const Parser = {
  parseName(person) {
    const parsed = { first: '', last: '', full: '' };

    if (typeof person === 'object') {
      if (person.firstname && person.lastname) {
        parsed.first = person.firstname;
        parsed.last = person.lastname;
        parsed.full = `${person.lastname}, ${person.firstname}`;
      } else if (person.given && person.family) {
        parsed.first = person.given;
        parsed.last = person.family;
        parsed.full = `${person.family}, ${person.given}`;
      } else if (person.name) {
        parsed.full = person.name;
        const comma = person.name.indexOf(',');
        if (comma > 0) {
          parsed.last = person.name.substring(0, comma).trim();
          parsed.first = person.name.substring(comma + 1).trim();
        } else {
          const space = person.name.lastIndexOf(' ');
          if (space > 0) {
            parsed.first = person.name.substring(0, space);
            parsed.last = person.name.substring(space + 1);
          } else {
            parsed.last = person.name;
          }
        }
      }
    } else if (typeof person === 'string') {
      parsed.full = person;
      const comma = person.indexOf(',');
      if (comma > 0) {
        parsed.last = person.substring(0, comma).trim();
        parsed.first = person.substring(comma + 1).trim();
      } else {
        const space = person.lastIndexOf(' ');
        if (space > 0) {
          parsed.first = person.substring(0, space);
          parsed.last = person.substring(space + 1);
        } else {
          parsed.last = person;
        }
      }
    }

    return parsed;
  },

  getAuthorLastName(entry) {
    if (entry.author && entry.author.length > 0) {
      const name = this.parseName(entry.author[0]);
      return name.last || 'Unknown';
    }
    if (entry.editor && entry.editor.length > 0) {
      const name = this.parseName(entry.editor[0]);
      return name.last || 'Unknown';
    }
    return 'Unknown';
  },

  sortEntries(entries) {
    return [...entries].sort((a, b) => {
      const lastA = this.getAuthorLastName(a);
      const lastB = this.getAuthorLastName(b);
      return lastA.localeCompare(lastB);
    });
  }
};
