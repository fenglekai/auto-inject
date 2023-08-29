import type { App } from 'vue'
import SnackBarVue from './SnackBar.vue'
import vuetify from '@/renderer/plugins/vuetify'

type options = {
  message: String
  onClose?: Function
}

const SnackBar = (options: options) => {
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }
  options = {
    ...options,
    message: options.message ? options.message : 'message'
  }

  const app = createApp(SnackBarVue, options).use(vuetify)
  const node = document.createElement('div')
  options.onClose = () => {
    setTimeout(() => {
      close(node, app)
    }, 1000)
  }
  app.mount(node)
  document.body.appendChild(node)
}

const close = (node: Element, app: App<Element>) => {
  document.body.removeChild(node)
  app.unmount()
}

export default SnackBar
