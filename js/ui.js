export const UI = {
  showMessage(elementId, message, type = 'success') {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => { el.innerHTML = ''; }, 5000);
  },

  clearMessage(elementId) {
    document.getElementById(elementId).innerHTML = '';
  },

  showLoading(elementId, message = 'Loading...') {
    document.getElementById(elementId).innerHTML = 
      `<div class="loading">${message}</div>`;
  },

  formatResultPreview(entry, index) {
    let author = '[Unknown]';
    if (entry.author && entry.author.length > 0) {
      const a = entry.author[0];
      if (a.name) {
        author = a.name;
      } else if (a.lastname) {
        author = a.lastname;
        if (a.firstname) author += ', ' + a.firstname;
      }
    }

    const title = entry.title || '[No Title]';
    const year = entry.year || '[Year]';

    return `
      <div class="result-item" data-index="${index}">
        <span class="result-num">[${index + 1}]</span>
        ${this.escapeHtml(author)}. ${this.escapeHtml(title)}. ${this.escapeHtml(year)}.
      </div>
    `;
  },

  showEntryDetails(entry) {
    return `
      <div class="output-section">
        <h2>Review Entry</h2>
        <form id="entry-form">
          <div class="form-group">
            <label for="edit-type">Type</label>
            <select id="edit-type">
              <option value="article" ${entry.type === 'article' ? 'selected' : ''}>Article</option>
              <option value="book" ${entry.type === 'book' ? 'selected' : ''}>Book</option>
              <option value="chapter" ${entry.type === 'chapter' ? 'selected' : ''}>Book Chapter</option>
              <option value="paper" ${entry.type === 'paper' ? 'selected' : ''}>Paper</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-title">Title *</label>
            <input type="text" id="edit-title" value="${this.escapeHtml(entry.title || '')}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-authors">Authors (one per line: Last, First)</label>
            <textarea id="edit-authors" rows="3">${this.formatAuthorsForEdit(entry.author)}</textarea>
          </div>
          
          <div class="form-group">
            <label for="edit-year">Year *</label>
            <input type="text" id="edit-year" value="${entry.year || ''}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-publisher">Publisher</label>
            <input type="text" id="edit-publisher" value="${entry.publisher || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-place">Place of Publication</label>
            <input type="text" id="edit-place" value="${entry.place || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-journal">Journal Name</label>
            <input type="text" id="edit-journal" value="${entry.journal?.name || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-volume">Volume</label>
            <input type="text" id="edit-volume" value="${entry.journal?.volume || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-issue">Issue/Number</label>
            <input type="text" id="edit-issue" value="${entry.journal?.number || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-pages">Pages</label>
            <input type="text" id="edit-pages" value="${entry.journal?.pages || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-doi">DOI</label>
            <input type="text" id="edit-doi" value="${this.getDOI(entry)}">
          </div>
          
          <div class="form-group">
            <label for="edit-url">URL</label>
            <input type="text" id="edit-url" value="${entry.url || ''}">
          </div>
          
          <div class="btn-group">
            <button type="button" id="save-entry-btn">Save & Add to Library</button>
            <button type="button" id="view-json-btn" class="btn-secondary">View JSON</button>
            <button type="button" id="cancel-entry-btn" class="btn-secondary">Cancel</button>
          </div>
        </form>
        
        <div id="json-display" style="display:none;">
          <h3 style="margin-top:20px;">JSON Data</h3>
          <div class="json-viewer">${JSON.stringify(entry, null, 2)}</div>
        </div>
      </div>
    `;
  },

  formatAuthorsForEdit(authors) {
    if (!authors || !Array.isArray(authors)) return '';
    return authors.map(a => {
      if (a.name) return a.name;
      if (a.lastname && a.firstname) return `${a.lastname}, ${a.firstname}`;
      if (a.lastname) return a.lastname;
      return '';
    }).filter(Boolean).join('\n');
  },

  getDOI(entry) {
    if (!entry.identifier) return '';
    const doi = entry.identifier.find(id => id.type === 'doi');
    return doi ? doi.id : '';
  },

  parseAuthorsFromText(text) {
    if (!text.trim()) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
      const comma = line.indexOf(',');
      if (comma > 0) {
        const lastname = line.substring(0, comma).trim();
        const firstname = line.substring(comma + 1).trim();
        return {
          lastname,
          firstname,
          name: `${lastname}, ${firstname}`
        };
      }
      return { name: line.trim() };
    });
  },

  validateEntry(entry) {
    const issues = [];
    if (!entry.title || entry.title.trim() === '') {
      issues.push('Missing title');
    }
    if (!entry.year || entry.year.trim() === '') {
      issues.push('Missing year');
    }
    if (!entry.author || entry.author.length === 0) {
      issues.push('Missing author(s)');
    }
    return issues;
  },

  showValidationWarning(issues, entryId) {
    return `<span class="warning" title="${issues.join(', ')}" data-entry="${entryId}">⚠️</span>`;
  },

  htmlToMarkdown(html) {
    return html.replace(/<i>/g, '*').replace(/<\/i>/g, '*');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  generateHTMLOutput(bundles) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chicago Style Bibliography</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { font-size: 24px; font-weight: bold; margin-top: 40px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { font-size: 20px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; }
    ol { padding-left: 0; }
    li { margin-bottom: 12px; margin-left: 2em; text-indent: -2em; }
    i { font-style: italic; }
    .note { color: #666; font-size: 0.9em; margin-top: 30px; padding: 10px; background: #f5f5f5; border-left: 3px solid #ccc; }
  </style>
</head>
<body>
  <h1>Chicago Style Citations</h1>
  
  <h2>Bibliography</h2>
  <ol>
`;

    bundles.forEach(b => {
      html += `    <li>${b.bibliography}</li>\n`;
    });

    html += `  </ol>
  
  <h2>Footnotes (First Reference)</h2>
  <ol>
`;

    bundles.forEach(b => {
      html += `    <li>${b.longFootnote}</li>\n`;
    });

    html += `  </ol>
  
  <h2>Footnotes (Subsequent References)</h2>
  <ol>
`;

    bundles.forEach(b => {
      html += `    <li>${b.shortFootnote}</li>\n`;
    });

    html += `  </ol>
  
  <div class="note">
    <strong>Note:</strong> Replace <code>[pg]</code> with actual page numbers when citing.
  </div>
</body>
</html>`;

    return html;
  },

  generateMarkdownOutput(bundles) {
    let md = `# Chicago Style Citations\n\n`;
    
    md += `## Bibliography\n\n`;
    bundles.forEach((b, i) => {
      md += `${i + 1}. ${this.htmlToMarkdown(b.bibliography)}\n\n`;
    });

    md += `## Footnotes (First Reference)\n\n`;
    bundles.forEach((b, i) => {
      md += `${i + 1}. ${this.htmlToMarkdown(b.longFootnote)}\n\n`;
    });

    md += `## Footnotes (Subsequent References)\n\n`;
    bundles.forEach((b, i) => {
      md += `${i + 1}. ${this.htmlToMarkdown(b.shortFootnote)}\n\n`;
    });

    md += `---\n\n*Note: Replace \`[pg]\` with actual page numbers when citing.*\n`;

    return md;
  },

  generateRichTextOutput(entries, style) {
    const container = document.createElement('div');
    container.style.fontFamily = "'Times New Roman', Times, serif";
    container.style.fontSize = '12pt';
    container.style.lineHeight = '2';
    
    const title = document.createElement('h1');
    title.textContent = style.toUpperCase() + ' Bibliography';
    title.style.textAlign = 'center';
    title.style.fontSize = '14pt';
    title.style.marginBottom = '24pt';
    container.appendChild(title);
    
    entries.forEach((entry, i) => {
      const p = document.createElement('p');
      p.style.marginLeft = '0.5in';
      p.style.textIndent = '-0.5in';
      p.style.marginBottom = '0';
      p.innerHTML = entry;
      container.appendChild(p);
    });
    
    return container;
  }
};
