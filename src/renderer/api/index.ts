import request from '../utils/axios'

export const PLCConnect = (params: { ip: string; port: number }) => {
  return request('/plc/connect', {
    method: 'post',
    data: params
  })
}

export const PLCWrite = (params: {
  ip: string
  port: number
  key: number
  value: number
  method: string
}) => {
  return request('/plc/write', {
    method: 'post',
    data: params
  })
}
