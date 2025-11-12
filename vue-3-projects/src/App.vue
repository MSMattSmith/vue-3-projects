<script setup lang="ts">
import { ref } from 'vue';
import IngredientsList from '@/components/IngredientsList.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorMessage from '@/components/ErrorMessage.vue';
import { extractIngredientsFromUrl } from '@/services/geminiService';
import ChefHatIcon from '@/components/ChefHatIcon.vue';
import URLInputForm from '@/components/URLInputForm.vue';
import type { Ingredient } from '@/types';

const url = ref<string>('');
const ingredients = ref<Ingredient[] | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

const handleExtract = async (newUrl: string) => {
  if (!newUrl) return;

  isLoading.value = true;
  ingredients.value = null;
  error.value = null;
  url.value = newUrl;

  try {
    const extractedIngredients = await extractIngredientsFromUrl(newUrl);
    ingredients.value = extractedIngredients;
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'An unknown error occurred.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
    <div class="w-full max-w-2xl mx-auto">
      <header class="text-center mb-8">
        <div class="flex items-center justify-center gap-4 mb-4">
          <ChefHatIcon class="w-12 h-12 text-teal-400" />
          <h1 class="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-500 text-transparent bg-clip-text">
            Recipe AI
          </h1>
        </div>
        <p class="text-lg text-gray-400">
          Paste a recipe URL to instantly extract the ingredients.
        </p>
      </header>

      <main>
        <URLInputForm :is-loading="isLoading" @submit="handleExtract" />
        
        <div class="mt-8">
          <LoadingSpinner v-if="isLoading" />
          <ErrorMessage v-if="error" :message="error" />
          <IngredientsList v-if="ingredients && ingredients.length > 0" :ingredients="ingredients" />
          <div v-if="ingredients && ingredients.length === 0 && !isLoading" class="text-center py-10 px-4 bg-gray-800 rounded-lg">
            <p class="text-gray-400">No ingredients were found for this recipe.</p>
          </div>
        </div>
      </main>
    </div>
    <footer class="w-full max-w-2xl mx-auto mt-12 text-center text-gray-500 text-sm">
      <p>Powered by Gemini API</p>
    </footer>
  </div>
</template>
