import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, 'state.json');

const NTFY_TOPIC = process.env.NTFY_TOPIC || 'cf-grind-gzn84omyxtxx';
const NTFY_TOKEN = process.env.NTFY_TOKEN || 'tk_lgbthqe3ldnhpln6blr2ho56qpc0b';

const FRIENDS = [
  'ronits2407', 'Shridhar278', '_sreedevesh', 'kaustavbhowal', 'arjund0702',
  'ByteWarden', 'iamag47', 'Dweep007', 'Prachet1718', 'PriyanshuIITGHY2006',
  'mumuksh736', 'Ansh949', 'UltimateAAJ', 'dhruv173', 'define_aditya',
  'AviatorKM', 'avani_12', 'aniketchonu', 'SaylorTwift', 'sqv1nx_',
  'northpoledagabru', 'HiyaS', 'Ayush_Kumar_Sharma', 'deepakroy13',
  'aditeyagoyal', 'htrap2018', 'alishabasohail2022', 'ianjaliprasad'
];

// Helper: send ntfy push notification
async function sendNtfy(title, body) {
  try {
    const headers = {
      'Title': title,
      'Priority': 'default',
      'Authorization': `Bearer ${NTFY_TOKEN}`
    };
    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      body: body,
      headers: headers
    });
    if (!res.ok) {
      console.error(`[Stalker Bot] Ntfy returned HTTP ${res.status}`);
    } else {
      console.log(`[Stalker Bot] Ntfy push sent successfully for ${title}`);
    }
  } catch (e) {
    console.error(`[Stalker Bot] Failed to send Ntfy notification:`, e.message);
  }
}

async function run() {
  console.log(`==================================================`);
  console.log(`[Stalker Bot] Starting GitHub Actions Friend Stalker`);
  console.log(`[Stalker Bot] Time: ${new Date().toISOString()}`);
  console.log(`[Stalker Bot] Tracking ${FRIENDS.length} friends`);
  console.log(`[Stalker Bot] Target Ntfy Topic: ${NTFY_TOPIC}`);

  // Load existing state
  let state = {};
  if (fs.existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      console.log(`[Stalker Bot] State loaded. Tracks ${Object.keys(state).length} handles`);
    } catch (e) {
      console.warn(`[Stalker Bot] Could not parse state.json, initializing fresh state.`);
    }
  }

  let totalNewSubmissions = 0;

  for (let i = 0; i < FRIENDS.length; i++) {
    const friend = FRIENDS[i];
    console.log(`[Stalker Bot] [${i + 1}/${FRIENDS.length}] Fetching user.status for ${friend}...`);

    try {
      const res = await fetch(`https://codeforces.com/api/user.status?handle=${friend}&count=10`);
      
      // Delay 1 second per handle to respect Codeforces rate limits
      await new Promise(r => setTimeout(r, 1000));

      if (!res.ok) {
        console.warn(`[Stalker Bot] HTTP ${res.status} when fetching ${friend}`);
        continue;
      }

      const data = await res.json();
      if (data.status !== 'OK' || !data.result || data.result.length === 0) {
        continue;
      }

      const userSubmissions = data.result.reverse(); // Process oldest to newest
      const seenIds = state[friend] || [];

      // Initializing DB state for new handle to prevent spamming past submissions
      if (!state[friend]) {
        console.log(`[Stalker Bot] Initializing state for new friend: ${friend}`);
        state[friend] = userSubmissions.map(s => s.id);
        continue;
      }

      for (const sub of userSubmissions) {
        if (sub.verdict === 'TESTING') continue;

        if (!seenIds.includes(sub.id)) {
          totalNewSubmissions++;
          console.log(`[Stalker Bot] 🔔 NEW SUBMISSION! Handle: ${friend}, Sub ID: ${sub.id}, Verdict: ${sub.verdict}, Problem: ${sub.problem.name}`);

          seenIds.push(sub.id);

          const title = friend;
          const verdictStr = sub.verdict === 'OK' ? 'AC' : sub.verdict;
          const tagsStr = sub.problem.tags ? sub.problem.tags.join(', ') : 'no tags';
          const ratingStr = sub.problem.rating ? sub.problem.rating : 'Unrated';
          const body = `${verdictStr} on ${sub.problem.name}\nTags: [${tagsStr}]\nRating: ${ratingStr}`;

          await sendNtfy(title, body);
        }
      }

      // Keep last 100 submission IDs per user in state to keep state.json small
      state[friend] = seenIds.slice(-100);

    } catch (e) {
      console.error(`[Stalker Bot] Error checking ${friend}:`, e.message);
    }
  }

  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  console.log(`[Stalker Bot] Saved state.json. Finished run with ${totalNewSubmissions} new notifications.`);
  console.log(`==================================================`);
}

run();
