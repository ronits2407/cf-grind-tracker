const DEFAULT_SETTINGS = {
  cfHandle: 'ronits2407',
  ntfyTopic: 'cf-grind-gzn84omyxtxx',
  browserNotifications: true,
  phoneNotifications: false,
  notifyAllVerdicts: false,
  enableStalker: true,
  pollIntervalMinutes: 5,
  requestDelayMs: 1000,
  friendHandles: [],
  shortcutStart: 'Ctrl+Shift+S',
  shortcutEnd: 'Ctrl+Shift+E',
  soundEffects: false,
  onboardingComplete: false
};

export class Settings {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => {
        resolve(result[key] !== undefined ? result[key] : DEFAULT_SETTINGS[key]);
      });
    });
  }

  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        const finalSettings = { ...DEFAULT_SETTINGS, ...result };
        resolve(finalSettings);
      });
    });
  }

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }

  async setAll(obj) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(obj, resolve);
    });
  }

  onChange(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        const simplifiedChanges = {};
        for (const [key, { newValue }] of Object.entries(changes)) {
          simplifiedChanges[key] = newValue;
        }
        callback(simplifiedChanges);
      }
    });
  }
}
