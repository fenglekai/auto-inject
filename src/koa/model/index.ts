import Store from 'electron-store'

export const whitelist = ['http://localhost:5173']

const schema: any = {
  taskID: {
    default: 0
  },
  task: {
    default: []
  }
}
export const store = new Store({ schema })

const useStoreGet = (key: string): any => {
  return store.get(key)
}
const useStoreSet = (key: string, value: any) => {
  return new Promise<void>((resolve, reject) => {
    try {
      store.set(key, value)
      resolve()
    } catch (error) {
      console.error(error)
      reject(Error('本地写入失败'))
    }
  })
}

export { useStoreGet, useStoreSet }
