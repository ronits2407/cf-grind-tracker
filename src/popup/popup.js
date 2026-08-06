import { Settings } from '../storage/settings.js';
import { DB } from '../storage/db.js';
import { getRank } from '../engine/rating.js';

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
  const rating = await settings.get('rating');
  const mode = await settings.get('mode');
  
  document.getElementById('handleDisplay').textContent = handle;
  document.getElementById('ratingDisplay').textContent = `${rating} RR`;
  document.getElementById('modeDisplay').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
  
  const rank = getRank(rating);
  document.getElementById('rankName').textContent = rank.name;
  
  const badge = document.getElementById('rankBadge');
  
  const rankParts = rank.name.split(' ');
  let badgeText = rankParts[0].charAt(0);
  if (rankParts.length > 1) badgeText += rankParts[1];
  
  badge.textContent = badgeText;
  badge.style.backgroundColor = rank.color;
  badge.style.boxShadow = `0 0 15px ${rank.color}80`;

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
  
  if (problems.length > 0) {
    const avgSpi = problems.reduce((sum, p) => sum + p.spi, 0) / problems.length;
    document.getElementById('spiTodayDisplay').textContent = avgSpi.toFixed(2);
  } else {
    document.getElementById('spiTodayDisplay').textContent = '0.00';
  }

  // Basic streak calc
  const allProblems = await db.getProblems();
  allProblems.sort((a, b) => b.timestamp - a.timestamp);
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const daysWithSolves = new Set();
  for (const p of allProblems) {
    const d = new Date(p.timestamp);
    d.setHours(0,0,0,0);
    daysWithSolves.add(d.getTime());
  }
  
  let timeCheck = currentDate.getTime();
  if (!daysWithSolves.has(timeCheck)) {
    timeCheck -= 86400000;
  }
  
  while (daysWithSolves.has(timeCheck)) {
    streak++;
    timeCheck -= 86400000;
  }
  
  document.getElementById('streakDisplay').textContent = streak;
}
