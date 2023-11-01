import Router from '@koa/router'
import PLC from './PLCRouter'
import Task from './taskRouter'
import { whitelist } from '../model'
export * from './websocket'

const router = new Router()

router.get('/', (ctx, next) => {
  ctx.body = 'This is the Koa server'
})
router.get('/test', async (ctx) => {
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
      ctx.body = ctx.request.query
    }, 1000)
  })
  await promise
})
router.post('/test', async (ctx) => {
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
      ctx.body = ctx.request.body
    }, 5000)
  })
  await promise
})
router.use('/plc', PLC)
router.use('/task', Task)

export default router

export const Middleware = async (ctx: any, next: any) => {
  if (ctx.path === '/favicon.ico') return
  const origin = ctx.header.origin
  if (whitelist.indexOf(origin) !== -1) {
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Content-Length, Authorization, Accept, X-Requested-With'
    )
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
    if (ctx.method === 'OPTIONS') {
      ctx.body = 200
    }
  }
  await next()
  const rt = ctx.response.get('X-Response-Time')
  console.log(`${ctx.method} ${ctx.url} - ${rt}`)
}
