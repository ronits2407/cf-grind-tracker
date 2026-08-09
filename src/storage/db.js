export class DB {
  constructor() {
    this.dbName = 'CFGrindTracker';
    this.version = 1;
    this.db = null;
  }

  async openDB() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => reject(event.target.error);

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('problems')) {
          const problemsStore = db.createObjectStore('problems', { keyPath: 'id', autoIncrement: true });
          problemsStore.createIndex('problemId', 'problemId', { unique: false });
          problemsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('friends')) {
          db.createObjectStore('friends', { keyPath: 'handle' });
        }

        if (!db.objectStoreNames.contains('friendActivity')) {
          const activityStore = db.createObjectStore('friendActivity', { keyPath: 'id', autoIncrement: true });
          activityStore.createIndex('handle', 'handle', { unique: false });
          activityStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async _transaction(storeName, mode) {
    await this.openDB();
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async addProblem(record) {
    const store = await this._transaction('problems', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({ ...record, timestamp: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProblems(filters = {}) {
    const store = await this._transaction('problems', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result;
        if (filters.dateFrom) results = results.filter(p => p.timestamp >= filters.dateFrom);
        if (filters.dateTo) results = results.filter(p => p.timestamp <= filters.dateTo);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addFriend(handle) {
    const store = await this._transaction('friends', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ handle, addedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFriend(handle) {
    const store = await this._transaction('friends', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(handle);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFriends() {
    const store = await this._transaction('friends', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.map(f => f.handle));
      request.onerror = () => reject(request.error);
    });
  }

  async addFriendActivity(record) {
    const store = await this._transaction('friendActivity', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({ ...record, timestamp: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFriendActivity(limit = 50) {
    const store = await this._transaction('friendActivity', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }



  async exportAll() {
    await this.openDB();
    const stores = ['problems', 'friends', 'friendActivity'];
    const data = {};
    for (const storeName of stores) {
      const store = await this._transaction(storeName, 'readonly');
      data[storeName] = await new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      });
    }
    return JSON.stringify(data);
  }

  async importAll(dataStr) {
    const data = JSON.parse(dataStr);
    await this.openDB();
    
    // Process each store in sequence, but within each store use a single transaction
    for (const storeName of Object.keys(data)) {
      if (!this.db.objectStoreNames.contains(storeName)) continue;
      
      await new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        // Clear existing data first
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          // Add all items within the same transaction (no await = no yielding)
          for (const item of data[storeName]) {
            store.add(item);
          }
        };
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
}
