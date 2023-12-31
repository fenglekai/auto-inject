<script lang="ts" setup>
import {} from 'vue'
import { resParams, readParams, apiParams, writeParams, taskListParams, DBParams } from '@/types'
import ReadSteps from './ReadSteps.vue'
import RequestSteps from './RequestSteps.vue'
import WriteSteps from './WriteSteps.vue'
import MongoDBOperationSteps from './MongoDBOperationSteps.vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    require: true,
    default() {
      return false
    }
  },
  mainList: {
    type: Array<resParams>,
    require: true,
    default() {
      return []
    }
  },
  editStatus: {
    type: Boolean,
    require: true,
    default() {
      return false
    }
  },
  editKey: {
    type: Number,
    require: true,
    default() {
      return -1
    }
  }
})

const emits = defineEmits(['complete', 'editComplete'])
const ctx: any = getCurrentInstance()
const dialog = ref(false)
const form = ref()
watch(
  () => props.editStatus,
  (curVal) => {
    if (curVal) {
      dialog.value = true
    }
  }
)
watch(dialog, (curVal) => {
  if (!curVal) {
    emits('editComplete', true)
    currentSteps.value = []
  }
})
watch(
  () => props.editKey,
  (curVal) => {
    if (curVal >= 0) {
      // for (const key in props.mainList[curVal].taskList) {
      //   setTimeout(() => {
      //     currentSteps.value.push(props.mainList[curVal].taskList[key])
      //   }, 200);
      // }
      currentSteps.value = props.mainList[curVal].taskList
    }
  }
)

const useTemplate = () => {
  currentSteps.value = []
  currentSteps.value.push({
    type: 'readModbus',
    status: 0,
    data: [
      {
        ip: 'localhost',
        port: '8888',
        readAddress: '5',
        readValue: '1',
        watchValue: null,
        method: 'readCoils'
      }
    ],
    resultData: {}
  })
  currentSteps.value.push({
    type: 'request',
    status: 0,
    data: {
      method: 'GET',
      url: 'http://localhost:3000/test',
      data: [{ name: 'key', value: 'value' }],
      useResponse: false,
      beforeResponse: {}
    },
    resultData: {}
  })
}

const selectedStep = ref('监听ModbusTCP值变化')
const steps = [
  '监听ModbusTCP值变化',
  '调用接口',
  'ModbusTCP写入值',
  'mongoDB操作',
  '等待接口调用',
  '完成接口返回'
]
const currentSteps = ref<Array<taskListParams>>([])
const handleAddSteps = () => {
  switch (selectedStep.value) {
    case '监听ModbusTCP值变化':
      currentSteps.value.push({
        type: 'readModbus',
        status: 0,
        data: [
          {
            ip: 'localhost',
            port: '8888',
            readAddress: '5',
            readValue: '1',
            watchValue: null,
            method: 'readCoils'
          }
        ],
        resultData: {}
      })
      break

    case '调用接口':
      currentSteps.value.push({
        type: 'request',
        status: 0,
        data: {
          method: 'GET',
          url: 'http://localhost:3000/test',
          data: [{ name: 'key', value: 'value' }],
          useResponse: false,
          beforeResponse: {}
        },
        resultData: {}
      })
      break

    case 'ModbusTCP写入值':
      currentSteps.value.push({
        type: 'writeModbus',
        status: 0,
        data: {
          ip: 'localhost',
          port: '8888',
          writeAddress: '5',
          writeValue: '1',
          method: 'writeSingleCoil'
        },
        resultData: {}
      })
      break

    case 'mongoDB操作':
      currentSteps.value.push({
        type: 'MongoDBOperation',
        status: 0,
        data: {
          url: 'localhost:27017',
          method: 'findDB',
          DBName: 'auto_inject',
          tabName: 'vehicle_tray',
          data: { key: 'value' },
          setData: {},
          useResponse: false,
          beforeResponse: {}
        },
        resultData: {}
      })
      break

    case '等待接口调用':
      currentSteps.value.push({
        type: 'waitApi',
        status: 0,
        data: {},
        resultData: {}
      })
      break

    case '完成接口返回':
      currentSteps.value.push({
        type: 'apiCallback',
        status: 0,
        data: {},
        resultData: {}
      })
      break

    default:
      break
  }
}
const watchStep = (value: { key: number; step: Array<readParams> | apiParams | writeParams }) => {
  const { key, step } = value
  if (step instanceof Array) {
    currentSteps.value[key].data = [...step]
  } else {
    currentSteps.value[key].data = { ...currentSteps.value[key].data, ...step }
  }
}

