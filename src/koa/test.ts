import { MongoClient, ObjectId } from 'mongodb'
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
  const updateResult = await collection.updateOne(
    { _id: new ObjectId('65378160a5d5301152697cc4') },
    { $set: { status: 1 } }
  )
  const updateResult2 = await collection.updateOne(
    { vehicle: '1', location: 1, point: 1 },
    { $set: { status: 0 } }
  )
  const findResult2 = await collection.find({}).toArray()
  // const result = await collection.deleteMany({})
  console.log('Found documents =>', findResult[0])
  console.log('Found documents =>', updateResult)
  console.log('Found documents =>', updateResult2)
  console.log('Found documents =>', findResult2[0])
  client.close()
}

;(async () => {
  console.log('start test')
  await test()
  console.log('end')
  process.exit()
})()
