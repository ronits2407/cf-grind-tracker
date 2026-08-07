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
    
    // FETCH GLOBAL RECENT SUBMISSIONS (Last ~15 minutes of all CF traffic)
    // This is 1 single request that instantly checks ALL friends at once!
    const response = await fetch(`https://codeforces.com/api/problemset.recentStatus?count=1000`);
    if (!response.ok) return;
    
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { return; }
    if (data.status !== 'OK') return;
    
    // Find all submissions made by any of our friends
    const friendsSubmissions = data.result.filter(sub => 
      sub.author.members.some(m => friendHandles.includes(m.handle))
    );
    
    if (!friendsSubmissions.length) return; // No friends submitted recently
    
    // Group submissions by friend
    const subsByFriend = {};
    for (const sub of friendsSubmissions) {
      for (const member of sub.author.members) {
        if (friendHandles.includes(member.handle)) {
          if (!subsByFriend[member.handle]) subsByFriend[member.handle] = [];
          subsByFriend[member.handle].push(sub);
        }
      }
    }
    
    // Process each friend who actually submitted
    for (const handle of Object.keys(subsByFriend)) {
      const subs = subsByFriend[handle];
      
      const lastSeenKey = `last_sub_${handle}`;
      const lastSeenIdStr = await env.CF_GRIND_KV.get(lastSeenKey);
      const lastSeenId = lastSeenIdStr ? parseInt(lastSeenIdStr, 10) : 0;
      
      let maxId = lastSeenId;
      
      // Sort submissions oldest to newest for chronological notifications
      subs.sort((a, b) => a.id - b.id);
      
      for (const sub of subs) {
        if (sub.id > lastSeenId && lastSeenId > 0) {
          if (sub.verdict && sub.verdict !== 'TESTING') {
            const verdictStr = sub.verdict === 'OK' ? 'AC' : sub.verdict;
            await fetch(`https://ntfy.sh/${ntfyTopic}`, {
              method: 'POST',
              headers: { 'Title': handle, 'Priority': 'default' },
              body: `${verdictStr} on ${sub.problem.name}`
            });
            await new Promise(r => setTimeout(r, 100)); // Rate limit NTFY
          }
        }
        if (sub.id > maxId) maxId = sub.id;
      }
      
      if (maxId > lastSeenId) {
        await env.CF_GRIND_KV.put(lastSeenKey, maxId.toString());
      }
    }
  }
};
