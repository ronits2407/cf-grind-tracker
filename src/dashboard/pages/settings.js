export default {
  html: `
    <div class="page active">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        
        <div class="cfgt-card">
          <h2 class="cfgt-card-title">PROFILE</h2>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Codeforces Username</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="ronits2407" style="flex: 1;" id="settings-handle">
              <button class="btn btn-primary">Validate</button>
            </div>
          </div>
        </div>

        <div class="cfgt-card">
          <h2 class="cfgt-card-title">NOTIFICATIONS (NTFY)</h2>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Ntfy Topic</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" value="cf-grind-gzn84omyxtxx" style="flex: 1;">
              <button class="btn btn-secondary">Test</button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" checked> Browser Notifications
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" checked> Phone Notifications (via Ntfy)
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox"> Notify on ALL verdicts (not just AC)
            </label>
          </div>
        </div>

        <div class="cfgt-card">
          <h2 class="cfgt-card-title">SPI TUNING</h2>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">K-Factor (Volatility)</label>
            <input type="range" min="16" max="64" value="32" style="width: 100%; accent-color: var(--accent);">
            <div style="text-align: right; font-size: 12px; color: var(--text-muted);">Current: 32</div>
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Penalty Multiplier</label>
            <input type="range" min="70" max="100" value="90" style="width: 100%; accent-color: var(--accent);">
            <div style="text-align: right; font-size: 12px; color: var(--text-muted);">Current: 0.9</div>
          </div>
        </div>

        <div class="cfgt-card">
          <h2 class="cfgt-card-title">DATA MANAGEMENT</h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn btn-secondary">Export JSON Backup</button>
            <button class="btn btn-secondary">Import JSON Backup</button>
            <button class="btn btn-secondary">Export PDF Report</button>
            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 8px 0;">
            <button class="btn" style="background: transparent; border: 1px solid #FF4655; color: #FF4655;">Reset All Data</button>
          </div>
          
          <div style="margin-top: 32px; text-align: center; color: var(--text-muted); font-size: 12px;">
            CF Grind Tracker v1.0.0<br>
            <a href="#" style="color: var(--text-secondary);">GitHub Repository</a>
          </div>
        </div>

      </div>
    </div>
  `,
  init: async () => {}
};
