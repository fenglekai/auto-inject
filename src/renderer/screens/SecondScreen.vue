<script setup lang="ts">
import { PLCConnect, PLCWrite } from '@/renderer/api'
import Register from '../utils/register'

onMounted(async () => {
  await websocket.init()
})
onUnmounted(() => {
  websocket.stopReading()
})

const ipInput = ref('localhost')
const portInput = ref(8888)
const ctx: any = getCurrentInstance()
const connectLoading = ref(false)
const handleConnect = async () => {
  connectLoading.value = true
  try {
    const data = await PLCConnect({ ip: ipInput.value, port: portInput.value })
    ctx.proxy.$snackbar({
      message: '连接成功'
    })
    console.log(data)
  } catch (error) {
    console.log(error)
  }
  connectLoading.value = false
}

const readMethod = ref<
  'readCoils' | 'readDiscreteInputs' | 'readHoldingRegisters' | 'readInputRegisters'
>('readCoils')
const readMethods = [
  'readCoils',
  'readDiscreteInputs',
  'readHoldingRegisters',
  'readInputRegisters'
]
const startRegister = ref(0)
const countRegister = ref(13)
const registers = ref()
const writeMethod = ref<'writeSingleCoil' | 'writeSingleRegister'>('writeSingleCoil')
const writeMethods = ['writeSingleCoil', 'writeSingleRegister']
const writeKey = ref(0)
const writeValue = ref(0)
const websocket = new Register()
const readLoading = ref(false)
const read = async () => {
  readLoading.value = true
  websocket.watchRegisters(
    {
      ip: ipInput.value,
      port: Number(portInput.value),
      readAddress: Number(startRegister.value),
      method: readMethod.value
    },
    (arg) => {
      registers.value = arg
    },
    Number(countRegister.value)
  )
}
const stop = async () => {
  websocket.stopReading()
  readLoading.value = false
}

const writeLoading = ref(false)
const writeRegisters = async () => {
  writeLoading.value = true
  try {
    const data = await PLCWrite({
      ip: ipInput.value,
      port: Number(portInput.value),
      key: Number(writeKey.value),
      value: Number(writeValue.value),
      method: writeMethod.value
    })
    console.log(data)
    ctx.proxy.$snackbar({
      message: '写入成功'
    })
  } catch (error) {
    console.error(error)
  }
  writeLoading.value = false
}
</script>
<template>
  <v-container>
    <v-row align="end" class="text-center">
      <v-col cols="12" class="text-start"
        >连接PLC API: POST http://localhost:3000/plc/connect</v-col
      >
      <v-col cols="12" class="text-start">参数: {ip: string, port: number}</v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="ipInput"
          label="IP"
          variant="underlined"
          hide-details="auto"
          style="min-width: 130px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="portInput"
          label="Port"
          variant="underlined"
          hide-details="auto"
          style="min-width: 60px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" :loading="connectLoading" @click="handleConnect"> 连接PLC </v-btn>
      </v-col>
    </v-row>
    <v-row align="end" class="text-center my-4">
      <v-col cols="12" class="text-start">读取PLC API:</v-col>
      <v-col cols="12" class="text-start">方式1: POST http://localhost:3000/plc/read</v-col>
      <v-col cols="12" class="text-start"
        >参数: {ip: string, port: number, start: number, count: number, method: string}</v-col
      >
      <v-col cols="12" class="text-start"
        >方式2: ws://localhost:3000/ 需要socket.io集成,监听modbus关键字</v-col
      >
    </v-row>
    <v-row align="end" class="text-center my-4">
      <v-col cols="auto">
        <v-select
          v-model="readMethod"
          :items="readMethods"
          variant="underlined"
          label="方法"
        ></v-select>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="startRegister"
          label="开始地址"
          variant="underlined"
          style="min-width: 60px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="countRegister"
          label="读取长度"
          variant="underlined"
          style="min-width: 60px"
        ></v-text-field>
      </v-col>
      <v-col cols="12" class="text-start"> 返回值：{{ registers }} </v-col>
      <v-col cols="auto">
        <v-btn :loading="readLoading" @click="read">读取Registers数据</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn @click="stop">停止读取</v-btn>
      </v-col>
    </v-row>
    <v-row align="center" class="text-center my-4">
      <v-col cols="12" class="text-start">写入PLC API: POST http://localhost:3000/plc/write</v-col>
      <v-col cols="12" class="text-start"
        >参数: {ip: string, port: number, key: number, value: number, method: string}</v-col
      >
      <v-col cols="auto">
        <v-select
          v-model="writeMethod"
          :items="writeMethods"
          variant="underlined"
          label="方法"
        ></v-select>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="writeKey"
          label="写入地址"
          variant="underlined"
          style="min-width: 100px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="writeValue"
          label="写入值"
          variant="underlined"
          style="min-width: 100px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn :loading="writeLoading" @click="writeRegisters">写入Registers数据</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
