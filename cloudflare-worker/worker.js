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
    
    if (!friendHandles.length || !ntfyTopic || !env.CF_GRIND_KV) {
      console.error("Missing ENV variables or KV binding!");
      return;
    }
    
    console.log(`Starting run. Tracking ${friendHandles.length} friends. Topic: ${ntfyTopic}`);
    
    const response = await fetch(`https://codeforces.com/api/problemset.recentStatus?count=1000`);
    if (!response.ok) {
      console.error(`Codeforces API failed with status: ${response.status}`);
      return;
    }
    
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { console.error("CF returned non-JSON"); return; }
    if (data.status !== 'OK') {
      console.error("CF API returned Error:", data.comment);
      return;
    }
    
    const friendsSubmissions = data.result.filter(sub => 
      sub.author.members.some(m => friendHandles.includes(m.handle))
    );
    
    console.log(`Found ${friendsSubmissions.length} submissions by friends in the last 1000 global submissions.`);
    if (!friendsSubmissions.length) return;
    
    const subsByFriend = {};
    for (const sub of friendsSubmissions) {
      for (const member of sub.author.members) {
        if (friendHandles.includes(member.handle)) {
          if (!subsByFriend[member.handle]) subsByFriend[member.handle] = [];
          subsByFriend[member.handle].push(sub);
        }
      }
    }
    
    for (const handle of Object.keys(subsByFriend)) {
      const subs = subsByFriend[handle];
      const lastSeenKey = `last_sub_${handle}`;
      const lastSeenIdStr = await env.CF_GRIND_KV.get(lastSeenKey);
      const lastSeenId = lastSeenIdStr ? parseInt(lastSeenIdStr, 10) : 0;
      
      console.log(`Analyzing ${handle}. Last seen ID: ${lastSeenId}. Found ${subs.length} new subs.`);
      let maxId = lastSeenId;
      subs.sort((a, b) => a.id - b.id);
      
      for (const sub of subs) {
        if (sub.id > lastSeenId && lastSeenId > 0) {
          if (sub.verdict && sub.verdict !== 'TESTING') {
            const verdictStr = sub.verdict === 'OK' ? 'AC' : sub.verdict;
            console.log(`🔔 TRIGGER NOTIFICATION: ${handle} got ${verdictStr} on ${sub.problem.name}`);
            
            const ntfyRes = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
              method: 'POST',
              headers: { 'Title': handle, 'Priority': 'default' },
              body: `${verdictStr} on ${sub.problem.name}`
            });
            
            if (!ntfyRes.ok) {
              console.error(`NTFY FAILED! Status: ${ntfyRes.status}`);
            } else {
              console.log(`NTFY Success!`);
            }
            await new Promise(r => setTimeout(r, 100));
          }
        } else if (lastSeenId === 0) {
           console.log(`Initializing DB for ${handle}. Ignoring sub ${sub.id} to prevent spam.`);
        }
        if (sub.id > maxId) maxId = sub.id;
      }
      
      if (maxId > lastSeenId) {
        console.log(`Saving new max ID for ${handle}: ${maxId}`);
        await env.CF_GRIND_KV.put(lastSeenKey, maxId.toString());
      }
    }
  }
};
