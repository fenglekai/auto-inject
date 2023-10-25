import axios, { AxiosRequestConfig } from 'axios'
import { ModbusClient, MongoDBClient } from '.'
import { DBParams, apiParams, readParams, resParams, writeParams } from '../../types'

export class TaskProcess {
  private processTaskStatus: boolean
  private abortController: AbortController | null
  private waitNextTimer: any
  private stepsResponse: Array<any>
  private errorStep: number
  constructor() {
    this.processTaskStatus = false
    this.abortController = null
    this.stepsResponse = []
    this.errorStep = 0
  }

  taskStart = async (mainTask: resParams, stepKey = 0) => {
    this.processTaskStatus = true
    mainTask.taskStatus = 1
    let taskKey = stepKey
    if (!this.stepsResponse.length) {
      this.stepsResponse = Array(mainTask.taskList.length).fill(null)
    }
    try {
      for (taskKey; taskKey < mainTask.taskList.length; taskKey++) {
        if (!this.processTaskStatus) {
          throw Error('任务已终止')
        }
        const currentTask = mainTask.taskList[taskKey]
        console.log(`${mainTask.taskName} Step ${taskKey + 1} 正在执行`)
        let res: any = false
        switch (currentTask.type) {
          case 'readModbus':
            res = await this.modbusRead(mainTask, taskKey)
            break

          case 'request':
            res = await this.apiRequest(mainTask, taskKey)
            break

          case 'writeModbus':
            res = await this.modbusWrite(mainTask, taskKey)
            break

          case 'findDB' || 'updateDB' || 'removeDB' || 'insertDB':
            res = await this.DBOperations(mainTask, taskKey)
            break

          default:
            break
        }
        this.stepsResponse[taskKey] = res
      }
      this.taskWaitNext(mainTask)
    } catch (error) {
      if (String(error).includes('任务已终止')) {
        console.log(`${mainTask.taskName} 任务已终止`)
        this.resetTask(mainTask)
      } else {
        console.error(error)
        mainTask.taskStatus = 3
        this.errorStep = taskKey
      }
    }
  }

  taskRetry = (mainTask: resParams) => {
    if (mainTask.taskStatus === 3) {
      mainTask.taskStatus = 1
      this.taskStart(mainTask, this.errorStep)
    }
  }

  taskStop = (mainTask: resParams) => {
    this.processTaskStatus = false
    this.abortController?.abort()
    this.resetTask(mainTask)
  }

