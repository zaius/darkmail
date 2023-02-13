(function () {
  console.log('hi there 2');

  const generateToken = (length = 16) => {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
  };
  const log = (...args) => {
    console.log('%c DARKMAIL: ', 'background: #343F53; color: #36CEFF;', ...args);
  };
  log('main.js loaded 3');

  if (import.meta.hot) {
    log('hot');
    import('/@vite/client');
  } else {
    log('not hot');
  }

  let token = generateToken();
  log('LOADING', `https://localhost:5173/ext.js?${token}`);

  const s = document.createElement('script');
  s.type = 'module';
  s.textContent = "import 'https://localhost:5173/ext.js?${token}'";
  s.onload = function () {
    console.log('Script onload fired');
  };
  s.addEventListener('error', (err, foo) => console.log('script load error', err, foo));

  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(s, firstScript);
})();
