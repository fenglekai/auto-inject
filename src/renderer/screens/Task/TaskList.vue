<!-- eslint-disable no-unreachable -->
<script lang="ts" setup>
import {} from 'vue'
import Register from '@/renderer/utils/register'
import { apiParams, readParams, resParams, writeParams } from '@/types'
import AddTask from './AddTask.vue'

onMounted(async () => {
  const taskData = await window.mainApi.getStore('task')
  mainList.value = taskData
  await websocket.init()
  websocket.watchTask((list) => {
    if (!list) {
      window.mainApi.setStore('task', [])
    }
    mainList.value = list
  })
})

onUnmounted(() => {
  websocket.stopReading()
})

const websocket = new Register()

const mainList = ref<Array<resParams>>([])
const panel = ref<Array<string>>([])

const deleteCheck = ref(false)
const deleteKey = ref(0)
const setDeleteKey = (key: number) => {
  deleteKey.value = key
  deleteCheck.value = true
}
const handleDeleteTask = async () => {
  const toRawList = toRaw(mainList.value)
  const list = toRawList.filter((_, index) => {
    return index !== deleteKey.value
  })
  await window.mainApi.setStore('task', list)
  websocket.updateTask()
  deleteCheck.value = false
}

const editStatus = ref(false)
const editKey = ref(-1)
const handleEditTask = (key: number) => {
  editStatus.value = true
  editKey.value = key
}
const editComplete = () => {
  editStatus.value = false
  editKey.value = -1
}

const btnLoading = ref(false)
const handleRunOnce = (key: number) => {
  btnLoading.value = true
  const instance = mainList.value[key]
  websocket.executeSingleTask(instance.taskName, () => {
    setTimeout(() => {
      btnLoading.value = false
    }, 1000)
  })
}
const handleStopOnce = (key: number) => {
  btnLoading.value = true
  const instance = mainList.value[key]
  websocket.stopSingleTask(instance.taskName, () => {
    setTimeout(() => {
      btnLoading.value = false
    }, 1000)
  })
}

const allBtnStatus = computed(() => {
  const res = mainList.value.every((item) => {
    return item.taskStatus === 0
  })
  return !res
})
const handleRunAll = () => {
  websocket.startAllTask()
}
const handleStopAll = () => {
  websocket.stopAllTask()
}
const handleRetry = (key: number) => {
  const instance = mainList.value[key]
  websocket.retrySingleTask(instance.taskName)
}
const handleExpendAll = () => {
  panel.value = mainList.value.map((item) => {
    return item.taskName
  })
}
const handleShrinkAll = () => {
  panel.value = []
}
const handleExport = () => {
  const toRawTask = toRaw(mainList.value)
  downloadFile(JSON.stringify({ task: toRawTask }), 'task.json')
}
const handleImport = () => {
  uploadFile((files: File[]) => {
    if (files.length) {
      if (files[0].name !== 'task.json') return alert('这不是任务文件')
      const reader = new FileReader()
      reader.readAsText(files[0])
      reader.onload = async function fileReadCompleted() {
        try {
          const data = JSON.parse(reader.result as string)
          const res: any[] = []
          for (let i = 0; i < data.task.length; i++) {
            const taskID = await window.mainApi.getStore('taskID')
            await window.mainApi.setStore('taskID', taskID + 1)
            const taskName = 'Task_' + (taskID + 1)
            res.push({ ...data.task[i], taskName })
          }
          const taskData = await window.mainApi.getStore('task')
          await window.mainApi.setStore('task', [...taskData, ...res])
          websocket.updateTask()
        } catch (error) {
          console.log(error)
          alert('读取错误')
        }
      }
    }
  })
}
const downloadFile = (content: any, filename: string) => {
  const eleLink = document.createElement('a')
  eleLink.download = filename
  eleLink.style.display = 'none'
  const blob = new Blob([content])
  eleLink.href = URL.createObjectURL(blob)
  document.body.appendChild(eleLink)
  eleLink.click()
  document.body.removeChild(eleLink)
}
const uploadFile = (callback) => {
  const ele = document.createElement('input')
  ele.type = 'file'
  ele.style.display = 'none'
  document.body.appendChild(ele)
  ele.click()
  ele.addEventListener('change', function (this) {
    callback(this.files)
  })
  document.body.removeChild(ele)
}
const resetCheck = ref(false)
const handleResetData = async () => {
  await window.mainApi.setStore('task', [])
  await window.mainApi.setStore('taskID', 0)
  websocket.updateTask()
  resetCheck.value = false
}
</script>

