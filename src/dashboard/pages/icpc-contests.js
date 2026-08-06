const html = `
<div class="page-header">
  <h2>ICPC Contests</h2>
</div>

<div class="val-panel contest-generator">
  <h3>Generate Contest</h3>
  <div class="preset-btns" style="margin-bottom: 15px; display:flex; gap:10px;">
    <button id="btn-preset-div3" class="val-btn">DIV3 (6)</button>
    <button id="btn-preset-div2" class="val-btn">DIV2 (5)</button>
    <button id="btn-preset-div1" class="val-btn">DIV1 (5)</button>
    <button id="btn-preset-custom" class="val-btn-outline">Custom</button>
  </div>
  
  <div id="custom-contest-opts" style="display:none; margin-bottom: 15px;">
    <label>Problem Count (3-10):</label>
    <input type="number" id="contest-prob-count" class="val-input" min="3" max="10" value="5" style="width: 100px; margin-right: 20px;">
    
    <label>Time Limit (mins):</label>
    <input type="number" id="contest-time-limit" class="val-input" min="10" max="300" value="120" style="width: 100px;">
  </div>
  
  <div id="contest-preview" style="margin-top: 20px; display:flex; flex-direction:column; gap:10px;">
    <!-- Preview problems -->
  </div>
  
  <button id="btn-gen-contest" class="val-btn" style="margin-top:20px; width:100%;">GENERATE PROBLEMS</button>
  <button id="btn-start-contest" class="val-btn" style="margin-top:10px; width:100%; display:none; background-color:#4FFFBE; color:#0F1923;">START CONTEST</button>
</div>

<div class="val-panel active-contest-panel" style="margin-top: 30px; display:none;" id="active-contest-panel">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h3>Active Contest</h3>
    <h2 id="contest-timer" style="color:var(--accent);">00:00:00</h2>
  </div>
  <table class="val-table" id="active-contest-table">
    <thead>
      <tr>
        <th>Problem</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody id="active-contest-tbody"></tbody>
  </table>
  <button id="btn-end-contest" class="val-btn" style="margin-top: 15px;">END CONTEST</button>
</div>
`;

let currentPreset = 'DIV3';
let generatedProblems = [];
let activeContest = null;
let timerInterval = null;
const listeners = [];

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function fetchRandomProblem(minRating, maxRating) {
  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await res.json();
    if(data.status !== 'OK') return null;
    
    const probs = data.result.problems.filter(p => p.rating >= minRating && p.rating <= maxRating);
    if (probs.length === 0) return null;
    return probs[Math.floor(Math.random() * probs.length)];
  } catch(e) {
    console.error(e);
    return null;
  }
}

async function generateContest() {
  const btn = document.getElementById('btn-gen-contest');
  btn.textContent = 'Generating...';
  btn.disabled = true;
  
  let ratings = [];
  if (currentPreset === 'DIV3') ratings = [800, 1000, 1200, 1400, 1600, 1800];
  else if (currentPreset === 'DIV2') ratings = [1200, 1400, 1600, 1900, 2100];
  else if (currentPreset === 'DIV1') ratings = [1900, 2100, 2300, 2500, 2700];
  else {
    const count = parseInt(document.getElementById('contest-prob-count').value) || 5;
    for(let i=0; i<count; i++) ratings.push(1000 + i*200);
  }
  
  generatedProblems = [];
  for (let r of ratings) {
    const p = await fetchRandomProblem(r, r+100);
    if(p) generatedProblems.push(p);
  }
  
  const preview = document.getElementById('contest-preview');
  preview.innerHTML = '';
  generatedProblems.forEach((p, idx) => {
    preview.innerHTML += `
      <div style="background:var(--surface); padding:10px; border-left: 3px solid var(--accent);">
        <strong>${String.fromCharCode(65+idx)}. ${p.name}</strong> (${p.rating || '?'})
      </div>
    `;
  });
  
  btn.textContent = 'GENERATE PROBLEMS';
  btn.disabled = false;
  document.getElementById('btn-start-contest').style.display = 'block';
}

function startContest() {
  if(generatedProblems.length === 0) return;
  const timeLimit = parseInt(document.getElementById('contest-time-limit').value) || 120;
  
  activeContest = {
    startTime: Date.now(),
    duration: timeLimit * 60 * 1000,
    problems: generatedProblems.map(p => ({...p, solved: false}))
  };
  
  renderActiveContest();
  document.getElementById('active-contest-panel').style.display = 'block';
  document.querySelector('.contest-generator').style.display = 'none';
  
  generatedProblems.forEach(p => {
    window.open(`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`, '_blank');
  });
  
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if(!activeContest) return;
  const now = Date.now();
  const elapsed = now - activeContest.startTime;
  const remaining = activeContest.duration - elapsed;
  
  if (remaining <= 0) {
    document.getElementById('contest-timer').textContent = "00:00:00";
    endContest();
    return;
  }
  
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  
  document.getElementById('contest-timer').textContent = 
    `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function renderActiveContest() {
  const tbody = document.getElementById('active-contest-tbody');
  tbody.innerHTML = '';
  activeContest.problems.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${String.fromCharCode(65+idx)}. ${p.name}</td>
      <td style="color:${p.solved ? '#4FFFBE' : '#FF4655'}">${p.solved ? 'AC' : 'Pending'}</td>
      <td>
        <button class="val-btn-outline mark-solved-btn" data-idx="${idx}">${p.solved ? 'Unmark' : 'Mark AC'}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  tbody.querySelectorAll('.mark-solved-btn').forEach(btn => {
    addListener(btn, 'click', (e) => {
      const idx = e.target.getAttribute('data-idx');
      activeContest.problems[idx].solved = !activeContest.problems[idx].solved;
      renderActiveContest();
    });
  });
}

function endContest() {
  clearInterval(timerInterval);
  alert('Contest Ended!');
  document.getElementById('active-contest-panel').style.display = 'none';
  document.querySelector('.contest-generator').style.display = 'block';
  activeContest = null;
}

function setPreset(preset, btnId) {
  currentPreset = preset;
  document.querySelectorAll('.preset-btns button').forEach(b => {
    b.className = 'val-btn-outline';
  });
  document.getElementById(btnId).className = 'val-btn';
  document.getElementById('custom-contest-opts').style.display = preset === 'CUSTOM' ? 'block' : 'none';
}

function init() {
  addListener(document.getElementById('btn-preset-div3'), 'click', () => setPreset('DIV3', 'btn-preset-div3'));
  addListener(document.getElementById('btn-preset-div2'), 'click', () => setPreset('DIV2', 'btn-preset-div2'));
  addListener(document.getElementById('btn-preset-div1'), 'click', () => setPreset('DIV1', 'btn-preset-div1'));
  addListener(document.getElementById('btn-preset-custom'), 'click', () => setPreset('CUSTOM', 'btn-preset-custom'));
  
  addListener(document.getElementById('btn-gen-contest'), 'click', generateContest);
  addListener(document.getElementById('btn-start-contest'), 'click', startContest);
  addListener(document.getElementById('btn-end-contest'), 'click', endContest);
}

function destroy() {
  if (timerInterval) clearInterval(timerInterval);
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
