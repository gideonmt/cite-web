export const Converter = {
  toBibJSON(source, sourceType) {
    if (sourceType === 'crossref') {
      return this.fromCrossRef(source);
    } else if (sourceType === 'openlibrary') {
      return this.fromOpenLibrary(source);
    }
    return {};
  },

  fromCrossRef(data) {
    const entry = {};

    // Type
    if (data.type) {
      const typeMap = {
        'journal-article': 'article',
        'book': 'book',
        'monograph': 'book',
        'book-chapter': 'chapter'
      };
      entry.type = typeMap[data.type] || data.type;
    }

    // Title
    if (data.title && data.title.length > 0) {
      entry.title = data.title[0];
    }

    // Authors
    if (data.author && Array.isArray(data.author)) {
      entry.author = data.author.map(a => {
        const author = {};
        if (a.given) author.firstname = a.given;
        if (a.family) author.lastname = a.family;
        
        let name = '';
        if (a.family) name = a.family;
        if (a.given) name += (name ? ', ' : '') + a.given;
        if (name) author.name = name;
        
        return author;
      });
    }

    // Year
    if (data.issued && data.issued['date-parts'] && 
        data.issued['date-parts'][0] && data.issued['date-parts'][0][0]) {
      entry.year = String(data.issued['date-parts'][0][0]);
    }

    // Journal info
    if (data['container-title'] && data['container-title'][0]) {
      entry.journal = {
        name: data['container-title'][0]
      };
      
      if (data.volume) entry.journal.volume = String(data.volume);
      if (data.issue) entry.journal.number = String(data.issue);
      if (data.page) entry.journal.pages = data.page;
      
      if (data.ISSN && data.ISSN[0]) {
        entry.journal.identifier = [{
          type: 'issn',
          id: data.ISSN[0]
        }];
      }
    }

    // Publisher
    if (data.publisher) {
      entry.publisher = data.publisher;
    }

    // DOI
    if (data.DOI) {
      entry.identifier = [{
        type: 'doi',
        id: data.DOI,
        url: `https://doi.org/${data.DOI}`
      }];
    }

    // URL
    if (data.URL) {
      entry.url = data.URL;
    }

    return entry;
  },

  fromOpenLibrary(data) {
    const entry = { type: 'book' };

    // Title
    if (data.title) {
      entry.title = data.title;
    }

    // Authors
    if (data.authors && Array.isArray(data.authors)) {
      entry.author = data.authors.map(a => {
        const author = { name: a.name };
        
        // Try to parse first/last
        const lastSpace = a.name.lastIndexOf(' ');
        if (lastSpace > 0) {
          author.firstname = a.name.substring(0, lastSpace);
          author.lastname = a.name.substring(lastSpace + 1);
        }
        
        return author;
      });
    }

    // Publisher
    if (data.publishers && data.publishers[0]) {
      entry.publisher = data.publishers[0].name;
    }

    // Year
    if (data.publish_date) {
      entry.year = data.publish_date;
    }

    // ISBN
    if (data.identifiers && data.identifiers.isbn_13 && data.identifiers.isbn_13[0]) {
      entry.identifier = [{
        type: 'isbn',
        id: data.identifiers.isbn_13[0]
      }];
    }

    // URL
    if (data.url) {
      entry.url = data.url;
    }

    return entry;
  }
};
