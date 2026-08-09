
import worker from './worker.js';

// Mock Environment
const env = {
  FRIEND_HANDLES: 'ronits2407, tourist, ecnerwala, Errichto, Benq, jiangly, yangster67, P1g, Shridhar278, FlashVS, Tanjiro_Kamado_069, aryan_gupta_iitg, _sreedevesh, kaustavbhowal, arjund0702',
  NTFY_TOPIC: 'cf-grind-test-local',
  CF_GRIND_KV: {
    store: new Map(),
    async get(key) { return this.store.get(key) || null; },
    async put(key, val) { this.store.set(key, val); }
  }
};

// Mock Context
const ctx = {
  promises: [],
  waitUntil(p) { this.promises.push(p); }
};

// Override fetch to intercept calls for testing
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (url.includes('ntfy.sh')) {
    console.log('[NTFY POST]', url, options.headers, options.body);
    return { ok: true };
  }
  if (url.includes('api/user.status')) {
    console.log('[CF API GET]', url);
  }
  return originalFetch(url, options);
};

async function run() {
  console.log('=== RUN 1 ===');
  await worker.processFriends(env);
  console.log('Current Index in KV:', await env.CF_GRIND_KV.get('current_friend_index'));
  
  console.log('\n=== RUN 2 ===');
  await worker.processFriends(env);
  console.log('Current Index in KV:', await env.CF_GRIND_KV.get('current_friend_index'));
}

run().catch(console.error);

