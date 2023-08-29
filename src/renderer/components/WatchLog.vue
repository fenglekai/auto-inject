<script lang="ts" setup>
import Register from '../utils/register'

onMounted(async () => {
  formatLog(await window.mainApi.logFile())
  await websocket.init()
  websocket.watchLog((log: { path: string; lines: Array<string> }) => {
    formatLog(log)
  })
})
onUnmounted(() => {
  websocket.stopReading()
})

const websocket = new Register()
const logFile = ref<Array<string>>([])
const formatLog = (log: { path: string; lines: Array<string> }) => {
  const length = 50
  const logLength = log.lines.length
  logFile.value = log.lines.splice(logLength - length, logLength - 1).reverse()
}
</script>

<template>
  <v-card class="pl-4 py-4 bg-black">
    <div ref="cardRef" class="overflow-y-auto" style="max-height: calc(100vh - 200px)">
      <div>
        <p v-for="(item, index) in logFile" :key="index">
          {{ item }}
        </p>
      </div>
    </div>
  </v-card>
</template>
