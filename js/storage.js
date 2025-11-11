export const Storage = {
  library: {
    metadata: { collection: "my_collection", records: 0 },
    records: []
  },

  init() {
    // Try to load from localStorage if available (for user's own environment)
    try {
      const saved = localStorage.getItem('cite_library');
      if (saved) {
        this.library = JSON.parse(saved);
      }
    } catch (e) {
      // localStorage not available, use memory only
      console.log('Using memory storage');
    }
  },

  save() {
    // Try to save to localStorage if available
    try {
      localStorage.setItem('cite_library', JSON.stringify(this.library));
    } catch (e) {
      // localStorage not available, data stays in memory
    }
  },

  addEntry(entry) {
    const id = 'rec_' + (this.library.records.length + 1);
    const newEntry = {
      ...entry,
      id: id,
      collection: 'my_collection'
    };
    
    this.library.records.push(newEntry);
    this.library.metadata.records = this.library.records.length;
    this.save();
    
    return id;
  },

  getEntries() {
    return this.library.records;
  },

  clear() {
    this.library = {
      metadata: { collection: "my_collection", records: 0 },
      records: []
    };
    this.save();
  },

  exportJSON() {
    return JSON.stringify(this.library, null, 2);
  },

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate structure
      if (data.records && Array.isArray(data.records)) {
        this.library = data;
        if (!this.library.metadata) {
          this.library.metadata = { collection: "my_collection" };
        }
        this.library.metadata.records = this.library.records.length;
        this.save();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
};

// Initialize on load
Storage.init();
