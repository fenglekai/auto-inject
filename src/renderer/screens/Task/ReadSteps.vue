<script lang="ts" setup>
import { readParams } from '@/types'
import {} from 'vue'

const props = defineProps({
  itemKey: {
    type: Number,
    require: true,
    default() {
      return 0
    }
  },
  currentStep: {
    type: Object as PropType<Array<readParams> | any>,
    require: true,
    default() {
      return []
    }
  }
})
const emits = defineEmits(['watchStep'])

const readForm = ref<Array<readParams>>(props.currentStep)
watch(readForm.value, (curVal) => {
  const toRawValue = toRaw(curVal)
  emits('watchStep', { key: props.itemKey, step: toRawValue })
})

const baseFormRule = (value: any) => {
  if (!value) return '这是必填项'
  return true
}
const numberFormRule = (value: any) => {
  if (/[^0-9]/.test(value)) return '请输入数字'
  return true
}
const readMethods = [
  'readCoils',
  'readDiscreteInputs',
  'readHoldingRegisters',
  'readInputRegisters'
]

const handleAddListener = () => {
  readForm.value.push({
    ip: 'localhost',
    port: '8888',
    readAddress: '5',
    readValue: '1',
    watchValue: null,
    method: 'readCoils'
  })
}
const handleDeleteListener = (key: number) => {
  readForm.value = readForm.value.filter((_, index) => {
    return key !== index
  })
}
</script>

<template>
  <v-row align="end" class="my-4">
    <v-col cols="12" class="text-start">Step{{ props.itemKey + 1 }}:监听ModbusTCP值变化</v-col>
    <v-col cols="12">
      <v-row v-for="(readItem, index) in readForm" :key="index">
        <v-col cols="auto">
          <v-text-field
            v-model="readItem.ip"
            :rules="[baseFormRule]"
            label="PLC IP"
            variant="underlined"
            style="min-width: 130px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="readItem.port"
            :rules="[baseFormRule, numberFormRule]"
            label="PLC Port"
            variant="underlined"
            style="min-width: 80px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-select
            v-model="readItem.method"
            :items="readMethods"
            variant="underlined"
            label="方法"
          ></v-select>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="readItem.readAddress"
            :rules="[baseFormRule, numberFormRule]"
            label="读取地址"
            variant="underlined"
            style="min-width: 150px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="readItem.readValue"
            :rules="[baseFormRule, numberFormRule]"
            label="监测值变化"
            variant="underlined"
            style="min-width: 150px"
          ></v-text-field>
        </v-col>
        <template v-if="index !== 0">
          <v-col cols="auto">
            <v-btn density="compact" icon="mdi-minus" @click="handleDeleteListener(index)"></v-btn>
          </v-col>
        </template>
      </v-row>
    </v-col>
    <v-col cols="12" class="text-end">
      <v-tooltip text="新增监听" location="top">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            density="compact"
            icon="mdi-plus"
            @click="handleAddListener"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-col>
  </v-row>
</template>
