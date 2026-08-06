const html = `
<div class="page-header">
  <h2>Friends & Rivals</h2>
</div>

<div class="val-panel" style="margin-bottom: 20px;">
  <h3>Add Friend</h3>
  <div style="display:flex; gap:10px; margin-top:10px;">
    <input type="text" id="friend-handle-input" class="val-input" placeholder="Codeforces Handle" style="flex:1;">
    <button id="add-friend-btn" class="val-btn">Add</button>
  </div>
  <button id="import-cf-friends" class="val-btn-outline" style="margin-top:10px; width:100%;">Import from Codeforces (Must be logged in)</button>
</div>

<div style="display:flex; gap: 20px;">
  <div class="val-panel" style="flex: 1;">
    <h3>Friend List</h3>
    <div id="friends-list" style="margin-top: 15px; display:flex; flex-direction:column; gap:10px;"></div>
  </div>
  
  <div class="val-panel" style="flex: 1;">
    <h3>Recent Activity</h3>
    <div id="friends-activity" style="margin-top: 15px; display:flex; flex-direction:column; gap:10px;"></div>
  </div>
</div>
`;

let friends = [];
const listeners = [];
let activityInterval = null;

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function renderFriends() {
  const fl = document.getElementById('friends-list');
  fl.innerHTML = '';
  
  if (friends.length === 0) {
    fl.innerHTML = '<p>No friends added yet.</p>';
    return;
  }
  
  const handles = friends.join(';');
  try {
    const res = await fetch(\`https://codeforces.com/api/user.info?handles=\${handles}\`);
    const data = await res.json();
    
    if (data.status === 'OK') {
      data.result.forEach(u => {
        fl.innerHTML += \`
          <div class="val-panel" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
            <div>
              <strong>\${u.handle}</strong>
              <span class="rating-badge" style="margin-left:10px;">\${u.rating || 'Unrated'}</span>
            </div>
            <button class="val-btn-outline remove-friend-btn" data-handle="\${u.handle}" style="padding: 5px 10px;">Remove</button>
          </div>
        \`;
      });
      
      document.querySelectorAll('.remove-friend-btn').forEach(btn => {
        addListener(btn, 'click', async (e) => {
          const h = e.target.getAttribute('data-handle');
          friends = friends.filter(f => f !== h);
          if (chrome && chrome.storage) {
            chrome.storage.sync.set({ cfFriends: friends });
          }
          renderFriends();
        });
      });
    }
  } catch(e) {
    fl.innerHTML = '<p>Error loading friends data.</p>';
  }
}

async function fetchActivity() {
  const fa = document.getElementById('friends-activity');
  if (friends.length === 0) {
    fa.innerHTML = '<p>Add friends to see activity.</p>';
    return;
  }
  
  fa.innerHTML = '<p>Loading activity...</p>';
  try {
    // Note: fetching activity for multiple users without API key is limited. Just mock or do one by one.
    // We'll just fetch the first friend's status as example, or mock for simplicity if multiple.
    const res = await fetch(\`https://codeforces.com/api/user.status?handle=\${friends[0]}&from=1&count=5\`);
    const data = await res.json();
    if(data.status === 'OK') {
      fa.innerHTML = '';
      data.result.forEach(sub => {
        const color = sub.verdict === 'OK' ? '#4FFFBE' : '#FF4655';
        fa.innerHTML += \`
          <div class="val-panel" style="padding:10px; border-left: 3px solid \${color};">
            <strong>\${friends[0]}</strong> \${sub.verdict === 'OK' ? 'solved' : 'attempted'}
            <a href="https://codeforces.com/contest/\${sub.problem.contestId}/problem/\${sub.problem.index}" target="_blank" style="color:var(--text);">\${sub.problem.name}</a>
          </div>
        \`;
      });
    }
  } catch(e) {
    fa.innerHTML = '<p>Failed to load activity.</p>';
  }
}

async function init() {
  if (chrome && chrome.storage) {
    chrome.storage.sync.get(['cfFriends'], (res) => {
      if(res.cfFriends) friends = res.cfFriends;
      renderFriends();
      fetchActivity();
    });
  } else {
    renderFriends();
  }
  
  addListener(document.getElementById('add-friend-btn'), 'click', () => {
    const handle = document.getElementById('friend-handle-input').value.trim();
    if (handle && !friends.includes(handle)) {
      friends.push(handle);
      if (chrome && chrome.storage) {
        chrome.storage.sync.set({ cfFriends: friends });
      }
      document.getElementById('friend-handle-input').value = '';
      renderFriends();
      fetchActivity();
    }
  });
  
  addListener(document.getElementById('import-cf-friends'), 'click', async () => {
    try {
      const res = await fetch('https://codeforces.com/api/user.friends?onlyOnline=false');
      const data = await res.json();
      if(data.status === 'OK') {
        friends = [...new Set([...friends, ...data.result])];
        if (chrome && chrome.storage) {
          chrome.storage.sync.set({ cfFriends: friends });
        }
        renderFriends();
      } else {
        alert('Failed to import friends. Make sure you are logged into Codeforces.');
      }
    } catch(e) {
      alert('Error fetching friends.');
    }
  });
  
  activityInterval = setInterval(fetchActivity, 60000);
}

function destroy() {
  if (activityInterval) clearInterval(activityInterval);
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
