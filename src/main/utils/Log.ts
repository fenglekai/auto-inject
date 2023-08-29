import log from 'electron-log'

export const initLog = () => {
  log.transports.file.level = 'debug'
  log.transports.file.maxSize = 1002430
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
  let date: any = new Date()
  date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  log.transports.file.fileName = `${date}.log`
  Object.assign(console, log.functions)
}
export default log
