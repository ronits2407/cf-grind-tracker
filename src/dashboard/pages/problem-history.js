const html = `
<div class="page-header" style="margin-bottom: 24px;">
  <h2>Problem History</h2>
  <div class="header-actions">
    <button id="export-json-btn" class="btn btn-primary">Export JSON</button>
  </div>
</div>
<div class="history-controls val-panel">
  <input type="text" id="search-hist" placeholder="Search by problem name..." class="val-input">
  <select id="filter-mode" class="val-select">
    <option value="all">All Modes</option>
    <option value="practice">Practice</option>
    <option value="learning">Learning</option>
    <option value="contest">Contest</option>
  </select>
  <select id="filter-rating" class="val-select">
    <option value="all">All Ratings</option>
    <option value="<1200">&lt; 1200</option>
    <option value="1200-1500">1200 - 1500</option>
    <option value="1600-1900">1600 - 1900</option>
    <option value=">1900">&gt; 1900</option>
  </select>
  <select id="filter-ai" class="val-select">
    <option value="all">AI Used: All</option>
    <option value="yes">AI Used: Yes</option>
    <option value="no">AI Used: No</option>
  </select>
</div>
<div class="history-table-container">
  <table class="val-table" id="history-table">
    <thead>
      <tr>
        <th data-sort="name">Problem Name <span></span></th>
        <th data-sort="rating">Rating <span></span></th>
        <th data-sort="mode">Mode <span></span></th>
        <th data-sort="solveTime">Solve Time <span></span></th>
        <th data-sort="wa">WA <span></span></th>
        <th data-sort="ai">AI <span></span></th>
        <th data-sort="date">Date <span></span></th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody id="history-tbody">
      <!-- Rows will be injected here -->
    </tbody>
  </table>
  <div id="history-empty" style="display:none; text-align:center; padding: 20px;">
    No problems solved yet.
  </div>
</div>
<div class="pagination-controls">
  <button id="page-prev" class="btn btn-secondary">Previous</button>
  <span id="page-info">Page 1 of 1</span>
  <button id="page-next" class="btn btn-secondary">Next</button>
</div>

<!-- Notes Modal -->
<div id="notes-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.7); z-index:999; align-items:center; justify-content:center;">
  <div style="background:var(--bg-surface); border:1px solid var(--accent); padding:24px; width:500px; max-width:90vw; position:relative;">
    <h3 id="modal-problem-title" style="margin-bottom:12px; color:var(--text);">Scratchpad Notes</h3>
    <textarea id="modal-notes-text" style="width:100%; height:150px; background:var(--bg-primary); border:1px solid var(--border-color); color:var(--text); padding:10px; font-family:monospace; margin-bottom:15px;" placeholder="Write your scratchpad notes, time complexity, DP states, or hints here..."></textarea>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
      <button id="modal-save-btn" class="btn btn-primary">Save Notes</button>
    </div>
  </div>
</div>
`;

let problems = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 20;
let sortCol = 'date';
let sortAsc = false;
let activeProblemForNotes = null;

function formatTime(secs) {
  if (!secs) return '-';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString();
}

function openNotesModal(problem) {
  activeProblemForNotes = problem;
  const modal = document.getElementById('notes-modal');
  const title = document.getElementById('modal-problem-title');
  const textarea = document.getElementById('modal-notes-text');

  // Also check localStorage backup if notes isn't in p.notes
  const key = `cfgt_notes_${problem.contestId}${problem.index}`;
  const localNotes = localStorage.getItem(key) || '';

  title.textContent = `Scratchpad Notes: ${problem.title || problem.name || problem.problemId}`;
  textarea.value = problem.notes || localNotes;
  modal.style.display = 'flex';
}

function closeNotesModal() {
  document.getElementById('notes-modal').style.display = 'none';
  activeProblemForNotes = null;
}

function renderTable() {
  const tbody = document.getElementById('history-tbody');
  const empty = document.getElementById('history-empty');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    empty.style.display = 'block';
    document.getElementById('history-table').style.display = 'none';
    document.getElementById('page-info').textContent = 'Page 1 of 1';
    return;
  }
  
  empty.style.display = 'none';
  document.getElementById('history-table').style.display = 'table';
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filtered.slice(start, end);
  
  pageItems.forEach((p, idx) => {
    const key = `cfgt_notes_${p.contestId}${p.index}`;
    const hasNotes = !!(p.notes || localStorage.getItem(key));
    const btnColor = hasNotes ? '#4FFFBE' : 'var(--text-muted)';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="https://codeforces.com/contest/${p.contestId}/problem/${p.index}" target="_blank" style="color:var(--text); text-decoration:underline;">${p.title || p.name || (p.contestId ? p.contestId + p.index : p.problemId)}</a></td>
      <td><span class="rating-badge">${p.rating || '?'}</span></td>
      <td>${p.mode || 'practice'}</td>
      <td>${formatTime(p.solveTime / 1000)}</td>
      <td>${p.wrongSubmissions || p.waCount || 0}</td>
      <td>${p.aiUsed ? '✓' : '✗'}</td>
      <td>${formatDate(p.timestamp)}</td>
      <td><button class="btn-notes" data-idx="${start + idx}" style="background:transparent; border:1px solid ${btnColor}; color:${btnColor}; cursor:pointer; padding:2px 8px; font-size:12px;">📝 Notes</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Attach notes button handlers
  const noteBtns = tbody.querySelectorAll('.btn-notes');
  noteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      openNotesModal(filtered[idx]);
    });
  });
}

