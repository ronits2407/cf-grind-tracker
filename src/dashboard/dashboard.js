import { DB } from '../storage/db.js';
import { Settings } from '../storage/settings.js';
import { getRank, getRankProgress } from '../engine/rating.js';

import overviewPage from './pages/overview.js';
import modeStatsPage from './pages/mode-stats.js';
import ratingBreakdownPage from './pages/rating-breakdown.js';
import problemHistoryPage from './pages/problem-history.js';
import achievementsPage from './pages/achievements.js';
import icpcContestsPage from './pages/icpc-contests.js';
import practiceListPage from './pages/practice-list.js';
import friendsPage from './pages/friends.js';
import settingsPage from './pages/settings.js';

const pages = {
  'overview': overviewPage,
  'mode-stats': modeStatsPage,
  'rating-breakdown': ratingBreakdownPage,
  'problem-history': problemHistoryPage,
  'achievements': achievementsPage,
  'icpc-contests': icpcContestsPage,
  'practice-list': practiceListPage,
  'friends': friendsPage,
  'settings': settingsPage
};

const db = new DB();
const settings = new Settings();

window.cfgtDB = db;
window.cfgtSettings = settings;

window.cfgtState = {
  rating: 1200,
  rank: 'SILVER 1'
};

document.addEventListener('DOMContentLoaded', async () => {
  await db.openDB();
  await settings.load();

  window.cfgtState.rating = settings.get('rating') || 1200;
  window.cfgtState.rank = getRank(window.cfgtState.rating);

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
  document.getElementById('sidebar-rating').textContent = `${window.cfgtState.rating} RR`;
  document.getElementById('sidebar-rank-name').textContent = window.cfgtState.rank;
  
  // Extract first letters for badge e.g. "SILVER 1" -> "S1"
  const rankParts = window.cfgtState.rank.split(' ');
  let badgeText = rankParts[0].charAt(0);
  if (rankParts.length > 1) badgeText += rankParts[1];
  document.getElementById('sidebar-rank-icon').textContent = badgeText;
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
