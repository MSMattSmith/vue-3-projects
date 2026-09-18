<template>
  <g class="visitor-layer">
    <g v-for="obstacle in luggage" :key="`luggage-${obstacle.id}`" class="luggage-obstacle" @click.stop="$emit('clear-luggage', obstacle.id)">
      <rect :x="obstacle.x * tileSize + 7" :y="obstacle.y * tileSize + 7" :width="tileSize - 14" :height="tileSize - 14" rx="5" fill="#92400e" stroke="#fbbf24" stroke-width="2" />
      <text :x="obstacle.x * tileSize + tileSize / 2" :y="obstacle.y * tileSize + tileSize / 2 + 5" text-anchor="middle" font-size="14">🧳</text>
      <title>Click to clear luggage for €30</title>
    </g>
    <template v-for="positioned in positionedVisitors" :key="`visitor-${positioned.visitor.id}`">
      <g v-if="isInTransit(positioned.visitor)"
        :transform="`translate(${positioned.x}, ${positioned.y})`" class="visitor-sprite">
      <g class="visitor-status" :class="positioned.visitor.satisfactionState">
        <rect x="-18" y="-31" width="36" height="5" rx="2" fill="#374151" />
        <rect x="-18" y="-31" :width="36 * Math.max(0, positioned.visitor.satisfaction) / 100" height="5" rx="2" :fill="getSatisfactionColor(positioned.visitor.satisfactionState)" />
        <text v-if="positioned.visitor.satisfaction < 40" x="0" y="-36" text-anchor="middle" font-size="10">{{ positioned.visitor.satisfaction < 15 ? `💣 ${positioned.visitor.patienceCountdown}s` : getStatusIcon(positioned.visitor) }}</text>
        <text v-else-if="positioned.visitor.satisfaction < 75" x="0" y="-36" text-anchor="middle" font-size="10">{{ getStatusIcon(positioned.visitor) }}</text>
      </g>
      <circle cx="0" cy="0" r="10" fill="#FFFFFF" :stroke="getSatisfactionColor(positioned.visitor.satisfactionState)" :stroke-width="positioned.visitor.satisfactionState === 'furious' ? 3 : 2" />
      <text v-if="isInTransit(positioned.visitor)" x="0" y="4" text-anchor="middle" font-size="12">{{ getTravelModeIcon(positioned.visitor.travelMode) }}</text>
      <text v-if="positioned.visitor.satisfactionState === 'furious'" x="-19" y="4" font-size="10">💨</text>
      </g>
    </template>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { computed } from 'vue'

const props = defineProps({
  visitors: { type: Array, required: true },
  luggage: { type: Array, required: true },
  tileSize: { type: Number, required: true },
  getTravelModeIcon: { type: Function, required: true }
})

defineEmits(['clear-luggage'])

const positionedVisitors = computed(() => {
  const positions = props.visitors.map((visitor) => ({
    visitor,
    x: visitor.x * props.tileSize + props.tileSize / 2,
    y: visitor.y * props.tileSize + props.tileSize / 2
  }))

  for (let pass = 0; pass < 10; pass++) {
    for (let firstIndex = 0; firstIndex < positions.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < positions.length; secondIndex++) {
        const first = positions[firstIndex]
        const second = positions[secondIndex]
        const dx = second.x - first.x
        const dy = second.y - first.y
        const distance = Math.hypot(dx, dy)
        if (distance >= 22) continue
        const angle = distance === 0 ? ((first.visitor.id % 8) * Math.PI) / 4 : Math.atan2(dy, dx)
        const push = (22 - distance) / 2
        first.x -= Math.cos(angle) * push
        first.y -= Math.sin(angle) * push
        second.x += Math.cos(angle) * push
        second.y += Math.sin(angle) * push
      }
    }
  }

  return positions.map((position) => ({
    ...position,
    x: Math.max(12, Math.min(788, position.x)),
    y: Math.max(12, Math.min(548, position.y))
  }))
})

function getSatisfactionColor(state) {
  if (state === 'furious') return '#ef4444'
  if (state === 'frustrated') return '#f59e0b'
  return '#22c55e'
}

function getStatusIcon(visitor) {
  if (visitor.isStuck) return '⚠️'
  return visitor.currentTaskIndex === 0 ? '🗯️ 🏨?' : '⏳'
}

function isInTransit(visitor) {
  return Boolean(visitor.route?.length && visitor.routeIndex < visitor.route.length)
}
</script>
