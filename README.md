# CF Grind Tracker 🎯

A Valorant-themed Chrome extension for Codeforces practice tracking.

## Features
- Real-time tracking of Codeforces submissions.
- Valorant-themed competitive ranking system (Iron to Radiant).
- Beautiful dashboard displaying stats, recent problems, and history.
- Push notifications on mobile using ntfy for updates and practice reminders.
- Background Cloudflare Worker for tracking friends' progress.

## Installation
### Chrome Extension
1. Clone repo
2. Open chrome://extensions
3. Enable Developer Mode
4. Load Unpacked → select this folder
5. Enter your CF handle in settings
6. Enter ntfy topic: `cf-grind-gzn84omyxtxx`

### Phone Notifications (Optional)
1. Install ntfy app on phone
2. Subscribe to topic: `cf-grind-gzn84omyxtxx`
3. Enable phone notifications in extension settings

### Always-On Friend Stalker (Optional)
1. `cd cloudflare-worker`
2. `npm install -g wrangler`
3. `wrangler kv:namespace create CF_GRIND_KV` → copy ID to wrangler.toml
4. `wrangler secret put FRIEND_HANDLES` → enter comma-separated CF handles
5. `wrangler deploy`

## SPI Formula
The ranking is based on SPI (Solve Performance Index).
SPI = (avgTime / solveTime) × ratingMultiplier × penaltyFactor × confidenceWeight
Rating change: K=32, ΔRating = K × (SPI - 1.0) × modeMultiplier

## Rank System
- < 1000: Iron
- 1000-1199: Bronze
- 1200-1399: Silver
- 1400-1599: Gold
- 1600-1799: Platinum
- 1800-1999: Diamond
- 2000-2199: Ascendant
- 2200-2399: Immortal
- >= 2400: Radiant

## Development
- Load extension as unpacked in Chrome
- Edit files and reload extension to test
- Note: Icon SVGs are used directly; if PNGs are needed for some browser constraints, they can be generated from the provided SVGs.

## License
MIT
