import { DB } from '../storage/db.js';
import { Settings } from '../storage/settings.js';
import { calculateSPI, getAvgSolveTime } from '../engine/spi.js';
import { applyRatingChange } from '../engine/rating.js';
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

  try {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&count=10`);
    const data = await response.json();
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
        chrome.tabs.sendMessage(tab.id, { type: 'AUTO_COMPLETE', wrongSubmissions: wrongCount });
      }
    } else {
      const tabs = await chrome.tabs.query({ url: '*://codeforces.com/*' });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_WA', wrongSubmissions: wrongCount });
      }
    }
  } catch (error) {
    console.error('Error polling submissions:', error);
  }
}

async function checkFriendsActivity() {
  let friends = await db.getFriends();
  const myHandle = await settings.get('cfHandle');
  if (myHandle && !friends.includes(myHandle)) {
    friends.push(myHandle);
  }
  if (!friends || friends.length === 0) return;

  for (const friend of friends) {
    try {
      const response = await fetch(`https://codeforces.com/api/user.status?handle=${friend}&count=1`);
      const data = await response.json();
      if (data.status !== 'OK' || !data.result || data.result.length === 0) continue;
      
      const latestSub = data.result[0];
      const acts = await db.getFriendActivity(10);
      const alreadyProcessed = acts.find(a => a.handle === friend && a.submissionId === latestSub.id);
      
      if (!alreadyProcessed) {
        await db.addFriendActivity({
          handle: friend,
          submissionId: latestSub.id,
          verdict: latestSub.verdict,
          problemName: latestSub.problem.name
        });
        
        if (latestSub.verdict === 'OK') {
          showBrowserNotification('Friend Activity', `${friend} solved ${latestSub.problem.name}!`);
          const phoneNtfy = await settings.get('phoneNotifications');
          if (phoneNtfy) {
            const topic = await settings.get('ntfyTopic');
            await sendNtfyNotification(topic, 'Friend Solved a Problem', `${friend} AC on ${latestSub.problem.name}`);
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
  } else if (message.type === 'GET_AVG_SOLVE_TIME') {
    getAvgSolveTime(message.payload.rating, db).then(sendResponse);
    return true;
  } else if (message.type === 'CALCULATE_SPI') {
    calculateSPI(
      message.payload.rating, 
      message.payload.solveTime, 
      message.payload.wrongSubmissions, 
      message.payload.aiUsed, 
      db
    ).then(sendResponse);
    return true;
  } else if (message.type === 'COMPLETE_SOLVE') {
    (async () => {
      const { problemData, solveData } = message.payload;
      const currentRating = await settings.get('rating');
      const kFactor = await settings.get('kFactor');
      
      const spi = await calculateSPI(problemData.rating, solveData.solveTime, solveData.wrongSubmissions, solveData.aiUsed, db);
      
      const ratingUpdate = applyRatingChange(currentRating, spi, problemData.mode, kFactor);
      
      await settings.set('rating', ratingUpdate.newRating);
      
      await db.addProblem({
        ...problemData,
        ...solveData,
        spi,
        ratingDelta: ratingUpdate.delta
      });
      
      await db.addRatingHistory({
        ratingBefore: currentRating,
        ratingAfter: ratingUpdate.newRating,
        delta: ratingUpdate.delta,
        reason: `Solved ${problemData.problemId}`
      });
      
      currentSolve = null;
      
      if (ratingUpdate.rankChanged) {
        showBrowserNotification('Rank Update!', `You are now ${ratingUpdate.rankAfter.name}!`);
      }
      
      sendResponse({ status: 'ok', ratingUpdate, spi });
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
