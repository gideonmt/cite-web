const MLA = {
  formatBibliography(entry) {
    let result = '';

    // Author(s)
    if (entry.author && entry.author.length > 0) {
      const names = entry.author.map(p => Parser.parseName(p));
      
      if (names.length === 1) {
        result += names[0].last;
        if (names[0].first) result += ', ' + names[0].first;
      } else if (names.length === 2) {
        result += names[0].last;
        if (names[0].first) result += ', ' + names[0].first;
        result += ', and ';
        if (names[1].first) result += names[1].first + ' ';
        result += names[1].last;
      } else {
        result += names[0].last;
        if (names[0].first) result += ', ' + names[0].first;
        result += ', et al';
      }
    } else {
      result += 'Unknown Author';
    }

    result += '. ';

    // Title
    const title = entry.title || 'Untitled';
    const type = entry.type || '';

    if (type === 'article' || type === 'paper') {
      result += `"${title}." `;
    } else {
      result += `<i>${title}</i>. `;
    }

    // Container
    if (entry.journal && entry.journal.name) {
      result += `<i>${entry.journal.name}</i>`;
      
      if (entry.journal.volume) {
        result += ', vol. ' + entry.journal.volume;
      }
      
      if (entry.journal.number) {
        result += ', no. ' + entry.journal.number;
      }
      
      if (entry.year) {
        result += ', ' + entry.year;
      }
      
      if (entry.journal.pages) {
        result += ', pp. ' + entry.journal.pages;
      }
      
      result += '.';
    } else if (entry.publisher) {
      if (entry.publisher) result += entry.publisher + ', ';
      if (entry.year) result += entry.year + '.';
    } else if (entry.year) {
      result += entry.year + '.';
    }

    // URL or DOI
    if (entry.identifier && Array.isArray(entry.identifier)) {
      for (const id of entry.identifier) {
        if (id.type === 'doi') {
          result += ` https://doi.org/${id.id}.`;
          break;
        }
      }
    } else if (entry.url) {
      result += ' ' + entry.url + '.';
    }

    return result;
  }
};
