import { DB } from '../storage/db.js';
import { Settings } from '../storage/settings.js';

import { showBrowserNotification } from '../notifications/browser.js';
import { sendNtfyNotification } from '../notifications/ntfy.js';

const db = new DB();
const settings = new Settings();
let currentSolve = null;

function setupAlarms() {
  chrome.alarms.get('submission-poll', (alarm) => {
    if (!alarm) chrome.alarms.create('submission-poll', { periodInMinutes: 0.5 });
  });
  chrome.alarms.get('friend-poll', (alarm) => {
    if (!alarm) chrome.alarms.create('friend-poll', { periodInMinutes: 1 });
  });
}

chrome.runtime.onInstalled.addListener(setupAlarms);
chrome.runtime.onStartup.addListener(setupAlarms);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'submission-poll' && currentSolve) {
    await checkSubmissions();
  } else if (alarm.name === 'friend-poll') {
    await checkFriendsActivity();
  }
});

async function checkSubmissions() {
  if (!currentSolve) return;
  const handle = await settings.get('cfHandle');
  if (!handle) return;

  console.log(`[CFGT] Polling submissions for active solve: ${handle} (Problem ${currentSolve.contestId}${currentSolve.problemIndex})`);

  try {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=10`);
    if (!response.ok) return;
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return; // Not JSON, probably CF returning HTML (e.g. 503)
    }
    
    if (data.status !== 'OK') return;

    let wrongCount = 0;
    let foundAC = false;

    for (const sub of data.result) {
      if (
        sub.problem.contestId == currentSolve.contestId && sub.problem.index === currentSolve.problemIndex
      ) {
        // It's for the current problem — CF API uses creationTimeSeconds (not Ms)
        if ((sub.creationTimeSeconds * 1000) >= currentSolve.startTime) {
          if (sub.verdict === 'OK') {
            foundAC = true;
          } else if (['WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR'].includes(sub.verdict)) {
            wrongCount++;
          }
        }
      }
    }

    if (foundAC) {
      const tabs = await chrome.tabs.query({ url: '*://codeforces.com/*' });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: 'AUTO_COMPLETE', wrongSubmissions: wrongCount }).catch(() => {});
      }
    } else {
      const tabs = await chrome.tabs.query({ url: '*://codeforces.com/*' });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_WA', wrongSubmissions: wrongCount }).catch(() => {});
      }
    }
  } catch (error) {
    // Silently handle polling errors
  }
}

async function checkFriendsActivity() {
  const friends = [
    'ronits2407', 'Shridhar278', '_sreedevesh', 'kaustavbhowal', 'arjund0702',
    'ByteWarden', 'iamag47', 'Dweep007', 'Prachet1718', 'PriyanshuIITGHY2006',
    'mumuksh736', 'Ansh949', 'UltimateAAJ', 'dhruv173', 'define_aditya',
    'AviatorKM', 'avani_12', 'aniketchonu', 'SaylorTwift', 'sqv1nx_',
    'northpoledagabru', 'HiyaS', 'Ayush_Kumar_Sharma', 'deepakroy13',
    'aditeyagoyal', 'htrap2018', 'alishabasohail2022', 'ianjaliprasad'
  ];

  console.log(`[CFGT] Polling activity for ${friends.length} friends...`);
  
  // We fetch up to 1000 recent activities to ensure we don't notify for old submissions
  const recentActivities = await db.getFriendActivity(1000);
  const ntfyToken = 'tk_lgbthqe3ldnhpln6blr2ho56qpc0b';
  const ntfyTopic = await settings.get('ntfyTopic');

  for (const friend of friends) {
    try {
      const response = await fetch(`https://codeforces.com/api/user.status?handle=${friend}&count=10`);
      
      // 1 request per second
      await new Promise(r => setTimeout(r, 1000));
      
      const data = await response.json();
      if (data.status !== 'OK' || !data.result || data.result.length === 0) continue;
      
      // Process from oldest to newest in the 10 fetched
      const submissions = data.result.reverse();
      
      for (const latestSub of submissions) {
        if (latestSub.verdict === 'TESTING') continue;
        
        const alreadyProcessed = recentActivities.find(a => a.handle === friend && a.submissionId === latestSub.id);
        
        if (!alreadyProcessed) {
          await db.addFriendActivity({
            handle: friend,
            submissionId: latestSub.id,
            verdict: latestSub.verdict,
            problemName: latestSub.problem.name
          });
          
          recentActivities.push({ handle: friend, submissionId: latestSub.id });
          
          const title = friend;
          const verdictStr = latestSub.verdict === 'OK' ? 'AC' : latestSub.verdict;
          const tagsStr = latestSub.problem.tags ? latestSub.problem.tags.join(', ') : 'no tags';
          const ratingStr = latestSub.problem.rating ? latestSub.problem.rating : 'Unrated';
          
          const body = `${verdictStr} on ${latestSub.problem.name}\nTags: [${tagsStr}]\nRating: ${ratingStr}`;
          
          // Browser Notification
          showBrowserNotification(title, body);
          
          // Ntfy Notification (Authenticated)
          if (ntfyTopic) {
            await sendNtfyNotification(ntfyTopic, title, body, null, ntfyToken);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching friend activity for', friend, e);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SOLVE') {
    currentSolve = { ...message.payload, wrongSubmissions: 0 };
    sendResponse({ status: 'ok' });
  } else if (message.type === 'STOP_SOLVE') {
    currentSolve = null;
    sendResponse({ status: 'ok' });
  } else if (message.type === 'GET_SOLVE_STATUS') {
    sendResponse({ currentSolve });
  } else if (message.type === 'COMPLETE_SOLVE') {
    (async () => {
      const { problemData, solveData } = message.payload;
      
      await db.addProblem({
        ...problemData,
        ...solveData
      });
      
      currentSolve = null;
      
      sendResponse({ status: 'ok' });
    })();
    return true;
  } else if (message.type === 'SEND_NTFY') {
    settings.get('ntfyTopic').then(topic => {
      sendNtfyNotification(topic, message.payload.title, message.payload.body, message.payload.url).then(sendResponse);
    });
    return true;
  } else if (message.type === 'GET_FRIENDS_ACTIVITY') {
    db.getFriendActivity().then(sendResponse);
    return true;
  }
});
