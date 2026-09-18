<template>
  <div class="game-container" @keydown.esc="cancelPendingSkiLift" tabindex="0">
    <Transition name="tutorial-fade">
      <div v-if="showTutorial" class="tutorial-banner">
        <strong>Start here</strong>
        <span>Place the facilities your guests request, then use the road tools to connect new roads to the brown
          starting road.</span>
      </div>
    </Transition>
    <div v-if="pendingSkiLiftSource" class="action-banner">
      <span>🚡 Select a second location to complete the Ski Lift cable connection (or press ESC to cancel).</span>
    </div>
    <div class="game-board">
      <svg :viewBox="`0 0 ${GRID_WIDTH * TILE_SIZE} ${GRID_HEIGHT * TILE_SIZE}`" class="grid-canvas"
        @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @mousemove="onMouseMove"
        @mousedown="onBoardMouseDown" @mouseup="onBoardMouseUp" @mouseleave="onBoardMouseUp" @click="onBoardClick">
        <BoardDefs />
        <BoardTerrainLayer :grid-width="GRID_WIDTH" :grid-height="GRID_HEIGHT" :tile-size="TILE_SIZE"
          :river-path-d="riverPathD" :is-forest-tile="isForestTile" />
        <BoardInfrastructureLayer :road-segments="roadSegments" :roads="drawnRoads" :footpaths="footpaths"
          :ski-lift-cables="skiLiftCables" :pending-ski-lift-source="pendingSkiLiftSource" :hover-tile="hoverTile"
          :tile-size="TILE_SIZE" :get-road-path-d="getRoadPathD" @upgrade-path="upgradePath" />
        <BoardBuildingsLayer :buildings="buildings" :pending-ski-lift-source="pendingSkiLiftSource"
          :tile-size="TILE_SIZE" :get-hotel-guest-count="getHotelGuestCount"
          :get-facility-occupancy="getFacilityOccupancy" />
        <BoardVegetationLayer :trees="allPineTrees" />
        <BoardPreviewLayer :preview="activePreview" :tile-size="TILE_SIZE" />
        <BoardVisitorsLayer :visitors="store.activeVisitors" :luggage="store.luggage" :tile-size="TILE_SIZE"
          :get-travel-mode-icon="getTravelModeIcon" @clear-luggage="store.clearLuggage" />
      </svg>
      <div class="road-toolbar">
        <button :class="{ active: roadTool === 'dirt' }" @click="setRoadTool('dirt')">Dirt Road €10</button>
        <button :class="{ active: roadTool === 'paved' }" @click="setRoadTool('paved')">Paved Road €30</button>
        <button v-if="roadTool" @click="setRoadTool(null)">Exit Road Tool</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore.js'
import type { RoadType } from '../stores/gameTypes'
import BoardDefs from './board/BoardDefs.vue'
import BoardTerrainLayer from './board/BoardTerrainLayer.vue'
import BoardInfrastructureLayer from './board/BoardInfrastructureLayer.vue'
import BoardBuildingsLayer from './board/BoardBuildingsLayer.vue'
import BoardVegetationLayer from './board/BoardVegetationLayer.vue'
import BoardPreviewLayer from './board/BoardPreviewLayer.vue'
import BoardVisitorsLayer from './board/BoardVisitorsLayer.vue'

interface DraggedItem {
  type: string
  label: string
  icon: string
  color: string
  width: number
  height: number
  capacity: number
}

const props = defineProps<{ draggedItem: DraggedItem | null }>()
const emit = defineEmits(['facility-placed'])
const store = useGameStore()
const TILE_SIZE = 40
const GRID_WIDTH = 20
const GRID_HEIGHT = 14
let animationFrame
let lastAnimationTime
const showTutorial = ref(true)
let tutorialTimeout

function animateVisitors(timestamp) {
  if (lastAnimationTime === undefined) lastAnimationTime = timestamp
  const deltaSeconds = Math.min((timestamp - lastAnimationTime) / 1000, 0.1)
  lastAnimationTime = timestamp
  if (!store.isPaused && !store.isDrafting) store.moveVisitors(deltaSeconds)
  animationFrame = window.requestAnimationFrame(animateVisitors)
}

onMounted(() => {
  animationFrame = window.requestAnimationFrame(animateVisitors)
  tutorialTimeout = window.setTimeout(() => { showTutorial.value = false }, 10000)
  window.addEventListener('mouseup', onBoardMouseUp)
})

onUnmounted(() => {
  window.cancelAnimationFrame(animationFrame)
  window.clearTimeout(tutorialTimeout)
  window.removeEventListener('mouseup', onBoardMouseUp)
})

