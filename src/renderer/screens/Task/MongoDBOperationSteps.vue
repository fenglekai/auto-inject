<script lang="ts" setup>
import { DBParams, dynamicListParams, listParams, selectedResponse } from '@/types'
import {} from 'vue'
import ParamComponent from './ParamComponent.vue'
import { baseFormRule } from './formRule'

const props = defineProps({
  itemKey: {
    type: Number,
    default() {
      return 0
    }
  },
  currentStep: {
    type: Object as PropType<DBParams>,
    default() {
      return 0
    }
  }
})
const emits = defineEmits(['watchStep', 'setUseResponse', 'fetchStepResponse'])
const ctx: any = getCurrentInstance()

onMounted(() => {
  for (const key in props.currentStep.data) {
    const type = typeof props.currentStep.data[key] === 'number' ? 'number' : 'string'
    params.value.push({ name: key, value: props.currentStep.data[key], type })
  }
  for (const key in props.currentStep.setData) {
    const type = typeof props.currentStep.setData[key] === 'number' ? 'number' : 'string'
    updateParams.value.push({ name: key, value: props.currentStep.setData[key], type })
  }
  const beforeResponse = props.currentStep.beforeResponse
  const useBefore: dynamicListParams = []
  for (const key in beforeResponse.data) {
    useBefore.push({
      name: key,
      value: {
        step: (beforeResponse.data[key].step + 1).toString(),
        selected: beforeResponse.data[key].selected
      },
      stepSelect: false,
      stepLoading: false,
      stepResSelect: true,
      stepResList: []
    })
  }
  dynamicParams.value = useBefore
  const useUpdateBefore: dynamicListParams = []
  for (const key in beforeResponse.setData) {
    useUpdateBefore.push({
      name: key,
      value: {
        step: (beforeResponse.setData[key].step + 1).toString(),
        selected: beforeResponse.setData[key].selected
      },
      stepSelect: false,
      stepLoading: false,
      stepResSelect: true,
      stepResList: []
    })
  }
  dynamicUpdateParams.value = useUpdateBefore
})

const method = ['findDB', 'updateDB', 'removeDB', 'insertDB']
const DBForm = reactive({
  url: props.currentStep.url,
  DBName: props.currentStep.DBName,
  tabName: props.currentStep.tabName,
  method: props.currentStep.method
})
const params = ref<listParams>([])
const handleAddParams = () => {
  params.value.push({ name: '', value: '', type: 'string' })
}
const handleDeleteParams = (key: number) => {
  params.value = toRaw(params.value).filter((_: any, index: number) => {
    return key !== index
  })
}
const updateParams = ref<listParams>([])
const handleAddUpdateParams = () => {
  updateParams.value.push({ name: '', value: '', type: 'string' })
}
const handleDeleteUpdateParams = (key: number) => {
  updateParams.value = toRaw(updateParams.value).filter((_: any, index: number) => {
    return key !== index
  })
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
const dynamicUpdateParams = ref<dynamicListParams>([])
const handleAddDynamicUpdateParams = () => {
  emits('setUseResponse', props.itemKey, true)
  dynamicUpdateParams.value.push({
    name: 'key' + (dynamicUpdateParams.value.length + 1).toString(),
    value: { step: null, selected: [] },
    stepSelect: false,
    stepLoading: false,
    stepResSelect: true,
    stepResList: []
  })
}
const handleDeleteDynamicUpdateParams = (key: number) => {
  dynamicUpdateParams.value = toRaw(dynamicUpdateParams.value).filter((_: any, index: number) => {
    return key !== index
  })
  if (dynamicUpdateParams.value.length === 0) {
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
const handleSelectType = (value: any, index: number, useName: string) => {
  if (useName === 'params') {
    params.value[index].type = value
  }
  if (useName === 'updateParams') {
    updateParams.value[index].type = value
  }
}

const collectionParams = computed(() => {
  const data = {}
  for (const key in params.value) {
    const value =
      params.value[key].type === 'number'
        ? Number(params.value[key].value)
        : params.value[key].value
    data[params.value[key].name] = value
  }
  const setData = {}
  for (const key in updateParams.value) {
    const value =
      updateParams.value[key].type === 'number'
        ? Number(updateParams.value[key].value)
        : updateParams.value[key].value
    setData[updateParams.value[key].name] = value
  }

  const beforeResponse: { data: selectedResponse; setData: selectedResponse } = {
    data: {},
    setData: {}
  }
  dynamicParams.value.forEach((item) => {
    const toRawSelected = toRaw(item.value.selected)
    if (item.value.step) {
      beforeResponse.data[item.name] = {
        step: Number(item.value.step) - 1,
        selected: toRawSelected
      }
    }
  })
  dynamicUpdateParams.value.forEach((item) => {
    const toRawSelected = toRaw(item.value.selected)
    if (item.value.step) {
      beforeResponse.setData[item.name] = {
        step: Number(item.value.step) - 1,
        selected: toRawSelected
      }
    }
  })
  return { data, setData, beforeResponse }
})
watch(DBForm, (curVal) => {
  const { data, beforeResponse } = collectionParams.value
  emits('watchStep', {
    key: props.itemKey,
    step: { ...curVal, data, beforeResponse }
  })
})
watch(
  () => [params.value, dynamicParams.value, updateParams.value, dynamicUpdateParams.value],
  () => {
    const { data, setData, beforeResponse } = collectionParams.value
    const { method, url } = DBForm
    emits('watchStep', {
      key: props.itemKey,
      step: { method, url, data, setData, beforeResponse }
    })
  },
  { deep: true }
)

const handleTestLink = async () => {
  try {
    const res = await window.mainApi.mongoConnect(DBForm.url)
    ctx.proxy.$snackbar({
      message: '调用成功,返回:' + res
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
        <v-col cols="auto">Step{{ props.itemKey + 1 }}:mongoDB操作</v-col>
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
          <v-text-field
            v-model="DBForm.url"
            :rules="[baseFormRule]"
            label="IP&Port"
            variant="underlined"
            style="min-width: 300px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="DBForm.DBName"
            :rules="[baseFormRule]"
            label="数据库"
            variant="underlined"
            style="min-width: 100px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-text-field
            v-model="DBForm.tabName"
            :rules="[baseFormRule]"
            label="表名"
            variant="underlined"
            style="min-width: 100px"
          ></v-text-field>
        </v-col>
        <v-col cols="auto">
          <v-select
            v-model="DBForm.method"
            :items="method"
            variant="underlined"
            label="方法"
          ></v-select>
        </v-col>
      </v-row>
    </v-col>
    <ParamComponent
      use-name="params"
      :params="params"
      :dynamic-params="dynamicParams"
      :select-step-list="selectStepList"
      @select-step="handleSelectStep"
      @select-type="handleSelectType"
      @add-params="handleAddParams"
      @add-dynamic-params="handleAddDynamicParams"
      @delete-params="handleDeleteParams"
      @delete-dynamic-params="handleDeleteDynamicParams"
    />

    <template v-if="DBForm.method === 'updateDB'">
      <v-col cols="12">更新参数</v-col>
      <ParamComponent
        use-name="updateParams"
        :params="updateParams"
        :dynamic-params="dynamicUpdateParams"
        :select-step-list="selectStepList"
        @select-step="handleSelectStep"
        @select-type="handleSelectType"
        @add-params="handleAddUpdateParams"
        @add-dynamic-params="handleAddDynamicUpdateParams"
        @delete-params="handleDeleteUpdateParams"
        @delete-dynamic-params="handleDeleteDynamicUpdateParams"
      />
    </template>
  </v-row>
</template>
