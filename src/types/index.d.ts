export interface readParams {
  ip: string
  port: number | string
  readAddress: number | string
  readValue: number | string // 需要监测值
  watchValue: number | null // 当前监测值
  method: 'readCoils' | 'readDiscreteInputs' | 'readHoldingRegisters' | 'readInputRegisters'
}
export interface writeParams {
  ip: string
  port: number | string
  writeAddress: number | string
  writeValue: number | string
  method: 'writeSingleCoil' | 'writeSingleRegister'
}

interface selectedResponse {
  [value: string]: {
    step: number
    selected: string
  }
}

export interface apiParams {
  method: string
  url: string
  data: any
  useResponse: boolean
  beforeResponse: selectedResponse
}

export interface taskListParams {
  type: 'readModbus' | 'request' | 'writeModbus' | 'readDB' | 'writeDB'
  data: Array<readParams> | apiParams | writeParams
  status: 0 | 1 | 2 | 3 // 0: 未执行 1: 执行中 2: 执行成功 3: 执行失败
}

export interface resParams {
  taskName: string
  taskList: Array<taskListParams>
  taskStatus: 0 | 1 | 2 | 3 // 0: 未执行 1: 执行中 2: 执行成功 3: 执行失败
}
