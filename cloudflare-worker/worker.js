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
    const ntfyToken = env.NTFY_TOKEN;
    
    if (!friendHandles.length || !ntfyTopic || !env.CF_GRIND_KV) {
      console.error("Missing ENV variables or KV binding!");
      return;
    }
    
    console.log(`Starting run. Tracking ${friendHandles.length} friends directly via user.status.`);
    
    // Check all handles directly. We must keep total requests <= 50!
    // 49 CF requests + 1 aggregated Ntfy request = 50 requests exactly.
    const notificationsToPush = [];
    const kvUpdates = {};
    
    // We fetch in parallel to make it finish well within the 30s CPU limit
    await Promise.all(friendHandles.map(async (handle) => {
      try {
        const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=3`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.status !== 'OK') return;
        
        const submissions = data.result;
        if (!submissions.length) return;
        
        const lastSeenKey = `last_sub_${handle}`;
        const lastSeenIdStr = await env.CF_GRIND_KV.get(lastSeenKey);
        const lastSeenId = lastSeenIdStr ? parseInt(lastSeenIdStr, 10) : 0;
        
        let maxId = lastSeenId;
        
        for (const sub of submissions) {
          if (sub.id > lastSeenId && lastSeenId > 0) {
            if (sub.verdict && sub.verdict !== 'TESTING') {
              const verdictStr = sub.verdict === 'OK' ? 'AC' : sub.verdict;
              notificationsToPush.push(`${handle}: ${verdictStr} on ${sub.problem.name}`);
            }
          } else if (lastSeenId === 0) {
             // Just initialize, don't spam
          }
          if (sub.id > maxId) maxId = sub.id;
        }
        
        if (maxId > lastSeenId) {
          kvUpdates[lastSeenKey] = maxId.toString();
        }
      } catch (e) {
        console.error(`Error checking ${handle}:`, e);
      }
    }));
    
    // Save all KV updates (KV put doesn't count towards the 50 subrequest limit)
    for (const [key, val] of Object.entries(kvUpdates)) {
      await env.CF_GRIND_KV.put(key, val);
    }
    
    // Send ONE aggregated Ntfy request to stay under the 50 limit!
    if (notificationsToPush.length > 0) {
      const combinedMessage = notificationsToPush.join('\n');
      console.log(`🔔 TRIGGER NOTIFICATION (Aggregated):\n${combinedMessage}`);
      
      const headers = {
        'Title': 'Codeforces Grind Tracker',
        'Priority': 'default'
      };
      
      if (ntfyToken) {
        headers['Authorization'] = `Bearer ${ntfyToken}`;
        console.log("Using Authenticated Ntfy Request to bypass IP ban.");
      }
      
      const ntfyRes = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        headers: headers,
        body: combinedMessage
      });
      
      if (!ntfyRes.ok) {
        console.error(`NTFY FAILED! Status: ${ntfyRes.status}`);
      } else {
        console.log(`NTFY Success!`);
      }
    } else {
      console.log("No new solved problems this minute.");
    }
  }
};
