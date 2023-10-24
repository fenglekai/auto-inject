import { MongoClient } from 'mongodb'

export class MongoDBClient {
  client: MongoClient | null
  mongoUrl: string
  constructor(url: string) {
    this.client = null
    this.mongoUrl = `mongodb://${this.localhostReplace(url)}`
  }

  private localhostReplace = (ip: string) => {
    return ip.replace('localhost', '127.0.0.1')
  }

  connect = async () => {
    // Connection URL
    this.client = new MongoClient(this.mongoUrl)

    // Use connect method to connect to the server
    await this.client.connect()
    return 'Connected successfully to mongo server'
  }

  disconnect = async () => {
    if (this.client) {
      await this.client.close()
      return 'Successfully disconnected from mongo server'
    }
    throw Error('Client is not connected')
  }

  find = async (DBName: string, tabName: string, data: any = {}) => {
    if (this.client) {
      const collection = this.client.db(DBName).collection(tabName)
      const result = await collection.find(data).toArray()
      return result
    }
    throw Error('Client is not connected')
  }

  insert = async (DBName: string, tabName: string, data: any = []) => {
    if (this.client) {
      const collection = this.client.db(DBName).collection(tabName)
      const result = await collection.insertMany(data)
      return result
    }
    throw Error('Client is not connected')
  }

  update = async (DBName: string, tabName: string, data: any = {}, setData: {}) => {
    if (this.client) {
      const collection = this.client.db(DBName).collection(tabName)
      const result = await collection.updateMany(data, { $set: setData })
      return result
    }
    throw Error('Client is not connected')
  }

  remove = async (DBName: string, tabName: string, data: any = null) => {
    if (!data) throw Error('删除的对象没有找到')
    if (this.client) {
      const collection = this.client.db(DBName).collection(tabName)
      const result = await collection.deleteMany(data)
      return result
    }
    throw Error('Client is not connected')
  }
}
