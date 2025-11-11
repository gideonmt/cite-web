const App = {
  currentResults: [],
  currentEntry: null,

  init() {
    this.setupTabs();
    this.setupAddTab();
    this.setupExportTab();
    this.setupViewTab();
    this.updateLibraryView();
  },

  setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        // Refresh view tab when opened
        if (tabName === 'view') {
          this.updateLibraryView();
        }
      });
    });
  },

  setupAddTab() {
    const searchBtn = document.getElementById('search-btn');
    const searchQuery = document.getElementById('search-query');

    searchQuery.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchBtn.click();
    });

    searchBtn.addEventListener('click', async () => {
      const query = searchQuery.value.trim();
      if (!query) {
        UI.showMessage('add-message', 'Please enter a search query', 'error');
        return;
      }

      UI.clearMessage('add-message');
      UI.showLoading('search-results', 'Searching...');
      document.getElementById('entry-details').innerHTML = '';

      try {
        const response = await API.searchSources(query);
        const results = API.parseResults(response, response.mode);
        
        this.currentResults = results.map(r => 
          Converter.toBibJSON(r, response.mode === 'isbn' ? 'openlibrary' : 'crossref')
        );

        if (this.currentResults.length === 0) {
          document.getElementById('search-results').innerHTML = 
            '<div class="note">No results found. Try a different query.</div>';
          return;
        }

        // Display results
        let html = '<h3>Search Results</h3>';
        this.currentResults.forEach((entry, i) => {
          html += UI.formatResultPreview(entry, i);
        });
        document.getElementById('search-results').innerHTML = html;

        // Add click handlers
        document.querySelectorAll('.result-item').forEach(item => {
          item.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            this.showEntryDetails(index);
          });
        });

      } catch (error) {
        console.error('Search error:', error);
        UI.showMessage('add-message', `Search failed: ${error.message}`, 'error');
        document.getElementById('search-results').innerHTML = '';
      }
    });
  },

  showEntryDetails(index) {
    this.currentEntry = this.currentResults[index];
    const detailsEl = document.getElementById('entry-details');
    detailsEl.innerHTML = UI.showEntryDetails(this.currentEntry);

    // Add event handlers
    document.getElementById('save-entry-btn').addEventListener('click', () => {
      this.saveEntryFromForm();
    });

    document.getElementById('cancel-entry-btn').addEventListener('click', () => {
      detailsEl.innerHTML = '';
      this.currentEntry = null;
    });

    document.getElementById('view-json-btn').addEventListener('click', () => {
      const jsonDisplay = document.getElementById('json-display');
      jsonDisplay.style.display = jsonDisplay.style.display === 'none' ? 'block' : 'none';
    });
  },

  saveEntryFromForm() {
    const form = document.getElementById('entry-form');
    
    // Build entry from form
    const entry = {
      type: document.getElementById('edit-type').value,
      title: document.getElementById('edit-title').value,
      year: document.getElementById('edit-year').value,
      author: UI.parseAuthorsFromText(document.getElementById('edit-authors').value)
    };
    
    const publisher = document.getElementById('edit-publisher').value;
    if (publisher) entry.publisher = publisher;
    
    const place = document.getElementById('edit-place').value;
    if (place) entry.place = place;
    
    const journal = document.getElementById('edit-journal').value;
    const volume = document.getElementById('edit-volume').value;
    const issue = document.getElementById('edit-issue').value;
    const pages = document.getElementById('edit-pages').value;
    
    if (journal || volume || issue || pages) {
      entry.journal = {};
      if (journal) entry.journal.name = journal;
      if (volume) entry.journal.volume = volume;
      if (issue) entry.journal.number = issue;
      if (pages) entry.journal.pages = pages;
    }
    
    const doi = document.getElementById('edit-doi').value;
    if (doi) {
      entry.identifier = [{
        type: 'doi',
        id: doi,
        url: `https://doi.org/${doi}`
      }];
    }
    
    const url = document.getElementById('edit-url').value;
    if (url) entry.url = url;
    
    // Validate
    const issues = UI.validateEntry(entry);
    if (issues.length > 0) {
      UI.showMessage('add-message', `Warning: ${issues.join(', ')}. Add anyway?`, 'error');
      if (!confirm(`This entry has issues:\n- ${issues.join('\n- ')}\n\nAdd to library anyway?`)) {
        return;
      }
    }
    
    const id = Storage.addEntry(entry);
    UI.showMessage('add-message', `✓ Entry added to library with ID: ${id}`);
    
    // Clear form
    document.getElementById('search-query').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('entry-details').innerHTML = '';
    this.currentEntry = null;
    this.currentResults = [];
  },

  setupExportTab() {
    const exportBtn = document.getElementById('export-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');

    exportBtn.addEventListener('click', () => {
      const entries = Storage.getEntries();
      
      if (entries.length === 0) {
        UI.showMessage('export-message', 'No entries in library. Add some citations first.', 'error');
        return;
      }

      UI.clearMessage('export-message');
      const format = document.getElementById('export-format').value;
      const style = document.getElementById('export-style').value;
      
      const sorted = Parser.sortEntries(entries);
      
      if (format === 'richtext') {
        // Generate rich text with hanging indent
        let richTextDiv;
        
        if (style === 'chicago') {
          const bundles = sorted.map(e => ({
            bibliography: Chicago.formatBibliography(e),
            longFootnote: Chicago.formatLongFootnote(e),
            shortFootnote: Chicago.formatShortFootnote(e)
          }));
          richTextDiv = UI.generateRichTextChicago(bundles);
        } else if (style === 'mla') {
          const formatted = sorted.map(e => MLA.formatBibliography(e));
          richTextDiv = UI.generateRichTextOutput(formatted, 'MLA');
        } else if (style === 'apa') {
          const formatted = sorted.map(e => APA.formatBibliography(e));
          richTextDiv = UI.generateRichTextOutput(formatted, 'APA');
        }
        
        // Check for validation issues
        const issues = this.checkEntriesForIssues(entries);
        let warningHtml = '';
        if (issues.length > 0) {
          warningHtml = '<div class="error"><strong>Warning:</strong> Some entries have missing fields:<ul>';
          issues.forEach(issue => {
            warningHtml += `<li>${issue}</li>`;
          });
          warningHtml += '</ul></div>';
        }
        
        document.getElementById('export-output').innerHTML = 
          warningHtml + '<div class="output-section"><h2>Rich Text Output</h2><div class="note">Click "Copy" below, then paste into your document. The hanging indent will be preserved.</div></div>';
        document.getElementById('export-output').appendChild(richTextDiv);
        
        downloadBtn.style.display = 'none';
        copyBtn.style.display = 'inline-block';
        
        copyBtn.onclick = () => {
          const range = document.createRange();
          range.selectNode(richTextDiv);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          
          try {
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            UI.showMessage('export-message', '✓ Copied to clipboard with formatting');
          } catch (err) {
            UI.showMessage('export-message', 'Copy failed. Please select and copy manually.', 'error');
          }
        };
        
      } else if (format === 'html') {
        let output = '';
        
        if (style === 'chicago') {
          const bundles = sorted.map(e => ({
            bibliography: Chicago.formatBibliography(e),
            longFootnote: Chicago.formatLongFootnote(e),
            shortFootnote: Chicago.formatShortFootnote(e)
          }));
          output = UI.generateHTMLOutput(bundles);
        } else if (style === 'mla') {
          output = this.generateSimpleHTML(sorted.map(e => MLA.formatBibliography(e)), 'MLA');
        } else if (style === 'apa') {
          output = this.generateSimpleHTML(sorted.map(e => APA.formatBibliography(e)), 'APA');
        }
        
        const blob = new Blob([output], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        document.getElementById('export-output').innerHTML = 
          `<div class="output-section"><h2>Preview</h2><iframe style="width:100%;height:600px;border:1px solid #ddd;background:white;" src="${url}"></iframe></div>`;
        
        downloadBtn.style.display = 'inline-block';
        copyBtn.style.display = 'inline-block';
        
        downloadBtn.onclick = () => this.downloadOutput(output, 'html');
        copyBtn.onclick = () => this.copyOutput(output);
        
      } else if (format === 'markdown') {
        let output = '';
        
        if (style === 'chicago') {
          const bundles = sorted.map(e => ({
            bibliography: Chicago.formatBibliography(e),
            longFootnote: Chicago.formatLongFootnote(e),
            shortFootnote: Chicago.formatShortFootnote(e)
          }));
          output = UI.generateMarkdownOutput(bundles);
        } else if (style === 'mla') {
          output = this.generateSimpleMarkdown(sorted.map(e => MLA.formatBibliography(e)), 'MLA');
        } else if (style === 'apa') {
          output = this.generateSimpleMarkdown(sorted.map(e => APA.formatBibliography(e)), 'APA');
        }
        
        document.getElementById('export-output').innerHTML = 
          `<div class="output-section"><h2>Output</h2><pre style="background:#f9f9f9;padding:15px;border:1px solid #ddd;white-space:pre-wrap;">${UI.escapeHtml(output)}</pre></div>`;
        
        downloadBtn.style.display = 'inline-block';
        copyBtn.style.display = 'inline-block';
        
        downloadBtn.onclick = () => this.downloadOutput(output, 'markdown');
        copyBtn.onclick = () => this.copyOutput(output);
      }
    });
  },

  generateSimpleHTML(entries, style) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${style} Bibliography</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 2; }
    h1 { font-size: 24px; text-align: center; margin-bottom: 30px; }
    .entry { margin-left: 0.5in; text-indent: -0.5in; margin-bottom: 0; }
    i { font-style: italic; }
  </style>
