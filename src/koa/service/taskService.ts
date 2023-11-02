import axios, { AxiosRequestConfig } from 'axios'
import { ModbusClient, MongoDBClient } from '.'
import { DBParams, apiParams, readParams, resParams, writeParams } from '../../types'

export class TaskProcess {
  private processTaskStatus: boolean
  private abortController: AbortController | null
  private waitNextTimer: any
  private errorStatus: boolean
  private errorStep: number
  private postStatus: boolean
  constructor() {
    this.processTaskStatus = false
    this.abortController = null
    this.errorStatus = false
    this.errorStep = 0
    this.postStatus = false
  }

  taskStart = async (mainTask: resParams, stepKey = 0) => {
    this.processTaskStatus = true
    mainTask.taskStatus = 1
    let taskKey = stepKey
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

          case 'MongoDBOperation':
            res = await this.DBOperations(mainTask, taskKey)
            break

          case 'waitApi':
            res = await this.waitApi(mainTask, taskKey)
            break

          case 'apiCallback':
            res = this.apiCallback(mainTask, taskKey)
            break

          default:
            break
        }
        mainTask.taskList[taskKey].resultData = res
      }
      this.taskWaitNext(mainTask)
    } catch (error) {
      if (String(error).includes('任务已终止')) {
        console.log(`${mainTask.taskName} 任务已终止`)
        this.resetTask(mainTask)
      } else {
        console.error(error)
        mainTask.taskStatus = 3
        this.errorStatus = true
        this.errorStep = taskKey
      }
    }
  }

  taskRetry = (mainTask: resParams) => {
    if (mainTask.taskStatus === 3) {
      mainTask.taskStatus = 1
      this.errorStatus = false
      this.taskStart(mainTask, this.errorStep)
    }
  }

  taskStop = (mainTask: resParams) => {
    this.processTaskStatus = false
    this.postStatus = false
    this.errorStatus = false
    this.abortController?.abort()
    this.resetTask(mainTask)
  }

  private resetTask = (mainTask: resParams) => {
    mainTask.taskStatus = 0
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

  /**
   * modbus读取步骤
   * @param mainTask
   * @param taskKey
   * @param isNextTicker
   * @returns
   */
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

  private getBeforeValue = (beforeData: any, selected: string[]) => {
    let value: any = ''
    let keys: Array<string>
    let index: any
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
    return value
  }

  /**
   * api请求步骤
   * @param mainTask
   * @param taskKey
   * @returns
   */
  apiRequest = async (mainTask: resParams, taskKey: number) => {
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
          if (step == null || selected.length === 0) {
            throw Error('搜索过去步骤不存在')
          }
          if (method === 'GET') {
            config.params[key] = this.getBeforeValue(mainTask.taskList[step].resultData, selected)
          } else {
            config.data[key] = this.getBeforeValue(mainTask.taskList[step].resultData, selected)
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

  /**
   * modbus写入步骤
   * @param mainTask
   * @param taskKey
   * @returns
   */
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

  /**
   * mongoDB操作步骤
   * @param mainTask
   * @param taskKey
   * @returns
   */
  DBOperations = async (mainTask: resParams, taskKey: number) => {
    const currentTask = mainTask.taskList[taskKey]
    try {
      currentTask.status = 1
      const { url, method, DBName, tabName, data, setData, useResponse, beforeResponse } =
        currentTask.data as DBParams
      const client = new MongoDBClient(url)
      await client.connect()
      const useData = { ...data }
      const useSetData = { ...setData }
      if (useResponse) {
        console.log(beforeResponse.data);
        for (const key in beforeResponse.data) {
          const { step, selected } = beforeResponse.data[key]
          if (step == null || selected.length === 0) {
            throw Error('搜索过去步骤不存在')
          }
          useData[key] = this.getBeforeValue(mainTask.taskList[step].resultData, selected)
        }
        for (const key in beforeResponse.setData) {
          const { step, selected } = beforeResponse.setData[key]
          if (step == null || selected.length === 0) {
            throw Error('搜索过去步骤不存在')
          }
          useSetData[key] = this.getBeforeValue(mainTask.taskList[step].resultData, selected)
        }
      }
      let res: any
      if (method === 'findDB') {
        res = await client.find(DBName, tabName, useData)
      }
      if (method === 'updateDB') {
        res = await client.update(DBName, tabName, useData, useSetData)
      }
      if (method === 'removeDB') {
        res = await client.remove(DBName, tabName, useData)
      }
      if (method === 'insertDB') {
        res = await client.insert(DBName, tabName, useData)
      }
      currentTask.status = 2
      await client.disconnect()
      return res
    } catch (error: any) {
      currentTask.status = 3
      return Promise.reject(Error('MongoDBOperations error: ' + error))
    }
  }

  /**
   * 等待接口调用步骤
   * @returns
   */
  private waitApi = (mainTask: resParams, taskKey: number) =>
    new Promise((resolve, reject) => {
      const currentTask = mainTask.taskList[taskKey]
      currentTask.status = 1
      const loop = () => {
        if (!this.processTaskStatus) {
          currentTask.status = 0
          return reject(Error('任务已终止'))
        }
        if (this.postStatus) {
          currentTask.status = 2
          return resolve(true)
        }
        setTimeout(() => {
          loop()
        }, 1000)
      }
      loop()
    })

  /**
   * 接口完成返回用步骤
   * @returns
   */
  private apiCallback = (mainTask: resParams, taskKey: number) => {
    const currentTask = mainTask.taskList[taskKey]
    if (!this.processTaskStatus) {
      currentTask.status = 0
      throw Error('任务已终止')
    }
    currentTask.status = 2
    this.postStatus = false
    return true
  }

  executeApi = () =>
    new Promise((resolve, reject) => {
      this.postStatus = true
      const loop = () => {
        if (!this.processTaskStatus) throw Error('任务已终止')
        if (this.errorStatus === false) {
          if (this.postStatus === false) return resolve(true)
        } else {
          return reject(Error('executeApi error: 任务报错'))
        }
        setTimeout(() => {
          loop()
        }, 1000)
      }
      loop()
    })
}
