import { getRank, getRankProgress } from '../../engine/rating.js';

const charts = [];

export default {
  html: `
    <div class="page active" id="overview-page">
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">CURRENT RANK</h2>
        <div style="display: flex; align-items: center; gap: 24px;">
          <div style="font-size: 64px;" id="overview-rank-icon">🥈</div>
          <div>
            <h1 style="font-size: 36px; margin-bottom: 8px;" id="overview-rank-name">SILVER 1</h1>
            <p style="color: var(--text-secondary);"><span id="overview-rating">1200</span> Rating</p>
          </div>
        </div>
        <div style="margin-top: 16px; background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="overview-progress" style="background: var(--accent); width: 0%; height: 100%;"></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px;">
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">TOTAL SOLVES</div>
          <h2 style="font-size: 32px;" id="stat-total-solves">0</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">AVG SPI (LAST 30)</div>
          <h2 style="font-size: 32px; color: var(--accent-green);" id="stat-avg-spi">0.00</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">SOLVES THIS WEEK</div>
          <h2 style="font-size: 32px;" id="stat-week-solves">0</h2>
        </div>
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">CURRENT STREAK</div>
          <h2 style="font-size: 32px;" id="stat-streak">0 Days</h2>
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
        <div id="custom-heatmap" class="heatmap-container" style="display: grid; grid-template-columns: repeat(52, 1fr); gap: 2px;"></div>
      </div>

      <div class="cfgt-card">
        <h2 class="cfgt-card-title">RECENT SOLVES</h2>
        <div class="table-container">
          <table id="recent-solves-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Rating</th>
                <th>Time</th>
                <th>SPI</th>
              </tr>
            </thead>
            <tbody>
              <!-- Data injected here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  charts,
  init: async () => {
    const db = window.cfgtDB;
    const settings = window.cfgtSettings;
    const currentRating = (await settings.get('rating')) || 1200;
    
    // Setup rank info
    const rankName = getRank(currentRating).name;
    const progress = getRankProgress(currentRating);
    
    document.getElementById('overview-rank-name').textContent = rankName;
    document.getElementById('overview-rating').textContent = currentRating;
    document.getElementById('overview-progress').style.width = `${progress}%`;
    
    // Stats logic
    const problems = await db.getProblems();
    document.getElementById('stat-total-solves').textContent = problems.length;
    
    // Avg SPI last 30
    const last30 = problems.slice(0, 30);
    if (last30.length > 0) {
      const avgSpi = last30.reduce((acc, p) => acc + (p.spi || 1.0), 0) / last30.length;
      document.getElementById('stat-avg-spi').textContent = avgSpi.toFixed(2);
    }
    
    // Week solves
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekSolves = problems.filter(p => p.timestamp >= oneWeekAgo).length;
    document.getElementById('stat-week-solves').textContent = weekSolves;

    // Simple streak calculation
    let streak = 0;
    let today = new Date();
    today.setHours(0,0,0,0);
    let checkDate = new Date(today);
    
    const solveDates = new Set(problems.map(p => {
      const d = new Date(p.timestamp);
      d.setHours(0,0,0,0);
      return d.getTime();
    }));

    while (solveDates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    // Check yesterday if today hasn't been solved
    if (streak === 0) {
      checkDate.setDate(today.getDate() - 1);
      while (solveDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    document.getElementById('stat-streak').textContent = `${streak} Days`;

    // Chart.js global settings
    if (window.Chart) {
      Chart.defaults.color = '#7B8794';
      Chart.defaults.borderColor = '#1F2F3D';
      Chart.defaults.font.family = 'Inter';

      // Rating chart
      const history = await db.getRatingHistory();
      const labels = history.map(h => {
        const d = new Date(h.timestamp);
        return `${d.getMonth()+1}/${d.getDate()}`;
      });
      const data = history.map(h => h.rating);
      
      const ctx = document.getElementById('ratingChart').getContext('2d');
      const ratingChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            label: 'Rating',
            data: data.length ? data : [1200],
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
      charts.push(ratingChart);
    }

    // Heatmap (Custom grid)
    const heatmapContainer = document.getElementById('custom-heatmap');
    // Group problems by date
    const dateCounts = {};
    problems.forEach(p => {
      const d = new Date(p.timestamp);
      d.setHours(0,0,0,0);
      const time = d.getTime();
      dateCounts[time] = (dateCounts[time] || 0) + 1;
    });

    const msInDay = 24 * 60 * 60 * 1000;
    const now = new Date();
    now.setHours(0,0,0,0);
    const startHeatmap = new Date(now.getTime() - 364 * msInDay);
    
    let heatmapHtml = '';
    for (let w = 0; w < 52; w++) {
      heatmapHtml += '<div style="display: grid; grid-template-rows: repeat(7, 1fr); gap: 2px;">';
      for (let d = 0; d < 7; d++) {
        const currentCellDate = startHeatmap.getTime() + ((w * 7) + d) * msInDay;
        const count = dateCounts[currentCellDate] || 0;
        let color = '#1F2F3D'; // Default empty
        if (count === 1) color = '#7e2d37';
        else if (count === 2) color = '#b03541';
        else if (count >= 3) color = '#FF4655';
        
        heatmapHtml += `<div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;" title="${new Date(currentCellDate).toLocaleDateString()}: ${count} solves"></div>`;
      }
      heatmapHtml += '</div>';
    }
    heatmapContainer.innerHTML = heatmapHtml;

    // Recent solves table
    const recent = problems.slice(0, 5);
    const tbody = document.querySelector('#recent-solves-table tbody');
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No solves yet.</td></tr>';
    } else {
      tbody.innerHTML = recent.map(p => `
        <tr>
          <td>${p.problemId}</td>
          <td>${p.rating || 'N/A'}</td>
          <td>${Math.round(p.solveTime / 60000)}m ${Math.round((p.solveTime % 60000) / 1000)}s</td>
          <td>${(p.spi || 0).toFixed(2)}</td>
        </tr>
      `).join('');
    }
  },
  destroy: () => {
    charts.forEach(c => c.destroy());
    charts.length = 0;
  }
};
