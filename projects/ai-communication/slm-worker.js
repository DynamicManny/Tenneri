// Live model worker for the AI-Assisted Communication sandbox.
// Everything heavy happens here, off the page's main thread, so the page
// never freezes: downloading the model, building the session, warming the
// GPU shaders and generating text. The page only receives small messages.

import {
  pipeline,
  TextStreamer,
  InterruptableStoppingCriteria,
  env
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';

env.allowLocalModels = false;

const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';

const SYSTEM_PROMPT =
  'You are a writing assistant for workplace communication. ' +
  'Write the email or message the user asks for and output only the draft. ' +
  'For emails, start with a Subject line. ' +
  'Use square-bracket placeholders like [Name] or [Date] for anything the user did not give you. ' +
  'Keep it concise and natural.';

let generator = null;
let loading = false;
let busy = false;
const stopper = new InterruptableStoppingCriteria();

function post(msg) { self.postMessage(msg); }

// Combine per-file progress into one honest number for the whole download.
const files = {};
function onProgress(p) {
  if (!p || !p.file) return;
  if (p.status === 'progress' && typeof p.total === 'number' && p.total > 0) {
    files[p.file] = { loaded: p.loaded, total: p.total };
  } else if (p.status === 'done' && files[p.file]) {
    files[p.file].loaded = files[p.file].total;
  } else {
    return;
  }
  let loaded = 0, total = 0;
  for (const k in files) { loaded += files[k].loaded; total += files[k].total; }
  post({ type: 'progress', loaded, total });
}

function build(device, dtype) {
  return pipeline('text-generation', MODEL, { device, dtype, progress_callback: onProgress });
}

async function load({ device = 'wasm', dtype = 'q8' } = {}) {
  if (generator || loading) return;
  loading = true;
  const t0 = performance.now();
  try {
    try {
      generator = await build(device, dtype);
    } catch (e) {
      if (device !== 'webgpu') throw e;
      // WebGPU was reported but would not start: fall back to the processor.
      console.warn('[slm] WebGPU failed, falling back to wasm:', e);
      device = 'wasm'; dtype = 'q8';
      for (const k in files) delete files[k];
      post({ type: 'fallback', device, dtype });
      generator = await build(device, dtype);
    }

    // Warm up. The first run compiles GPU shaders and is the slowest thing
    // the model ever does. Doing it now means the first real reply is fast.
    post({ type: 'stage', stage: 'warmup' });
    await generator([{ role: 'user', content: 'Hi' }], { max_new_tokens: 1, do_sample: false });

    post({ type: 'ready', device, dtype, ms: Math.round(performance.now() - t0) });
  } catch (e) {
    console.error('[slm] load failed:', e);
    generator = null;
    post({ type: 'error', phase: 'load', message: String((e && e.message) || e) });
  } finally {
    loading = false;
  }
}

async function generate({ id, prompt, history = [], maxTokens = 200 }) {
  if (!generator) { post({ type: 'error', phase: 'generate', id, message: 'Model not loaded' }); return; }
  if (busy) { stopper.interrupt(); }
  busy = true;
  stopper.reset();

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const m of history) {
    if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') messages.push(m);
  }
  messages.push({ role: 'user', content: String(prompt || '') });

  let tokens = 0;
  let text = '';
  const t0 = performance.now();
  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (chunk) => { text += chunk; post({ type: 'token', id, text: chunk, tokens }); },
    token_callback_function: () => { tokens++; }
  });

  try {
    const out = await generator(messages, {
      max_new_tokens: maxTokens,
      do_sample: false,
      repetition_penalty: 1.1,
      streamer,
      stopping_criteria: stopper
    });
    const last = out && out[0] && out[0].generated_text;
    const final = Array.isArray(last) ? (last[last.length - 1].content || '') : (last || text);
    post({
      type: 'done', id,
      text: final.trim(),
      tokens,
      ms: Math.round(performance.now() - t0),
      stopped: stopper.interrupted
    });
  } catch (e) {
    console.error('[slm] generate failed:', e);
    post({ type: 'error', phase: 'generate', id, message: String((e && e.message) || e) });
  } finally {
    busy = false;
  }
}

self.addEventListener('message', (e) => {
  const m = e.data || {};
  if (m.type === 'load') load(m);
  else if (m.type === 'generate') generate(m);
  else if (m.type === 'stop') stopper.interrupt();
});
