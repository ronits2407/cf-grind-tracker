import { DB } from '../storage/db.js';
import { Settings } from '../storage/settings.js';
import overviewPage from './pages/overview.js';
import ratingBreakdownPage from './pages/rating-breakdown.js';
import problemHistoryPage from './pages/problem-history.js';
import friendsPage from './pages/friends.js';
import settingsPage from './pages/settings.js';

const pages = {
  'overview': overviewPage,
  'rating-breakdown': ratingBreakdownPage,
  'problem-history': problemHistoryPage,
  'friends': friendsPage,
  'settings': settingsPage
};

const db = new DB();
const settings = new Settings();

window.cfgtDB = db;
window.cfgtSettings = settings;

window.cfgtState = {
  cfHandle: 'Guest'
};

document.addEventListener('DOMContentLoaded', async () => {
  await db.openDB();

  window.cfgtState.cfHandle = (await settings.get('cfHandle')) || 'Guest';

  updateSidebar();

  // Setup navigation
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      navigateTo(pageId);
      window.location.hash = pageId;
    });
  });

  // Handle deep links
  const initialPage = window.location.hash.replace('#', '') || 'overview';
  navigateTo(initialPage);
});

async function updateSidebar() {
  document.getElementById('sidebar-rating').textContent = '';
  document.getElementById('sidebar-rank-name').textContent = window.cfgtState.cfHandle;
  
  const iconContainer = document.getElementById('sidebar-rank-icon');
  if (window.cfgtState.cfHandle === 'Guest') {
    iconContainer.textContent = 'G';
    return;
  }
  
  // Set initial letter
  iconContainer.textContent = window.cfgtState.cfHandle.charAt(0).toUpperCase();
  
  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${window.cfgtState.cfHandle}`);
    const data = await res.json();
    if (data.status === 'OK' && data.result.length > 0) {
      const avatarUrl = data.result[0].titlePhoto || data.result[0].avatar;
      if (avatarUrl) {
        // Handle protocol-relative URLs returned by CF (e.g., //userpic.codeforces.org/...)
        const fullUrl = avatarUrl.startsWith('//') ? 'https:' + avatarUrl : avatarUrl;
        iconContainer.innerHTML = `<img src="${fullUrl}" style="width:100%; height:100%; border-radius:inherit; object-fit:cover;" alt="Avatar">`;
      }
    }
  } catch (e) {
    console.error('Failed to load CF avatar', e);
  }
}

async function navigateTo(pageId) {
  if (!pages[pageId]) pageId = 'overview';

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    }
  });

  const mainContent = document.getElementById('main-content');
  
  // Clean up previous page if needed
  if (window.currentPage && window.currentPage.destroy) {
    window.currentPage.destroy();
  }

  // Inject HTML
  mainContent.innerHTML = pages[pageId].html;

  // Init page logic
  if (pages[pageId].init) {
    await pages[pageId].init();
  }

  window.currentPage = pages[pageId];
}
