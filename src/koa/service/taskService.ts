import axios, { AxiosRequestConfig } from 'axios'
import { ModbusClient } from '.'
import { useStoreGet, useStoreSet } from '../model'
import { apiParams, readParams, resParams } from '../../types'

export class TaskProcess {
  private readTimer: Array<any>
  private taskStatus: boolean
  constructor() {
    this.readTimer = []
    this.taskStatus = false
  }

  taskStart = async (mainKey: number) => {
    this.taskStatus = true
    let mainList: Array<resParams> = await useStoreGet('task')
    const mainTask = mainList[mainKey]
    mainTask.taskStatus = 1
    await useStoreSet('task', mainList)
    try {
      for (let taskKey = 0; taskKey < mainTask.taskList.length; taskKey++) {
        mainList = await useStoreGet('task')
        const currentTask = mainList[mainKey].taskList[taskKey]
        console.log(`${mainTask.taskName} Step ${taskKey + 1} 正在执行`)
        switch (currentTask.type) {
          case 'readModbus':
            await this.modbusRead(mainKey, taskKey)
            break

          case 'request':
            await this.apiRequest(mainKey, taskKey)
            break

          case 'writeModbus':
            console.log('todo')
            break

          default:
            break
        }
      }
      this.taskWaitNext(mainKey)
    } catch (error) {
      if (String(error).includes('任务已终止')) {
        console.log(`${mainTask.taskName} 任务已终止`)
      } else {
        console.error(error)
        const mainList: Array<resParams> = await useStoreGet('task')
        mainTask.taskStatus = 3
        await useStoreSet('task', mainList)
      }
    }
  }

  taskStop = async (key: number) => {
    this.taskStatus = false
    await this.resetTask(key)
  }

  private taskWaitNext = (mainKey: number) => {
    setTimeout(async () => {
      const mainList: Array<resParams> = await useStoreGet('task')
      const mainTask = mainList[mainKey]
      console.log(`${mainTask.taskName} 任务正在等待重置`)
      try {
        for (let taskKey = 0; taskKey < mainTask.taskList.length; taskKey++) {
          let mainList: Array<resParams> = await useStoreGet('task')
          let currentTask = mainList[mainKey].taskList[taskKey]
          switch (currentTask.type) {
            case 'readModbus':
              await this.modbusRead(mainKey, taskKey, true)
              break

            default:
              break
          }
          mainList = await useStoreGet('task')
          currentTask = mainList[mainKey].taskList[taskKey]
          currentTask.status = 0
          await useStoreSet('task', mainList)
        }
        if (!this.taskStatus) throw Error('任务已终止')
        this.taskStart(mainKey)
      } catch (error) {
        if (String(error).includes('任务已终止')) {
          console.log(`${mainTask.taskName} 任务已终止`)
        } else {
          console.error(error)
          const mainList: Array<resParams> = await useStoreGet('task')
          const mainTask = mainList[mainKey]
          mainTask.taskStatus = 3
          await useStoreSet('task', mainList)
        }
      }
    }, 3 * 1000)
  }

  private resetTask = async (mainKey: number) => {
    const mainTask: Array<resParams> = await useStoreGet('task')
    const mainList = mainTask[mainKey]
    mainList.taskStatus = 0
    for (let taskKey = 0; taskKey < mainList.taskList.length; taskKey++) {
      const currentTask = mainList.taskList[taskKey]
      currentTask.status = 0
      switch (currentTask.type) {
        case 'readModbus':
          ;(currentTask.data as Array<readParams>).forEach((item) => {
            item.watchValue = null
          })
          break

        default:
          break
      }
    }
    await useStoreSet('task', mainTask)
  }

