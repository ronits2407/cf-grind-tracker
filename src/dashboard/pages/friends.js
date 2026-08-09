const html = `
<div class="page-header">
  <h2>Friends & Rivals</h2>
</div>

<div class="val-panel" style="margin-bottom: 20px;">
  <h3>Add Friend</h3>
  <div style="display:flex; gap:10px; margin-top:10px;">
    <input type="text" id="friend-handle-input" class="val-input" placeholder="Codeforces Handle" style="flex:1;">
    <button id="add-friend-btn" class="btn btn-primary">Add</button>
  </div>
  
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

const DEFAULT_FRIENDS = [
  'ronits2407', 'Shridhar278', '_sreedevesh', 'kaustavbhowal', 'arjund0702',
  'ByteWarden', 'iamag47', 'Dweep007', 'Prachet1718', 'PriyanshuIITGHY2006',
  'mumuksh736', 'Ansh949', 'UltimateAAJ', 'dhruv173', 'define_aditya',
  'AviatorKM', 'avani_12', 'aniketchonu', 'SaylorTwift', 'sqv1nx_',
  'northpoledagabru', 'HiyaS', 'Ayush_Kumar_Sharma', 'deepakroy13',
  'aditeyagoyal', 'htrap2018', 'alishabasohail2022', 'ianjaliprasad'
];

let friends = [...DEFAULT_FRIENDS];
const listeners = [];
let activityInterval = null;

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function renderFriends() {
  console.log('[CFGT Friends Page] Rendering friends list for', friends.length, 'handles');
  const fl = document.getElementById('friends-list');
  fl.innerHTML = '';
  
  if (friends.length === 0) {
    fl.innerHTML = '<p>No friends added yet.</p>';
    return;
  }
  
  const handles = friends.join(';');
  try {
    console.log('[CFGT Friends Page] Fetching user info from Codeforces API for handles...');
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handles}`);
    const data = await res.json();
    
    if (data.status === 'OK') {
      console.log('[CFGT Friends Page] Received user info for', data.result.length, 'handles');
      data.result.forEach(u => {
        fl.innerHTML += `
          <div class="val-panel" style="display:flex; justify-space-between; align-items:center; padding:10px;">
            <div>
              <strong>${u.handle}</strong>
              <span class="rating-badge" style="margin-left:10px;">${u.rating || 'Unrated'}</span>
            </div>
            <button class="btn btn-secondary remove-friend-btn" data-handle="${u.handle}" style="padding: 5px 10px;">Remove</button>
          </div>
        `;
      });
      
      document.querySelectorAll('.remove-friend-btn').forEach(btn => {
        addListener(btn, 'click', async (e) => {
          const h = e.target.getAttribute('data-handle');
          console.log('[CFGT Friends Page] Removing friend:', h);
          friends = friends.filter(f => f !== h);
          if (chrome && chrome.storage) {
            chrome.storage.sync.set({ cfFriends: friends });
          }
          renderFriends();
        });
      });
    }
  } catch(e) {
    console.error('[CFGT Friends Page] Error loading friends user info:', e);
    fl.innerHTML = '<p>Error loading friends data.</p>';
  }
}

async function fetchActivity() {
  console.log('[CFGT Friends Page] Fetching recent friend activity from IndexedDB...');
  const fa = document.getElementById('friends-activity');
  
  try {
    let activities = [];
    if (window.cfgtDB && window.cfgtDB.getFriendActivity) {
      activities = await window.cfgtDB.getFriendActivity(50);
    }
    
    console.log('[CFGT Friends Page] Retrieved', activities.length, 'activity records from DB');
    
    if (!activities || activities.length === 0) {
      fa.innerHTML = '<p>No recent activity recorded yet. The background worker checks Codeforces every minute.</p>';
      return;
    }

    fa.innerHTML = '';
    activities.forEach(sub => {
      const isAC = sub.verdict === 'OK' || sub.verdict === 'AC';
      const color = isAC ? '#4FFFBE' : '#FF4655';
      const verdictText = isAC ? 'AC' : (sub.verdict || 'ATTEMPTED');
      
      fa.innerHTML += `
        <div class="val-panel" style="padding:10px; border-left: 3px solid ${color}; margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between;">
            <strong>${sub.handle}</strong>
            <span style="color:${color}; font-weight:bold;">${verdictText}</span>
          </div>
          <div style="font-size:0.9em; margin-top:4px;">
            Problem: <strong>${sub.problemName || 'Problem'}</strong>
          </div>
        </div>
      `;
    });
  } catch(e) {
    console.error('[CFGT Friends Page] Failed to fetch activity:', e);
    fa.innerHTML = '<p>Failed to load activity from database.</p>';
  }
}

async function init() {
  console.log('[CFGT Friends Page] Initializing Friends page...');
  if (chrome && chrome.storage) {
    chrome.storage.sync.get(['cfFriends'], (res) => {
      if (res.cfFriends && res.cfFriends.length > 0) {
        friends = res.cfFriends;
      }
      console.log('[CFGT Friends Page] Active friend handles count:', friends.length);
      renderFriends();
      fetchActivity();
    });
  } else {
    renderFriends();
    fetchActivity();
  }
  
  addListener(document.getElementById('add-friend-btn'), 'click', () => {
    const handle = document.getElementById('friend-handle-input').value.trim();
    if (handle && !friends.includes(handle)) {
      console.log('[CFGT Friends Page] Adding new friend:', handle);
      friends.push(handle);
      if (chrome && chrome.storage) {
        chrome.storage.sync.set({ cfFriends: friends });
      }
      document.getElementById('friend-handle-input').value = '';
      renderFriends();
      fetchActivity();
    }
  });
  
  activityInterval = setInterval(fetchActivity, 15000); // refresh every 15s
}

function destroy() {
  console.log('[CFGT Friends Page] Destroying Friends page view');
  if (activityInterval) clearInterval(activityInterval);
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
