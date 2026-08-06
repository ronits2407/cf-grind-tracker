// src/content/panel.js

window.CFGT_Panel = {
  data: {
    startTime: null,
    timerInterval: null,
    status: 'IDLE', // IDLE, SOLVING, PAUSED, COMPLETE
    elapsedSeconds: 0,
    wrongCount: 0,
    mode: 'PRACTICE',
    avgTime: 1200, // mock default 20 mins
    rating: 1200
  },

  createPanel: function(container, problemData) {
    this.problemData = problemData;
    this.data.rating = problemData.rating || 1200;
    
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/content/panel.css');
    document.head.appendChild(link);

    // Create Main Container
    const panel = document.createElement('div');
    panel.id = 'cfgt-panel';
    panel.innerHTML = `
      <div class="cfgt-header">
        <div class="cfgt-title"><span class="cfgt-logo">♦</span> CF GRIND TRACKER</div>
        <div class="cfgt-tabs">
          <button class="cfgt-tab" data-mode="LEARNING">LEARNING</button>
          <button class="cfgt-tab active" data-mode="PRACTICE">PRACTICE</button>
          <button class="cfgt-tab" data-mode="CONTEST">CONTEST</button>
        </div>
      </div>
      
      <div class="cfgt-problem-info cfgt-confidence-medium">
        <div>
          <span class="cfgt-problem-name">${problemData.title}</span>
          <span class="cfgt-badge ${this.getRatingClass(this.data.rating)}">${this.data.rating ? '*' + this.data.rating : 'UNRATED'}</span>
        </div>
        <div class="cfgt-stats-preview">
          Avg time: ~<span id="cfgt-avg-time">20:00</span>
        </div>
      </div>

      <div class="cfgt-timer-section">
        <div>
          <div class="cfgt-status" id="cfgt-status-text">STATUS: IDLE</div>
          <div class="cfgt-timer" id="cfgt-timer-display">00:00:00</div>
        </div>
        <div class="cfgt-wa-counter" id="cfgt-wa-display">
          <span>❌</span>
          <span id="cfgt-wa-count">0</span> WAs (+<span id="cfgt-penalty-time">0</span>m penalty)
        </div>
      </div>

      <div class="cfgt-controls">
        <button class="cfgt-btn cfgt-btn-start" id="cfgt-btn-start">▶ START SOLVING</button>
        <button class="cfgt-btn cfgt-btn-pause cfgt-hidden" id="cfgt-btn-pause">⏸ PAUSE</button>
        <button class="cfgt-btn cfgt-btn-end cfgt-hidden" id="cfgt-btn-end">⏹ END SOLVE</button>
      </div>

      <div class="cfgt-spi-preview">
        <div>Predicted SPI: <span class="cfgt-spi-value" id="cfgt-spi-val">1.00</span></div>
        <div class="cfgt-rating-change neutral" id="cfgt-rating-delta">Δ +0</div>
      </div>

      <div class="cfgt-footer" id="cfgt-footer">
        <div class="cfgt-checkboxes">
          <label class="cfgt-checkbox-label"><input type="checkbox" class="cfgt-checkbox" id="chk-indep" checked> Solved Independently</label>
          <label class="cfgt-checkbox-label"><input type="checkbox" class="cfgt-checkbox" id="chk-tut"> Looked at Tutorial</label>
          <label class="cfgt-checkbox-label"><input type="checkbox" class="cfgt-checkbox" id="chk-sol"> Looked at Others' Solutions</label>
          <label class="cfgt-checkbox-label"><input type="checkbox" class="cfgt-checkbox" id="chk-ai"> Used AI</label>
        </div>
        <button class="cfgt-btn cfgt-btn-submit" id="cfgt-btn-submit">SUBMIT RECORD</button>
      </div>
      
      <div class="cfgt-success-banner" id="cfgt-success-banner">
        <strong>SUCCESS!</strong> Solve recorded. SPI: <span id="cfgt-final-spi">1.00</span> | Rating: <span id="cfgt-final-rating">+0</span>
      </div>
    `;
    
    container.parentNode.insertBefore(panel, container.nextSibling);
    this.panelEl = panel;
    
    this.bindEvents();
    this.loadSettings();
    this.updateDisplay();
  },

  getRatingClass: function(rating) {
    if (!rating || rating < 1200) return 'cfgt-rating-gray';
    if (rating < 1400) return 'cfgt-rating-green';
    if (rating < 1600) return 'cfgt-rating-cyan';
    if (rating < 1900) return 'cfgt-rating-blue';
    if (rating < 2100) return 'cfgt-rating-violet';
    if (rating < 2400) return 'cfgt-rating-orange';
    return 'cfgt-rating-red';
  },

  bindEvents: function() {
    // Mode tabs
    const tabs = this.panelEl.querySelectorAll('.cfgt-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.data.mode = e.target.dataset.mode;
        chrome.storage.sync.set({ defaultMode: this.data.mode });
        this.updateSPI();
      });
    });

    // Buttons
    this.panelEl.querySelector('#cfgt-btn-start').addEventListener('click', () => this.startSolve());
    this.panelEl.querySelector('#cfgt-btn-pause').addEventListener('click', () => this.pauseSolve());
    this.panelEl.querySelector('#cfgt-btn-end').addEventListener('click', () => this.endSolve());
    this.panelEl.querySelector('#cfgt-btn-submit').addEventListener('click', () => this.submitRecord());

    // Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key.toLowerCase() === 's' && this.data.status !== 'SOLVING') {
          e.preventDefault();
          this.startSolve();
        } else if (e.key.toLowerCase() === 'e' && this.data.status === 'SOLVING') {
          e.preventDefault();
          this.endSolve();
        }
      }
    });

    // Listen for Service Worker messages
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      // Handle both UPDATE_WA (from service worker) and SUBMISSION_UPDATE
      if (msg.type === 'UPDATE_WA' || msg.type === 'SUBMISSION_UPDATE') {
        this.data.wrongCount = msg.wrongSubmissions || msg.wrongCount || 0;
        this.updateDisplay();
        const waDisplay = this.panelEl.querySelector('#cfgt-wa-display');
        waDisplay.classList.remove('pulse');
        void waDisplay.offsetWidth; // trigger reflow
        waDisplay.classList.add('pulse');
      } else if (msg.type === 'AUTO_COMPLETE' && this.data.status === 'SOLVING') {
        // Auto-detected AC from service worker
        if (msg.wrongSubmissions !== undefined) {
          this.data.wrongCount = msg.wrongSubmissions;
        }
        this.endSolve();
      }
    });
  },

  loadSettings: function() {
    chrome.storage.sync.get(['defaultMode'], (res) => {
      if (res.defaultMode) {
        this.data.mode = res.defaultMode;
        const tabs = this.panelEl.querySelectorAll('.cfgt-tab');
        tabs.forEach(t => {
          t.classList.toggle('active', t.dataset.mode === res.defaultMode);
        });
      }
    });
    // Fetch avg solve time from background service worker
    chrome.runtime.sendMessage({ type: 'GET_AVG_SOLVE_TIME', payload: { rating: this.data.rating } }, (response) => {
      if (chrome.runtime.lastError) return; // extension context may not be ready
      if (response && response.avgTime) {
        this.data.avgTime = response.avgTime / 1000; // convert ms to seconds
        const mins = Math.floor(this.data.avgTime / 60);
        const secs = Math.floor(this.data.avgTime % 60);
        this.panelEl.querySelector('#cfgt-avg-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    });
  },

  startSolve: function() {
    if (this.data.status === 'SOLVING') return;
    this.data.status = 'SOLVING';
    this.data.startTime = Date.now() - (this.data.elapsedSeconds * 1000);
    
    this.panelEl.querySelector('#cfgt-btn-start').classList.add('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-btn-pause').classList.remove('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-btn-end').classList.remove('cfgt-hidden');
    
    this.panelEl.querySelector('#cfgt-timer-display').classList.add('running');
    
    this.data.timerInterval = setInterval(() => {
      this.data.elapsedSeconds = Math.floor((Date.now() - this.data.startTime) / 1000);
      this.updateDisplay();
    }, 1000);
    
    chrome.runtime.sendMessage({ 
      type: 'START_SOLVE', 
      payload: {
        problemId: `${this.problemData.contestId}${this.problemData.index}`,
        contestId: this.problemData.contestId,
        problemIndex: this.problemData.index,
        rating: this.problemData.rating,
        mode: this.data.mode,
        startTime: this.data.startTime
      }
    });
    
    this.updateDisplay();
  },

  pauseSolve: function() {
    if (this.data.status !== 'SOLVING') return;
    this.data.status = 'PAUSED';
    clearInterval(this.data.timerInterval);
    
    this.panelEl.querySelector('#cfgt-btn-start').classList.remove('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-btn-start').textContent = '▶ RESUME';
    this.panelEl.querySelector('#cfgt-btn-pause').classList.add('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-timer-display').classList.remove('running');
    
    this.updateDisplay();
  },

  endSolve: function() {
    if (this.data.status === 'COMPLETE') return;
    this.data.status = 'COMPLETE';
    clearInterval(this.data.timerInterval);
    
    this.panelEl.querySelector('#cfgt-btn-start').classList.add('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-btn-pause').classList.add('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-btn-end').classList.add('cfgt-hidden');
    this.panelEl.querySelector('#cfgt-timer-display').classList.remove('running');
    
    this.panelEl.querySelector('#cfgt-footer').style.display = 'block';
    this.updateDisplay();
  },

  submitRecord: function() {
    const isIndep = this.panelEl.querySelector('#chk-indep').checked;
    const isTut = this.panelEl.querySelector('#chk-tut').checked;
    const isSol = this.panelEl.querySelector('#chk-sol').checked;
    const isAi = this.panelEl.querySelector('#chk-ai').checked;
    
    const payload = {
      problemData: {
        problemId: `${this.problemData.contestId}${this.problemData.index}`,
        contestId: this.problemData.contestId,
        problemIndex: this.problemData.index,
        rating: this.problemData.rating || 1200,
        title: this.problemData.title,
        tags: this.problemData.tags || [],
        mode: this.data.mode
      },
      solveData: {
        solveTime: this.data.elapsedSeconds * 1000, // ms
        wrongSubmissions: this.data.wrongCount,
        aiUsed: isAi,
        tutorialUsed: isTut,
        othersUsed: isSol,
        independent: isIndep,
        timestamp: Date.now()
      }
    };
    
    this.panelEl.querySelector('#cfgt-btn-submit').disabled = true;
    this.panelEl.querySelector('#cfgt-btn-submit').textContent = 'SUBMITTING...';
    
    chrome.runtime.sendMessage({ type: 'COMPLETE_SOLVE', payload }, (response) => {
      this.panelEl.querySelector('#cfgt-footer').style.display = 'none';
      const banner = this.panelEl.querySelector('#cfgt-success-banner');
      banner.style.display = 'block';
      
      if (response && response.spi !== undefined) {
        this.panelEl.querySelector('#cfgt-final-spi').textContent = response.spi.toFixed(2);
        const deltaEl = this.panelEl.querySelector('#cfgt-final-rating');
        const delta = response.ratingUpdate ? response.ratingUpdate.delta : 0;
        deltaEl.textContent = (delta >= 0 ? '+' : '') + Math.round(delta);
        deltaEl.className = delta >= 0 ? 'cfgt-rating-change positive' : 'cfgt-rating-change negative';
      }
    });
  },

  updateDisplay: function() {
    // Timer
    const h = Math.floor(this.data.elapsedSeconds / 3600);
    const m = Math.floor((this.data.elapsedSeconds % 3600) / 60);
    const s = this.data.elapsedSeconds % 60;
    const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    this.panelEl.querySelector('#cfgt-timer-display').textContent = timeStr;
    
    // Status
    this.panelEl.querySelector('#cfgt-status-text').textContent = 'STATUS: ' + this.data.status;
    
    // WA Count — 20 min penalty per WA (ICPC style)
    this.panelEl.querySelector('#cfgt-wa-count').textContent = this.data.wrongCount;
    this.panelEl.querySelector('#cfgt-penalty-time').textContent = this.data.wrongCount * 20;
    
    this.updateSPI();
  },

  updateSPI: function() {
    // Basic SPI calculation preview
    if (this.data.elapsedSeconds === 0) return;
    
    let solveTime = this.data.elapsedSeconds + (this.data.wrongCount * 600);
    if (solveTime <= 0) solveTime = 1;
    
    let timeRatio = this.data.avgTime / solveTime;
    
    let modeMultiplier = 1.0;
    if (this.data.mode === 'CONTEST') modeMultiplier = 1.2;
    if (this.data.mode === 'LEARNING') modeMultiplier = 0.5;
    
    let penalty = Math.pow(0.9, this.data.wrongCount);
    
    let spi = timeRatio * modeMultiplier * penalty;
    
    const k = 32;
    let delta = Math.round(k * (spi - 1.0) * modeMultiplier);
    
    const spiEl = this.panelEl.querySelector('#cfgt-spi-val');
    spiEl.textContent = spi.toFixed(2);
    
    const deltaEl = this.panelEl.querySelector('#cfgt-rating-delta');
    deltaEl.textContent = 'Δ ' + (delta >= 0 ? '+' : '') + delta;
    
    deltaEl.className = 'cfgt-rating-change ' + (delta > 0 ? 'positive' : (delta < 0 ? 'negative' : 'neutral'));
  }
};
