export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 class="cfgt-card-title" style="margin: 0;">PROBLEM HISTORY</h2>
          <div>
            <button class="btn btn-secondary">Export JSON</button>
            <button class="btn btn-primary">Export PDF</button>
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <input type="text" placeholder="Search problem..." style="flex: 1;" id="search-hist">
          <select class="btn btn-secondary"><option>All Modes</option><option>Practice</option></select>
          <select class="btn btn-secondary"><option>Any Rating</option><option>Easy (<1200)</option></select>
          <select class="btn btn-secondary"><option>All Verdicts</option><option>AC</option><option>WA</option></select>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Problem</th>
                <th>Rating</th>
                <th>Mode</th>
                <th>Solve Time</th>
                <th>WA</th>
                <th>AI</th>
                <th>SPI</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td><a href="#" style="color: var(--text-primary);">A. Watermelon</a></td>
                <td><span style="color: #8B9BB4; padding: 2px 6px; background: rgba(139,155,180,0.1); border-radius: 4px;">800</span></td>
                <td>Practice</td>
                <td>5m 12s</td>
                <td>0</td>
                <td>-</td>
                <td style="color: var(--accent-green)">1.2</td>
                <td>2026-08-05</td>
              </tr>
              <tr>
                <td>2</td>
                <td><a href="#" style="color: var(--text-primary);">B. Before an Exam</a></td>
                <td><span style="color: #9C6942; padding: 2px 6px; background: rgba(156,105,66,0.1); border-radius: 4px;">1200</span></td>
                <td>Learning</td>
                <td>25m 40s</td>
                <td>2</td>
                <td>🤖</td>
                <td style="color: var(--accent)">0.6</td>
                <td>2026-08-04</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 24px;">
          <button class="btn btn-secondary">&lt;</button>
          <button class="btn btn-primary">1</button>
          <button class="btn btn-secondary">2</button>
          <button class="btn btn-secondary">3</button>
          <button class="btn btn-secondary">&gt;</button>
        </div>
      </div>
    </div>
  `,
  init: async () => {}
};
