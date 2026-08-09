// src/content/inject.js

function init() {
  const url = window.location.href;
  if (!url.includes('codeforces.com/problemset/problem/') && !url.includes('codeforces.com/contest/') && !url.includes('codeforces.com/gym/')) {
    return;
  }

  // Prevent multiple injections
  if (document.getElementById('cfgt-panel') || document.getElementById('cfgt-panel-host')) return;

  const titleEl = document.querySelector('.title');
  const title = titleEl ? titleEl.textContent.trim() : 'Unknown Problem';
  
  let contestId = '';
  let index = '';
  
  const matchProblemset = url.match(/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
  const matchContest = url.match(/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
  
  if (matchProblemset) {
    contestId = matchProblemset[1];
    index = matchProblemset[2];
  } else if (matchContest) {
    contestId = matchContest[1];
    index = matchContest[2];
  }

  let rating = null;
  const tags = [];
  const tagBoxes = document.querySelectorAll('.tag-box');
  
  tagBoxes.forEach(box => {
    const text = box.textContent.trim();
    if (text.startsWith('*')) {
      rating = parseInt(text.substring(1), 10);
    } else if (text !== '') {
      tags.push(text);
    }
  });

  const problemData = { title, contestId, index, rating, tags, url };

  const injectPanel = (container) => {
    // If panel logic is not loaded yet, wait for it
    const checkPanelLoaded = setInterval(() => {
      if (window.CFGT_Panel) {
        clearInterval(checkPanelLoaded);
        window.CFGT_Panel.createPanel(container, problemData);
      }
    }, 100);
  };

  const problemStatement = document.querySelector('.problem-statement');
  if (problemStatement) {
    injectPanel(problemStatement);
  } else {
    const observer = new MutationObserver((mutations, obs) => {
      const ps = document.querySelector('.problem-statement');
      if (ps) {
        injectPanel(ps);
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
