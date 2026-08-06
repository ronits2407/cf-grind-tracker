export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <button class="btn btn-primary" id="btn-practice">Practice</button>
          <button class="btn btn-secondary" id="btn-learning">Learning</button>
          <button class="btn btn-secondary" id="btn-contest">Contest</button>
        </div>
        
        <h2 class="cfgt-card-title">MODE STATISTICS</h2>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px;">
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">SOLVES</div>
            <div style="font-size: 24px; font-weight: 600;">85</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">AVG SPI</div>
            <div style="font-size: 24px; font-weight: 600; color: var(--accent-green);">1.15</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">AVG TIME</div>
            <div style="font-size: 24px; font-weight: 600;">18m</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">WA RATE</div>
            <div style="font-size: 24px; font-weight: 600; color: var(--accent);">22%</div>
          </div>
          <div style="background: var(--bg-primary); padding: 16px; text-align: center;">
            <div style="color: var(--text-secondary); font-size: 12px;">AI USAGE</div>
            <div style="font-size: 24px; font-weight: 600;">5%</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h3 style="font-family: var(--font-val); color: var(--text-secondary); margin-bottom: 12px;">SOLVE TIME TREND</h3>
            <div class="chart-container" style="height: 250px;">
              <canvas id="timeChart"></canvas>
            </div>
          </div>
          <div>
            <h3 style="font-family: var(--font-val); color: var(--text-secondary); margin-bottom: 12px;">SPI DISTRIBUTION</h3>
            <div class="chart-container" style="height: 250px;">
              <canvas id="spiChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  init: async () => {
    const timeCtx = document.getElementById('timeChart').getContext('2d');
    new Chart(timeCtx, {
      type: 'line',
      data: {
        labels: Array.from({length: 10}, (_, i) => \`#\${i+1}\`),
        datasets: [{
          label: 'Solve Time (m)',
          data: [45, 30, 25, 40, 20, 15, 35, 18, 22, 16],
          borderColor: '#4FFFBE',
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    const spiCtx = document.getElementById('spiChart').getContext('2d');
    new Chart(spiCtx, {
      type: 'bar',
      data: {
        labels: ['<0.5', '0.5-0.8', '0.8-1.0', '1.0-1.5', '1.5+'],
        datasets: [{
          label: 'Count',
          data: [5, 12, 15, 30, 10],
          backgroundColor: '#FF4655'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
};
