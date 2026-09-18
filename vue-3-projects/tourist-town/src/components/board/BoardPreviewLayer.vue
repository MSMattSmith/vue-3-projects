<template>
  <g v-if="preview" class="pending-preview" style="pointer-events: none;">
    <rect :x="preview.x * tileSize + 4" :y="preview.y * tileSize + 4"
      :width="preview.w * tileSize - 8" :height="preview.h * tileSize - 8"
      :fill="preview.valid ? 'rgba(46, 196, 182, 0.35)' : 'rgba(230, 57, 70, 0.35)'"
      :stroke="preview.valid ? '#2EC4B6' : '#E63946'" stroke-width="2" stroke-dasharray="4,4" rx="8" />
    <text v-if="preview.icon" :x="preview.x * tileSize + (preview.w * tileSize) / 2"
      :y="preview.y * tileSize + (preview.h * tileSize) / 2 + 5" text-anchor="middle" font-size="16" opacity="0.8">{{ preview.icon }}</text>
    <g v-if="!preview.valid" :transform="`translate(${preview.x * tileSize + preview.w * tileSize - 12}, ${preview.y * tileSize + 4})`">
      <circle cx="6" cy="6" r="10" fill="#E63946" />
      <path d="M 2,2 L 10,10 M 10,2 L 2,10" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
    </g>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
defineProps({ preview: { type: Object, default: null }, tileSize: { type: Number, required: true } })
</script>
