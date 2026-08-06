export default {
  html: `
    <div class="page active">
      <div class="cfgt-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 class="cfgt-card-title" style="margin: 0;">ACHIEVEMENTS</h2>
          <select class="btn btn-secondary">
            <option>All Categories</option>
            <option>Combat</option>
            <option>Grind</option>
            <option>Speed</option>
            <option>Streak</option>
          </select>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
          
          <!-- Unlocked -->
          <div style="background: var(--bg-primary); border: 1px solid var(--accent); padding: 24px; text-align: center; position: relative;">
            <div style="font-size: 48px; margin-bottom: 16px;">🩸</div>
            <h3 style="font-family: var(--font-val); color: var(--accent); margin-bottom: 8px;">FIRST BLOOD</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">First solve ever</p>
            <div style="font-size: 10px; color: var(--text-muted);">Unlocked: 2026-01-10</div>
          </div>

          <!-- Unlocked -->
          <div style="background: var(--bg-primary); border: 1px solid var(--gold); padding: 24px; text-align: center; position: relative;">
            <div style="font-size: 48px; margin-bottom: 16px;">💯</div>
            <h3 style="font-family: var(--font-val); color: var(--gold); margin-bottom: 8px;">CENTURION</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">100 problems solved</p>
            <div style="font-size: 10px; color: var(--text-muted);">Unlocked: 2026-05-22</div>
          </div>

          <!-- In Progress -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 24px; text-align: center; position: relative;">
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5; filter: grayscale(1);">⚡</div>
            <h3 style="font-family: var(--font-val); color: var(--text-primary); margin-bottom: 8px;">SPEED DEMON</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">Sub-5min solve on 1500+</p>
            <div style="background: var(--bg-surface); height: 4px; width: 100%; border-radius: 2px;">
              <div style="background: var(--text-muted); width: 0%; height: 100%;"></div>
            </div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;">0 / 1</div>
          </div>

          <!-- Locked -->
          <div style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 24px; text-align: center; position: relative; opacity: 0.5;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 24px;">🔒</div>
            <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
            <h3 style="font-family: var(--font-val); color: var(--text-primary); margin-bottom: 8px;">FLAWLESS</h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">Solve without any WA</p>
          </div>

        </div>
      </div>
    </div>
  `,
  init: async () => {}
};
