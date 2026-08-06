export function showBrowserNotification(title, body, url = null) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/assets/icons/icon128.png'),
    title: title,
    message: body
  }, (notificationId) => {
    if (url) {
      const listener = (id) => {
        if (id === notificationId) {
          chrome.tabs.create({ url });
          chrome.notifications.onClicked.removeListener(listener);
        }
      };
      chrome.notifications.onClicked.addListener(listener);
    }
  });
}
