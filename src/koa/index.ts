import Koa from 'koa'
import router, { Middleware, createWebSocket } from './router'
import { koaBody } from 'koa-body'
import net from 'net'
import { createServer } from 'http'
import { server as ModbusServer } from 'jsmodbus'
import log, { initLog } from '../main/utils/Log'
import { store } from './model'

const app = new Koa()
const httpServer = createServer(app.callback())
app.use(Middleware)
app.use(koaBody()).use(router.routes()).use(router.allowedMethods())
createWebSocket(httpServer)

let server: any
let PORT = 3000

const initServer = async (port: number) =>
  new Promise<boolean>((resolve, _reject) => {
    const server = net.createServer().listen(port)
    server.on('listening', () => {
      server.close()
      resolve(false)
    })
    server.on('error', () => {
      resolve(true)
    })
  })

const tryUsePort = async (port: number = 3000): Promise<number> => {
  let currentPort = port
  let portStatus = true
  while (portStatus) {
    portStatus = await initServer(currentPort)
    if (portStatus) {
      currentPort++
    } else {
      return currentPort
    }
  }
  return currentPort
}

export const init = async () => {
  PORT = await tryUsePort(PORT)
  return new Promise<string>((resolve, reject) => {
    if (server) return resolve('主服务已启动')
    server = httpServer.listen(PORT, () => {
      resolve(`主服务开启成功: http://localhost:${PORT}`)
      console.log(`主服务开启成功: http://localhost:${PORT}`)
    })
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        reject(Error(`端口:${PORT}被占用,请更换占用端口`))
      }
    })
  })
}

export const close = () =>
  new Promise<string>((resolve, reject) => {
    if (!server) reject(Error('主服务关闭失败'))
    server.close((err) => {
      if (err) {
        reject(Error('主服务关闭失败'))
      }
      resolve('主服务关闭')
      server = null
      PORT = 3000
    })
  })

export const status = () =>
  new Promise<object>((resolve, _reject) => {
    if (server) {
      return resolve({ status: true, port: PORT })
    }
    return resolve({ status: false, port: null })
  })

// 调试函数
let testServer: any
export const test = async () => {
  testServer = new net.Server()
  // eslint-disable-next-line no-unused-vars
  const modbusServer = new ModbusServer.TCP(testServer)
  const CanIUsePort = await tryUsePort(8888)
  testServer.listen(CanIUsePort)
  console.log(`modbusTCP测试服务开启成功: http://localhost:${CanIUsePort}`)
}
export const closeTest = () => {
  testServer.close()
}
// 默认开启服务和PLC测试
;(async () => {
  initLog()
  await init()
  // await test()
  console.log('本地缓存文件: ' + store.path)
  console.log('日志路径: ' + log.transports.file.getFile())
})()
