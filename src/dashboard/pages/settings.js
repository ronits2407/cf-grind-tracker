const html = `
<div class="page-header">
  <h2>Settings</h2>
</div>

<div class="val-panel settings-section">
  <h3>Profile</h3>
  <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
    <label style="width: 150px;">Codeforces Handle:</label>
    <input type="text" id="setting-handle" class="val-input" style="flex:1;">
    <button id="btn-validate-handle" class="btn btn-primary">Validate</button>
  </div>
  <div id="handle-validation-msg" style="margin-top:10px; font-size:0.9em;"></div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>Notifications</h3>
  <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
    <label style="width: 150px;">Ntfy Topic:</label>
    <input type="text" id="setting-ntfy" class="val-input" style="flex:1;" placeholder="e.g. cf-grind-gzn84omyxtxx">
    <button id="btn-test-ntfy" class="btn btn-secondary">Test</button>
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 150px;">Browser Notifications:</label>
    <input type="checkbox" id="setting-notify-browser" style="accent-color: var(--accent); width:20px; height:20px;">
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 150px;">Phone Notifications:</label>
    <input type="checkbox" id="setting-notify-phone" style="accent-color: var(--accent); width:20px; height:20px;">
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 150px;">Notify All Verdicts:</label>
    <input type="checkbox" id="setting-notify-all" style="accent-color: var(--accent); width:20px; height:20px;">
  </div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>Polling & Stalker Feature</h3>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 200px;">Enable Local Stalker:</label>
    <input type="checkbox" id="setting-enable-stalker" style="accent-color: var(--accent); width:20px; height:20px;">
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 200px;">Check Cycle Interval:</label>
    <select id="setting-poll-interval" class="val-select" style="flex:1;">
      <option value="1">Every 1 Minute</option>
      <option value="2">Every 2 Minutes</option>
      <option value="5">Every 5 Minutes (Default)</option>
      <option value="10">Every 10 Minutes</option>
      <option value="15">Every 15 Minutes</option>
    </select>
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 200px;">Delay Between Friends:</label>
    <select id="setting-request-delay" class="val-select" style="flex:1;">
      <option value="500">500 ms (0.5s)</option>
      <option value="1000">1000 ms (1s - Default)</option>
      <option value="2000">2000 ms (2s)</option>
      <option value="3000">3000 ms (3s)</option>
    </select>
  </div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>Data Management</h3>
  <div style="display:flex; gap: 15px; margin-top:15px;">
    <button id="btn-export-data" class="btn btn-primary">Export All Data</button>
    <button id="btn-reset-data" class="btn btn-secondary" style="border-color:#FF4655; color:#FF4655;">Reset Extension Data</button>
  </div>
</div>
`;

const listeners = [];

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function loadSettings() {
  if(chrome && chrome.storage) {
    chrome.storage.sync.get(['cfHandle', 'ntfyTopic', 'browserNotifications', 'phoneNotifications', 'notifyAllVerdicts', 'enableStalker', 'pollIntervalMinutes', 'requestDelayMs'], (res) => {
      if(res.cfHandle) document.getElementById('setting-handle').value = res.cfHandle;
      if(res.ntfyTopic) document.getElementById('setting-ntfy').value = res.ntfyTopic;
      if(res.browserNotifications !== undefined) document.getElementById('setting-notify-browser').checked = res.browserNotifications;
      if(res.phoneNotifications !== undefined) document.getElementById('setting-notify-phone').checked = res.phoneNotifications;
      if(res.notifyAllVerdicts !== undefined) document.getElementById('setting-notify-all').checked = res.notifyAllVerdicts;
      if(res.enableStalker !== undefined) document.getElementById('setting-enable-stalker').checked = res.enableStalker;
      if(res.pollIntervalMinutes) document.getElementById('setting-poll-interval').value = res.pollIntervalMinutes;
      if(res.requestDelayMs) document.getElementById('setting-request-delay').value = res.requestDelayMs;
    });
  }
}

function saveSetting(key, val) {
  if(chrome && chrome.storage) {
    chrome.storage.sync.set({ [key]: val });
  }
}

async function validateHandle() {
  const h = document.getElementById('setting-handle').value.trim();
  const msg = document.getElementById('handle-validation-msg');
  if(!h) {
    msg.textContent = 'Please enter a handle';
    msg.style.color = '#FF4655';
    return;
  }
  
  msg.textContent = 'Validating...';
  msg.style.color = 'var(--text)';
  
  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${h}`);
    const data = await res.json();
    if(data.status === 'OK') {
      msg.textContent = `Success! Rating: ${data.result[0].rating || 'Unrated'}`;
      msg.style.color = '#4FFFBE';
      saveSetting('cfHandle', h);
    } else {
      msg.textContent = 'Handle not found.';
      msg.style.color = '#FF4655';
    }
  } catch(e) {
    msg.textContent = 'Network error during validation.';
    msg.style.color = '#FF4655';
  }
}

function init() {
  loadSettings();
  
  addListener(document.getElementById('btn-validate-handle'), 'click', validateHandle);
  
  addListener(document.getElementById('setting-handle'), 'change', (e) => saveSetting('cfHandle', e.target.value));
  addListener(document.getElementById('setting-ntfy'), 'change', (e) => saveSetting('ntfyTopic', e.target.value));
  addListener(document.getElementById('setting-notify-browser'), 'change', (e) => saveSetting('browserNotifications', e.target.checked));
  addListener(document.getElementById('setting-notify-phone'), 'change', (e) => saveSetting('phoneNotifications', e.target.checked));
  addListener(document.getElementById('setting-notify-all'), 'change', (e) => saveSetting('notifyAllVerdicts', e.target.checked));
  addListener(document.getElementById('setting-enable-stalker'), 'change', (e) => saveSetting('enableStalker', e.target.checked));
  addListener(document.getElementById('setting-poll-interval'), 'change', (e) => saveSetting('pollIntervalMinutes', parseInt(e.target.value)));
  addListener(document.getElementById('setting-request-delay'), 'change', (e) => saveSetting('requestDelayMs', parseInt(e.target.value)));
  

  
  addListener(document.getElementById('btn-export-data'), 'click', async () => {
    if(window.cfgtDB && window.cfgtDB.getProblems) {
      const data = await window.cfgtDB.getProblems();
      const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
      const a = document.createElement('a');
      a.href = str;
      a.download = 'cf_grind_full_backup.json';
      a.click();
    }
  });
  
  addListener(document.getElementById('btn-reset-data'), 'click', () => {
    if(confirm('Are you SURE you want to delete all extension data?')) {
      if(confirm('This is irreversible. Final confirmation?')) {
        if(chrome && chrome.storage) {
          chrome.storage.sync.clear();
          chrome.storage.local.clear();
        }
        alert('Data cleared. Please reload the extension.');
      }
    }
  });

  addListener(document.getElementById('btn-test-ntfy'), 'click', () => {
    const topic = document.getElementById('setting-ntfy').value.trim();
    if (topic && chrome && chrome.runtime) {
      saveSetting('ntfyTopic', topic); // Force save before test
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'SEND_NTFY',
          payload: {
            title: 'Test Notification',
            body: 'CF Grind Tracker push notifications are working!'
          }
        });
        alert('Test push sent! Check your phone.');
      }, 100);
    } else {
      alert('Please enter a valid Ntfy topic first.');
    }
  });
}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
