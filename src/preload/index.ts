import { contextBridge, ipcRenderer } from 'electron'
import { resParams } from '../types'

// Whitelist of valid channels used for IPC communication (Send message from Renderer to Main)
const mainAvailChannels: string[] = ['msgRequestGetVersion', 'msgOpenExternalLink', 'windowMax', 'windowMin', 'windowClose']
const rendererAvailChannels: string[] = ['msgReceivedVersion']

contextBridge.exposeInMainWorld('mainApi', {
  send: (channel: string, ...data: any[]): void => {
    if (mainAvailChannels.includes(channel)) {
      ipcRenderer.send.apply(null, [channel, ...data])
    } else {
      throw new Error(`Send failed: Unknown ipc channel name: ${channel}`)
    }
  },
  receive: (channel: string, cbFunc: Function): void => {
    if (rendererAvailChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => cbFunc(event, ...args))
    } else {
      throw new Error(`Receive failed: Unknown ipc channel name: ${channel}`)
    }
  },
  invoke: async (channel: string, ...data: any[]): Promise<any> => {
    if (mainAvailChannels.includes(channel)) {
      const result = await ipcRenderer.invoke.apply(null, [channel, ...data])
      return result
    }
    throw new Error(`Invoke failed: Unknown ipc channel name: ${channel}`)
  },
  getStore: (key: string) => ipcRenderer.invoke('store:getStore', key),
  setStore: (key: string, value: any) => ipcRenderer.invoke('store:setStore', key, value),
  logFile: () => ipcRenderer.invoke('log:logFile'),
  openPath: () => ipcRenderer.invoke('log:openPath'),
  apiRequest: (mainTask: resParams, taskKey: number) =>
    ipcRenderer.invoke('server:apiRequest', mainTask, taskKey),
  mongoDBOperation: (mainTask: resParams, taskKey: number) =>
    ipcRenderer.invoke('server:mongoDBOperation', mainTask, taskKey),
  mongoConnect: (url: string) => ipcRenderer.invoke('server:mongoConnect', url)
})

contextBridge.exposeInMainWorld('APIServer', {
  openServer: () => ipcRenderer.invoke('api:openServer'),
  closeServer: () => ipcRenderer.invoke('api:closeServer'),
  serverStatus: () => ipcRenderer.invoke('api:serverStatus')
})
