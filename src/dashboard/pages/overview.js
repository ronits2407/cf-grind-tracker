

const charts = [];

export default {
  html: `
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">WELCOME BACK</h2>
        <div style="display: flex; align-items: center; gap: 24px;">
          <div style="font-size: 64px;" id="overview-rank-icon">👋</div>
          <div>
            <h1 style="font-size: 36px; margin-bottom: 8px;" id="overview-handle">Loading...</h1>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px;">
        <div class="cfgt-card" style="margin-bottom: 0;">
          <div class="cfgt-card-title">TOTAL SOLVES</div>
          <h2 style="font-size: 32px;" id="stat-total-solves">0</h2>
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
    const cfHandle = await settings.get('cfHandle');
    
    document.getElementById('overview-handle').textContent = cfHandle || 'Guest';
    
    // Stats logic
    const problems = await db.getProblems();
    document.getElementById('stat-total-solves').textContent = problems.length;
    

    
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
        </tr>
      `).join('');
    }
  },
  destroy: () => {
    charts.forEach(c => c.destroy());
    charts.length = 0;
  }
};
