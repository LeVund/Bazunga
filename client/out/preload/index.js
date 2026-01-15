"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  fetchApi: (endpoint) => electron.ipcRenderer.invoke("api:fetch", endpoint)
});
