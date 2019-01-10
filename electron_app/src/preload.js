/*
Copyright 2018 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const { remote, ipcRenderer, webFrame } = require('electron');
const SpellChecker = remote.require('spellchecker');

// expose ipcRenderer to the renderer process
window.ipcRenderer = ipcRenderer;

// Allow the fetch API to load resources from this
// protocol: this is necessary to load olm.wasm.
// (Also mark it a secure although we've already
// done this in the main process).
webFrame.registerURLSchemeAsPrivileged('vector', {
    secure: true,
    supportFetchAPI: true,
});

window.setSpellCheckLang = (locale) => {
  const fmtLocale = `${locale.split('-')[0]}-${locale.split('-')[1].toUpperCase()}`;
  webFrame.setSpellCheckProvider(fmtLocale, true, {
    spellCheck(text) {
        return !(SpellChecker.isMisspelled(text));
    },
  });
};
window.addEventListener('contextmenu', (e) => {
  console.log(`global ${global.mainWindow}`);
  console.log(e.target.tagName);
  e.preventDefault();
});


(async() => {
  await waitForWebContents();
  console.log(`MAINWIN ${global.mainWindow}`);
})();

const waitForWebContents = () => {
  new Promise(resolve => {
    setTimeout(() => resolve(), 2000);
  });
};
