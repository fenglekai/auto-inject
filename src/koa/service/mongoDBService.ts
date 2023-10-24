import { MongoClient } from 'mongodb'

export class MongoDBClient {
  client: MongoClient | null
  constructor() {
    this.client = null
  }

  private localhostReplace = (ip: string) => {
    return ip.replace('localhost', '127.0.0.1')
  }

  connect = async (url: string) => {
    // Connection URL
    const mongoUrl = `mongodb://${this.localhostReplace(url)}`
    this.client = new MongoClient(mongoUrl)

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

  remove = async (DBName: string, tabName: string, data: any = {}) => {
    if (this.client) {
      const collection = this.client.db(DBName).collection(tabName)
      const result = await collection.deleteMany(data)
      return result
    }
    throw Error('Client is not connected')
  }
}