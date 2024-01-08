<script setup lang="ts">
const windowMaxSize = ref(false)
const windowMax = () => {
  window.mainApi.send('windowMax')
  windowMaxSize.value = !windowMaxSize.value
}
const windowMin = () => {
  window.mainApi.send('windowMin')
}
const windowClose = () => {
  window.mainApi.send('windowClose')
}
</script>
<template>
  <v-app-bar color="primary" density="compact">
    <v-app-bar-title style="-webkit-app-region: drag">Auto Inject</v-app-bar-title>
    <template #append>
      <v-btn icon @click="windowMin">
        <v-icon>mdi-window-minimize</v-icon>
      </v-btn>
      <v-btn icon @click="windowMax">
        <v-icon v-if="!windowMaxSize">mdi-window-maximize</v-icon>
        <v-icon v-else>mdi-window-restore</v-icon>
      </v-btn>
      <v-btn icon @click="windowClose">
        <v-icon>mdi-window-close</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>
<style scoped>
.active {
  opacity: 1 !important;
}
</style>
