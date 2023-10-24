import { MongoClient } from 'mongodb'
// 调试函数
const test = async () => {
  // Connection URL
  const url = 'mongodb://localhost:27017'
  const client = new MongoClient(url)

  // Database Name
  const dbName = 'auto_inject'

  // Use connect method to connect to the server
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('vehicle_tray')
  const findResult = await collection.find({}).toArray()
  console.log('Found documents =>', findResult)
  client.close()
}

;(async () => {
  console.log('start test')
  await test()
  console.log('end')
  process.exit()
})()
