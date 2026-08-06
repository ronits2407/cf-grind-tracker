// Cloudflare Worker - CF Grind Tracker Friend Stalker
// Runs every 60 seconds via Cron Trigger
// Uses Cloudflare KV for state persistence
// Environment variables: NTFY_TOPIC, FRIEND_HANDLES (comma-separated)

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.processFriends(env));
  },

  async processFriends(env) {
    const friendHandles = env.FRIEND_HANDLES ? env.FRIEND_HANDLES.split(',') : [];
    const ntfyTopic = env.NTFY_TOPIC;
    
    if (!friendHandles.length || !ntfyTopic) {
      console.error("Missing FRIEND_HANDLES or NTFY_TOPIC env vars");
      return;
    }
    
    for (const handle of friendHandles) {
      try {
        const trimmedHandle = handle.trim();
        if (!trimmedHandle) continue;
        
        await this.checkFriend(trimmedHandle, ntfyTopic, env.CF_GRIND_KV);
        // Rate limit API calls
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error(`Error checking friend ${handle}:`, e);
      }
    }
  },

  async checkFriend(handle, topic, kv) {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=5`);
    if (!response.ok) {
      throw new Error(`CF API HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`CF API returned: ${data.comment}`);
    }
    
    const submissions = data.result;
    if (!submissions.length) return;
    
    const lastSeenKey = `last_sub_${handle}`;
    const lastSeenIdStr = await kv.get(lastSeenKey);
    const lastSeenId = lastSeenIdStr ? parseInt(lastSeenIdStr, 10) : 0;
    
    let maxId = lastSeenId;
    
    for (const sub of submissions) {
      if (sub.id > lastSeenId && lastSeenId > 0) {
        // New submission!
        const problemName = sub.problem.name;
        if (sub.verdict && sub.verdict !== 'TESTING') {
          const verdictStr = sub.verdict === 'OK' ? 'AC' : sub.verdict;
          const body = `${verdictStr} on ${problemName}`;
          
          await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            headers: {
              'Title': handle,
              'Priority': 'default'
            },
            body: body
          });
        }
      }
      
      if (sub.id > maxId) {
        maxId = sub.id;
      }
    }
    
    if (maxId > lastSeenId) {
      await kv.put(lastSeenKey, maxId.toString());
    }
  }
};
