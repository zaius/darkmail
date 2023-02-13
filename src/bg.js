/* Background page for the extension. Visit the about:debugging page and inspect to see
 * the logs */
const log = (...args) => {
  console.log('%c DARKMAIL: ', 'background: #343F53; color: #36CEFF;', ...args);
};

log('Darkmail bg.js loaded');

const generateToken = (length = 16) => {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
};

// This should work, but doesn't?? the error fires but doesn't have a reason
//   const s = document.createElement('script');
//   s.type = 'module';
//   s.src = 'https://localhost:5173/ext.js?${token}';
//   s.addEventListener('error', err => console.log('script load error', err));
//   const firstScript = document.getElementsByTagName('script')[0];
//   firstScript.parentNode.insertBefore(s, firstScript);
const install = async tab => {
  let token = generateToken();
  log('Installing on tab', tab.id);
  try {
    await browser.tabs.executeScript(tab.id, {
      // file: 'https://localhost:5173/ext.js',
      // file: '/dist/ext.js',
      // runAt: 'document_end',
      // code: `console.log('execute script run');`,
      code: `(function() {
      console.log('LOADING', 'https://localhost:5173/ext.js?${token}', window.__darkmail);

      const s = document.createElement('script');
      s.type = 'module';
      s.textContent = "import 'https://localhost:5173/ext.js?${token}'";
      s.onload = function() {console.log('Script onload fired'); }
      s.addEventListener('error', (err, foo) => console.log('script load error', err, foo));

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript) {
        firstScript.parentNode.insertBefore(s, firstScript);
      } else {
        document.head.appendChild(s);
      }
      })();
    `,
    });
  } catch (err) {
    log('Error executing script', err);
    console.error(browser.runtime.lastError);
  }
};
const remove = async tab => {
  log('Removing on tab', tab.id);
  // Why oh why do i have to wrap this in an eval?! the window.__darkmail (and all
  // window level globals) aren't accessible...
  await browser.tabs.executeScript(tab.id, {
    code: `
      (function() {
        window.eval("console.log('Disabling', window, window.__darkmail, window.FOO); window.__darkmail?.disable();");
      })()`,
  });
};

// if (import.meta.hot) {
if (true) {
  log('hot');
  // import('/@vite/client');
  browser.webNavigation.onCommitted.addListener(async ({ tabId, frameId, url }) => {
    console.log('URL', url);
    if (url === 'https://icanhazip.com/' || url.startsWith('https://mail.google.com')) {
    } else {
      return;
    }
    console.log('adding listener', frameId, url);
    const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
    install(tab);
  });
} else {
  log('not hot');
}
//});
log('Listener installed');

let enabledTabs = {};

const toggleActive = async (tabId, keep) => {
  if (!keep) {
    enabledTabs[tabId] = !enabledTabs[tabId];
  }
  const enabled = enabledTabs[tabId];
  const tab = await browser.tabs.get(tabId);
  log('onClicked', tab);
  if (enabled) {
    browser.browserAction.setBadgeText({ text: 'Y' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'green' });
    browser.browserAction.setBadgeTextColor({ color: 'white' });
    install(tab);
  } else {
    browser.browserAction.setBadgeText({ text: 'N' });
    browser.browserAction.setBadgeBackgroundColor({ color: 'red' });
    browser.browserAction.setBadgeTextColor({ color: 'white' });
    remove(tab);
  }

  log('browserAction onclick!', window);
};

browser.browserAction.onClicked.addListener(() => {
  (async () => {
    const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
    await toggleActive(tab.id);
  })();
});

browser.tabs.onActivated.addListener(activeInfo => {
  (async () => {
    await toggleActive(activeInfo.tabId, true);
  })();
});

browser.runtime.onInstalled.addListener(() => {
  log('Installing');
  browser.menus.create({
    id: 'darkmail-button',
    title: 'Enable Darkmail',
    contexts: ['selection'],
  });
  browser.menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'darkmail-button') {
      console.log('darkmail click', info.selectionText);
    }
  });
  log('Installing: DONE');
});

browser.webNavigation.onCommitted.addListener(({ tabId, frameId, url }) => {
  log('Listener called', tabId, frameId, url);
  // Filter out non main window events.
  if (frameId !== 0) {
    log('aborting frame', frameId);
    return;
  }
});
