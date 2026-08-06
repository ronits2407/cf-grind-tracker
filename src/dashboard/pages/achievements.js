const html = `
<div class="page-header">
  <h2>Achievements</h2>
</div>
<div class="achievements-controls val-panel">
  <select id="achiev-category" class="val-select">
    <option value="All">All Categories</option>
    <option value="Grind">Grind</option>
    <option value="Speed">Speed</option>
    <option value="Combat">Combat</option>
    <option value="Streak">Streak</option>
  </select>
</div>
<div class="achievements-grid" id="achievements-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding-top: 20px;">
  <!-- Achievement cards injected here -->
</div>
`;

const ACHIEVEMENTS = [
  { id: 'first_blood', title: 'First Blood', desc: 'First solve', icon: '🩸', category: 'Grind', req: 1 },
  { id: 'centurion', title: 'Centurion', desc: '100 problems', icon: '💯', category: 'Grind', req: 100 },
  { id: 'five_hundred', title: '500 Club', desc: '500 problems', icon: '🔥', category: 'Grind', req: 500 },
  { id: 'speed_demon', title: 'Speed Demon', desc: 'Sub-5min on 1500+ rated', icon: '⚡', category: 'Speed' },
  { id: 'lightning', title: 'Lightning Fast', desc: 'Sub-10min on 1800+', icon: '🌩️', category: 'Speed' },
  { id: 'flawless', title: 'Flawless', desc: 'Any solve with 0 WA', icon: '🎯', category: 'Combat' },
  { id: 'perfectionist', title: 'Perfectionist', desc: '10 consecutive 0 WA', icon: '🌟', category: 'Combat' },
  { id: 'clean_coder', title: 'Clean Coder', desc: '20 consecutive no AI', icon: '🧠', category: 'Combat' },
  { id: 'rank_iron', title: 'Iron', desc: 'Reach Iron rank', icon: '🛡️', category: 'Grind' },
  { id: 'rank_bronze', title: 'Bronze', desc: 'Reach Bronze rank', icon: '🥉', category: 'Grind' },
  { id: 'rank_silver', title: 'Silver', desc: 'Reach Silver rank', icon: '🥈', category: 'Grind' },
  { id: 'rank_gold', title: 'Gold', desc: 'Reach Gold rank', icon: '🥇', category: 'Grind' },
  { id: 'rank_plat', title: 'Platinum', desc: 'Reach Platinum rank', icon: '💠', category: 'Grind' },
  { id: 'rank_diamond', title: 'Diamond', desc: 'Reach Diamond rank', icon: '💎', category: 'Grind' },
  { id: 'rank_ascendant', title: 'Ascendant', desc: 'Reach Ascendant rank', icon: '✨', category: 'Grind' },
  { id: 'rank_immortal', title: 'Immortal', desc: 'Reach Immortal rank', icon: '♾️', category: 'Grind' },
  { id: 'rank_radiant', title: 'Radiant', desc: 'Reach Radiant rank', icon: '🌞', category: 'Grind' },
  { id: 'perfect_contest', title: 'Perfect Contest', desc: 'ICPC all solved 0 WA', icon: '🏆', category: 'Combat' },
  { id: 'icpc_ready', title: 'ICPC Ready', desc: '5 ICPC contests', icon: '⚔️', category: 'Grind' },
  { id: 'streak_30', title: '30-Day Streak', desc: '30-day streak', icon: '📅', category: 'Streak' },
  { id: 'streak_100', title: '100-Day Streak', desc: '100-day streak', icon: '📆', category: 'Streak' },
  { id: 'night_owl', title: 'Night Owl', desc: 'Solve after midnight', icon: '🦉', category: 'Streak' },
  { id: 'early_bird', title: 'Early Bird', desc: 'Solve before 7am', icon: '🌅', category: 'Streak' }
];

let unlocked = new Set();
const listeners = [];

async function analyzeAchievements() {
  unlocked.clear();
  let problems = [];
  try {
    if (window.cfgtDB && window.cfgtDB.getProblems) {
      problems = await window.cfgtDB.getProblems();
    }
  } catch(e){}

  if (problems.length >= 1) unlocked.add('first_blood');
  if (problems.length >= 100) unlocked.add('centurion');
  if (problems.length >= 500) unlocked.add('five_hundred');

  let consecutive0WA = 0;
  let consecutiveNoAI = 0;

  for (const p of problems) {
    if (p.solveTime < 300 && p.rating >= 1500) unlocked.add('speed_demon');
    if (p.solveTime < 600 && p.rating >= 1800) unlocked.add('lightning');
    if ((p.waCount || 0) === 0) {
      unlocked.add('flawless');
      consecutive0WA++;
      if (consecutive0WA >= 10) unlocked.add('perfectionist');
    } else {
      consecutive0WA = 0;
    }

    if (!p.aiUsed) {
      consecutiveNoAI++;
      if (consecutiveNoAI >= 20) unlocked.add('clean_coder');
    } else {
      consecutiveNoAI = 0;
    }

    const h = new Date(p.timestamp).getHours();
    if (h < 4) unlocked.add('night_owl');
    if (h >= 4 && h < 7) unlocked.add('early_bird');
  }
}

function renderAchievements() {
  const container = document.getElementById('achievements-container');
  const cat = document.getElementById('achiev-category').value;
  container.innerHTML = '';

  const filtered = ACHIEVEMENTS.filter(a => cat === 'All' || a.category === cat);

  filtered.forEach(a => {
    const isUnlocked = unlocked.has(a.id);
    const card = document.createElement('div');
    card.className = 'val-panel ' + (isUnlocked ? 'unlocked-achiev' : 'locked-achiev');
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.style.padding = '20px';
    card.style.borderRadius = '4px';
    if (!isUnlocked) {
      card.style.opacity = '0.5';
    } else {
      card.style.border = '1px solid var(--accent)';
      card.style.boxShadow = '0 0 10px rgba(255,70,85,0.2)';
    }

    card.innerHTML = \`
      <div style="font-size: 3rem; margin-bottom: 10px;">\${a.icon}</div>
      <h3 style="margin-top:0;">\${a.title}</h3>
      <p style="color:var(--text); opacity:0.8;">\${a.desc}</p>
      \${!isUnlocked ? '<div style="position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(15,25,35,0.7); display:flex; align-items:center; justify-content:center; font-size:3rem;">🔒</div>' : ''}
    \`;
    container.appendChild(card);
  });
}

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function init() {
  await analyzeAchievements();
  renderAchievements();
  addListener(document.getElementById('achiev-category'), 'change', renderAchievements);
}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
