<script lang="ts" setup>
import {} from 'vue'
import { baseFormRule } from './formRule'
import { dynamicListParams, listParams } from '@/types'
defineProps({
  useName: {
    type: String,
    require: true,
    default() {
      return "params"
    }
  },
  params: {
    type: Object as PropType<listParams>,
    require: true,
    default() {
      return []
    }
  },
  dynamicParams: {
    type: Object as PropType<dynamicListParams>,
    require: true,
    default() {
      return []
    }
  },
  selectStepList: {
    type: Object as PropType<Array<string>>,
    require: true,
    default() {
      return []
    }
  }
})

const emits = defineEmits([
  'selectStep',
  'selectType',
  'addParams',
  'addDynamicParams',
  'deleteParams',
  'deleteDynamicParams'
])
const handleSelectStep = (value: any, index: number) => {
  emits('selectStep', value, index)
}
const handleSelectType = (value: any, index: number, name: string) => {
  emits('selectType', value, index, name)
}
function handleAddParams() {
  emits('addParams', arguments)
}
const handleDeleteParams = (index: number) => {
  emits('deleteParams', index)
}
function handleAddDynamicParams() {
  emits('addDynamicParams', arguments)
}
const handleDeleteDynamicParams = (index: number) => {
  emits('deleteDynamicParams', index)
}
</script>

<template>
  <v-col cols="12">
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
        <v-select
          v-model="item.type"
          :rules="[baseFormRule]"
          :items="['number', 'string']"
          label="选择步骤"
          variant="underlined"
          style="min-width: 100px"
          @update:model-value="(value: any) => handleSelectType(value, index, useName)"
        ></v-select>
      </v-col>
      <v-col cols="auto">
        <v-text-field
          v-model="item.value"
          :rules="[baseFormRule]"
          label="参数值"
          variant="underlined"
          style="min-width: 200px"
        ></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn density="compact" icon="mdi-minus" @click="handleDeleteParams(index)"></v-btn>
      </v-col>
    </v-row>
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
        <v-btn density="compact" icon="mdi-minus" @click="handleDeleteDynamicParams(index)"></v-btn>
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

    <v-tooltip text="新增参数" location="top">
      <template #activator="{ props: tipProps }">
        <v-btn v-bind="tipProps" density="compact" icon="mdi-plus" @click="handleAddParams"></v-btn>
      </template>
    </v-tooltip>
  </v-col>
</template>
