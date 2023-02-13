import style from './style.scss?inline';

import { Gmail } from 'gmail-js';
import $ from 'jquery';

const log = (...args) => {
  console.log('%c DARKMAIL: ', 'background: #343F53; color: #36CEFF;', ...args);
};

if (window.__darkmail) {
  window.__darkmail.disable();
}
window.FOO = 'bar';

const setStyle = (name, content) => {
  log('setting style for', name);
  document.querySelectorAll(`style[data-module="${name}"]`).forEach(el => el.remove());

  const el = document.createElement('style');
  el.dataset['module'] = name;
  el.dataset['ext'] = 'darkmail';
  el.innerHTML = content;
  document.head.appendChild(el);
};
setStyle('/Users/zaius/code/darkmail/src/style.scss', style);

if (import.meta.hot) {
  log('hot', import.meta.hot);

  // import('/@vite/client');
  import.meta.hot.accept(newModule => {
    if (newModule) {
      // newModule is undefined when SyntaxError happened
      console.log('updated: count is now ', newModule.count);
    }
  });
  import.meta.hot.accept('./ext.js', newFoo => {
    console.log('new ext', newFoo);
  });
  import.meta.hot.accept(newFoo => {
    console.log('new module', newFoo);
  });
  import.meta.hot.on('vite:beforeFullReload', () => {
    console.log('Full reload called');
  });
  import.meta.hot.on('special-update', event => {
    console.log('Special update called', event.file);
    if (event.file.includes('.scss')) {
      setStyle(event.file, event.content);
    }
  });
} else {
  log('not hot');
}

const g = Gmail($);

console.log('gmail', g);

log('Darkmail ext.js loaded 71');
// log('Style is:', style);

window.__darkmail = {
  disable() {
    console.trace('disabling');
    log('Disabling darkmail');
    g.observe.off();

    let els = document.querySelectorAll('style[data-ext="darkmail"]');
    log('Removing styles', els);
    els.forEach(el => el.remove());
  },
};

g.observe.on('view_thread', (...args) => {
  console.log('view thread', args);
});
// view_email fires only when rendering, but not necessarily on entering every email
// relying on show_thread means sometimes we're firing on the old email since dom takes
// time to update.
g.observe.on('view_email', event => {
  console.log('view email', event);
});
