import { resParams } from '@/types'
import { TaskProcess } from './service'

const DBTaskTest = async () => {
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
          data: { status: 0 },
          setData: {},
          useResponse: false,
          beforeResponse: {
            data: {},
            setData: {}
          }
        },
        resultData: {}
      },
      {
        type: 'updateDB',
        status: 0,
        data: {
          url: 'localhost:27017',
          DBName: 'auto_inject',
          tabName: 'vehicle_tray',
          data: {},
          setData: {
            status: 1
          },
          useResponse: true,
          beforeResponse: {
            data: {
              vehicle: {
                step: 1,
                selected: ['0->vehicle']
              },
              location: {
                step: 1,
                selected: ['0->location']
              },
              point: {
                step: 1,
                selected: ['0->point']
              }
            },
            setData: {}
          }
        },
        resultData: {}
      }
    ],
    taskStatus: 0
  }
  const task = new TaskProcess()
  await task.taskStart(example)
  console.log(example)
}

// 调试函数
const test = async () => {
  // await DBTaskTest()
  // 方式1： 使用Map映射对象 O(nm+k) wtf?
  const getBeforeValue1 = (
    beforeData: any,
    selected: Array<Array<string | number> | string> | undefined
  ) => {
    let value: any = ''
    const list = new Map()
    const keys: any[] = []
    const loop = (data: any) => {
      for (const key in data) {
        keys.push(key)
        const currentKeys = keys.join('->')
        list.set(currentKeys, data[key])
        if (data[key] instanceof Object) {
          loop(data[key])
        }
        keys.length--
      }
    }
    loop(beforeData)

    if (selected) {
      if (selected.length === 1) {
        value = list.get(selected[0])
        return value
      }
      selected.forEach((item) => {
        value += String(list.get(item))
      })
    }
    return value
  }

  // 方式2：简单遍历  O(nm)
  const getBeforeValue2 = (beforeData: any, selected: string[] | undefined) => {
    let value: any = ''
    let keys: Array<string>
    let index: any
    if (selected) {
      if (selected.length === 1) {
        if (selected[0].includes('->')) {
          keys = selected[0].split('->')
          keys.forEach((key) => {
            if (!index) {
              index = beforeData[key]
            } else {
              index = index[key]
            }
          })
          return index
        }
        return beforeData[selected[0]]
      }
      for (let i = 0; i < selected.length; i++) {
        if (selected[i].includes('->')) {
          keys = selected[i].split('->')
          index = undefined
          keys.forEach((key) => {
            if (!index) {
              index = beforeData[key]
            } else {
              index = index[key]
            }
          })
          value += String(index)
        } else {
          value += String(beforeData[selected[i]])
        }
      }
    }
    return value
  }
  const beforeData = [
    { vehicle: 1, location: 2 },
    { vehicle: 11, location: 22 }
  ]
  const selected = ['0->vehicle', '1->location']
  for (let i = 0; i < 10000; i++) {
    beforeData.push(beforeData[0])
    selected.push(selected[0])
  }
  const beforeTimer1 = new Date().getTime()
  getBeforeValue1(beforeData, selected)
  const afterTimer1 = new Date().getTime()
  console.log(String(afterTimer1 - beforeTimer1) + 'ms')
  const beforeTimer2 = new Date().getTime()
  getBeforeValue2(beforeData, selected)
  const afterTimer2 = new Date().getTime()
  console.log(String(afterTimer2 - beforeTimer2) + 'ms')
  // result: 122
  // console.log(getBeforeValue({ taskID: '001' }, ['taskID']))
  // // result: 001
  // console.log(getBeforeValue({ taskID: '001', body: { name: 'Task' } }, ['taskID', 'body->name']))
  // // result: 001Task
}

;(async () => {
  console.log('start test')
  await test()
  console.log('end')
  process.exit()
})()
