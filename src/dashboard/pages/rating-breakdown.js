const charts = [];

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
            <tbody id="rating-table-body">
              <!-- Data injected here -->
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
            <div id="improvement-container">
              <!-- Data injected here -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  charts,
  init: async () => {
    const db = window.cfgtDB;
    
    const render = async () => {
      // Clean up charts
      charts.forEach(c => c.destroy());
      charts.length = 0;

      const problems = await db.getProblems();
      const filter = document.getElementById('rating-range').value;
      
      let filtered = problems.filter(p => p.rating);
      if (filter === '800-1199') filtered = filtered.filter(p => p.rating >= 800 && p.rating < 1200);
      else if (filter === '1200-1599') filtered = filtered.filter(p => p.rating >= 1200 && p.rating < 1600);
      else if (filter === '1600+') filtered = filtered.filter(p => p.rating >= 1600);

      // Group by rating
      const byRating = {};
      filtered.forEach(p => {
        if (!byRating[p.rating]) byRating[p.rating] = [];
        byRating[p.rating].push(p);
      });

      const tbody = document.getElementById('rating-table-body');
      const imprContainer = document.getElementById('improvement-container');
      tbody.innerHTML = '';
      imprContainer.innerHTML = '';

      if (Object.keys(byRating).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No data for selected range.</td></tr>';
        imprContainer.innerHTML = '<div style="color: var(--text-secondary);">No data to show improvement trends.</div>';
      } else {
        const sortedRatings = Object.keys(byRating).map(Number).sort((a,b) => a - b);
        
        sortedRatings.forEach(r => {
          const arr = byRating[r];
          const avgTime = arr.reduce((acc, p) => acc + (p.solveTime || 0), 0) / arr.length;
          const avgSpi = arr.reduce((acc, p) => acc + (p.spi || 0), 0) / arr.length;
          let conf = 'Medium';
          if (avgSpi > 1.2) conf = 'High';
          else if (avgSpi < 0.8) conf = 'Low';

          let timeColor = '#ECE8E1';
          if (avgSpi > 1.2) timeColor = 'var(--accent-green)';
          else if (avgSpi < 0.8) timeColor = 'var(--accent)';

          // Table row
          tbody.innerHTML += `
            <tr>
              <td>${r}</td>
              <td>${arr.length}</td>
              <td><span style="color: ${timeColor}">${Math.round(avgTime / 60000)}m ${Math.round((avgTime % 60000) / 1000)}s</span></td>
              <td>${avgSpi.toFixed(2)}</td>
              <td>${conf}</td>
            </tr>
          `;

          // Improvement trend (only if >= 10 solves)
          if (arr.length >= 10) {
            // arr is sorted by timestamp desc by default usually, assuming getProblems returns newest first.
            // Let's sort to be safe: oldest to newest
            const sortedArr = [...arr].sort((a,b) => a.timestamp - b.timestamp);
            const first5 = sortedArr.slice(0, 5);
            const last5 = sortedArr.slice(-5);
            
            const first5Time = first5.reduce((acc, p) => acc + (p.solveTime || 0), 0) / 5;
            const last5Time = last5.reduce((acc, p) => acc + (p.solveTime || 0), 0) / 5;
            
            const diff = first5Time > 0 ? ((last5Time - first5Time) / first5Time) * 100 : 0;
            const diffColor = diff < 0 ? 'var(--accent-green)' : 'var(--accent)';
            const diffText = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
            
            imprContainer.innerHTML += `
              <div style="background: var(--bg-primary); padding: 16px; margin-bottom: 8px; border-left: 3px solid ${diffColor};">
                <div style="display: flex; justify-content: space-between;">
                  <span>${r} Rating</span>
                  <span style="color: ${diffColor};">${diffText} time</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">First 5: ${(first5Time/60000).toFixed(1)}m | Last 5: ${(last5Time/60000).toFixed(1)}m</div>
              </div>
            `;
          }
        });
        
        if (imprContainer.innerHTML === '') {
          imprContainer.innerHTML = '<div style="color: var(--text-secondary);">Need at least 10 solves in a rating bucket to show trends.</div>';
        }
      }

      // Tag Radar Chart
      const tags = {};
      filtered.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach(t => {
            if (!tags[t]) tags[t] = { count: 0, spiSum: 0 };
            tags[t].count++;
            tags[t].spiSum += (p.spi || 1.0);
          });
        }
      });

      // Get top 6 tags
      const topTags = Object.keys(tags)
        .map(t => ({ tag: t, avgSpi: tags[t].spiSum / tags[t].count, count: tags[t].count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 6);

      if (window.Chart && topTags.length > 0) {
        Chart.defaults.color = '#7B8794';
        Chart.defaults.borderColor = '#1F2F3D';
        Chart.defaults.font.family = 'Inter';

        const radarCtx = document.getElementById('radarChart').getContext('2d');
        const radarChart = new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: topTags.map(t => t.tag),
            datasets: [{
              label: 'Avg SPI by Tag',
              data: topTags.map(t => t.avgSpi),
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
        charts.push(radarChart);
      } else {
        document.getElementById('radarChart').parentElement.innerHTML = '<div style="color: var(--text-secondary); padding: 40px; text-align: center;">Not enough tag data</div>';
      }
    };

    document.getElementById('rating-range').addEventListener('change', render);
    await render();
  },
  destroy: () => {
    charts.forEach(c => c.destroy());
    charts.length = 0;
  }
};
