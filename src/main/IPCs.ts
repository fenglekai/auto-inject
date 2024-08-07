import { BrowserWindow, app, ipcMain, shell } from 'electron'
import Constants from './utils/Constants'
import { init, close, status } from '../koa'
import { useStoreGet, useStoreSet } from '../koa/model'
import { MongoDBClient, TaskProcess, logRead } from '../koa/service'
import { resParams } from '../types'

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

    ipcMain.on('windowMax', () => {
      if (window.isMaximized()) {
        window.restore()
      } else {
        window.maximize()
      }
    })

    ipcMain.on('windowMin', function () {
      window.minimize()
    })

    ipcMain.on('windowClose', function () {
      window.close()
    })

    ipcMain.handle('api:openServer', init)
    ipcMain.handle('api:closeServer', close)
    ipcMain.handle('api:serverStatus', status)
    ipcMain.handle('store:getStore', (ev, key) => useStoreGet(key))
    ipcMain.handle('store:setStore', async (ev, key, value) => await useStoreSet(key, value))
    ipcMain.handle('log:logFile', () => {
      return logRead()
    })
    ipcMain.handle('log:openPath', () => {
      const logPath = app.getPath('logs')
      shell.showItemInFolder(logPath)
    })
    ipcMain.handle('server:apiRequest', async (ev, mainTask: resParams, taskKey: number) => {
      const task = new TaskProcess()
      const data = await task.apiRequest(mainTask, taskKey)
      return data
    })
    ipcMain.handle('server:mongoConnect', async (ev, url: string) => {
      const mongo = new MongoDBClient(url)
      const data = await mongo.connect()
      return data
    })
    ipcMain.handle('server:mongoDBOperation', async (ev, mainTask: resParams, taskKey: number) => {
      const task = new TaskProcess()
      const data = await task.DBOperations(mainTask, taskKey)
      return data
    })
  }
}
