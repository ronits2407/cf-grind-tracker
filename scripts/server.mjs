import express from 'express';
import { runStalker } from './friend_stalker.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('CF Grind Tracker Friend Stalker Service is running!');
});

app.get('/stalk', async (req, res) => {
  console.log(`[HTTP Trigger] Received stalk request from cron-job.org at ${new Date().toISOString()}`);
  try {
    const result = await runStalker();
    res.json({ status: 'ok', time: new Date().toISOString(), result });
  } catch (e) {
    console.error(`[HTTP Trigger Error]`, e);
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
