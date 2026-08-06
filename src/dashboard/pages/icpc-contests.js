export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <h2 class="cfgt-card-title">GENERATE CONTEST</h2>
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <button class="btn btn-secondary">DIV 3</button>
          <button class="btn btn-secondary">DIV 2</button>
          <button class="btn btn-secondary">DIV 1</button>
          <button class="btn btn-primary">CUSTOM</button>
        </div>

        <div style="background: var(--bg-primary); padding: 24px; border: 1px solid var(--border-color); margin-bottom: 24px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <div>
              <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Problem Count</label>
              <input type="range" min="3" max="10" value="5" style="width: 100%; accent-color: var(--accent);">
              <div style="text-align: right; font-size: 12px; color: var(--accent);">5 Problems</div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Time Limit (Minutes)</label>
              <input type="number" value="300" style="width: 100%;">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width: 100%;">GENERATE CONTEST</button>
        </div>
      </div>

      <div class="cfgt-card">
        <h2 class="cfgt-card-title">CONTEST HISTORY</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Preset</th>
                <th>Solved/Total</th>
                <th>Penalty</th>
                <th>Time Taken</th>
                <th>Rating Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2026-07-20</td>
                <td>DIV 2</td>
                <td>3/5</td>
                <td>120</td>
                <td>2h 45m</td>
                <td style="color: var(--accent-green);">+45</td>
              </tr>
              <tr>
                <td>2026-07-15</td>
                <td>DIV 3</td>
                <td>5/5</td>
                <td>45</td>
                <td>1h 15m</td>
                <td style="color: var(--accent-green);">+12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  init: async () => {}
};