const inventoryTypes = [
  { type: 'ski_lift', label: 'Ski Lift', icon: '🚡', color: '#E63946', width: 1, height: 1 },
  { type: 'bus_stop', label: 'Bus Stop', icon: '🚌', color: '#FFB703', width: 1, height: 1 },
  { type: 'train_station', label: 'Train Station', icon: '🚉', color: '#1D3557', width: 2, height: 1 }
]
const mountainPineCoords = [
  { cx: 700, cy: 70, scale: 0.45 }, { cx: 730, cy: 110, scale: 0.5 }, { cx: 685, cy: 160, scale: 0.4 }, { cx: 715, cy: 200, scale: 0.55 }, { cx: 675, cy: 250, scale: 0.45 }, { cx: 705, cy: 290, scale: 0.6 }, { cx: 665, cy: 350, scale: 0.5 }, { cx: 695, cy: 390, scale: 0.65 }, { cx: 650, cy: 440, scale: 0.55 }, { cx: 680, cy: 490, scale: 0.7 }, { cx: 660, cy: 530, scale: 0.65 }
]
const roadSegments = ref([
  [{ x: 0, y: 3 }, { x: 3, y: 6 }, { x: 8, y: 6 }, { x: 13, y: 11 }, { x: 15, y: 11 }],
  [{ x: 8, y: 6 }, { x: 8, y: 3 }, { x: 6, y: 1 }]
])
const pineForestZones = [
  { minX: 1, maxX: 5, minY: 0, maxY: 2 }, { minX: 9, maxX: 14, minY: 0, maxY: 3 }, { minX: 1, maxX: 5, minY: 8, maxY: 12 }, { minX: 8, maxX: 14, minY: 12, maxY: 13 }
]
const buildings = ref([])
const skiLiftCables = ref([])
const pendingSkiLiftSource = ref(null)
const isDraggingOver = ref(false)
const hoverTile = ref({ x: 0, y: 0 })
const footpaths = computed(() => store.infrastructurePaths)
const drawnRoads = computed(() => Array.from(store.roads.values()))
const roadTool = ref<RoadType | null>(null)
const isDrawingRoad = ref(false)

