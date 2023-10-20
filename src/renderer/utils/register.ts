import { Socket, io } from 'socket.io-client'
import SnackBar from '@/renderer/components/snackBar'

/**
 * 单独持续读取Modbus状态
 * 监控任务状态
 * 监控日志文件
 */
export default class Register {
  socket: Socket
  constructor() {
    this.socket = io({ autoConnect: false })
  }

  init = async () => {
    const data = await window.APIServer.serverStatus()
    this.socket = io('http://127.0.0.1:' + data.port, { autoConnect: false })
  }

  watchRegisters = async (params: any, callback: (arg: any) => void, length: number = 1) => {
    try {
      const { ip, port, readAddress, method } = params
      this.socket.connect()
      this.socket.emit('modbus', { ip, port, start: readAddress, count: length, method })
      this.socket.on('modbus', (arg: any) => {
        callback(arg)
      })
      this.socket.on('connect_error', (error) => {
        Promise.reject(Error('websocket connect error ', error))
        this.socket.disconnect()
      })
    } catch (error) {
      console.error(error)
      SnackBar({
        message: '连接失败'
      })
    }
  }

  stopReading = async () => {
    this.socket.disconnect()
    this.socket.removeAllListeners()
  }

  watchTask = (callback: (list: Array<any>) => void) => {
    this.socket.connect()
    this.socket.emit('task', 'watch')
    this.socket.on('task', (list) => {
      callback(list)
    })
  }

  updateTask = () => {
    this.socket.emit('task', 'update')
  }

  executeSingleTask = (taskName: string, callback: () => void) => {
    this.socket.emit('startOnce', taskName, () => {
      callback()
    })
  }

  stopSingleTask = (taskName: string, callback: () => void) => {
    this.socket.emit('stopOnce', taskName, () => {
      callback()
    })
  }

  startAllTask = () => {
    this.socket.emit('startAll', true)
  }

  stopAllTask = () => {
    this.socket.emit('stopAll', true)
  }

  retrySingleTask = (taskName: string) => {
    this.socket.emit('retry', taskName)
  }

  watchLog = async (callback: (log: any) => void) => {
    this.socket.connect()
    this.socket.emit('logFile', true)
    this.socket.on('logFile', (log) => {
      callback(log)
    })
  }
}