const handleDeleteSteps = (key: number) => {
  currentSteps.value = currentSteps.value.filter((_, index) => {
    return index !== key
  })
}
const handleMoveUpSteps = (key: number) => {
  if (key - 1 < 0) return
  const upKey = key - 1
  const currentUpItem = currentSteps.value[upKey]
  const currentItem = currentSteps.value[key]
  currentSteps.value[upKey] = currentItem
  currentSteps.value[key] = currentUpItem
}
const handleMoveDownSteps = (key: number) => {
  if (key + 1 >= currentSteps.value.length) return
  const downKey = key + 1
  const currentDownItem = currentSteps.value[downKey]
  const currentItem = currentSteps.value[key]
  currentSteps.value[downKey] = currentItem
  currentSteps.value[key] = currentDownItem
}

/**
 * 新增操作
 */
const handleAddTask = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  if (!currentSteps.value.length)
    return ctx.proxy.$snackbar({
      message: '请添加步骤'
    })
  const taskID = await window.mainApi.getStore('taskID')
  await window.mainApi.setStore('taskID', taskID + 1)
  const taskName = 'Task_' + (taskID + 1)

  const toRawStep = toRaw(currentSteps.value)

  const res: resParams = {
    taskName,
    taskList: toRawStep,
    taskStatus: 0
  }
  const toRawList = toRaw(props.mainList)
  await window.mainApi.setStore('task', [...toRawList, res])
  emits('complete', true)
  dialog.value = false
  currentSteps.value = []
  setTimeout(() => {
    form.value.reset()
  }, 200)
}
/**
 * 修改操作
 */
const handleEditTask = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  if (!currentSteps.value.length)
    return ctx.proxy.$snackbar({
      message: '请添加步骤'
    })
  const toRawList = toRaw(props.mainList)
  toRawList[props.editKey].taskList.length = 0
  for (const key in currentSteps.value) {
    toRawList[props.editKey].taskList.push(toRaw(currentSteps.value[key]))
  }
  await window.mainApi.setStore('task', [...toRawList])
  emits('complete', true)
  dialog.value = false
  currentSteps.value = []
  setTimeout(() => {
    form.value.reset()
  }, 200)
}

const taskStepMoveAndRemove = computed(() => {
  let flag = false
  currentSteps.value.forEach((item) => {
    if (item.type === 'request' || item.type === 'MongoDBOperation') {
      if ((item.data as apiParams).useResponse) {
        flag = true
      }
    }
  })
  return flag
})

const dynamicDialog = ref(false)
const waitTipShow = ref(false)
let timer: any
const useDynamicConfirm = () => {
  if (!waitTipShow.value) {
    waitTipShow.value = true
    dynamicDialog.value = false
    timer = setTimeout(() => {
      waitTipShow.value = false
    }, 5 * 60 * 1000)
  }
}

const setUseResponse = async (step: number, status: boolean) => {
  if (!waitTipShow.value) {
    dynamicDialog.value = true
  }
  const data = currentSteps.value[step].data as apiParams
  data.useResponse = status
}

onUnmounted(() => {
  clearTimeout(timer)
})

const fetchStepResponse = async (stepKey: number, callback: (data: any) => any) => {
  const step = toRaw(currentSteps.value)
  let res: any
  const tempTask = {
    taskName: 'tempTask',
    taskList: step,
    taskStatus: 0
  }
  if (step[stepKey].type === 'request') {
    try {
      res = await window.mainApi.apiRequest(tempTask, stepKey)
      currentSteps.value[stepKey].resultData = res
      return callback(res)
    } catch (error) {
      callback(res)
      return ctx.proxy.$snackbar({
        message: error
      })
    }
  }
  if (step[stepKey].type === 'MongoDBOperation') {
    try {
      res = await window.mainApi.mongoDBOperation(tempTask, stepKey)
      currentSteps.value[stepKey].resultData = res
      return callback(res)
    } catch (error) {
      callback(res)
      return ctx.proxy.$snackbar({
        message: error
      })
    }
  }
  callback(res)
  return ctx.proxy.$snackbar({
    message: '步骤不存在返回'
  })
}
</script>

