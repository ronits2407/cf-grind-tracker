const html = `
<div class="page-header">
  <h2>Problem History</h2>
  <div class="header-actions">
    <button id="export-json-btn" class="val-btn">Export JSON</button>
    <button id="export-pdf-btn" class="val-btn-outline">Export PDF</button>
  </div>
</div>
<div class="history-controls val-panel">
  <input type="text" id="search-hist" placeholder="Search by problem name..." class="val-input">
  <select id="filter-mode" class="val-select">
    <option value="all">All Modes</option>
    <option value="practice">Practice</option>
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
        <th data-sort="spi">SPI <span></span></th>
        <th data-sort="date">Date <span></span></th>
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
  <button id="page-prev" class="val-btn-outline">Previous</button>
  <span id="page-info">Page 1 of 1</span>
  <button id="page-next" class="val-btn-outline">Next</button>
</div>
`;

let problems = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 20;
let sortCol = 'date';
let sortAsc = false;

function formatTime(secs) {
  if (!secs) return '-';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString();
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
  
  document.getElementById('page-info').textContent = \`Page \${currentPage} of \${totalPages}\`;
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filtered.slice(start, end);
  
  pageItems.forEach(p => {
    const tr = document.createElement('tr');
    
    let spiColor = '';
    if (p.spi) {
      spiColor = p.spi > 1 ? '#4FFFBE' : '#FF4655';
    }
    
    tr.innerHTML = \`
      <td><a href="https://codeforces.com/contest/\${p.contestId}/problem/\${p.index}" target="_blank" style="color:var(--text); text-decoration:underline;">\${p.name || p.contestId + p.index}</a></td>
      <td><span class="rating-badge">\${p.rating || '?'}</span></td>
      <td>\${p.mode || 'practice'}</td>
      <td>\${formatTime(p.solveTime)}</td>
      <td>\${p.waCount || 0}</td>
      <td>\${p.aiUsed ? '✓' : '✗'}</td>
      <td style="color:\${spiColor}">\${p.spi ? p.spi.toFixed(2) : '-'}</td>
      <td>\${formatDate(p.timestamp)}</td>
    \`;
    tbody.appendChild(tr);
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
      case 'spi': valA = a.spi || 0; valB = b.spi || 0; break;
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
  
  addListener(document.getElementById('export-pdf-btn'), 'click', () => {
    alert('PDF export coming soon');
  });
}

function destroy() {
  listeners.forEach(({ el, type, handler }) => {
    el.removeEventListener(type, handler);
  });
  listeners.length = 0;
}

export default { html, init, destroy };
