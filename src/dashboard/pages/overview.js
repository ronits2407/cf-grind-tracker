export default {
  html: `
    <div class="page active" id="overview-page">
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">CURRENT RANK</h2>
        <div style="display: flex; align-items: center; gap: 24px;">
          <div style="font-size: 64px;">🥈</div>
          <div>
            <h1 style="font-size: 36px; margin-bottom: 8px;">SILVER 1</h1>
            <p style="color: var(--text-secondary);">1200 Rating <span style="color: var(--accent-green);">+14</span></p>
          </div>
        </div>
        <div style="margin-top: 16px; background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: var(--accent); width: 45%; height: 100%;"></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px;">
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">TOTAL SOLVES</div>
          <h2 style="font-size: 32px;">142</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">AVG SPI</div>
          <h2 style="font-size: 32px; color: var(--accent-green);">1.24</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">BEST STREAK</div>
          <h2 style="font-size: 32px;">14 Days</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">FASTEST SOLVE</div>
          <h2 style="font-size: 32px;">2m 14s</h2>
        </div>
      </div>

      <div class="cfgt-card">
        <h2 class="cfgt-card-title">RATING PROGRESSION</h2>
        <div class="chart-container">
          <canvas id="ratingChart"></canvas>
        </div>
      </div>
      
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">ACTIVITY HEATMAP</h2>
        <div id="cal-heatmap" class="heatmap-container"></div>
      </div>
    </div>
  `,
  init: async () => {
    // Chart.js init
    const ctx = document.getElementById('ratingChart').getContext('2d');
    
    Chart.defaults.color = '#ECE8E1';
    Chart.defaults.font.family = 'Inter';
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Rating',
          data: [1000, 1050, 1100, 1080, 1150, 1200],
          borderColor: '#FF4655',
          backgroundColor: 'rgba(255, 70, 85, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: '#1F2F3D' }
          },
          x: {
            grid: { color: '#1F2F3D' }
          }
        }
      }
    });

    // Cal-heatmap init (dummy implementation for now as CalHeatmap requires strict data format)
    const calContainer = document.getElementById('cal-heatmap');
    calContainer.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 40px;">[Heatmap Placeholder - Requires real activity data]</div>';
  }
};
