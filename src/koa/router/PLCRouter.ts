import { ModbusClient } from '../service'
import Router from '@koa/router'
const router = new Router()

router.post('/connect', async (ctx) => {
  const { ip, port } = ctx.request.body
  if (!ip || !port) {
    ctx.status = 500
    ctx.body = { message: 'ip或port为空' }
    return
  }
  try {
    const client = new ModbusClient()
    await client.modbusConnect({ ip: String(ip), port: Number(port) })
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

router.post('/read', async (ctx) => {
  const readMethods = [
    'readCoils',
    'readDiscreteInputs',
    'readHoldingRegisters',
    'readInputRegisters'
  ]
  const { ip, port, start, count, method } = ctx.request.body
  const startNum = Number(start)
  const countNum = Number(count)
  if (
    typeof startNum !== 'number' ||
    typeof countNum !== 'number' ||
    Number.isNaN(startNum) ||
    Number.isNaN(countNum) ||
    !readMethods.some((val) => val === method)
  ) {
    ctx.status = 500
    ctx.body = { message: '请输入正确的值' }
    return
  }
  try {
    const client = new ModbusClient()
    await client.modbusConnect({ ip: String(ip), port: Number(port) })
    const data = await client.readRegisters(method, startNum, countNum)
    ctx.body = { data: data.response.body.valuesAsArray }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

router.post('/write', async (ctx) => {
  const writeMethods = ['writeSingleCoil', 'writeSingleRegister']
  const { ip, port, key, value, method } = ctx.request.body
  if (key === undefined || value === undefined || !writeMethods.some((val) => val === method)) {
    ctx.status = 500
    ctx.body = { message: '请输入正确的值' }
    console.log('请输入正确的值')
    return
  }
  try {
    const client = new ModbusClient()
    await client.modbusConnect({ ip: String(ip), port: Number(port) })
    const res = await client.writeRegister(method, Number(key), Number(value))
    ctx.body = { message: res }
    console.log(res)
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
    console.error('write error: ', error)
  }
})

export default router.routes()
