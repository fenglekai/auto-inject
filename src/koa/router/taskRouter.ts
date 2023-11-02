import { resParams } from '@/types'
import { useStoreGet, useStoreSet } from '../model'
import Router from '@koa/router'
import { TaskProcess } from '../service'
import { currentTaskList, taskProcessList } from './websocket'
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
router.get('/start', async (ctx) => {
  try {
    for (let i = 0; i < currentTaskList.length; i++) {
      if (taskProcessList[currentTaskList[i].taskName] == null) {
        taskProcessList[currentTaskList[i].taskName] = new TaskProcess()
      }
      const time = new Date().getTime()
      taskProcessList[currentTaskList[i].taskName].taskStart(currentTaskList[i], time)
    }
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})
router.get('/stop', async (ctx) => {
  try {
    for (let i = 0; i < currentTaskList.length; i++) {
      if (taskProcessList[currentTaskList[i].taskName] == null) {
        taskProcessList[currentTaskList[i].taskName] = new TaskProcess()
      }
      taskProcessList[currentTaskList[i].taskName].taskStop(currentTaskList[i])
    }
    ctx.body = { message: 'success' }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

router.get('/taskConfirm', async (ctx) => {
  try {
    const taskName = ctx.request.query.taskName
    if (typeof taskName !== 'string') throw Error('taskName is not a string')
    if (taskProcessList[taskName] == null) throw Error('The task does not exist')
    await taskProcessList[taskName].executeApi()
    ctx.body = true
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: String(error) }
  }
})

export default router.routes()
