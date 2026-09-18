<template>
  <g>
    <g class="drawn-roads">
      <line v-for="connection in roadConnections" :key="connection.id" :x1="connection.x1" :y1="connection.y1"
        :x2="connection.x2" :y2="connection.y2" :stroke="connection.type === 'paved' ? '#475569' : '#B45309'"
        stroke-width="12" stroke-linecap="round"/>
      <line v-for="road in isolatedRoads" :key="`road-stub-${road.x}-${road.y}`"
        :x1="road.x * tileSize + tileSize / 2 - 9" :y1="road.y * tileSize + tileSize / 2"
        :x2="road.x * tileSize + tileSize / 2 + 9" :y2="road.y * tileSize + tileSize / 2"
        :stroke="road.type === 'paved' ? '#475569' : '#B45309'" stroke-width="12" stroke-linecap="round"
        />
      <g v-for="road in visibleRoads" :key="`road-tile-${road.x}-${road.y}`">
        <circle v-if="road.currentOccupants > 3" :cx="road.x * tileSize + tileSize / 2"
          :cy="road.y * tileSize + tileSize / 2" r="12" fill="none" stroke="#EF4444" stroke-width="3"
          stroke-dasharray="4 3" />
        <text v-if="road.currentOccupants > 3" :x="road.x * tileSize + tileSize - 7" :y="road.y * tileSize + 12"
          text-anchor="middle" font-size="10">⚠️</text>
      </g>
    </g>
    <g class="roads" stroke="#B45309" stroke-linecap="round" stroke-linejoin="round">
      <path v-for="(road, index) in roadSegments" :key="`road-${index}`" :d="getRoadPathD(road)" stroke-width="12"
        fill="none" />
    </g>
    <g class="footpaths" stroke-linecap="round">
      <path v-for="path in footpaths" :key="path.id" :d="getRoadPathD([path.from, path.to])"
        :stroke="path.upgraded ? '#FFFFFF' : '#B7791F'" :stroke-width="path.upgraded ? 8 : 3"
        :stroke-dasharray="path.upgraded ? undefined : '5 4'" fill="none"
        :class="{ 'upgradeable-path': !path.upgraded }" @click.stop="$emit('upgrade-path', path.id)">
        <title>{{ path.upgraded ? 'Road' : 'Click to upgrade to road' }}</title>
      </path>
    </g>
    <g class="ski-lift-cables">
      <line v-for="(cable, index) in skiLiftCables" :key="`cable-${index}`" :x1="cable.x1 * tileSize + tileSize / 2"
        :y1="cable.y1 * tileSize + tileSize / 2" :x2="cable.x2 * tileSize + tileSize / 2"
        :y2="cable.y2 * tileSize + tileSize / 2" stroke="#1D3557" stroke-width="3" stroke-dasharray="6,4" />
      <line v-if="pendingSkiLiftSource" :x1="pendingSkiLiftSource.x * tileSize + tileSize / 2"
        :y1="pendingSkiLiftSource.y * tileSize + tileSize / 2" :x2="hoverTile.x * tileSize + tileSize / 2"
        :y2="hoverTile.y * tileSize + tileSize / 2" stroke="#E63946" stroke-width="3" stroke-dasharray="4,4" />
    </g>
  </g>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { computed } from 'vue'

const props = defineProps({
  roadSegments: { type: Array, required: true },
  roads: { type: Array, required: true },
  footpaths: { type: Array, required: true },
  skiLiftCables: { type: Array, required: true },
  pendingSkiLiftSource: { type: Object, default: null },
  hoverTile: { type: Object, required: true },
  tileSize: { type: Number, required: true },
  getRoadPathD: { type: Function, required: true }
})

defineEmits(['upgrade-path'])

// FIX: Helper to unwrap key-value objects like { "14,5": { x: 14, y: 5 } }
const normalizedRoads = computed(() => {
  if (!Array.isArray(props.roads)) return []
  return props.roads.map((item) => {
    if (!item) return null
    // If already direct RoadTile object with .x property
    if (item.x !== undefined) return item
    // If wrapped in dynamic coordinate key { "14,5": RoadTile }
    const values = Object.values(item)
    return values.length > 0 ? values[0] : null
  }).filter(Boolean)
})

const visibleRoads = computed(() => normalizedRoads.value.filter((road) => !road.base))

const isolatedRoads = computed(() => visibleRoads.value.filter((road) => {
  return !normalizedRoads.value.some((neighbor) =>
    Math.abs(neighbor.x - road.x) + Math.abs(neighbor.y - road.y) === 1
  )
}))

const roadConnections = computed(() => {
  const roadsList = normalizedRoads.value
  const visRoads = visibleRoads.value
  const roadKeys = new Set(roadsList.map((road) => `${road.x},${road.y}`))
  const connections = []
  const connectionKeys = new Set()

  visRoads.forEach((road) => {
    for (const direction of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]) {
      const neighborX = road.x + direction.x
      const neighborY = road.y + direction.y
      if (!roadKeys.has(`${neighborX},${neighborY}`)) continue
      const neighbor = roadsList.find((item) => item.x === neighborX && item.y === neighborY)
      if (!neighbor) continue
      const connectionKey = [`${road.x},${road.y}`, `${neighbor.x},${neighbor.y}`].sort().join('-')
      if (connectionKeys.has(connectionKey)) continue
      connectionKeys.add(connectionKey)
      connections.push({
        id: `${road.x},${road.y}-${neighbor.x},${neighbor.y}`,
        x1: road.x * props.tileSize + props.tileSize / 2,
        y1: road.y * props.tileSize + props.tileSize / 2,
        x2: neighbor.x * props.tileSize + props.tileSize / 2,
        y2: neighbor.y * props.tileSize + props.tileSize / 2,
        type: road.type
      })
    }
  })
  return connections
})
</script>
