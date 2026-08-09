// src/content/inject.js

function init() {
  const url = window.location.href;
  if (!url.includes('codeforces.com/problemset/problem/') && !url.includes('codeforces.com/contest/') && !url.includes('codeforces.com/gym/')) {
    return;
  }

  // Prevent multiple injections
  if (document.getElementById('cfgt-panel') || document.getElementById('cfgt-panel-host')) return;

  // Inject a script into the main page context to suppress Codeforces' problem statement mutation alert
  const script = document.createElement('script');
  script.textContent = `
    if (window.Codeforces) {
      const origShowMessage = window.Codeforces.showMessage;
      window.Codeforces.showMessage = function(msg) {
        if (typeof msg === 'string' && msg.toLowerCase().includes('recently')) {
          return; // Suppress the problem statement recently changed alert
        }
        if (origShowMessage) {
          return origShowMessage.apply(this, arguments);
        }
      };
    }
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Inject CSS for light DOM elements (like mode buttons inside CF title)
  if (!document.getElementById('cfgt-light-styles')) {
    const style = document.createElement('style');
    style.id = 'cfgt-light-styles';
    style.textContent = `
      #cfgt-modes-light {
        display: inline-flex;
        gap: 8px;
        margin-left: 20px;
        vertical-align: middle;
      }
      .cfgt-mode-btn-light {
        background: transparent;
        border: 1px solid #4F5E7B;
        color: #8C9BAB;
        padding: 4px 12px;
        border-radius: 4px;
        font-family: 'Oswald', sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .cfgt-mode-btn-light:hover {
        background: rgba(79, 94, 123, 0.2);
        color: #ECE8E1;
      }
      .cfgt-mode-btn-light.active {
        background: #FF4655;
        border-color: #FF4655;
        color: #ECE8E1;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

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
