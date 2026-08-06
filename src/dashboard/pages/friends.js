export default {
  html: `
    <div class="page active">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
        
        <div class="cfgt-card">
          <h2 class="cfgt-card-title">FRIENDS LIST</h2>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" placeholder="CF Handle" style="flex: 1;">
            <button class="btn btn-primary">+</button>
          </div>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 24px;">Import from CF</button>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: var(--bg-primary); padding: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 2px solid var(--accent);">
              <div>
                <div style="font-weight: 600; font-family: var(--font-val);">tourist</div>
                <div style="font-size: 12px; color: var(--text-secondary);">3800 • Active 2h ago</div>
              </div>
              <button style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">✖</button>
            </div>
            <div style="background: var(--bg-primary); padding: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 2px solid var(--border-color);">
              <div>
                <div style="font-weight: 600; font-family: var(--font-val);">Benq</div>
                <div style="font-size: 12px; color: var(--text-secondary);">3750 • Active 1d ago</div>
              </div>
              <button style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">✖</button>
            </div>
          </div>
        </div>

        <div class="cfgt-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 class="cfgt-card-title" style="margin: 0;">ACTIVITY FEED (LIVE)</h2>
            <div style="font-size: 12px; color: var(--accent-green);">● Connected</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <div style="background: var(--bg-primary); padding: 16px; border-left: 4px solid var(--accent-green); display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; background: var(--bg-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-val); font-weight: bold;">T</div>
              <div style="flex: 1;">
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600; color: #FF4655;">tourist</span> solved 
                  <a href="#" style="color: var(--text-primary);">E. Data Structures</a>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">2 mins ago • Rating: 3200</div>
              </div>
              <div style="background: rgba(79, 255, 190, 0.1); color: var(--accent-green); padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">Accepted</div>
            </div>

            <div style="background: var(--bg-primary); padding: 16px; border-left: 4px solid var(--accent); display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; background: var(--bg-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-val); font-weight: bold;">B</div>
              <div style="flex: 1;">
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600; color: #FF4655;">Benq</span> attempted 
                  <a href="#" style="color: var(--text-primary);">F. Math Problem</a>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">15 mins ago • Rating: 3400</div>
              </div>
              <div style="background: rgba(255, 70, 85, 0.1); color: var(--accent); padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">Wrong Answer</div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `,
  init: async () => {}
};
