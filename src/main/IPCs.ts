import { BrowserWindow, app, ipcMain, shell } from 'electron'
import Constants from './utils/Constants'
import { init, close, status } from '../koa'
import { useStoreGet, useStoreSet } from '../koa/model'
import log from './utils/Log'

/*
 * IPC Communications
 * */
export default class IPCs {
  static initialize(window: BrowserWindow): void {
    // Get application version
    ipcMain.on('msgRequestGetVersion', () => {
      window.webContents.send('msgReceivedVersion', Constants.APP_VERSION)
    })

    // Open url via web browser
    ipcMain.on('msgOpenExternalLink', async (event, url: string) => {
      await shell.openExternal(url)
    })

    ipcMain.handle('api:openServer', init)
    ipcMain.handle('api:closeServer', close)
    ipcMain.handle('api:serverStatus', status)
    ipcMain.handle('store:getStore', (ev, key) => useStoreGet(key))
    ipcMain.handle('store:setStore', async (ev, key, value) => await useStoreSet(key, value))
    ipcMain.handle('log:logFile', async () => {
      const logFile = log.transports.file.readAllLogs()
      return logFile[logFile.length - 1]
    })
    ipcMain.handle('log:openPath', () => {
      const logPath = app.getPath('logs')
      shell.showItemInFolder(logPath)
    })
  }
}