  private modbusRead = async (mainKey: number, taskKey: number, isNextTicker: boolean = false) => {
    return new Promise((resolve, reject) => {
      let mainList: Array<resParams> = useStoreGet('task')
      let currentTask = mainList[mainKey].taskList[taskKey]
      currentTask.status = 1
      useStoreSet('task', mainList)
        .then(() => {
          const passList = new Array((currentTask.data as readParams[]).length).fill(false)
          for (let i = 0; i < (currentTask.data as readParams[]).length; i++) {
            const { ip, port, readAddress, readValue, method } = (
              currentTask.data as Array<readParams>
            )[i]
            const client = new ModbusClient()
            client
              .modbusConnect({ ip: ip.replace('localhost', '127.0.0.1'), port: Number(port) })
              .then(() => {
                const loop = async () => {
                  try {
                    if (!this.taskStatus) {
                      for (let i = 0; i < this.readTimer.length; i++) {
                        clearTimeout(this.readTimer[i])
                      }
                      reject(Error('任务已终止'))
                      return
                    }
                    mainList = useStoreGet('task')
                    currentTask = mainList[mainKey].taskList[taskKey]
                    const data = await client.readRegisters(method, Number(readAddress), 1)
                    const currentValue = data.response.body.valuesAsArray[0]
                    currentTask.data[i].watchValue = currentValue
                    await useStoreSet('task', mainList)
                    this.readTimer[i] = setTimeout(() => {
                      loop()
                    }, 1000)
                    // // 判断等待重置状态
                    passList[i] = isNextTicker
                      ? Number(readValue) !== currentValue
                      : Number(readValue) === currentValue
                    const callbackPass = passList.every((value) => value)
                    if (callbackPass) {
                      if (!isNextTicker) {
                        mainList = useStoreGet('task')
                        currentTask = mainList[mainKey].taskList[taskKey]
                        currentTask.status = 2
                        await useStoreSet('task', mainList)
                      }
                      if (this.readTimer.length) {
                        for (let i = 0; i < this.readTimer.length; i++) {
                          clearTimeout(this.readTimer[i])
                        }
                      }
                      resolve(true)
                    }
                  } catch (error) {
                    mainList = useStoreGet('task')
                    currentTask = mainList[mainKey].taskList[taskKey]
                    console.error('loop error:', error)
                    currentTask.status = 3
                    clearTimeout(this.readTimer[i])
                    await useStoreSet('task', mainList)
                    reject(error)
                  }
                }
                loop()
              })
              .catch((error) => {
                mainList = useStoreGet('task')
                currentTask = mainList[mainKey].taskList[taskKey]
                console.error(error)
                currentTask.status = 3
                useStoreSet('task', mainList)
                reject(error)
              })
          }
        })
        .catch((error) => {
          mainList = useStoreGet('task')
          currentTask = mainList[mainKey].taskList[taskKey]
          console.error(error)
          currentTask.status = 3
          useStoreSet('task', mainList)
          reject(error)
        })
    })
  }

  private apiRequest = async (mainKey: number, taskKey: number) => {
    return new Promise((resolve, reject) => {
      let mainList: Array<resParams> = useStoreGet('task')
      let currentTask = mainList[mainKey].taskList[taskKey]
      currentTask.status = 1
      useStoreSet('task', mainList).then(() => {
        const { url, method, data } = currentTask.data as apiParams
        const config: AxiosRequestConfig<any> = {
          url: url.replace('localhost', '127.0.0.1'),
          method,
          timeout: 30 * 1000,
          proxy: false
        }
        // 格式化请求体
        if (method === 'GET') {
          const formatData: any = {}
          for (let j = 0; j < data.length; j++) {
            formatData[data[j].name] = data[j].value
          }
          config.params = formatData
        }
        if (method === 'POST') {
          config.data = JSON.parse(data)
        }
        axios
          .request(config)
          .then((res) => {
            console.log(res.data)
            mainList = useStoreGet('task')
            currentTask = mainList[mainKey].taskList[taskKey]
            currentTask.status = 2
            useStoreSet('task', mainList)
            resolve(true)
          })
          .catch((error) => {
            setTimeout(() => {
              mainList = useStoreGet('task')
              currentTask = mainList[mainKey].taskList[taskKey]
              currentTask.status = 3
              useStoreSet('task', mainList)
              reject(Error('apiRequest error: ' + error.message))
            }, 200)
          })
      })
    })
  }
}
