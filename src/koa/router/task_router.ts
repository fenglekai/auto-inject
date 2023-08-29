import { resParams } from '@/types'
import { useStoreGet, useStoreSet } from '../model'
import Router from '@koa/router'
import { TaskProcess } from '../service'
const router = new Router()

router.get('/getTask', async (ctx) => {
  try {
    const currentTaskList: Array<resParams> = await useStoreGet('task')
    ctx.body = { data: currentTaskList, message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

router.post('/setTask', async (ctx) => {
  try {
    const { task } = ctx.request.body
    if (task instanceof Array) {
      await useStoreSet('task', task)
    } else {
      throw Error('传入格式错误')
    }
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})
const taskProcessList: any = {}
router.get('/start', async (ctx) => {
  try {
    const currentTaskList: Array<resParams> = await useStoreGet('task')
    for (let i = 0; i < currentTaskList.length; i++) {
      taskProcessList[currentTaskList[i].taskName] = new TaskProcess()
      setTimeout(async () => {
        await taskProcessList[currentTaskList[i].taskName].taskStart(i)
      }, 200)
    }
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})
router.get('/stop', async (ctx) => {
  try {
    const currentTaskList: Array<resParams> = await useStoreGet('task')
    for (let i = 0; i < currentTaskList.length; i++) {
      if (taskProcessList[currentTaskList[i].taskName]) {
        setTimeout(async () => {
          await taskProcessList[currentTaskList[i].taskName].taskStop(i)
        }, 200)
      }
    }
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

export default router.routes()