  private resetTask = (mainTask: resParams) => {
    mainTask.taskStatus = 0
    this.stepsResponse.length = 0
    clearTimeout(this.waitNextTimer)
    for (let taskKey = 0; taskKey < mainTask.taskList.length; taskKey++) {
      const currentTask = mainTask.taskList[taskKey]
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
  }

  private taskWaitNext = (mainTask: resParams) => {
    console.log(`${mainTask.taskName} 任务正在等待重置`)
    this.waitNextTimer = setTimeout(async () => {
      try {
        if (!this.processTaskStatus) {
          throw Error('任务已终止')
        }
        for (let taskKey = 0; taskKey < mainTask.taskList.length; taskKey++) {
          const currentTask = mainTask.taskList[taskKey]
          switch (currentTask.type) {
            case 'readModbus':
              await this.modbusRead(mainTask, taskKey, true)
              break

            default:
              break
          }
          currentTask.status = 0
        }
        if (!this.processTaskStatus) {
          throw Error('任务已终止')
        }
        this.taskStart(mainTask)
      } catch (error) {
        if (String(error).includes('任务已终止')) {
          console.log(`${mainTask.taskName} 任务已终止`)
          this.resetTask(mainTask)
        } else {
          console.error(error)
          mainTask.taskStatus = 3
        }
      }
    }, 3 * 1000)
  }

  private modbusRead = async (
    mainTask: resParams,
    taskKey: number,
    isNextTicker: boolean = false
  ): Promise<any> => {
    const readTimer: any[] = []
    const currentTask = mainTask.taskList[taskKey]
    try {
      currentTask.status = 1
      const passList = new Array((currentTask.data as readParams[]).length).fill(false)
      const promise: Promise<any> = new Promise((resolve, reject) => {
        for (let i = 0; i < (currentTask.data as readParams[]).length; i++) {
          const { ip, port, readAddress, readValue, method } = (
            currentTask.data as Array<readParams>
          )[i]
          const client = new ModbusClient()
          client
            .modbusConnect({ ip, port: Number(port) })
            .then(() => {
              const loop = async () => {
                if (!this.processTaskStatus) {
                  for (let i = 0; i < readTimer.length; i++) {
                    clearTimeout(readTimer[i])
                  }
                  return reject(Error('任务已终止'))
                }
                try {
                  const data = await client.readRegisters(method, Number(readAddress), 1)
                  const currentValue = data.response.body.valuesAsArray[0]
                  currentTask.data[i].watchValue = currentValue
                  // 判断等待重置状态
                  passList[i] = isNextTicker
                    ? Number(readValue) !== currentValue
                    : Number(readValue) === currentValue
                  const callbackPass = passList.every((value) => value)
                  if (callbackPass) {
                    if (!isNextTicker) {
                      currentTask.status = 2
                    }
                    if (readTimer.length) {
                      for (let i = 0; i < readTimer.length; i++) {
                        clearTimeout(readTimer[i])
                      }
                    }
                    resolve(true)
                  } else {
                    readTimer[i] = setTimeout(() => {
                      loop()
                    }, 1000)
                  }
                } catch (error) {
                  currentTask.status = 3
                  reject(error)
                }
              }
              loop()
            })
            .catch((error) => {
              currentTask.status = 3
              reject(error)
            })
        }
      })
      const result = await promise
      return result
    } catch (error) {
      for (const key in readTimer) {
        clearTimeout(readTimer[key])
      }
      console.error(error)
      currentTask.status = 3
      return Promise.reject(error)
    }
  }

  private localhostReplace = (ip: string) => {
    return ip.replace('localhost', '127.0.0.1')
  }

  private apiRequest = async (mainTask: resParams, taskKey: number) => {
    const currentTask = mainTask.taskList[taskKey]
    try {
      currentTask.status = 1
      const { url, method, data, useResponse, beforeResponse } = currentTask.data as apiParams
      this.abortController = new AbortController()
      const config: AxiosRequestConfig<any> = {
        url: this.localhostReplace(url),
        method,
        timeout: 30 * 1000,
        proxy: false,
        signal: this.abortController.signal
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
      if (useResponse) {
        for (const key in beforeResponse) {
          const { step, selected } = beforeResponse[key]
          if (method === 'GET') {
            config.params[key] = this.stepsResponse[step][selected]
          } else {
            config.data[key] = this.stepsResponse[step][selected]
          }
        }
      }
      const res = await axios.request(config)
      currentTask.status = 2
      this.abortController = null
      return res.data
    } catch (error: any) {
      if (String(error).includes('canceled')) {
        this.abortController = null
        return Promise.reject(Error('任务已终止'))
      }
      currentTask.status = 3
      this.abortController = null
      return Promise.reject(Error('apiRequest error: ' + error.message))
    }
  }

  private modbusWrite = async (mainTask: resParams, taskKey: number) => {
    const currentTask = mainTask.taskList[taskKey]
    try {
      currentTask.status = 1
      const { ip, port, method, writeAddress, writeValue } = currentTask.data as writeParams
      const client = new ModbusClient()
      await client.modbusConnect({ ip, port: Number(port) })
      await client.writeRegister(method, Number(writeAddress), Number(writeValue))
      currentTask.status = 2
      return true
    } catch (error: any) {
      currentTask.status = 3
      return Promise.reject(Error('modbusWrite error: ' + error))
    }
  }

  private DBOperations = async (mainTask: resParams, taskKey: number) => {
    const currentTask = mainTask.taskList[taskKey]
    try {
      currentTask.status = 1
      const { url, DBName, tabName, data, setData, useResponse, beforeResponse } =
        currentTask.data as DBParams
      const client = new MongoDBClient(url)
      await client.connect()
      const useData = { ...data }
      const useSetData = { ...setData }
      if (useResponse) {
        for (const key in beforeResponse.data) {
          const { step, selected } = beforeResponse.data[key]
          useData[key] = this.stepsResponse[step][selected]
        }
        for (const key in beforeResponse.setData) {
          const { step, selected } = beforeResponse.setData[key]
          useSetData[key] = this.stepsResponse[step][selected]
        }
      }
      let res: any
      if (currentTask.type === 'findDB') {
        res = await client.find(DBName, tabName, useData)
      }
      if (currentTask.type === 'updateDB') {
        res = await client.update(DBName, tabName, useData, useSetData)
      }
      if (currentTask.type === 'removeDB') {
        res = await client.remove(DBName, tabName, useData)
      }
      if (currentTask.type === 'insertDB') {
        res = await client.insert(DBName, tabName, useData)
      }
      currentTask.status = 2
      await client.disconnect()
      return res
    } catch (error: any) {
      currentTask.status = 3
      return Promise.reject(Error('DBOperations error: ' + error))
    }
  }
}
