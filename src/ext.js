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

const nodeText = element => {
  // Return the text of a node without the text from the children. e.g.
  //   <div>foo <div>bar</div> foo</div>
  // returns: foo foo
  if (!element) {
    return null;
  }
  if (!element.childNodes.length) {
    return null;
  }
  return window.Array.from(element.childNodes)
    .filter(el => el.nodeType === Node.TEXT_NODE)
    .map(el => el.textContent)
    .join('');
};

const background = el => {
  if (!el) {
    return null;
  }
  let bg = getComputedStyle(el).getPropertyValue('background-color');
  if (bg === 'rgba(0, 0, 0, 0)') {
    return background(el.parentNode);
  }
  return bg;
};

// https://stackoverflow.com/questions/9733288/how-to-programmatically-calculate-the-contrast-ratio-between-two-colors
const luminance = rgbTriad => {
  const a = rgbTriad.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const contrast = (rgb1, rgb2) => {
  let lum1 = luminance(rgb1);
  let lum2 = luminance(rgb2);
  let brightest = Math.max(lum1, lum2);
  let darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};
const rgbToArray = str =>
  str
    .match(/(\d+), (\d+), (\d+)/)
    .slice(1)
    .map(Number);

const fixContrast = $message => {
  log('Fixing contrast');
  if (window.__darkmail?.contrast === false) {
    log('Skipping');
    return;
  }
  $message.querySelectorAll('.ii.gt div').forEach(el => {
    const bg = rgbToArray(background(el));
    const lum = luminance(bg);
    if (lum < 0.8) {
      return;
    }
    // 222831 => 34, 40, 49
    // const newBg = bg.map(i => 255 - i).join(', ');
    const newBg = [255 - bg[0] + 34, 255 - bg[1] + 40, 255 - bg[2] + 49].join(', ');
    console.log('Luminance too high', lum, bg, newBg, el);
    el.style.setProperty('background-color', `rgb(${newBg})`, 'important');
  });

  // Ameritrade uses font tags?!
  $message.querySelectorAll('.ii.gt td, .ii.gt font').forEach(el => {
    let con = contrast(
      rgbToArray(background(el)),
      rgbToArray(getComputedStyle(el).getPropertyValue('color'))
    );
    if (con < 4) {
      console.log('Fixing contrast', con, el);
      el.style.setProperty('color', '#eeeeee', 'important');
    }
  });
};
g.observe.on('view_thread', (...args) => {
  console.log('view thread', args);
});
// view_email fires only when rendering, but not necessarily on entering every email
// relying on show_thread means sometimes we're firing on the old email since dom takes
// time to update.
g.observe.on('view_email', event => {
  console.log('view email', event);
  setTimeout(() => {
    fixContrast(event.$el[0]);
  }, 0);
});
