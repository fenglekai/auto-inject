<script setup lang="ts">
import { onMounted } from 'vue'
import { useClientStore } from '@/renderer/store/client'
import { storeToRefs } from 'pinia'

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    mainApi?: any
    APIServer?: any
  }
}

type TipState = 'info' | 'error'

onMounted(async () => {
  serverStatus()
})

const { counterIncrease } = useClientStore()
const { port } = storeToRefs(useClientStore())

const tipText = ref('服务器未启动')
const tipState = ref<TipState>('info')
const openServer = async () => {
  try {
    tipText.value = await window.APIServer.openServer()
    tipState.value = 'info'
  } catch (error) {
    tipText.value = '服务器开启失败，请检查端口占用'
    tipState.value = 'error'
  }
}
const closeServer = async () => {
  try {
    tipText.value = await window.APIServer.closeServer()
    tipState.value = 'info'
  } catch (error) {
    tipText.value = '服务器关闭失败'
    tipState.value = 'error'
  }
}

const serverStatus = async () => {
  const data = await window.APIServer.serverStatus()
  if (data.status) {
    counterIncrease(data.port)
    tipText.value = '服务器已启动，http://localhost:' + port.value
  }
}
const openLogPath = async () => {
  window.mainApi.openPath()
}
</script>

<template>
  <v-container>
    <v-parallax src="./images/vbanner.jpg">
      <div class="d-flex flex-column fill-height justify-center align-center text-white">
        <h1 class="text-h4 font-weight-thin mb-4"> AutoInject </h1>
        <h4 class="subheading"> ModbusTCP 可视化图形界面连接工具 </h4>
      </div>
    </v-parallax>

    <v-alert class="mt-1" :type="tipState" variant="tonal" border="start" :text="tipText"></v-alert>
    <v-row class="mt-1" justify="end">
      <v-col cols="auto"><v-btn @click="openLogPath">查看日志路径</v-btn></v-col>
      <v-col cols="auto"><v-btn @click="serverStatus">查看状态</v-btn></v-col>
      <v-col cols="auto"><v-btn color="primary" @click="openServer">开启</v-btn></v-col>
      <v-col cols="auto"><v-btn color="error" @click="closeServer">关闭</v-btn></v-col>
    </v-row>
  </v-container>
</template>
