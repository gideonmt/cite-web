export const Chicago = {
  joinNamesBiblio(people) {
    if (!Array.isArray(people) || people.length === 0) return '';

    const names = people.map(p => Parser.parseName(p));
    let result = names[0].last;
    if (names[0].first) result += ', ' + names[0].first;

    if (names.length === 2) {
      result += ', and ' + (names[1].first ? names[1].first + ' ' : '') + names[1].last;
    } else if (names.length > 2) {
      for (let i = 1; i < names.length; i++) {
        result += ', ';
        if (i === names.length - 1) result += 'and ';
        result += (names[i].first ? names[i].first + ' ' : '') + names[i].last;
      }
    }

    return result;
  },

  joinNamesFootnote(people) {
    if (!Array.isArray(people) || people.length === 0) return '';

    const names = people.map(p => Parser.parseName(p));
    return names.map((n, i) => {
      if (i > 0) {
        if (i === names.length - 1) return 'and ' + (n.first ? n.first + ' ' : '') + n.last;
        return (n.first ? n.first + ' ' : '') + n.last;
      }
      return (n.first ? n.first + ' ' : '') + n.last;
    }).join(', ');
  },

  formatBibliography(entry) {
    let result = '';

    // Author/Editor
    if (entry.author && entry.author.length > 0) {
      result += this.joinNamesBiblio(entry.author);
    } else if (entry.editor && entry.editor.length > 0) {
      result += this.joinNamesBiblio(entry.editor);
      result += entry.editor.length > 1 ? ', eds' : ', ed';
    } else {
      result += 'Unknown Author';
    }

    result += '. ';

    // Title
    const title = entry.title || 'Untitled';
    const type = entry.type || '';

    if (type === 'article' || type === 'paper') {
      result += `"${title}."`;
    } else {
      result += `<i>${title}</i>.`;
    }

    // Container info
    if (entry.journal) {
      result += ' ';
      if (entry.journal.name) {
        result += `<i>${entry.journal.name}</i>`;
      }

      if (entry.journal.volume) {
        result += ' ' + entry.journal.volume;
        if (entry.journal.number) {
          result += ', no. ' + entry.journal.number;
        }
      }

      if (entry.year) {
        result += ' (' + entry.year + ')';
      }

      if (entry.journal.pages) {
        result += ': ' + entry.journal.pages;
      }

      result += '.';
    } else if (entry.publisher) {
      result += ' ';
      if (entry.place) result += entry.place + ': ';
      result += entry.publisher;
      if (entry.year) result += ', ' + entry.year;
      result += '.';
    } else if (entry.year) {
      result += ' ' + entry.year + '.';
    }

    // DOI or URL
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
  },

  formatLongFootnote(entry) {
    let result = '';

    // Author/Editor
    if (entry.author && entry.author.length > 0) {
      result += this.joinNamesFootnote(entry.author);
    } else if (entry.editor && entry.editor.length > 0) {
      result += this.joinNamesFootnote(entry.editor);
      result += entry.editor.length > 1 ? ', eds.' : ', ed.';
    } else {
      result += 'Unknown Author';
    }

    result += ', ';

    // Title
    const title = entry.title || 'Untitled';
    const type = entry.type || '';

    if (type === 'article' || type === 'paper') {
      result += `"${title},"`;
    } else {
      result += `<i>${title}</i>`;
    }

    // Container info
    if (entry.journal) {
      result += ' ';
      if (entry.journal.name) {
        result += `<i>${entry.journal.name}</i>`;
      }

      if (entry.journal.volume) {
        result += ' ' + entry.journal.volume;
        if (entry.journal.number) {
          result += ', no. ' + entry.journal.number;
        }
      }

      if (entry.year) {
        result += ' (' + entry.year + ')';
      }

      result += ': [pg].';
    } else if (entry.publisher) {
      result += ' (';
      if (entry.place) result += entry.place + ': ';
      result += entry.publisher;
      if (entry.year) result += ', ' + entry.year;
      result += '), [pg].';
    } else {
      if (entry.year) result += ' (' + entry.year + ')';
      result += ', [pg].';
    }

    return result;
  },

  formatShortFootnote(entry) {
    const lastName = Parser.getAuthorLastName(entry);
    let result = lastName + ', ';

    // Shortened title (first 4 words)
    const title = entry.title || 'Untitled';
    const words = title.split(/\s+/);
    let shortTitle = '';
    let count = 0;

    for (const word of words) {
      if (count === 0 && ['The', 'A', 'An'].includes(word)) continue;
      if (count >= 4) break;
      if (shortTitle) shortTitle += ' ';
      shortTitle += word;
      count++;
    }

    const type = entry.type || '';
    if (type === 'article' || type === 'paper') {
      result += `"${shortTitle},"`;
    } else {
      result += `<i>${shortTitle}</i>`;
    }

    result += ' [pg].';
    return result;
  }
};
