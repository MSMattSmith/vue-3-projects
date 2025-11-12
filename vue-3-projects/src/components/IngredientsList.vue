<script setup lang="ts">
import type { Ingredient } from '../types';

defineProps<{
  ingredients: Ingredient[];
}>();
</script>

<template>
  <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-xl backdrop-blur-sm">
    <h2 class="text-2xl font-bold mb-6 text-teal-400">Ingredients</h2>
    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <li 
        v-for="(ingredient, index) in ingredients" 
        :key="index" 
        class="bg-gray-800 p-4 rounded-md border border-gray-700 transition-all duration-300 hover:border-teal-500 hover:shadow-teal-500/10 hover:shadow-lg transform hover:-translate-y-1"
      >
        <p class="font-semibold text-lg text-white">{{ ingredient.name }}</p>
        <p class="text-gray-400">{{ ingredient.quantity }}</p>
      </li>
    </ul>
  </div>
</template>
