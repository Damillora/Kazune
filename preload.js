// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer, shell } = require('electron');
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {
  window.$ = window.jQuery = require(path.join(__dirname, '/node_modules/jquery/dist/jquery.min.js'));;

  window.addEventListener('message', event => {
    const message = event.data;
    ipcRenderer.send(message.event, message.value);
  });
  window.addEventListener('open-link', event => {
    const message = event.detail;
    shell.openExternal(message);
  });
  ipcRenderer.on('data', function(event, data) {
    var event = new CustomEvent(data.event, { detail: data.value });
    window.dispatchEvent(event);
  })
})

