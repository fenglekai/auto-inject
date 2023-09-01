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

const useStoreGet = (key: string): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    try {
      const value: any = store.get(key)
      resolve(value)
    } catch (error) {
      console.error(error)
      reject(Error('本地写入失败'))
    }
  })
}
const useStoreSet = (key: string, value: any): Promise<any> => {
  return new Promise<any>((resolve, reject) => {
    try {
      store.set(key, value)
      resolve(true)
    } catch (error) {
      console.error(error)
      reject(Error('本地写入失败'))
    }
  })
}

export { useStoreGet, useStoreSet }
