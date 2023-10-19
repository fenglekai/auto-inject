<script lang="tsx" setup>
import { useTheme } from 'vuetify'

const theme = useTheme()
const handleChangeTheme = (): void => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const drawer = ref()
const rail = ref(false)

const router = useRouter()
const handleRoute = (path: string): void => {
  router.push(path)
}

const dialog = ref(false)
</script>

<template>
  <v-navigation-drawer v-model="drawer" expand-on-hover rail permanent @click="rail = false">
    <v-list-item title="Auto Inject" nav>
      <template #prepend>
        <v-icon icon="mdi-home-city" class="ma-2" color="light-blue" />
      </template>
    </v-list-item>
    <div class="pa-2">
      <v-btn block color="green-accent-3" class="mb-2" @click="dialog = true">
        <v-icon icon="mdi-spider-thread" />
        <v-tooltip activator="parent" location="bottom"> 日志监控 </v-tooltip>
      </v-btn>
      <v-btn block color="primary" @click="handleChangeTheme">
        <v-icon icon="mdi-brightness-6" />
        <v-tooltip activator="parent" location="bottom">
          {{ $t('menu.change-theme') }}
        </v-tooltip>
      </v-btn>
    </div>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-application"
        title="主页"
        @click="handleRoute('/')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-access-point"
        title="ModbusTCP测试"
        @click="handleRoute('/second')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-table-plus"
        title="创建任务流程"
        @click="handleRoute('/task')"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-dialog v-model="dialog" width="auto">
    <WatchLog />
  </v-dialog>
</template>

<style lang="scss" scoped></style>
