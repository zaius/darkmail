# Darkmail

A dark-mode extension for gmail that overrides styles of the messages to expand the dark
theme into the message content and message composition.


# Development

```sh
npm install
cd keys
npx devcert-cli generate localhost
cd ..
npx vite
```
Then visit `about:debugging` and add the extension's manifest.json from your filesystem



# Relevant links

Darken text extension: https://chrome.google.com/webstore/detail/darken-text/kmonkhbnghcmlhgbmlpagpapfomioidg

Font contrast extension: https://github.com/Fushko/font-contrast/blob/master/src/enable.js

Gmail.js - what a blessing! https://github.com/kartiktalwar/gmail.js#

A vite webext example doing similar HMR loading - https://github.com/antfu/vitesse-webext
