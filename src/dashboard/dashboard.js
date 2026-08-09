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

function updateSidebar() {
  document.getElementById('sidebar-rating').textContent = '';
  document.getElementById('sidebar-rank-name').textContent = window.cfgtState.cfHandle;
  document.getElementById('sidebar-rank-icon').textContent = window.cfgtState.cfHandle.charAt(0).toUpperCase();
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
