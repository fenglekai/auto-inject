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

// test('主流程测试', async () => {
//   const example: resParams = {
//     taskName: 'Task_1',
//     taskList: [
//       {
//         type: 'request',
//         status: 0,
//         data: {
//           method: 'POST',
//           url: 'http://localhost:3000/test',
//           data: '{ "taskID": "0001", "body": { "name": "Task" } }',
//           useResponse: false,
//           beforeResponse: {}
//         },
//         resultData: {}
//       },
//       {
//         type: 'MongoDBOperation',
//         status: 0,
//         data: {
//           url: 'localhost:27017',
//           method: 'findDB',
//           DBName: 'auto_inject',
//           tabName: 'vehicle_tray',
//           data: { status: 0 },
//           setData: {},
//           useResponse: false,
//           beforeResponse: {
//             data: {},
//             setData: {}
//           }
//         },
//         resultData: {}
//       },
//       {
//         type: 'request',
//         status: 0,
//         data: {
//           method: 'POST',
//           url: 'http://localhost:3000/test',
//           data: '{}',
//           useResponse: true,
//           beforeResponse: {
//             id: {
//               step: 0,
//               selected: ['taskID']
//             },
//             name: {
//               step: 0,
//               selected: ['body->name']
//             },
//             position: {
//               step: 1,
//               selected: ['0->vehicle', '0->location', '0->point']
//             }
//           }
//         },
//         resultData: {}
//       },
//       {
//         type: 'MongoDBOperation',
//         status: 0,
//         data: {
//           url: 'localhost:27017',
//           method: 'updateDB',
//           DBName: 'auto_inject',
//           tabName: 'vehicle_tray',
//           data: {},
//           setData: {
//             status: 1
//           },
//           useResponse: true,
//           beforeResponse: {
//             data: {
//               vehicle: {
//                 step: 1,
//                 selected: ['0->vehicle']
//               },
//               location: {
//                 step: 1,
//                 selected: ['0->location']
//               },
//               point: {
//                 step: 1,
//                 selected: ['0->point']
//               }
//             },
//             setData: {}
//           }
//         },
//         resultData: {}
//       }
//     ],
//     taskStatus: 0
//   }
//   const task = new TaskProcess()
//   await task.taskStart(example)
//   console.log(example)
//   for (let i = 0; i < example.taskList.length; i++) {
//     expect(example.taskList[i].status, '效验步骤是否成功').toBe(2)
//   }
// })

// test('DB流程测试', async () => {
//   const example: resParams = {
//     taskName: 'Task_5',
//     taskList: [
//       {
//         type: 'MongoDBOperation',
//         status: 0,
//         data: {
//           url: 'localhost:27017',
//           method: 'findDB',
//           DBName: 'auto_inject',
//           tabName: 'vehicle_tray',
//           data: { status: 0 },
//           setData: {},
//           useResponse: false,
//           beforeResponse: {
//             data: {},
//             setData: {}
//           }
//         },
//         resultData: {}
//       },
//       {
//         type: 'MongoDBOperation',
//         status: 0,
//         data: {
//           url: 'localhost:27017',
//           method: 'updateDB',
//           DBName: 'auto_inject',
//           tabName: 'vehicle_tray',
//           data: {},
//           setData: {
//             status: 1
//           },
//           useResponse: true,
//           beforeResponse: {
//             data: {
//               vehicle: {
//                 step: 0,
//                 selected: ['0->vehicle']
//               },
//               location: {
//                 step: 0,
//                 selected: ['0->location']
//               },
//               point: {
//                 step: 0,
//                 selected: ['0->point']
//               }
//             },
//             setData: {}
//           }
//         },
//         resultData: {}
//       }
//     ],
//     taskStatus: 0
//   }
//   const task = new TaskProcess()
//   await task.taskStart(example)
//   expect(example.taskList[0].status, '效验步骤是否成功').toBe(2)
//   console.log(example)
// })
test('公共接口调用流程测试', async () => {
  const example: resParams = {
    taskName: 'Task_5',
    taskList: [
      {
        type: 'waitPost',
        status: 0,
        data: {},
        resultData: {}
      },
      {
        type: 'request',
        status: 0,
        data: {
          method: 'POST',
          url: 'http://localhost:3000/test',
          data: '{ "taskID": "0001", "body": { "name": "Task" } }',
          useResponse: false,
          beforeResponse: {}
        },
        resultData: {}
      },
      {
        type: 'postCallback',
        status: 0,
        data: {},
        resultData: {}
      }
    ],
    taskStatus: 0
  }
  const task = new TaskProcess()
  setTimeout(async () => {
    const res = await task.executePost()
    console.log('post:' + res)
  }, 5000)
  await task.taskStart(example)
  for (let i = 0; i < example.taskList.length; i++) {
    expect(example.taskList[i].status, '效验步骤是否成功').toBe(2)
  }
})

test.afterAll(async () => {
  await waiting(2000)
  await appElectron.close()
})