<template>
  <div>
    <v-row class="ma-2">
      <v-col cols="auto">
        <v-btn :disabled="allBtnStatus" color="primary" variant="outlined" @click="handleRunAll">
          全部运行
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn :disabled="!allBtnStatus" color="red" variant="outlined" @click="handleStopAll">
          全部停止
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="outlined" @click="handleExpendAll"> 全部展开 </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn variant="outlined" @click="handleShrinkAll"> 全部收起 </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn :disabled="allBtnStatus" variant="outlined" @click="handleExport"> 导出 </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn :disabled="allBtnStatus" variant="outlined" @click="handleImport"> 导入 </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn :disabled="allBtnStatus" color="red" variant="outlined" @click="resetCheck = true">
          重置数据
        </v-btn>
      </v-col>
    </v-row>
    <v-expansion-panels v-model="panel" multiple>
      <template v-for="(main, mainIndex) in mainList" :key="mainIndex">
        <v-expansion-panel :value="main.taskName">
          <v-expansion-panel-title>
            <span>{{ main.taskName }}</span>
            <v-timeline direction="horizontal" align="start" class="mx-8">
              <v-timeline-item
                hide-opposite
                fill-dot
                size="20"
                :dot-color="
                  main.taskStatus === 3
                    ? 'error'
                    : main.taskStatus === 2
                    ? 'success'
                    : main.taskStatus === 1
                    ? 'white'
                    : 'grey'
                "
              >
                <template #icon>
                  <v-progress-circular
                    v-if="main.taskStatus === 1"
                    indeterminate
                    color="primary"
                  ></v-progress-circular>
                </template>
              </v-timeline-item>
              <template v-for="(task, index) in main.taskList" :key="index">
                <v-timeline-item
                  hide-opposite
                  fill-dot
                  :dot-color="
                    task.status === 3
                      ? 'error'
                      : task.status === 2
                      ? 'success'
                      : task.status === 1
                      ? 'white'
                      : 'grey'
                  "
                  size="20"
                >
                  <template #icon>
                    <v-progress-circular v-if="task.status === 1" indeterminate color="primary">
                    </v-progress-circular>
                  </template>
                </v-timeline-item>
              </template>
            </v-timeline>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-timeline density="compact" side="end" class="mx-4">
              <v-timeline-item
                :dot-color="
                  main.taskStatus === 3
                    ? 'error'
                    : main.taskStatus === 2
                    ? 'success'
                    : main.taskStatus === 1
                    ? 'white'
                    : 'grey'
                "
              >
                <template #icon>
                  <v-progress-circular
                    v-if="main.taskStatus === 1"
                    indeterminate
                    color="primary"
                  ></v-progress-circular>
                </template>
                <v-chip class="ms-0" color="primary" label> {{ main.taskName }} </v-chip>
                <v-tooltip :disabled="!!main.taskStatus" text="单例运行" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      :disabled="!!main.taskStatus"
                      :loading="btnLoading"
                      color="primary"
                      icon="mdi-lightning-bolt"
                      size="small"
                      class="ml-2"
                      v-bind="props"
                      @click="handleRunOnce(mainIndex)"
                    ></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :disabled="!main.taskStatus" text="重试" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      :disabled="main.taskStatus !== 3"
                      color="primary"
                      icon="mdi-reload"
                      size="small"
                      class="ml-2"
                      v-bind="props"
                      @click="handleRetry(mainIndex)"
                    ></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :disabled="!main.taskStatus" text="停止" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      :disabled="!main.taskStatus"
                      :loading="btnLoading"
                      color="red"
                      icon="mdi-cancel"
                      size="small"
                      class="ml-2"
                      v-bind="props"
                      @click="handleStopOnce(mainIndex)"
                    ></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :disabled="!!main.taskStatus" text="编辑" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      :disabled="!!main.taskStatus"
                      icon="mdi-pencil"
                      size="small"
                      class="ml-2"
                      v-bind="props"
                      @click="handleEditTask(mainIndex)"
                    ></v-btn>
                  </template>
                </v-tooltip>
                <v-tooltip :disabled="!!main.taskStatus" text="删除" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      :disabled="!!main.taskStatus"
                      color="red"
                      icon="mdi-trash-can-outline"
                      size="small"
                      class="ml-2"
                      v-bind="props"
                      @click="setDeleteKey(mainIndex)"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </v-timeline-item>
              <template v-for="(task, index) in main.taskList" :key="index">
                <v-timeline-item
                  :dot-color="
                    task.status === 3
                      ? 'error'
                      : task.status === 2
                      ? 'success'
                      : task.status === 1
                      ? 'white'
                      : 'grey'
                  "
                  size="small"
                >
                  <template #icon>
                    <v-progress-circular v-if="task.status === 1" indeterminate color="primary">
                      {{ index + 1 }}
                    </v-progress-circular>
                    <span v-else> {{ index + 1 }} </span>
                  </template>
                  <v-row v-if="task.type === 'readModbus'">
                    <v-col
                      v-for="(readItem, readIndex) in (task.data as Array<readParams>)"
                      :key="readIndex"
                      cols="auto"
                    >
                      <v-card class="pa-2">
                        <v-chip class="mb-2" color="blue" label size="small">
                          {{ `${readItem.ip}:${readItem.port}` }}
                        </v-chip>
                        <p class="mb-2">
                          监听PLC地址:
                          <v-chip color="orange-darken-3" label size="small" class="mr-2">
                            {{ readItem.method }}
                          </v-chip>
                          <v-chip color="orange-darken-3" label size="small">
                            {{ readItem.readAddress }}
                          </v-chip>
                        </p>
                        <p>
                          当前值状态:
                          <v-chip label size="small">
                            {{ readItem.watchValue }}
                          </v-chip>
                        </p>
                      </v-card>
                    </v-col>
                    <template v-if="task.status === 2">
                      <v-divider class="mt-2"></v-divider>
                      result: {{ task.resultData }}
                    </template>
                  </v-row>
                  <div v-if="task.type === 'request'">
                    调用接口:
                    <v-chip class="ms-0 mr-2" color="orange-darken-3" label size="small">
                      {{ (task.data as apiParams).method }}
                    </v-chip>
                    <v-chip class="ms-0" color="blue" label size="small">
                      {{ (task.data as apiParams).url }}
                    </v-chip>
                    <template v-if="task.status === 2">
                      <v-divider class="mt-2"></v-divider>
                      result: {{ task.resultData }}
                    </template>
                  </div>
                  <div v-if="task.type === 'writeModbus'">
                    <v-chip color="blue" label size="small">
                      {{ `${(task.data as writeParams).ip}:${(task.data as writeParams).port}` }}
                    </v-chip>
                    Modbus写入值:
                    <v-chip class="ms-0 mr-2" color="orange-darken-3" label size="small">
                      {{ (task.data as writeParams).method }}
                    </v-chip>
                    <v-chip class="ms-0" color="orange-darken-3" label size="small">
                      {{ (task.data as writeParams).writeAddress }}
                    </v-chip>
                    =>
                    <v-chip class="ms-0" label size="small">
                      {{ (task.data as writeParams).writeValue }}
                    </v-chip>
                    <template v-if="task.status === 2">
                      <v-divider class="mt-2"></v-divider>
                      result: {{ task.resultData }}
                    </template>
                  </div>
                  <div v-if="task.type === 'MongoDBOperation'">
                    mongoDB操作:
                    <v-chip class="ms-0 mr-2" color="blue" label size="small">
                      {{ (task.data as apiParams).url }}
                    </v-chip>
                    <v-chip class="ms-0 mr-2" color="orange-darken-3" label size="small">
                      {{ (task.data as apiParams).method }}
                    </v-chip>
                    <template v-if="task.status === 2">
                      <v-divider class="mt-2"></v-divider>
                      result: {{ task.resultData }}
                    </template>
                  </div>
                  <div v-if="task.type === 'waitApi'"> 等待接口调用 </div>
                  <div v-if="task.type === 'apiCallback'"> 完成接口返回 </div>
                </v-timeline-item>
              </template>
            </v-timeline>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </template>
    </v-expansion-panels>

    <AddTask
      :disabled="allBtnStatus"
      :main-list="mainList"
      :edit-status="editStatus"
      :edit-key="editKey"
      @complete="websocket.updateTask()"
      @edit-complete="editComplete"
    />

    <v-dialog v-model="deleteCheck" width="auto">
      <v-card>
        <v-card-text> 确认删除该任务吗？ </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="red" @click="handleDeleteTask()">确认</v-btn>
          <v-btn @click="deleteCheck = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="resetCheck" width="auto">
      <v-card>
        <v-card-text> 该操作将清空所有任务及ID,确认重置所有数据吗? </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="red" @click="handleResetData()">确认</v-btn>
          <v-btn @click="resetCheck = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
