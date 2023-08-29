import { server as ModbusServer } from 'jsmodbus'
import net from 'net'

// 调试函数
const test = async () => {
  const netServer = new net.Server()
  // eslint-disable-next-line no-unused-vars
  const server = new ModbusServer.TCP(netServer)
  netServer.listen(8888)

  // netServer.close()
}

;(async () => {
  console.log('start test')
  await test()
  console.log('start end')
  process.exit()
})()
