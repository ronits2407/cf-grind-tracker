// Notification click URL map — static, persists across service worker lifecycle
const pendingNotificationUrls = {};

// Static top-level listener (required by MV3 — dynamic listeners inside callbacks are lost on SW suspend)
chrome.notifications.onClicked.addListener((notificationId) => {
  const url = pendingNotificationUrls[notificationId];
  if (url) {
    chrome.tabs.create({ url });
    delete pendingNotificationUrls[notificationId];
  }
  chrome.notifications.clear(notificationId);
});

// Clean up when notification is closed
chrome.notifications.onClosed.addListener((notificationId) => {
  delete pendingNotificationUrls[notificationId];
});

export function showBrowserNotification(title, body, url = null) {
  const notifId = 'cfgt-' + Date.now();
  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon.png'),
    title: title,
    message: body
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Notification error:', chrome.runtime.lastError.message);
    }
  });

  if (url) {
    pendingNotificationUrls[notifId] = url;
  }
}
