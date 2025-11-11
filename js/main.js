import { Storage } from './storage.js';
import { API } from './api.js';
import { Converter } from './converter.js';
import { Parser } from './parser.js';
import { Chicago } from './formatters/chicago.js';
import { MLA } from './formatters/mla.js';
import { APA } from './formatters/apa.js';
import { UI } from './ui.js';
import { App } from './app.js';

window.Storage = Storage;
window.API = API;
window.Converter = Converter;
window.Parser = Parser;
window.Chicago = Chicago;
window.MLA = MLA;
window.APA = APA;
window.UI = UI;
window.App = App;

Storage.init();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}