<template>
  <v-dialog v-model="dialog" scrollable persistent fullscreen transition="dialog-bottom-transition">
    <template #activator="{ props: wrapperProps }">
      <v-btn
        color="primary"
        icon="mdi-plus"
        v-bind="wrapperProps"
        :disabled="props.disabled"
        style="position: fixed; right: 1em; bottom: 1em; z-index: 1"
      ></v-btn>
    </template>
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>创建流程步骤</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-subtitle>
        <v-row justify="end" align="center" class="my-1">
          <v-col cols="auto">
            <span>选择预设模板：</span>
          </v-col>
          <v-col cols="auto">
            <v-btn size="x-small" variant="tonal" @click="useTemplate">监听Modbus&调用接口</v-btn>
          </v-col>
          <v-col cols="auto">
            <v-select
              v-model="selectedStep"
              :items="steps"
              variant="underlined"
              label="步骤选择"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="auto">
            <v-btn size="small" @click="handleAddSteps">添加步骤</v-btn>
          </v-col>
        </v-row>
      </v-card-subtitle>
      <v-divider></v-divider>
      <v-card-text>
        <v-form ref="form" @submit.prevent>
          <template v-for="(item, index) in currentSteps" :key="'step' + String(index)">
            <v-card class="pa-4 mb-2" variant="outlined">
              <v-row justify="end">
                <v-col cols="auto">
                  <v-tooltip text="上移步骤" location="top" :disabled="taskStepMoveAndRemove">
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        :disabled="taskStepMoveAndRemove"
                        v-bind="tipProps"
                        density="compact"
                        icon="mdi-chevron-up"
                        @click="handleMoveUpSteps(index)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-col>
                <v-col cols="auto">
                  <v-tooltip text="下移步骤" location="top" :disabled="taskStepMoveAndRemove">
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        :disabled="taskStepMoveAndRemove"
                        v-bind="tipProps"
                        density="compact"
                        icon="mdi-chevron-down"
                        @click="handleMoveDownSteps(index)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-col>
                <v-col
                  cols="auto"
                  :disabled="taskStepMoveAndRemove && currentSteps.length - 1 !== index"
                >
                  <v-tooltip text="删除步骤" location="top">
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        :disabled="taskStepMoveAndRemove && currentSteps.length - 1 !== index"
                        v-bind="tipProps"
                        density="compact"
                        icon="mdi-close"
                        color="red"
                        @click="handleDeleteSteps(index)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-col>
              </v-row>

              <v-lazy :min-height="100" :options="{ threshold: 0.5 }" transition="fade-transition">
                <ReadSteps
                  v-if="item.type === 'readModbus'"
                  :item-key="index"
                  :current-step="(currentSteps[index].data as Array<readParams>)"
                  @watch-step="watchStep"
                />
                <RequestSteps
                  v-if="item.type === 'request'"
                  :item-key="index"
                  :current-step="(currentSteps[index].data as apiParams)"
                  @watch-step="watchStep"
                  @set-use-response="setUseResponse"
                  @fetch-step-response="fetchStepResponse"
                />
                <WriteSteps
                  v-if="item.type === 'writeModbus'"
                  :item-key="index"
                  :current-step="(currentSteps[index].data as writeParams)"
                  @watch-step="watchStep"
                />
                <MongoDBOperationSteps
                  v-if="item.type === 'MongoDBOperation'"
                  :item-key="index"
                  :current-step="(currentSteps[index].data as DBParams)"
                  @watch-step="watchStep"
                  @set-use-response="setUseResponse"
                  @fetch-step-response="fetchStepResponse"
                />
                <div v-if="item.type === 'waitApi'"> Step{{ index + 1 }}: 等待接口调用 </div>
                <div v-if="item.type === 'apiCallback'"> Step{{ index + 1 }}: 完成接口返回 </div>
              </v-lazy>
            </v-card>
          </template>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="justify-end">
        <v-btn v-if="!props.editStatus" type="submit" color="primary" @click="handleAddTask">
          新增
        </v-btn>
        <v-btn v-else type="submit" color="primary" @click="handleEditTask">编辑完成</v-btn>
        <v-btn
          @click="
            () => {
              dialog = false
            }
          "
          >取消</v-btn
        >
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dynamicDialog" persistent width="auto">
      <v-card>
        <v-card-title class="text-h5"> 你确认添加动态参数吗？ </v-card-title>
        <v-card-text
          >添加后将无法移动和删除步骤，在删除所有动态步骤后生效（该消息5分钟内不再提醒）</v-card-text
        >
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green-darken-1" variant="text" @click="dynamicDialog = false"> 取消 </v-btn>
          <v-btn color="green-darken-1" variant="text" @click="useDynamicConfirm"> 确认 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>
