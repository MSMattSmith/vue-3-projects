<template>
  <g class="destinations">
    <g v-for="building in buildings" :key="`building-${building.id}`">
      <rect :x="building.x * tileSize + 4" :y="building.y * tileSize + 4"
        :width="(building.w || 1) * tileSize - 8" :height="(building.h || 1) * tileSize - 8"
        :fill="building.color" :class="{ 'pulse-highlight': pendingSkiLiftSource && pendingSkiLiftSource.id === building.id }" rx="8" />
      <text v-if="building.icon" :x="building.x * tileSize + ((building.w || 1) * tileSize) / 2"
        :y="building.y * tileSize + ((building.h || 1) * tileSize) / 2 + 5" text-anchor="middle" font-size="16">{{ building.icon }}</text>
      <template v-if="building.type === 'hotel'">
        <circle :cx="building.x * tileSize + (building.w || 1) * tileSize - 10" :cy="building.y * tileSize + 10" r="10" fill="#1D3557" stroke="#FFFFFF" stroke-width="1.5" />
        <text :x="building.x * tileSize + (building.w || 1) * tileSize - 10" :y="building.y * tileSize + 14" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">{{ getHotelGuestCount(building) }}</text>
      </template>
      <g v-if="getFacilityOccupancy(building)" class="occupancy-dots">
        <circle v-for="dot in getOccupancyDots(building)" :key="dot.id" :cx="dot.x" :cy="dot.y" r="3.2"
          :fill="dot.active ? dot.color : '#FFFFFF'" :opacity="dot.active ? 1 : 0.3"
          :stroke="dot.active ? '#1F2937' : '#64748B'" stroke-width="1">
          <title>{{ dot.active ? 'Occupied' : 'Available' }}</title>
        </circle>
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const props = defineProps({
  buildings: { type: Array, required: true },
  pendingSkiLiftSource: { type: Object, default: null },
  tileSize: { type: Number, required: true },
  getHotelGuestCount: { type: Function, required: true },
  getFacilityOccupancy: { type: Function, required: true }
})

function getOccupancyDots(building) {
  const stats = props.getFacilityOccupancy(building)
  if (!stats) return []
  const width = (building.w || 1) * props.tileSize
  const columns = Math.max(2, Math.min(6, Math.ceil(Math.sqrt(stats.capacity))))
  const color = stats.ratio >= 0.8 ? '#EF4444' : stats.ratio >= 0.5 ? '#F59E0B' : '#22C55E'
  return Array.from({ length: stats.capacity }, (_, index) => ({
    id: index,
    x: building.x * props.tileSize + 10 + (index % columns) * Math.max(7, (width - 20) / columns),
    y: building.y * props.tileSize + (building.h || 1) * props.tileSize - 8 - Math.floor(index / columns) * 7,
    active: index < stats.current,
    color
  }))
}
</script>
