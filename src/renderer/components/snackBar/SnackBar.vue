<script setup lang="ts">
const props = defineProps({
  message: {
    type: String,
    default() {
      return ''
    }
  },
  show: {
    type: Boolean,
    default() {
      return true
    }
  },
  onClose: {
    type: Function,
    default() {
      return () => {}
    }
  }
})
const snackbar = ref(props.show)
watch(snackbar, (curVal) => {
  if (!curVal) {
    props.onClose()
  }
})
const handleClose = () => {
  snackbar.value = false
}
</script>
<template>
  <v-snackbar v-model="snackbar">
    {{ props.message }}
    <template #actions>
      <v-btn color="pink" variant="text" @click="handleClose"> Close </v-btn>
    </template>
  </v-snackbar>
</template>
