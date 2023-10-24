import { MongoClient } from 'mongodb'

interface ConnectParams {
  ip: string
  port: number
}

export class MongoDBClient {
  client: MongoClient | null
  constructor() {
    this.client = null
  }

  private localhostReplace = (ip: string) => {
    return ip.replace('localhost', '127.0.0.1')
  }

  connect = async (params: ConnectParams) => {
    // Connection URL
    const url = `mongodb://${this.localhostReplace(params.ip)}:${params.port}`
    this.client = new MongoClient(url)

    // Use connect method to connect to the server
    await this.client.connect()
    console.log('Connected successfully to mongo server')
  }

  find = async (DBName: string,conName: string,data: any = {}) => {
    if (this.client) {
        const collection = this.client.db(DBName).collection(conName)
        const result = await collection.find(data).toArray();
        return result
    }
    throw Error('Client is not connected')
  }

  insert = async (DBName: string,conName: string,data: any = []) => {
    if (this.client) {
        const collection = this.client.db(DBName).collection(conName)
        const result = await collection.insertMany(data);
        return result
    }
    throw Error('Client is not connected')
  }

  update = async (DBName: string,conName: string,data: any = {},setData: {}) => {
    if (this.client) {
        const collection = this.client.db(DBName).collection(conName)
        const result = await collection.updateMany(data, { $set: setData });
        return result
    }
    throw Error('Client is not connected')
  }

  remove = async (DBName: string,conName: string,data: any = {}) => {
    if (this.client) {
        const collection = this.client.db(DBName).collection(conName)
        const result = await collection.deleteMany(data);
        return result
    }
    throw Error('Client is not connected')
  }
}
