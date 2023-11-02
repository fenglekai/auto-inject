<script lang="ts" setup>
import { writeParams } from '@/types'
import {} from 'vue'
import { baseFormRule, numberFormRule } from './formRule'

const props = defineProps({
  itemKey: {
    type: Number,
    require: true,
    default() {
      return 0
    }
  },
  currentStep: {
    type: Object as PropType<writeParams>,
    require: true,
    default() {
      return []
    }
  }
})
const emits = defineEmits(['watchStep'])

const writeForm = ref<writeParams>(props.currentStep)
watch(writeForm.value, (curVal) => {
  emits('watchStep', { key: props.itemKey, step: curVal })
})

const writeMethods = ['writeSingleCoil', 'writeSingleRegister']
</script>

<template>
  <v-row align="end" class="my-4">
    <v-col cols="12" class="text-start">Step{{ props.itemKey + 1 }}:ModbusTCP写入值</v-col>
    <v-col cols="12">
      <v-row>
        <v-col cols="auto">
          <v-text-field
            v-model="writeForm.ip"
            :rules="[baseFormRule]"
            label="PLC IP"
            variant="underlined"
            style="min-width: 130px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="writeForm.port"
            :rules="[baseFormRule, numberFormRule]"
            label="PLC Port"
            variant="underlined"
            style="min-width: 80px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-select
            v-model="writeForm.method"
            :items="writeMethods"
            variant="underlined"
            label="方法"
          ></v-select>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="writeForm.writeAddress"
            :rules="[baseFormRule, numberFormRule]"
            label="写入地址"
            variant="underlined"
            style="min-width: 150px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="writeForm.writeValue"
            :rules="[baseFormRule, numberFormRule]"
            label="写入值"
            variant="underlined"
            style="min-width: 150px"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
