import log from '../../main/utils/Log'

export * from './PLCService'
export * from './taskService'

export const logRead = () => {
  const logFile = log.transports.file.readAllLogs().filter((item) => {
    return item.path.includes(log.transports.file.fileName)
  })
  return logFile[logFile.length - 1]
}
