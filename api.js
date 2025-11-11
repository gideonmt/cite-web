const API = {
  async searchSources(query) {
    let url = '';
    let mode = '';

    // Detect search type
    if (query.startsWith('10.')) {
      // DOI
      mode = 'doi';
      url = `https://api.crossref.org/works/${encodeURIComponent(query)}`;
    } else if (this.isISBN(query)) {
      // ISBN
      mode = 'isbn';
      const cleanISBN = query.replace(/-/g, '');
      url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;
    } else {
      // Title/author search
      mode = 'search';
      url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`;
    }

    console.log('Searching:', url); // Debug log

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data); // Debug log
      
      return { data, mode };
    } catch (error) {
      console.error('API error details:', error);
      
      // More helpful error message
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - make sure you are using a local server (not file://) and have internet connection');
      }
      
      throw error;
    }
  },

  isISBN(query) {
    const cleaned = query.replace(/-/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13 && 
           /^[\dX]+$/.test(cleaned);
  },

  parseResults(apiResponse, mode) {
    const { data } = apiResponse;
    const results = [];

    console.log('Parsing results for mode:', mode); // Debug log

    if (mode === 'doi') {
      if (data.message) {
        results.push(data.message);
      }
    } else if (mode === 'isbn') {
      for (const key in data) {
        results.push(data[key]);
      }
    } else if (mode === 'search') {
      if (data.message && data.message.items) {
        results.push(...data.message.items);
      }
    }

    console.log('Parsed results:', results.length, 'items'); // Debug log
    return results;
  }
};