</head>
<body>
  <h1>${style} Bibliography</h1>
`;

    entries.forEach(e => {
      html += `  <p class="entry">${e}</p>\n`;
    });

    html += `</body>\n</html>`;
    return html;
  },

  generateSimpleMarkdown(entries, style) {
    let md = `# ${style} Bibliography\n\n`;
    entries.forEach((e, i) => {
      md += `${UI.htmlToMarkdown(e)}\n\n`;
    });
    return md;
  },

  downloadOutput(content, format) {
    const ext = format === 'html' ? 'html' : 'md';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bibliography.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    UI.showMessage('export-message', '✓ File downloaded');
  },

  copyOutput(content) {
    navigator.clipboard.writeText(content).then(() => {
      UI.showMessage('export-message', '✓ Copied to clipboard');
    }).catch(() => {
      UI.showMessage('export-message', 'Copy failed. Please select and copy manually.', 'error');
    });
  },

  setupViewTab() {
    const importBtn = document.getElementById('import-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const clearBtn = document.getElementById('clear-btn');
    const importFile = document.getElementById('import-file');

    importBtn.addEventListener('click', () => {
      importFile.click();
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = Storage.importJSON(ev.target.result);
        if (success) {
          UI.showMessage('view-message', '✓ Library imported successfully');
          this.updateLibraryView();
        } else {
          UI.showMessage('view-message', 'Import failed. Invalid JSON format.', 'error');
        }
        importFile.value = '';
      };
      reader.readAsText(file);
    });

    exportJsonBtn.addEventListener('click', () => {
      const json = Storage.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cite_library.json';
      a.click();
      URL.revokeObjectURL(url);
      UI.showMessage('view-message', '✓ Library exported');
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all entries? This cannot be undone.')) {
        Storage.clear();
        this.updateLibraryView();
        UI.showMessage('view-message', '✓ Library cleared');
      }
    });
  },

  updateLibraryView() {
    const viewer = document.getElementById('library-viewer');
    const entries = Storage.getEntries();
    
    if (entries.length === 0) {
      viewer.innerHTML = '<div class="note">Your library is empty. Add citations using the "Add Citation" tab.</div>';
      document.getElementById('view-message').innerHTML = '';
      return;
    }
    
    // Show entries as cards with edit buttons
    let html = '';
    const issues = this.checkEntriesForIssues(entries);
    
    if (issues.length > 0) {
      html += '<div class="error"><strong>Warning:</strong> Some entries have missing fields:<ul>';
      issues.forEach(issue => {
        html += `<li>${issue}</li>`;
      });
      html += '</ul></div>';
    }
    
    entries.forEach((entry, idx) => {
      const validation = UI.validateEntry(entry);
      const warningIcon = validation.length > 0 ? UI.showValidationWarning(validation, entry.id) : '';
      
      html += `
        <div class="entry-item">
          <div class="entry-header">
            <div class="entry-title">${UI.escapeHtml(entry.title || 'Untitled')} ${warningIcon}</div>
            <div class="entry-actions">
              <button class="btn-secondary edit-library-entry" data-index="${idx}">Edit</button>
              <button class="btn-secondary view-library-json" data-index="${idx}">JSON</button>
              <button class="btn-secondary delete-library-entry" data-index="${idx}">Delete</button>
            </div>
          </div>
          <div class="entry-details">
            ${this.formatEntryPreview(entry)}
          </div>
          <div id="json-view-${idx}" style="display:none;" class="json-viewer">${JSON.stringify(entry, null, 2)}</div>
          <div id="edit-view-${idx}" style="display:none;"></div>
        </div>
      `;
    });
    
    viewer.innerHTML = html;
    
    // Attach event handlers
    document.querySelectorAll('.edit-library-entry').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.editLibraryEntry(idx);
      });
    });
    
    document.querySelectorAll('.view-library-json').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const jsonView = document.getElementById(`json-view-${idx}`);
        jsonView.style.display = jsonView.style.display === 'none' ? 'block' : 'none';
      });
    });
    
    document.querySelectorAll('.delete-library-entry').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (confirm('Delete this entry?')) {
          Storage.library.records.splice(idx, 1);
          Storage.library.metadata.records = Storage.library.records.length;
          Storage.save();
          this.updateLibraryView();
          UI.showMessage('view-message', '✓ Entry deleted');
        }
      });
    });
    
    document.getElementById('view-message').innerHTML = '';
  },

  formatEntryPreview(entry) {
    const author = entry.author && entry.author.length > 0 ? 
      (entry.author[0].name || entry.author[0].lastname || 'Unknown') : 'Unknown';
    const year = entry.year || 'n.d.';
    const type = entry.type || 'unknown';
    return `${author} (${year}) - ${type}`;
  },

  editLibraryEntry(index) {
    const entry = Storage.getEntries()[index];
    const editView = document.getElementById(`edit-view-${index}`);
    
    if (editView.style.display === 'block') {
      editView.style.display = 'none';
      return;
    }
    
    editView.innerHTML = UI.showEntryDetails(entry);
    editView.style.display = 'block';
    
    // Attach handlers for the edit form
    editView.querySelector('#save-entry-btn').addEventListener('click', () => {
      this.saveLibraryEntryFromForm(index);
    });
    
    editView.querySelector('#cancel-entry-btn').addEventListener('click', () => {
      editView.style.display = 'none';
    });
    
    editView.querySelector('#view-json-btn').addEventListener('click', () => {
      const jsonDisplay = editView.querySelector('#json-display');
      jsonDisplay.style.display = jsonDisplay.style.display === 'none' ? 'block' : 'none';
    });
  },

  saveLibraryEntryFromForm(index) {
    const editView = document.getElementById(`edit-view-${index}`);
    
    // Build entry from form
    const entry = {
      type: editView.querySelector('#edit-type').value,
      title: editView.querySelector('#edit-title').value,
      year: editView.querySelector('#edit-year').value,
      author: UI.parseAuthorsFromText(editView.querySelector('#edit-authors').value)
    };
    
    const publisher = editView.querySelector('#edit-publisher').value;
    if (publisher) entry.publisher = publisher;
    
    const place = editView.querySelector('#edit-place').value;
    if (place) entry.place = place;
    
    const journal = editView.querySelector('#edit-journal').value;
    const volume = editView.querySelector('#edit-volume').value;
    const issue = editView.querySelector('#edit-issue').value;
    const pages = editView.querySelector('#edit-pages').value;
    
    if (journal || volume || issue || pages) {
      entry.journal = {};
      if (journal) entry.journal.name = journal;
      if (volume) entry.journal.volume = volume;
      if (issue) entry.journal.number = issue;
      if (pages) entry.journal.pages = pages;
    }
    
    const doi = editView.querySelector('#edit-doi').value;
    if (doi) {
      entry.identifier = [{
        type: 'doi',
        id: doi,
        url: `https://doi.org/${doi}`
      }];
    }
    
    const url = editView.querySelector('#edit-url').value;
    if (url) entry.url = url;
    
    // Keep the original ID and collection
    const originalEntry = Storage.getEntries()[index];
    entry.id = originalEntry.id;
    entry.collection = originalEntry.collection;
    
    // Update in storage
    Storage.library.records[index] = entry;
    Storage.save();
    
    UI.showMessage('view-message', '✓ Entry updated');
    this.updateLibraryView();
  },

  checkEntriesForIssues(entries) {
    const issues = [];
    entries.forEach(entry => {
      const validation = UI.validateEntry(entry);
      if (validation.length > 0) {
        const title = entry.title || 'Untitled';
        const id = entry.id || 'unknown';
        issues.push(`${title} (${id}): ${validation.join(', ')}`);
      }
    });
    return issues;
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
