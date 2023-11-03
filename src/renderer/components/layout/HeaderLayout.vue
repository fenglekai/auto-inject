<script setup lang="ts">
const windowMax = () => {
  window.mainApi.send('windowMax')
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
          <v-icon>mdi-window-maximize</v-icon>
          <!-- <v-icon>mdi-window-restore</v-icon> -->
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