function updateHoverTile(event) {
  const svgRect = event.currentTarget.getBoundingClientRect()
  if (!svgRect.width || !svgRect.height) return
  const scaleX = (GRID_WIDTH * TILE_SIZE) / svgRect.width
  const scaleY = (GRID_HEIGHT * TILE_SIZE) / svgRect.height
  const mouseX = (event.clientX - svgRect.left) * scaleX
  const mouseY = (event.clientY - svgRect.top) * scaleY
  hoverTile.value = { x: Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(mouseX / TILE_SIZE))), y: Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(mouseY / TILE_SIZE))) }
}
function onDragOver(event) {
  isDraggingOver.value = true;
  updateHoverTile(event)
}
function onDragLeave() {
  isDraggingOver.value = false
}
function onMouseMove(event) {
  if (pendingSkiLiftSource.value || roadTool.value) updateHoverTile(event)
  if (isDrawingRoad.value && roadTool.value) {
    store.placeRoad(hoverTile.value.x, hoverTile.value.y, roadTool.value)
  }
}
function onBoardMouseDown(event) {
  if (!roadTool.value || event.button !== 0) return

  // Prevent native browser dragging behavior (which breaks mousemove)
  event.preventDefault()

  updateHoverTile(event)
  isDrawingRoad.value = true
  store.placeRoad(hoverTile.value.x, hoverTile.value.y, roadTool.value)
}
function onBoardMouseUp() {
  isDrawingRoad.value = false
}
function setRoadTool(tool: RoadType | null) {
  roadTool.value = tool;
  isDrawingRoad.value = false
}
function getTravelModeIcon(mode) {
  switch (mode) {
    case 'car': return '🚗';
    case 'bus': return '🚌';
    case 'train': return '🚆';
    case 'cable_car': return '🚡';
    case 'walking': return '🚶';
    default: return '🚶'
  }
}
const activePreview = computed(() => {
  if (isDraggingOver.value && props.draggedItem) {
    const item = props.draggedItem
    return { x: hoverTile.value.x, y: hoverTile.value.y, w: item.width, h: item.height, icon: item.icon, valid: isValidPlacement(item.type, hoverTile.value.x, hoverTile.value.y, item.width, item.height) }
  }
  if (pendingSkiLiftSource.value) return { x: hoverTile.value.x, y: hoverTile.value.y, w: 1, h: 1, icon: '🚡', valid: isValidPlacement('ski_lift', hoverTile.value.x, hoverTile.value.y, 1, 1) }
  return null
})
function isValidPlacement(itemType, tileX, tileY, w = 1, h = 1) {
  if (tileX < 0 || tileY < 0 || tileX + w > GRID_WIDTH || tileY + h > GRID_HEIGHT) return false
  if (buildings.value.some((building) => tileX < building.x + (building.w || 1) && tileX + w > building.x && tileY < building.y + (building.h || 1) && tileY + h > building.y)) return false
  if (itemType === 'bus_stop' && !isAdjacentToRoad(tileX, tileY, w, h)) return false
  if (itemType === 'ski_lift' && pendingSkiLiftSource.value && pendingSkiLiftSource.value.x === tileX && pendingSkiLiftSource.value.y === tileY) return false
  return true
}
function isAdjacentToRoad(x, y, w, h) {
  const roadTiles = getOccupiedRoadTiles()
  for (let px = x; px < x + w; px++) for (let py = y; py < y + h; py++) if (roadTiles.some((tile) => Math.abs(tile.x - px) <= 1 && Math.abs(tile.y - py) <= 1)) return true
  return false
}
function getOccupiedRoadTiles() {
  const tiles = []
  roadSegments.value.forEach((segment) => segment.forEach((point, index) => {
    const next = segment[index + 1]
    if (!next) return
    const steps = Math.max(Math.abs(next.x - point.x), Math.abs(next.y - point.y)) * 4
    for (let step = 0; step <= steps; step++) {
      const x = Math.round(point.x + (next.x - point.x) * (step / (steps || 1)))
      const y = Math.round(point.y + (next.y - point.y) * (step / (steps || 1)))
      if (!tiles.some((tile) => tile.x === x && tile.y === y)) tiles.push({ x, y })
    }
  }))
  return tiles
}
function onDrop(event) {
  const itemType = event.dataTransfer?.getData('text/plain')
  const itemConfig = props.draggedItem?.type === itemType ? props.draggedItem : inventoryTypes.find((item) => item.type === itemType)
  if (!itemConfig) return
  updateHoverTile(event)
  const { x, y } = hoverTile.value
  if (!isValidPlacement(itemType, x, y, itemConfig.width, itemConfig.height)) return
  const newBuilding = { id: `${itemConfig.type}-${Date.now()}`, type: itemConfig.type, color: itemConfig.color, icon: itemConfig.icon, x, y, w: itemConfig.width, h: itemConfig.height }
  if (!store.placeFacility({ type: itemConfig.type, label: itemConfig.label, icon: itemConfig.icon, x, y, capacity: itemConfig.capacity, width: itemConfig.width, height: itemConfig.height })) return
  buildings.value.push(newBuilding)
  if (itemType === 'ski_lift') pendingSkiLiftSource.value = newBuilding
  emit('facility-placed', itemConfig)
  isDraggingOver.value = false
}
function onBoardClick(event) {
  if (!pendingSkiLiftSource.value) return
  updateHoverTile(event)
  const { x, y } = hoverTile.value
  if (!isValidPlacement('ski_lift', x, y, 1, 1)) return
  const itemConfig = inventoryTypes.find((item) => item.type === 'ski_lift')
  const secondStation = { id: `ski_lift-${Date.now()}`, color: itemConfig.color, icon: itemConfig.icon, x, y, w: 1, h: 1 }
  buildings.value.push(secondStation)
  skiLiftCables.value.push({ x1: pendingSkiLiftSource.value.x, y1: pendingSkiLiftSource.value.y, x2: x, y2: y })
  pendingSkiLiftSource.value = null
}
function cancelPendingSkiLift() { pendingSkiLiftSource.value = null }
function upgradePath(pathId) { store.upgradeInfrastructurePath(pathId) }
const riverPathD = computed(() => {
  const S = TILE_SIZE
  return `M 0,${S} L ${4 * S},${5 * S} L ${7 * S},${5 * S} L ${12 * S},${10 * S} L ${15 * S},${10 * S} L ${15 * S},${11.5 * S} L ${11.5 * S},${11.5 * S} L ${6.5 * S},${6.5 * S} L ${3.5 * S},${6.5 * S} L 0,${2 * S} Z`
})
function isForestTile(x, y) { return pineForestZones.some((zone) => x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY) }
function isBuildingOnTile(x, y) { return buildings.value.some((building) => x >= building.x && x < building.x + (building.w || 1) && y >= building.y && y < building.y + (building.h || 1)) }
function getHotelGuestCount(building) { return store.facilities.find((facility) => facility.type === 'hotel' && facility.x === building.x && facility.y === building.y)?.currentOccupancy || 0 }
function getFacilityOccupancy(building) {
  const facility = store.facilities.find((item) => item.type === building.type && item.x === building.x && item.y === building.y)
  if (!facility) return null
  return { current: facility.currentOccupancy, capacity: facility.capacity, ratio: facility.capacity ? facility.currentOccupancy / facility.capacity : 0 }
}
function isNearRiver(cx, cy) {
  const S = TILE_SIZE
  if (cx < 5 * S && cy < 6 * S && Math.abs(cy - (cx + S)) < 25) return true
  if (cx >= 4 * S && cx <= 7 * S && cy >= 4.5 * S && cy <= 7 * S) return true
  if (cx > 6 * S && cy > 5 * S && Math.abs(cy - (cx - S)) < 30) return true
  return false
}
function seededRandom(seed) { const value = Math.sin(seed) * 10000; return value - Math.floor(value) }
const allPineTrees = computed(() => {
  const trees = []
  let seed = 120
  pineForestZones.forEach((zone) => {
    for (let x = zone.minX; x <= zone.maxX; x++) for (let y = zone.minY; y <= zone.maxY; y++) {
      if (isBuildingOnTile(x, y)) continue
        ;[{ sx: 10, sy: 12 }, { sx: 30, sy: 12 }, { sx: 10, sy: 32 }, { sx: 30, sy: 32 }].forEach((slot) => {
          const jitterX = (seededRandom(seed++) - 0.5) * 6
          const jitterY = (seededRandom(seed++) - 0.5) * 6
          const cx = x * TILE_SIZE + slot.sx + jitterX
          const cy = y * TILE_SIZE + slot.sy + jitterY
          const scale = 0.85 + seededRandom(seed++) * 0.45
          if (!isNearRiver(cx, cy)) trees.push({ cx, cy, scale: Number(scale.toFixed(2)), animDelay: Number((seededRandom(seed++) * 3).toFixed(2)) })
        })
    }
  })
  mountainPineCoords.forEach((tree) => trees.push({ ...tree, animDelay: Number((seededRandom(seed++) * 3).toFixed(2)) }))
  return trees.sort((a, b) => a.cy - b.cy)
})
function getRoadPathD(points) { return points.reduce((path, point, index) => `${path}${index === 0 ? 'M' : ' L'} ${point.x * TILE_SIZE + TILE_SIZE / 2} ${point.y * TILE_SIZE + TILE_SIZE / 2}`, '') }
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
  outline: none;
}

