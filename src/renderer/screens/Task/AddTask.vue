<script lang="ts" setup>
import {} from 'vue'
import { resParams, readParams, apiParams, writeParams, taskListParams } from '@/types'
import ReadSteps from './ReadSteps.vue'
import RequestSteps from './RequestSteps.vue'

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
    ]
  })
  currentSteps.value.push({
    type: 'request',
    status: 0,
    data: {
      method: 'GET',
      url: 'http://localhost:3000/test',
      data: [{ name: 'key', value: 'value' }]
    }
  })
}

const selectedStep = ref('监听ModbusTCP值变化')
const steps = ['监听ModbusTCP值变化', '调用接口']
const currentSteps = ref<Array<taskListParams>>([])
const handleAddSteps = () => {
  if (selectedStep.value === '监听ModbusTCP值变化') {
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
      ]
    })
  }
  if (selectedStep.value === '调用接口') {
    currentSteps.value.push({
      type: 'request',
      status: 0,
      data: {
        method: 'GET',
        url: 'http://localhost:3000/test',
        data: [{ name: 'key', value: 'value' }]
      }
    })
  }
}
const watchStep = (value: { key: number; step: Array<readParams> | apiParams | writeParams }) => {
  const { key, step } = value
  currentSteps.value[key].data = step
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

const handleEditTask = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return
  if (!currentSteps.value.length)
    return ctx.proxy.$snackbar({
      message: '请添加步骤'
    })
  const toRawStep = toRaw(currentSteps.value)
  const toRawList = toRaw(props.mainList)
  toRawList[props.editKey].taskList = toRawStep
  await window.mainApi.setStore('task', [...toRawList])
  emits('complete', true)
  dialog.value = false
  currentSteps.value = []
  setTimeout(() => {
    form.value.reset()
  }, 200)
}
</script>

<template>
  <v-dialog v-model="dialog" scrollable width="900">
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
      <v-card-title>创建流程步骤</v-card-title>
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
          <template v-for="(item, index) in currentSteps" :key="index">
            <v-card class="pa-4 mb-2" variant="outlined">
              <v-row justify="end">
                <v-col cols="auto">
                  <v-tooltip text="上移步骤" location="top">
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        v-bind="tipProps"
                        density="compact"
                        icon="mdi-chevron-up"
                        @click="handleMoveUpSteps(index)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-col>
                <v-col cols="auto">
                  <v-tooltip text="下移步骤" location="top">
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        v-bind="tipProps"
                        density="compact"
                        icon="mdi-chevron-down"
                        @click="handleMoveDownSteps(index)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </v-col>
                <v-col cols="auto">
                  <v-tooltip text="删除步骤" location="top">
                    <template #activator="{ props: tipProps }">
                      <v-btn
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
              />
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
  </v-dialog>
</template>
