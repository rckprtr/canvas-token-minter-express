<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ToastProps {
  message: string
  duration?: number
  type?: 'info' | 'warning' | 'error' | 'success'
}

const props = withDefaults(defineProps<{
  toast: ToastProps
}>(), {
  toast: () => ({
    message: '',
    duration: 10_000,
    type: 'info'
  })
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isVisible = ref(false)

const show = () => {
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
  emit('close')
}

onMounted(() => {
  show()
  setTimeout(hide, props.toast.duration)
})

onUnmounted(() => {
  hide()
})

const toastClasses = computed(() => {
  const baseClasses = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md text-black text-base z-50 transition-opacity duration-300'
  const typeClasses = {
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  }
  return `${baseClasses} ${typeClasses[props.toast.type]}`
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isVisible" :class="toastClasses">
      {{ toast.message }}
    </div>
  </Transition>
</template>