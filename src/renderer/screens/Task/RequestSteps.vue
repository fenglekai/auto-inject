<script lang="ts" setup>
import request from '@/renderer/utils/axios'
import { apiParams, selectedResponse } from '@/types'
import { AxiosRequestConfig } from 'axios'
import {} from 'vue'

type dynamicListParams = Array<{
  name: string
  value: { step: string | null; selected: any }
  stepSelect: boolean
  stepLoading: boolean
  stepResSelect: boolean
  stepResList: Array<string>
}>

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
const emits = defineEmits(['watchStep', 'setUseResponse', 'fetchStepResponse'])
const ctx: any = getCurrentInstance()

onMounted(() => {
  if (props.currentStep.method === 'GET') {
    params.value = props.currentStep.data
  }
  if (props.currentStep.method === 'POST') {
    postJSON.value = props.currentStep.data
  }
  const beforeResponse = props.currentStep.beforeResponse
  const setData: dynamicListParams = []
  for (const key in beforeResponse) {
    setData.push({
      name: key,
      value: { step: (beforeResponse[key].step + 1).toString(), selected: beforeResponse[key].selected },
      stepSelect: false,
      stepLoading: false,
      stepResSelect: true,
      stepResList: []
    })
  }
  dynamicParams.value = setData
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

/**
 * 动态参数
 */
const dynamicParams = ref<dynamicListParams>([])
const handleAddDynamicParams = () => {
  emits('setUseResponse', props.itemKey, true)
  dynamicParams.value.push({
    name: 'key' + (dynamicParams.value.length + 1).toString(),
    value: { step: null, selected: [] },
    stepSelect: false,
    stepLoading: false,
    stepResSelect: true,
    stepResList: []
  })
}
const handleDeleteDynamicParams = (key: number) => {
  dynamicParams.value = toRaw(dynamicParams.value).filter((_: any, index: number) => {
    return key !== index
  })
  if (dynamicParams.value.length === 0) {
    emits('setUseResponse', props.itemKey, false)
  }
}
const selectStepList = computed(() => {
  const res: string[] = []
  for (let i = 0; i < props.itemKey; i++) {
    res.push(String(i + 1))
  }
  return res
})
// {"key": 1,"body": {"name": "dd"}}
const handleSelectStep = (value: any, index: number) => {
  const currentDynamic = dynamicParams.value[index]
  currentDynamic.stepLoading = true
  currentDynamic.stepSelect = true
  currentDynamic.stepResSelect = true
  currentDynamic.value.selected = []
  emits('fetchStepResponse', Number(value) - 1, (data: any) => {
    const list = {}
    const keys: any[] = []
    const recursive = (data: any) => {
      for (const key in data) {
        keys.push(key)
        const currentKeys = keys.join('->')
        list[currentKeys] = data[key]
        if (data[key] instanceof Object) {
          recursive(data[key])
        }
        keys.length--
      }
    }
    recursive(data)
    if (!Object.keys(list).length) {
      currentDynamic.stepResSelect = true
    } else {
      currentDynamic.stepResSelect = false
      currentDynamic.stepResList = Object.keys(list)
    }
    currentDynamic.stepLoading = false
    currentDynamic.stepSelect = false
  })
}

const collectionParams = computed(() => {
  let data: any
  if (selectedMethod.value === 'GET') {
    data = toRaw(params.value)
  }
  if (selectedMethod.value === 'POST') {
    data = toRaw(postJSON.value)
  }

  const beforeResponse: selectedResponse = {}
  dynamicParams.value.forEach((item) => {
    const toRawSelected = toRaw(item.value.selected)
    if (item.value.step) {
      beforeResponse[item.name] = {
        step: Number(item.value.step) - 1,
        selected: toRawSelected
      }
    }
  })
  return { data, beforeResponse }
})
watch(selectedMethod, (curVal) => {
  const { data, beforeResponse } = collectionParams.value
  emits('watchStep', {
    key: props.itemKey,
    step: { method: curVal, url: url.value, data, beforeResponse }
  })
})
watch(url, (curVal) => {
  const { data, beforeResponse } = collectionParams.value
  emits('watchStep', {
    key: props.itemKey,
    step: { method: selectedMethod.value, url: curVal, data, beforeResponse }
  })
})
watch(
  () => params.value,
  (curVal) => {
    if (selectedMethod.value !== 'GET') return
    const toRawVal = toRaw(curVal)
    const { beforeResponse } = collectionParams.value
    emits('watchStep', {
      key: props.itemKey,
      step: { method: selectedMethod.value, url: url.value, data: toRawVal, beforeResponse }
    })
  },
  { deep: true }
)
watch(postJSON, (curVal) => {
  if (selectedMethod.value !== 'POST') return
  const { beforeResponse } = collectionParams.value
  emits('watchStep', {
    key: props.itemKey,
    step: { method: selectedMethod.value, url: url.value, data: curVal, beforeResponse }
  })
})
watch(
  () => dynamicParams.value,
  () => {
    const { data, beforeResponse } = collectionParams.value
    emits('watchStep', {
      key: props.itemKey,
      step: { method: selectedMethod.value, url: url.value, data, beforeResponse }
    })
  },
  { deep: true }
)

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
    <v-col v-if="selectedMethod === 'POST'" cols="12">
      <v-textarea
        v-model:model-value="postJSON"
        label="JSON参数"
        variant="solo-inverted"
        :rules="[baseFormRule, validateJSON]"
      ></v-textarea>
    </v-col>
    <v-col cols="12">
      <template v-if="selectedMethod === 'GET'">
        <v-row v-for="(item, index) in params" :key="'params' + String(index)">
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
          <v-col cols="auto">
            <v-btn density="compact" icon="mdi-minus" @click="handleDeleteParams(index)"></v-btn>
          </v-col>
        </v-row>
      </template>
      <v-row v-for="(item, index) in dynamicParams" :key="'dynamicParams' + String(index)">
        <v-col cols="auto">
          <v-text-field
            v-model="item.name"
            :rules="[baseFormRule]"
            label="动态参数名"
            variant="underlined"
            style="min-width: 300px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-select
            v-model="item.value.step"
            :rules="[baseFormRule]"
            :items="selectStepList"
            :disabled="item.stepSelect"
            :loading="item.stepLoading"
            label="选择步骤"
            variant="underlined"
            style="min-width: 100px"
            @update:model-value="(value: any) => handleSelectStep(value, index)"
          ></v-select>
        </v-col>
        <v-col cols="auto">
          <v-select
            v-model="item.value.selected"
            :rules="[baseFormRule]"
            :items="item.stepResList"
            :disabled="item.stepResSelect"
            :loading="item.stepLoading"
            chips
            label="动态参数值"
            multiple
            variant="underlined"
            style="min-width: 180px"
          ></v-select>
        </v-col>
        <v-col cols="auto">
          <v-btn
            density="compact"
            icon="mdi-minus"
            @click="handleDeleteDynamicParams(index)"
          ></v-btn>
        </v-col>
      </v-row>
    </v-col>

    <v-col cols="12" class="text-end">
      <v-tooltip text="新增动态参数" location="top">
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            density="compact"
            icon="mdi-plus"
            color="primary"
            class="mr-4"
            @click="handleAddDynamicParams"
          ></v-btn>
        </template>
      </v-tooltip>

      <v-tooltip v-if="selectedMethod === 'GET'" text="新增参数" location="top">
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
  </v-row>
</template>
