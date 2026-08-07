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
    
    const notificationsToPush = [];
    const kvUpdates = {};
    
    // Cloudflare limits max concurrent fetches to 6. If we fire 49 at once, it aborts them!
    // We must chunk them into groups of 5.
    const chunkArray = (arr, size) => 
      Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
      
    const chunks = chunkArray(friendHandles, 5);
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (handle) => {
        try {
          const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=3`);
          if (!response.ok) {
            // Must consume body to prevent Cloudflare deadlock
            await response.text().catch(() => {});
            return;
          }
          
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
               // Initialize DB
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
    }
    
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
        // Must consume body here too
        await ntfyRes.text().catch(() => {});
        console.error(`NTFY FAILED! Status: ${ntfyRes.status}`);
      } else {
        await ntfyRes.text().catch(() => {});
        console.log(`NTFY Success!`);
      }
    } else {
      console.log("No new solved problems this minute.");
    }
  }
};
