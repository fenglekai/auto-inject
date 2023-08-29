import { app, WebContents, RenderProcessGoneDetails } from 'electron'
import Constants from './utils/Constants'
import { createErrorWindow, createMainWindow } from './MainRunner'
import { macOSDisableDefaultMenuItem } from './utils/Menus'
// import cp from 'child_process'
// import path from 'path'

let mainWindow
let errorWindow

// 提示设定字符集
console.log(
  "Info: If there are garbled characters, please enter 'chcp 65001' on the command line and then run the program"
)

app.on('ready', () => {
  macOSDisableDefaultMenuItem()
  mainWindow = createMainWindow(mainWindow)
  // cp.fork(path.join(__dirname, '../koa/index.js'))
})

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow(mainWindow)
  }
})

app.on('window-all-closed', () => {
  mainWindow = null
  errorWindow = null

  if (!Constants.IS_MAC) {
    app.quit()
  }
})

app.on(
  'render-process-gone',
  (event: Event, webContents: WebContents, details: RenderProcessGoneDetails) => {
    errorWindow = createErrorWindow(errorWindow, mainWindow, details)
  }
)

process.on('uncaughtException', () => {
  errorWindow = createErrorWindow(errorWindow, mainWindow)
})
