import { Server } from 'socket.io'
import { useStoreGet, whitelist } from '../model'
import { ModbusClient, TaskProcess } from '../service'
import { resParams } from '../../types'
import log from '../../main/utils/Log'

let io: Server

export const createWebSocket = async (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: whitelist[0]
    }
  })
  let currentTaskList: Array<resParams> = await useStoreGet('task')

  const taskProcessList: any = {}
  const initProcess = () => {
    for (let i = 0; i < currentTaskList.length; i++) {
      if (!taskProcessList[currentTaskList[i].taskName]) {
        taskProcessList[currentTaskList[i].taskName] = new TaskProcess()
      }
    }
  }
  initProcess()

  io.on('connection', async (socket) => {
    let timer: any

    socket.on('modbus', async (arg) => {
      clearTimeout(timer)
      const { ip, port, start, count, method } = arg
      if (
        !ip ||
        !method ||
        typeof port !== 'number' ||
        typeof start !== 'number' ||
        typeof count !== 'number' ||
        Number.isNaN(port) ||
        Number.isNaN(start) ||
        Number.isNaN(count)
      )
        return socket.emit('modbus', '请输入正确数值')

      const response = async () => {
        const res = await readModbus(ip, port, start, count, method)
        socket.emit('modbus', res)
        timer = setTimeout(async () => {
          await response()
        }, 1000)
      }
      await response()
    })

    /**
     * 任务流程 start
     */

    let taskTimer: any
    socket.on('task', async (tag) => {
      if (tag === 'update') {
        currentTaskList = await useStoreGet('task')
        initProcess()
      }

      if (tag === 'watch') {
        clearInterval(taskTimer)
        taskTimer = setInterval(async () => {
          socket.emit('task', currentTaskList)
        }, 200)
      }
    })

    socket.on('startOnce', (taskName, callback) => {
      for (let i = 0; i < currentTaskList.length; i++) {
        const task = currentTaskList[i]
        if (taskName === task.taskName && !task.taskStatus) {
          callback()
          const time = new Date().getTime()
          taskProcessList[taskName].taskStart(currentTaskList[i], time)
          break
        }
      }
    })
    socket.on('stopOnce', (taskName, callback) => {
      for (let i = 0; i < currentTaskList.length; i++) {
        const task = currentTaskList[i]
        if (taskName === task.taskName) {
          callback()
          taskProcessList[taskName].taskStop(currentTaskList[i])
          break
        }
      }
    })
    socket.on('startAll', () => {
      for (let i = 0; i < currentTaskList.length; i++) {
        const time = new Date().getTime()
        taskProcessList[currentTaskList[i].taskName].taskStart(currentTaskList[i], time)
      }
    })
    socket.on('stopAll', () => {
      for (let i = 0; i < currentTaskList.length; i++) {
        taskProcessList[currentTaskList[i].taskName].taskStop(currentTaskList[i])
      }
    })
    /**
     * 任务流程 end
     */

    /**
     * 日志读取 start
     */
    const logRead = async () => {
      const logFile = log.transports.file.readAllLogs()
      socket.emit('logFile', logFile[logFile.length - 1])
    }
    let logTimer: any
    socket.on('logFile', () => {
      clearInterval(logTimer)
      logTimer = setInterval(logRead, 1000)
    })

    /**
     * 日志读取 end
     */

    socket.on('disconnect', () => {
      clearInterval(timer)
      clearInterval(taskTimer)
      clearInterval(logTimer)
    })
  })
}

const client = new ModbusClient()
const readModbus = async (
  ip: string,
  port: number,
  start: number,
  count: number,
  readMethod: string
) => {
  try {
    await client.modbusConnect({ ip, port })
    const data = await client.readRegisters(readMethod, start, count)
    return data.response.body.valuesAsArray
  } catch (error) {
    return String(error)
  }
}
