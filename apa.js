const APA = {
  formatBibliography(entry) {
    let result = '';

    // Author(s)
    if (entry.author && entry.author.length > 0) {
      const names = entry.author.map(p => Parser.parseName(p));
      
      names.forEach((name, i) => {
        if (i > 0) {
          if (i === names.length - 1) {
            result += ', & ';
          } else {
            result += ', ';
          }
        }
        
        result += name.last;
        if (name.first) {
          const initials = name.first.split(' ')
            .map(n => n.charAt(0).toUpperCase() + '.')
            .join(' ');
          result += ', ' + initials;
        }
      });
    } else {
      result += 'Unknown Author';
    }

    result += '. ';

    // Year
    if (entry.year) {
      result += '(' + entry.year + '). ';
    } else {
      result += '(n.d.). ';
    }

    // Title
    const title = entry.title || 'Untitled';
    const type = entry.type || '';

    if (type === 'article' || type === 'paper') {
      result += title + '. ';
    } else {
      result += `<i>${title}</i>. `;
    }

    // Container
    if (entry.journal && entry.journal.name) {
      result += `<i>${entry.journal.name}</i>`;
      
      if (entry.journal.volume) {
        result += ', <i>' + entry.journal.volume + '</i>';
      }
      
      if (entry.journal.number) {
        result += '(' + entry.journal.number + ')';
      }
      
      if (entry.journal.pages) {
        result += ', ' + entry.journal.pages;
      }
      
      result += '.';
    } else if (entry.publisher) {
      result += entry.publisher + '.';
    }

    // DOI or URL
    if (entry.identifier && Array.isArray(entry.identifier)) {
      for (const id of entry.identifier) {
        if (id.type === 'doi') {
          result += ` https://doi.org/${id.id}`;
          break;
        }
      }
    } else if (entry.url) {
      result += ' ' + entry.url;
    }

    return result;
  }
};
