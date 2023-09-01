// 调试函数
const test = async () => {
  const person = { name: '111' }
  const fn = (value) => {
    value.name = '2222222'
  }
  console.log(person)
  fn(person)
  console.log(person)
}

;(async () => {
  console.log('start test')
  await test()
  console.log('end')
  process.exit()
})()
