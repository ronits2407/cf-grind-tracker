// Cloudflare Worker - CF Grind Tracker Friend Stalker
// Runs every 60 seconds via Cron Trigger
// Uses Cloudflare KV for state persistence
// Environment variables: NTFY_TOPIC, FRIEND_HANDLES (comma-separated)

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.processFriends(env));
  },

  async processFriends(env) {
    const friendHandles = env.FRIEND_HANDLES ? env.FRIEND_HANDLES.split(',').map(s => s.trim()).filter(Boolean) : [];
    const ntfyTopic = env.NTFY_TOPIC;
    
    if (!friendHandles.length || !ntfyTopic || !env.CF_GRIND_KV) return;
    
    // Always check the first handle (you!) every single minute for instant alerts
    const myHandle = friendHandles[0];
    const otherFriends = friendHandles.slice(1);
    
    const BATCH_SIZE = 10;
    const currentIndexStr = await env.CF_GRIND_KV.get('current_friend_index');
    let currentIndex = currentIndexStr ? parseInt(currentIndexStr, 10) : 0;
    
    if (currentIndex >= otherFriends.length) currentIndex = 0;
    const batch = otherFriends.slice(currentIndex, currentIndex + BATCH_SIZE);
    
    let nextIndex = currentIndex + BATCH_SIZE;
    if (nextIndex >= otherFriends.length) nextIndex = 0;
    await env.CF_GRIND_KV.put('current_friend_index', nextIndex.toString());
    
    // Combine your handle + the batch of 10 friends
    const handlesToCheck = [myHandle, ...batch];
    
    for (const handle of handlesToCheck) {
      try {
        await this.checkFriend(handle, ntfyTopic, env.CF_GRIND_KV);
        await new Promise(r => setTimeout(r, 200)); 
      } catch (e) {
        console.error(`Error checking ${handle}:`, e);
      }
    }
  },

  async checkFriend(handle, topic, kv) {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=3`);
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
