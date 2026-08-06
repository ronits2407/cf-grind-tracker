const html = `
<div class="page-header">
  <h2>Settings</h2>
</div>

<div class="val-panel settings-section">
  <h3>Profile</h3>
  <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
    <label style="width: 150px;">Codeforces Handle:</label>
    <input type="text" id="setting-handle" class="val-input" style="flex:1;">
    <button id="btn-validate-handle" class="val-btn">Validate</button>
  </div>
  <div id="handle-validation-msg" style="margin-top:10px; font-size:0.9em;"></div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>Notifications</h3>
  <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
    <label style="width: 150px;">Ntfy Topic:</label>
    <input type="text" id="setting-ntfy" class="val-input" style="flex:1;" placeholder="e.g. cf-grind-gzn84omyxtxx">
  </div>
  <div style="display:flex; gap:10px; margin-top:15px; align-items:center;">
    <label style="width: 150px;">Browser Notifications:</label>
    <input type="checkbox" id="setting-notify-browser" style="accent-color: var(--accent); width:20px; height:20px;">
  </div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>SPI Tuning</h3>
  <div style="margin-top:10px;">
    <label>K-Factor (16-64): <span id="val-k">32</span></label>
    <input type="range" id="setting-k" min="16" max="64" value="32" style="width:100%; accent-color:var(--accent);">
  </div>
  <div style="margin-top:10px;">
    <label>Penalty Multiplier (0.7-1.0): <span id="val-pen">0.9</span></label>
    <input type="range" id="setting-penalty" min="0.7" max="1.0" step="0.05" value="0.9" style="width:100%; accent-color:var(--accent);">
  </div>
</div>

<div class="val-panel settings-section" style="margin-top: 20px;">
  <h3>Data Management</h3>
  <div style="display:flex; gap: 15px; margin-top:15px;">
    <button id="btn-export-data" class="val-btn">Export All Data</button>
    <button id="btn-reset-data" class="val-btn-outline" style="border-color:#FF4655; color:#FF4655;">Reset Extension Data</button>
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
    chrome.storage.sync.get(['cfHandle', 'ntfyTopic', 'notifyBrowser', 'spiK', 'spiPenalty'], (res) => {
      if(res.cfHandle) document.getElementById('setting-handle').value = res.cfHandle;
      if(res.ntfyTopic) document.getElementById('setting-ntfy').value = res.ntfyTopic;
      if(res.notifyBrowser !== undefined) document.getElementById('setting-notify-browser').checked = res.notifyBrowser;
      if(res.spiK) {
        document.getElementById('setting-k').value = res.spiK;
        document.getElementById('val-k').textContent = res.spiK;
      }
      if(res.spiPenalty) {
        document.getElementById('setting-penalty').value = res.spiPenalty;
        document.getElementById('val-pen').textContent = res.spiPenalty;
      }
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
    const res = await fetch(\`https://codeforces.com/api/user.info?handles=\${h}\`);
    const data = await res.json();
    if(data.status === 'OK') {
      msg.textContent = \`Success! Rating: \${data.result[0].rating || 'Unrated'}\`;
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
  addListener(document.getElementById('setting-notify-browser'), 'change', (e) => saveSetting('notifyBrowser', e.target.checked));
  
  addListener(document.getElementById('setting-k'), 'input', (e) => {
    document.getElementById('val-k').textContent = e.target.value;
    saveSetting('spiK', parseInt(e.target.value));
  });
  
  addListener(document.getElementById('setting-penalty'), 'input', (e) => {
    document.getElementById('val-pen').textContent = e.target.value;
    saveSetting('spiPenalty', parseFloat(e.target.value));
  });
  
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
}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
