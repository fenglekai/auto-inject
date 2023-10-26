import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test'
import { TaskProcess } from '../src/koa/service/taskService'
import { resParams } from '../src/types'

let appWindow: Page
let appElectron: ElectronApplication

function waiting(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isElementVisible(selector: string, waitingMilliseconds = 100) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      expect(await appWindow.isVisible(selector), `Confirm selector '${selector}' is visible`).toBe(
        true
      )
      resolve(true)
    }, waitingMilliseconds)
  })
}

test.beforeAll(async () => {
  // Open Electron app from build directory
  appElectron = await electron.launch({ args: ['dist/main/index.js'] })
  appWindow = await appElectron.firstWindow()

  await appWindow.waitForEvent('load')
})

test('Environment check', async () => {
  const isPackaged = await appElectron.evaluate(async ({ app }) => {
    return app.isPackaged
  })

  expect(isPackaged, 'Confirm that is in development mode').toBe(false)
})

test('Document element check', async () => {
  await isElementVisible('.subheading')
})

test('DB流程测试', async () => {
  const example: resParams = {
    taskName: 'Task_5',
    taskList: [
      {
        type: 'findDB',
        status: 0,
        data: {
          url: 'localhost:27017',
          DBName: 'auto_inject',
          tabName: 'vehicle_tray',
          data: {},
          setData: {},
          useResponse: false,
          beforeResponse: {
            data: {},
            setData: {}
          }
        }
      }
    ],
    taskStatus: 0
  }
  const task = new TaskProcess()
  task.taskStart(example)
  // await appWindow.click('.v-list-item-title', { clickCount: 1, delay: 50 })

  // const counterValueElement = await appWindow.$('#counter-badge .v-badge__badge')

  // expect(
  //   await appWindow.evaluate((element) => element?.innerHTML, counterValueElement),
  //   'Confirm counter value is same'
  // ).toBe('10')
})

test.afterAll(async () => {
  await waiting(2000)
  await appElectron.close()
})
