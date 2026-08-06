export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">RATING BREAKDOWN</h2>
        
        <div style="margin-bottom: 24px;">
          <select id="rating-range" class="btn btn-secondary">
            <option value="all">All Ratings</option>
            <option value="800-1199">800 - 1199</option>
            <option value="1200-1599">1200 - 1599</option>
            <option value="1600+">1600+</option>
          </select>
        </div>

        <div class="table-container" style="margin-bottom: 32px;">
          <table>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Solves</th>
                <th>Avg Time</th>
                <th>Avg SPI</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span style="color: #8B9BB4">800</span></td>
                <td>42</td>
                <td><span style="color: var(--accent-green)">4m 12s</span></td>
                <td>1.5</td>
                <td>High</td>
              </tr>
              <tr>
                <td><span style="color: #9C6942">900</span></td>
                <td>30</td>
                <td><span style="color: var(--accent-green)">6m 45s</span></td>
                <td>1.3</td>
                <td>High</td>
              </tr>
              <tr>
                <td><span style="color: #B0C4DE">1000</span></td>
                <td>25</td>
                <td><span style="color: #ECE8E1">12m 30s</span></td>
                <td>1.0</td>
                <td>Medium</td>
              </tr>
              <tr>
                <td><span style="color: #B0C4DE">1100</span></td>
                <td>15</td>
                <td><span style="color: var(--accent)">25m 10s</span></td>
                <td>0.7</td>
                <td>Low</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h3 style="font-family: var(--font-val); color: var(--text-secondary); margin-bottom: 12px;">TAG RADAR</h3>
            <div class="chart-container" style="height: 300px;">
              <canvas id="radarChart"></canvas>
            </div>
          </div>
          <div>
            <h3 style="font-family: var(--font-val); color: var(--text-secondary); margin-bottom: 12px;">IMPROVEMENT TREND</h3>
            <div style="background: var(--bg-primary); padding: 16px; margin-bottom: 8px; border-left: 3px solid var(--accent-green);">
              <div style="display: flex; justify-content: space-between;">
                <span>800 Rating</span>
                <span style="color: var(--accent-green);">-40% time</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">First 5: 8m | Last 5: 4.8m</div>
            </div>
            <div style="background: var(--bg-primary); padding: 16px; margin-bottom: 8px; border-left: 3px solid var(--accent-green);">
              <div style="display: flex; justify-content: space-between;">
                <span>900 Rating</span>
                <span style="color: var(--accent-green);">-25% time</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">First 5: 10m | Last 5: 7.5m</div>
            </div>
            <div style="background: var(--bg-primary); padding: 16px; margin-bottom: 8px; border-left: 3px solid var(--accent);">
              <div style="display: flex; justify-content: space-between;">
                <span>1000 Rating</span>
                <span style="color: var(--accent);">+15% time</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">First 5: 14m | Last 5: 16.1m</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  init: async () => {
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: ['DP', 'Greedy', 'Math', 'Graphs', 'Strings', 'Data Structures'],
        datasets: [{
          label: 'Avg SPI by Tag',
          data: [0.8, 1.2, 1.4, 0.6, 1.1, 0.9],
          backgroundColor: 'rgba(255, 70, 85, 0.2)',
          borderColor: '#FF4655',
          pointBackgroundColor: '#FF4655'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid: { color: '#1F2F3D' },
            angleLines: { color: '#1F2F3D' },
            ticks: { display: false }
          }
        }
      }
    });
  }
};