function applyFiltersAndSort() {
  const q = document.getElementById('search-hist').value.toLowerCase();
  const mode = document.getElementById('filter-mode').value;
  const rating = document.getElementById('filter-rating').value;
  const ai = document.getElementById('filter-ai').value;
  
  filtered = problems.filter(p => {
    const nameMatch = (p.name || p.contestId + p.index).toLowerCase().includes(q);
    const modeMatch = mode === 'all' || (p.mode || 'practice') === mode;
    
    let ratingMatch = true;
    const r = p.rating || 0;
    if (rating === '<1200') ratingMatch = r > 0 && r < 1200;
    else if (rating === '1200-1500') ratingMatch = r >= 1200 && r <= 1500;
    else if (rating === '1600-1900') ratingMatch = r >= 1600 && r <= 1900;
    else if (rating === '>1900') ratingMatch = r > 1900;
    
    let aiMatch = true;
    if (ai === 'yes') aiMatch = p.aiUsed === true;
    else if (ai === 'no') aiMatch = !p.aiUsed;
    
    return nameMatch && modeMatch && ratingMatch && aiMatch;
  });
  
  filtered.sort((a, b) => {
    let valA, valB;
    switch(sortCol) {
      case 'name': valA = a.name || ''; valB = b.name || ''; break;
      case 'rating': valA = a.rating || 0; valB = b.rating || 0; break;
      case 'mode': valA = a.mode || ''; valB = b.mode || ''; break;
      case 'solveTime': valA = a.solveTime || 0; valB = b.solveTime || 0; break;
      case 'wa': valA = a.waCount || 0; valB = b.waCount || 0; break;
      case 'ai': valA = a.aiUsed ? 1 : 0; valB = b.aiUsed ? 1 : 0; break;
      case 'date': valA = a.timestamp || 0; valB = b.timestamp || 0; break;
      default: valA = a.timestamp || 0; valB = b.timestamp || 0; break;
    }
    
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });
  
  renderTable();
}

const listeners = [];

function addListener(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
  listeners.push({ el, type, handler });
}

async function init() {
  if (window.cfgtDB && window.cfgtDB.getProblems) {
    try {
      problems = await window.cfgtDB.getProblems();
    } catch(e) { console.error('Failed to get problems', e); }
  }
  
  applyFiltersAndSort();
  
  addListener(document.getElementById('search-hist'), 'keyup', applyFiltersAndSort);
  addListener(document.getElementById('filter-mode'), 'change', applyFiltersAndSort);
  addListener(document.getElementById('filter-rating'), 'change', applyFiltersAndSort);
  addListener(document.getElementById('filter-ai'), 'change', applyFiltersAndSort);
  
  const ths = document.querySelectorAll('#history-table th');
  ths.forEach(th => {
    addListener(th, 'click', () => {
      const col = th.getAttribute('data-sort');
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }
      ths.forEach(t => t.querySelector('span').textContent = '');
      th.querySelector('span').textContent = sortAsc ? ' ↑' : ' ↓';
      applyFiltersAndSort();
    });
  });
  
  addListener(document.getElementById('page-prev'), 'click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  
  addListener(document.getElementById('page-next'), 'click', () => {
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  
  addListener(document.getElementById('export-json-btn'), 'click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(problems));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "cf_grind_history.json");
    dlAnchorElem.click();
  });
  
  addListener(document.getElementById('modal-cancel-btn'), 'click', closeNotesModal);

  addListener(document.getElementById('modal-save-btn'), 'click', async () => {
    if (!activeProblemForNotes) return;
    const text = document.getElementById('modal-notes-text').value.trim();
    activeProblemForNotes.notes = text;

    const key = `cfgt_notes_${activeProblemForNotes.contestId}${activeProblemForNotes.index}`;
    localStorage.setItem(key, text);

    if (window.cfgtDB && window.cfgtDB.updateProblem && activeProblemForNotes.id) {
      try {
        await window.cfgtDB.updateProblem(activeProblemForNotes);
      } catch(e) { console.error('Failed to update problem notes in DB', e); }
    }

    closeNotesModal();
    renderTable();
  });


}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
