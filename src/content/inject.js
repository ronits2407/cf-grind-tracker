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

  // Observer to kill the Codeforces "recently changed" alert
  const alertKiller = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.textContent && node.textContent.includes('problem statement has recently been changed')) {
            node.style.display = 'none';
          }
          const alerts = node.querySelectorAll ? node.querySelectorAll('*') : [];
          alerts.forEach(el => {
            if (el.textContent && el.textContent.includes('problem statement has recently been changed')) {
              el.style.display = 'none';
            }
          });
        }
      }
    }
    // Also periodic check just in case
    document.querySelectorAll('.alert, .info, div').forEach(el => {
      if (el.textContent && el.textContent.includes('problem statement has recently been changed')) {
        if (el.style.display !== 'none' && el.childElementCount < 5) {
          el.style.display = 'none';
        }
      }
    });
  });
  alertKiller.observe(document.body, { childList: true, subtree: true });

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
