

const charts = [];

export default {
  html: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 24px;">
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
  `,
  charts,
  init: async () => {
    const db = window.cfgtDB;
    
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
  },
  destroy: () => {
    charts.forEach(c => c.destroy());
    charts.length = 0;
  }
};
