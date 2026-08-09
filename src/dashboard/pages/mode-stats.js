const charts = [];

export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <div style="display: flex; gap: 16px; margin-bottom: 24px;" id="mode-tabs">
          <button class="btn btn-primary" data-mode="practice">Practice</button>
          <button class="btn btn-secondary" data-mode="learning">Learning</button>
          <button class="btn btn-secondary" data-mode="contest">Contest</button>
        </div>
        
        <h2 class="cfgt-card-title">MODE STATISTICS</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">SOLVES</div>
            <div style="font-size: 24px; font-weight: 600;" id="ms-solves">0</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">AVG TIME</div>
            <div style="font-size: 24px; font-weight: 600;" id="ms-time">0m</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">WA RATE</div>
            <div style="font-size: 24px; font-weight: 600; color: var(--accent);" id="ms-wa">0%</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">AI USAGE</div>
            <div style="font-size: 24px; font-weight: 600;" id="ms-ai">0%</div>
          </div>
        </div>

        <div>
          <h3 style="font-family: var(--font-val); color: var(--text-secondary); margin-bottom: 12px;">SOLVE TIME TREND</h3>
          <div class="chart-container" style="height: 300px; position: relative;">
            <canvas id="timeChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  charts,
  init: async () => {
    const db = window.cfgtDB;
    let currentMode = 'practice';

    const render = async () => {
      // Clear existing charts
      charts.forEach(c => c.destroy());
      charts.length = 0;

      const problems = await db.getProblems();
      const modeData = problems.filter(p => p.mode === currentMode);
      
      // Update stats
      document.getElementById('ms-solves').textContent = modeData.length;
      
      if (modeData.length === 0) {
        document.getElementById('ms-time').textContent = '0m';
        document.getElementById('ms-wa').textContent = '0%';
        document.getElementById('ms-ai').textContent = '0%';
        return;
      }

      let totalTime = 0;
      let waCount = 0;
      let aiCount = 0;

      modeData.forEach(p => {
        totalTime += (p.solveTime || 0);
        if (p.attempts > 1 || p.wrongSubmissions > 0) waCount++;
        if (p.aiUsed) aiCount++;
      });

      const avgTime = totalTime / modeData.length;
      
      document.getElementById('ms-time').textContent = `${Math.round(avgTime / 60000)}m`;
      document.getElementById('ms-wa').textContent = `${Math.round((waCount / modeData.length) * 100)}%`;
      document.getElementById('ms-ai').textContent = `${Math.round((aiCount / modeData.length) * 100)}%`;

      if (window.Chart) {
        Chart.defaults.color = '#7B8794';
        Chart.defaults.borderColor = '#1F2F3D';
        Chart.defaults.font.family = 'Inter';

        // Time trend chart (last 30 solves in this mode)
        const recent = modeData.slice(0, 30).reverse();
        const timeLabels = recent.map((_, i) => `#${i+1}`);
        const timeData = recent.map(p => p.solveTime / 60000);

        const timeCtx = document.getElementById('timeChart').getContext('2d');
        const timeChart = new Chart(timeCtx, {
          type: 'line',
          data: {
            labels: timeLabels.length ? timeLabels : ['No Data'],
            datasets: [{
              label: 'Solve Time (m)',
              data: timeData.length ? timeData : [0],
              borderColor: '#4FFFBE',
              backgroundColor: 'rgba(79, 255, 190, 0.1)',
              fill: true,
              tension: 0.3
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
        charts.push(timeChart);
      }
    };

    // Tab switching
    const tabs = document.querySelectorAll('#mode-tabs button');
    tabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        currentMode = btn.getAttribute('data-mode');
        render();
      });
    });

    await render();
  },
  destroy: () => {
    charts.forEach(c => c.destroy());
    charts.length = 0;
  }
};
