<script setup lang="ts">
import AlertTriangleIcon from './AlertTriangleIcon.vue';

defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-center gap-3" role="alert">
    <AlertTriangleIcon class="w-6 h-6 text-red-400" />
    <div>
      <strong class="font-bold">Error: </strong>
      <span class="block sm:inline">{{ message }}</span>
    </div>
  </div>
</template>
