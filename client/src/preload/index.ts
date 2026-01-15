import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  fetchApi: (endpoint: string) => Promise<unknown>
}

contextBridge.exposeInMainWorld('electronAPI', {
  fetchApi: (endpoint: string) => ipcRenderer.invoke('api:fetch', endpoint)
} as ElectronAPI)
