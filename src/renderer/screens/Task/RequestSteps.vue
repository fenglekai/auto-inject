<script lang="ts" setup>
import request from '@/renderer/utils/axios'
import { apiParams } from '@/types'
import { AxiosRequestConfig } from 'axios'
import {} from 'vue'

const props = defineProps({
  itemKey: {
    type: Number,
    default() {
      return 0
    }
  },
  currentStep: {
    type: Object as PropType<apiParams>,
    default() {
      return 0
    }
  }
})
const emits = defineEmits(['watchStep'])
const ctx: any = getCurrentInstance()

onMounted(() => {
  if (props.currentStep.method === 'GET') {
    params.value = props.currentStep.data
  }
  if (props.currentStep.method === 'POST') {
    postJSON.value = props.currentStep.data
  }
})

const baseFormRule = (value: any) => {
  if (!value) return '这是必填项'
  return true
}
const selectedMethod = ref(props.currentStep.method)
const method = ['GET', 'POST']
const url = ref(props.currentStep.url)
const params = ref([{ name: 'key', value: 'value' }])
const handleAddParams = () => {
  params.value.push({ name: '', value: '' })
}
const handleDeleteParams = (key: number) => {
  params.value = toRaw(params.value).filter((_: any, index: number) => {
    return key !== index
  })
}
const postJSON = ref('{"key": 1}')
const validateJSON = (value: any) => {
  try {
    JSON.parse(value)
    return true
  } catch (err) {
    return '请输入正确JSON格式'
  }
}
watch(selectedMethod, (curVal) => {
  let data: any
  if (curVal === 'GET') {
    data = toRaw(params.value)
  }
  if (curVal === 'POST') {
    data = toRaw(postJSON.value)
  }
  emits('watchStep', {
    key: props.itemKey,
    step: { method: curVal, url: url.value, data }
  })
})
watch(url, (curVal) => {
  let data: any
  if (selectedMethod.value === 'GET') {
    data = toRaw(params.value)
  }
  if (selectedMethod.value === 'POST') {
    data = toRaw(postJSON.value)
  }
  emits('watchStep', {
    key: props.itemKey,
    step: { method: selectedMethod.value, url: curVal, data }
  })
})
watch(
  () => params.value,
  (curVal) => {
    if (selectedMethod.value !== 'GET') return
    const toRawVal = toRaw(curVal)
    emits('watchStep', {
      key: props.itemKey,
      step: { method: selectedMethod.value, url: url.value, data: toRawVal }
    })
  },
  { deep: true }
)
watch(postJSON, (curVal) => {
  if (selectedMethod.value !== 'POST') return
  emits('watchStep', {
    key: props.itemKey,
    step: { method: selectedMethod.value, url: url.value, data: curVal }
  })
})

const handleTestLink = async () => {
  try {
    let data: any
    const config: AxiosRequestConfig<any> = {
      method: selectedMethod.value,
      url: url.value
    }
    if (selectedMethod.value === 'GET') {
      data = toRaw(params.value)
      const formatData: any = {}
      for (let j = 0; j < data.length; j++) {
        formatData[data[j].name] = data[j].value
      }
      config.params = formatData
    }
    if (selectedMethod.value === 'POST') {
      data = toRaw(postJSON.value)
      config.data = JSON.parse(data)
    }
    const res = await request(config)
    ctx.proxy.$snackbar({
      message: '调用成功,返回:' + JSON.stringify(res.data)
    })
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <v-row align="end" class="my-4">
    <v-col cols="12" class="text-start">
      <v-row align="center">
        <v-col cols="auto">Step{{ props.itemKey + 1 }}:调用接口</v-col>
        <v-col cols="auto">
          <v-tooltip text="测试连接" location="top">
            <template #activator="{ props: tipProps }">
              <v-btn
                v-bind="tipProps"
                density="compact"
                icon="mdi-link-variant"
                @click="handleTestLink"
              ></v-btn>
            </template>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12">
      <v-row>
        <v-col cols="auto">
          <v-select
            v-model="selectedMethod"
            :items="method"
            variant="underlined"
            label="方法"
          ></v-select>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="url"
            :rules="[baseFormRule]"
            label="调用接口"
            variant="underlined"
            style="min-width: 500px"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-col>
    <v-col v-if="selectedMethod === 'GET'" cols="12">
      <v-row v-for="(item, index) in params" :key="item.name">
        <v-col cols="auto">
          <v-text-field
            v-model="item.name"
            :rules="[baseFormRule]"
            label="参数名"
            variant="underlined"
            style="min-width: 300px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="item.value"
            :rules="[baseFormRule]"
            label="参数值"
            variant="underlined"
            style="min-width: 300px"
          ></v-text-field>
        </v-col>
        <template v-if="index !== 0">
          <v-col cols="auto">
            <v-btn density="compact" icon="mdi-minus" @click="handleDeleteParams(index)"></v-btn>
          </v-col>
        </template>
      </v-row>
    </v-col>
    <v-col v-if="selectedMethod === 'GET'" cols="12" class="text-end">
      <v-tooltip text="新增参数" location="top">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            density="compact"
            icon="mdi-plus"
            @click="handleAddParams"
          ></v-btn>
        </template>
      </v-tooltip>
    </v-col>
    <v-col v-if="selectedMethod === 'POST'" cols="12">
      <v-textarea
        v-model:model-value="postJSON"
        label="JSON参数"
        variant="solo-inverted"
        :rules="[baseFormRule, validateJSON]"
      ></v-textarea>
    </v-col>
  </v-row>
</template>
