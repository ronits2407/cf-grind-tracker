const html = `
<div class="page-header">
  <h2>Practice Area</h2>
</div>

<div class="val-panel practice-tabs" style="display:flex; gap: 10px; margin-bottom: 20px;">
  <button id="tab-rec" class="val-btn">Recommended</button>
  <button id="tab-lad" class="val-btn-outline">Ladders</button>
  <button id="tab-queue" class="val-btn-outline">My Queue</button>
</div>

<div id="content-rec" class="tab-content" style="display:block;">
  <p>Fetching tailored recommendations based on your weak tags...</p>
  <div id="rec-list" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;"></div>
</div>

<div id="content-lad" class="tab-content" style="display:none;">
  <h3>Rating Ladders</h3>
  <div id="ladders-list" style="display:flex; flex-direction:column; gap:10px;">
    <!-- Rendered via JS -->
  </div>
</div>

<div id="content-queue" class="tab-content" style="display:none;">
  <h3>Your Queue</h3>
  <div id="queue-list" style="display:flex; flex-direction:column; gap:10px;"></div>
</div>
`;

const listeners = [];
let practiceQueue = [];

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.practice-tabs button').forEach(el => el.className = 'val-btn-outline');
  
  if (tabId === 'rec') {
    document.getElementById('content-rec').style.display = 'block';
    document.getElementById('tab-rec').className = 'val-btn';
    loadRecommendations();
  } else if (tabId === 'lad') {
    document.getElementById('content-lad').style.display = 'block';
    document.getElementById('tab-lad').className = 'val-btn';
    renderLadders();
  } else if (tabId === 'queue') {
    document.getElementById('content-queue').style.display = 'block';
    document.getElementById('tab-queue').className = 'val-btn';
    renderQueue();
  }
}

async function loadRecommendations() {
  const recList = document.getElementById('rec-list');
  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await res.json();
    if (data.status === 'OK') {
      const probs = data.result.problems.slice(0, 10);
      recList.innerHTML = '';
      probs.forEach(p => {
        recList.innerHTML += \`
          <div class="val-panel" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <a href="https://codeforces.com/contest/\${p.contestId}/problem/\${p.index}" target="_blank" style="color:var(--text); text-decoration:none;">
                <strong>\${p.name}</strong>
              </a>
              <span class="rating-badge" style="margin-left:10px;">\${p.rating || '?'}</span>
              <div style="font-size:0.8em; color:gray; margin-top:5px;">\${p.tags.join(', ')}</div>
            </div>
            <button class="val-btn-outline queue-add-btn" data-id="\${p.contestId}-\${p.index}" data-name="\${p.name}">+ Queue</button>
          </div>
        \`;
      });
      
      document.querySelectorAll('.queue-add-btn').forEach(btn => {
        addListener(btn, 'click', (e) => {
          const id = e.target.getAttribute('data-id');
          const name = e.target.getAttribute('data-name');
          practiceQueue.push({ id, name });
          if(chrome && chrome.storage) {
            chrome.storage.sync.set({ practiceQueue });
          }
          alert('Added to queue!');
        });
      });
    }
  } catch(e) {
    recList.innerHTML = '<p>Error loading recommendations.</p>';
  }
}

function renderLadders() {
  const ladders = [
    { title: 'Div 3 A/B (800-1000)', range: '800-1000' },
    { title: 'Div 2 A (1000-1200)', range: '1000-1200' },
    { title: 'Div 2 B (1200-1400)', range: '1200-1400' },
    { title: 'Div 2 C (1400-1600)', range: '1400-1600' }
  ];
  
  const ll = document.getElementById('ladders-list');
  ll.innerHTML = '';
  ladders.forEach(l => {
    ll.innerHTML += \`
      <div class="val-panel">
        <h4>\${l.title}</h4>
        <button class="val-btn" style="margin-top:10px;">Start Ladder</button>
      </div>
    \`;
  });
}

function renderQueue() {
  const ql = document.getElementById('queue-list');
  ql.innerHTML = '';
  if (practiceQueue.length === 0) {
    ql.innerHTML = '<p>Queue is empty.</p>';
    return;
  }
  
  practiceQueue.forEach((q, idx) => {
    ql.innerHTML += \`
      <div class="val-panel" style="display:flex; justify-content:space-between;">
        <span>\${q.name} (\${q.id})</span>
        <button class="val-btn-outline remove-queue-btn" data-idx="\${idx}">Remove</button>
      </div>
    \`;
  });
  
  document.querySelectorAll('.remove-queue-btn').forEach(btn => {
    addListener(btn, 'click', (e) => {
      const idx = e.target.getAttribute('data-idx');
      practiceQueue.splice(idx, 1);
      if(chrome && chrome.storage) {
        chrome.storage.sync.set({ practiceQueue });
      }
      renderQueue();
    });
  });
}

async function init() {
  if(chrome && chrome.storage) {
    chrome.storage.sync.get(['practiceQueue'], (res) => {
      if(res.practiceQueue) practiceQueue = res.practiceQueue;
    });
  }
  
  addListener(document.getElementById('tab-rec'), 'click', () => switchTab('rec'));
  addListener(document.getElementById('tab-lad'), 'click', () => switchTab('lad'));
  addListener(document.getElementById('tab-queue'), 'click', () => switchTab('queue'));
  
  switchTab('rec');
}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
