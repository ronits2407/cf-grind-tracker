import { Settings } from '../storage/settings.js';
import { DB } from '../storage/db.js';

const settings = new Settings();
const db = new DB();

document.addEventListener('DOMContentLoaded', async () => {
  const isSetup = await settings.get('onboardingComplete');
  
  if (!isSetup) {
    document.getElementById('setupView').style.display = 'flex';
    
    document.getElementById('btnSaveSetup').addEventListener('click', async () => {
      const handle = document.getElementById('handleInput').value.trim();
      if (handle) {
        await settings.set('cfHandle', handle);
        await settings.set('onboardingComplete', true);
        window.location.reload();
      }
    });
  } else {
    document.getElementById('mainView').style.display = 'flex';
    await loadStats();
    
    document.getElementById('btnDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') });
    });
    
    document.getElementById('btnSettings').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/dashboard.html') + '#settings' });
    });
  }
});

async function loadStats() {
  const handle = await settings.get('cfHandle');
  
  document.getElementById('handleDisplay').textContent = handle;
  
  const badge = document.getElementById('avatarBadge');

  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    if (!res.ok) return;
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return; // CF returned HTML (e.g. 503)
    }
    
    if (data.status === 'OK' && data.result.length > 0) {
      let avatarUrl = data.result[0].titlePhoto || data.result[0].avatar;
      if (avatarUrl && avatarUrl.startsWith('//')) {
        avatarUrl = 'https:' + avatarUrl;
      }
      badge.style.backgroundImage = `url(${avatarUrl})`;
      badge.style.backgroundSize = 'cover';
      badge.style.backgroundPosition = 'center';
      badge.textContent = ''; // clear text if image loads
    }
  } catch (e) {
    console.error('Failed to fetch avatar', e);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const problems = await db.getProblems({ dateFrom: today.getTime() });
  document.getElementById('solvesTodayDisplay').textContent = problems.length;
}
