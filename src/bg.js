/* global browser */
/* Background page for the extension. Visit the about:debugging page and inspect to see
 * the logs */
const log = (...args) => {
  console.log('%c DARKMAIL: ', 'background: #343F53; color: #36CEFF;', ...args);
};

const URLS = [
  'https://mail.google.com/mail/u/0/*',
  'https://mail.google.com/mail/u/1/*',
  'https://icanhazip.com/*',
];

const generateToken = (length = 16) => {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
};

let enabledTabs = {};

// This should work, but doesn't?? the error fires but doesn't have a reason
//   const s = document.createElement('script');
//   s.type = 'module';
//   s.src = 'https://localhost:5173/ext.js?${token}';
//   s.addEventListener('error', err => console.log('script load error', err));
//   const firstScript = document.getElementsByTagName('script')[0];
//   firstScript.parentNode.insertBefore(s, firstScript);
const install = async tabId => {
  let token = generateToken();
  log('Installing on tab', tabId);
  try {
    await browser.tabs.executeScript(tabId, {
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
    enabledTabs[tabId] = true;
  } catch (err) {
    log('Error executing script', err);
    console.error(browser.runtime.lastError);
  }
};
const remove = async tabId => {
  log('Removing on tab', tabId);
  // Why oh why do i have to wrap this in an eval?! the window.__darkmail (and all
  // window level globals) aren't accessible...
  await browser.tabs.executeScript(tabId, {
    code: `
      (function() {
        window.eval("console.log('Disabling', window, window.__darkmail, window.FOO); window.__darkmail?.disable();");
      })()`,
  });
  enabledTabs[tabId] = false;
};

(async () => {
  log('Darkmail bg.js loaded');

  try {
    enabledTabs = (await browser.storage.local.get()).enabledTabs || {};
  } catch (err) {
    log('Error parsing existing state', await browser.storage.local.get());
  }

  // if (import.meta.hot) {
  if (true) {
    log('hot');
    // import('/@vite/client');
  } else {
    log('not hot');
  }
  //});
  log('Listener installed', enabledTabs);

  const stateColors = {
    on: {
      text: 'Y',
      backgroundColor: 'green',
      textColor: 'white',
    },
    off: {
      text: 'N',
      backgroundColor: 'red',
      textColor: 'white',
    },
  };

  const isActive = tabId => {
    return enabledTabs[tabId];
  };
  const updateBadge = async () => {
    const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
    const isEnabled = enabledTabs[tab.id];

    let colors;
    if (isEnabled) {
      colors = stateColors.on;
    } else {
      colors = stateColors.off;
    }
    browser.browserAction.setBadgeText({ text: colors.text });
    browser.browserAction.setBadgeBackgroundColor({ color: colors.backgroundColor });
    browser.browserAction.setBadgeTextColor({ color: colors.textColor });
  };

  const setActive = async (tabId, newState) => {
    log('-- SET ACTIVE', {
      tabId,
      enabledTabs,
      newState,
      oldState: enabledTabs[tabId],
    });
    // const tab = await browser.tabs.get(tabId);

    if (newState === isActive(tabId)) {
      return;
    }
    if (newState) {
      await install(tabId);
    } else {
      await remove(tabId);
    }
    await updateBadge();
    browser.storage.local.set({ enabledTabs });
  };

  browser.browserAction.onClicked.addListener(() => {
    log('-- BROWSER: ON CLICKED');
    (async () => {
      const tab = (await browser.tabs.query({ currentWindow: true, active: true }))[0];
      await setActive(tab.id, !isActive(tab.id));
    })();
  });

  browser.tabs.onActivated.addListener(({ tabId, previousTabId, windowId }) => {
    log('-- TABS: ON ACTIVATED', { tabId, previousTabId, windowId });
    updateBadge();
  });

  // check for navigation / refresh
  browser.webNavigation.onCommitted.addListener(async ({ tabId, frameId, url }) => {
    if (frameId !== 0) {
      return;
    }
    log('-- NAVIGATION: ON COMMITTED', { tabId, frameId, url });
    console.log('URL', url);
    const urlMatch = URLS.find(pattern => url.match(pattern));
    if (!urlMatch) {
      return;
    }
    if (enabledTabs[tabId]) {
      install(tabId);
    }
  });

  browser.runtime.onInstalled.addListener(() => {
    (async () => {
      log('-- RUNTIME: ON INSTALLED');
      browser.menus.create({
        id: 'darkmail-button',
        title: 'Enable Darkmail',
        contexts: ['selection'],
      });
      const tabs = await browser.tabs.query({
        url: URLS,
      });
      log('tabs are', tabs);
      tabs.forEach(tab => {
        enabledTabs[tab.id] = false;
      });

      updateBadge();

      log('Installing: DONE');
    })();
  });

  browser.menus.onClicked.addListener((info, _tab) => {
    log('-- MENUS: ON CLICKED');
    if (info.menuItemId === 'darkmail-button') {
      console.log('darkmail click', info.selectionText);
    }
  });

  log('Install complete');
  updateBadge();
})();