.tutorial-banner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid #38bdf8;
  border-radius: 8px;
  background: #0c4a6e;
  color: #e0f2fe;
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 4px 12px rgba(12, 74, 110, 0.25);
}

.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.action-banner {
  background-color: #1D3557;
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 4px 12px rgba(29, 53, 87, 0.15);
}

.game-board {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  background-color: #EFF1E8;
}

.grid-canvas {
  width: 100%;
  height: auto;
  display: block;
}

/* Disable pointer events on nested background graphics to keep mouse drag smooth */
.grid-canvas :deep(g) {
  pointer-events: none;
}

/* Re-enable interaction for elements that need click actions */
.grid-canvas :deep(.upgradeable-path) {
  pointer-events: visiblePainted;
}

.road-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #1e293b;
}

.road-toolbar button {
  border: 1px solid #475569;
  border-radius: 5px;
  padding: 6px 9px;
  background: #334155;
  color: #f8fafc;
  cursor: pointer;
}

.road-toolbar button.active {
  background: #0284c7;
  border-color: #38bdf8;
}

.pulse-highlight {
  animation: pulseStation 1.2s infinite alternate ease-in-out;
}

@keyframes pulseStation {
  0% {
    opacity: 0.6;
    stroke: #E63946;
    stroke-width: 2px;
  }

  100% {
    opacity: 1;
    stroke: #FFFFFF;
    stroke-width: 3px;
  }
}

.sway-mid-tier {
  animation: swayAngledMid 2.4s ease-in-out infinite alternate;
}

.sway-top-tier {
  animation: swayAngledTop 2.4s ease-in-out infinite alternate;
}

@keyframes swayAngledMid {
  0% {
    transform: rotate(-3deg) skewX(-2deg);
  }

  100% {
    transform: rotate(3deg) skewX(2deg);
  }
}

@keyframes swayAngledTop {
  0% {
    transform: rotate(-7deg) skewX(-4deg);
  }

  100% {
    transform: rotate(7deg) skewX(4deg);
  }
}
</style>
