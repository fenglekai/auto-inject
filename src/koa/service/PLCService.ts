import {
  ReadCoilsRequestBody,
  ReadDiscreteInputsRequestBody,
  ReadHoldingRegistersRequestBody,
  ReadInputRegistersRequestBody
} from 'jsmodbus/dist/request'
import net from 'net'
import { ModbusTCPClient, client, UserRequestResolve, ModbusTCPRequest } from 'jsmodbus'

interface ConnectParams {
  ip: string
  port: number
}

class ModbusClient {
  client: ModbusTCPClient | null
  constructor() {
    this.client = null
  }

  modbusConnect = (params: ConnectParams) =>
    new Promise<void | string>((resolve, reject) => {
      const { ip, port } = params
      const socket = new net.Socket()
      if (this.client) return resolve()
      this.client = new client.TCP(socket)
      const options = {
        host: ip,
        port
      }
      this.client.socket.setTimeout(1000 * 5, () => {
        reject(Error('连接超时'))
        if (!this.client) return
        this.client.socket.end()
        this.client = null
        socket.end()
      })

      this.client.socket.on('connect', async () => {
        resolve('连接成功')
      })
      this.client.socket.on('error', (err) => {
        reject(Error('连接错误: ' + err))
        if (!this.client) return
        this.client.socket.end()
        this.client = null
        socket.end()
      })
      this.client.socket.connect(options)
    })

  /**
   * @param readMethod readCoils/readDiscreteInputs/readHoldingRegisters/readInputRegisters
   * @param start 开始地址
   * @param count 查询长度
   */
  readRegisters = (readMethod: string, start: number, count: number) =>
    new Promise<
      UserRequestResolve<
        ModbusTCPRequest<
          | ReadHoldingRegistersRequestBody
          | ReadCoilsRequestBody
          | ReadDiscreteInputsRequestBody
          | ReadInputRegistersRequestBody
        >
      >
    >((resolve, reject) => {
      if (!this.client) return reject(Error('modbus连接失败'))
      try {
        this.client[readMethod](start, count)
          .then((res) => resolve(res))
          .catch((err) => {
            reject(err)
          })
      } catch (error) {
        reject(Error('读取错误: ' + error))
      }
    })

  /**
   * @param writeMethod writeSingleCoil/writeSingleRegister
   * @param key 写入地址
   * @param value 写入值
   */
  writeRegister = (writeMethod: string, key: number, value: number) =>
    new Promise<string>((resolve, reject) => {
      if (!this.client) return reject(Error('modbus连接失败'))
      if (
        typeof key !== 'number' ||
        typeof value !== 'number' ||
        Number.isNaN(key) ||
        Number.isNaN(value)
      )
        return reject(Error('请输入正确数值'))
      try {
        this.client[writeMethod](key, value)
        resolve('写入成功')
      } catch (error) {
        console.log(error)
        reject(Error('写入失败: ' + error))
      }
    })
}

export { ModbusClient }
