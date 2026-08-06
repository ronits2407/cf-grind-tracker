export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <div style="display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
          <h2 class="cfgt-card-title" style="margin: 0; color: var(--accent); cursor: pointer;">RECOMMENDED</h2>
          <h2 class="cfgt-card-title" style="margin: 0; cursor: pointer;">LADDERS</h2>
          <h2 class="cfgt-card-title" style="margin: 0; cursor: pointer;">QUEUE</h2>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <select class="btn btn-secondary"><option>Rating: 1200-1400</option></select>
          <select class="btn btn-secondary"><option>Tags: Weakest</option></select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin-bottom: 8px;"><a href="#" style="color: var(--text-primary); text-decoration: none;">A. Mocha and Math</a></h3>
              <div style="display: flex; gap: 8px; font-size: 12px;">
                <span style="color: #9C6942; background: rgba(156,105,66,0.1); padding: 2px 6px; border-radius: 4px;">900</span>
                <span style="color: var(--text-secondary); background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">bitmasks</span>
                <span style="color: var(--text-secondary); background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">math</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Est. 12m</div>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">+ QUEUE</button>
            </div>
          </div>

          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin-bottom: 8px;"><a href="#" style="color: var(--text-primary); text-decoration: none;">C. Number of Pairs</a></h3>
              <div style="display: flex; gap: 8px; font-size: 12px;">
                <span style="color: #B0C4DE; background: rgba(176,196,222,0.1); padding: 2px 6px; border-radius: 4px;">1300</span>
                <span style="color: var(--text-secondary); background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">binary search</span>
                <span style="color: var(--text-secondary); background: var(--bg-surface); padding: 2px 6px; border-radius: 4px;">two pointers</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="color: var(--text-secondary); font-size: 12px; margin-bottom: 8px;">Est. 25m</div>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;">+ QUEUE</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  init: async () => {}
};
