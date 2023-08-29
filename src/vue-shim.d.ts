declare module '*.vue' {
  import { defineComponent } from 'vue'
  const component: ReturnType<typeof defineComponent>
  export default component
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    mainApi?: any
    APIServer?: any
  }
}
