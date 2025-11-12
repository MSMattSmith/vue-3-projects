<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col sm:flex-row items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm">
    <input
      type="url"
      v-model="url"
      placeholder="https://example.com/your-favorite-recipe"
      required
      :disabled="isLoading"
      class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition duration-200 disabled:opacity-50"
    />
    <button
      type="submit"
      :disabled="isLoading"
      class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
    >
      <MagicWandIcon class="w-5 h-5" />
      <span>{{ isLoading ? 'Extracting...' : 'Get Ingredients' }}</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MagicWandIcon from './MagicWandIcon.vue';

defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', url: string): void
}>();

const url = ref('');

const handleSubmit = () => {
  if (url.value) {
    emit('submit', url.value);
  }
};
</script>
