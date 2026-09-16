<template>
    <div class="game-container" @keydown.esc="cancelPendingSkiLift" tabindex="0">
        <!-- Active Mode Notification Banner -->
        <div v-if="pendingSkiLiftSource" class="action-banner">
            <span>🚡 Select a second location to complete the Ski Lift cable connection (or press ESC to cancel).</span>
        </div>

        <div class="game-board">
            <svg :viewBox="`0 0 ${GRID_WIDTH * TILE_SIZE} ${GRID_HEIGHT * TILE_SIZE}`" class="grid-canvas"
                @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @mousemove="onMouseMove"
                @click="onBoardClick">
                <defs>
                    <filter id="tile-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.08" />
                    </filter>

                    <linearGradient id="mnt-slope-light" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#D5DAE3" />
                        <stop offset="45%" stop-color="#A6ADC0" />
                        <stop offset="100%" stop-color="#7B8394" />
                    </linearGradient>

                    <linearGradient id="mnt-slope-dark" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#555C6B" />
                        <stop offset="60%" stop-color="#3A3F4B" />
                        <stop offset="100%" stop-color="#242831" />
                    </linearGradient>

                    <linearGradient id="snow-crest-grad" x1="0" y1="0" x2="1" y2="0.5">
                        <stop offset="0%" stop-color="#FFFFFF" />
                        <stop offset="80%" stop-color="#E2E8F0" />
                        <stop offset="100%" stop-color="#CBD5E1" />
                    </linearGradient>

                    <linearGradient id="tier-base-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#2F663B" />
                        <stop offset="60%" stop-color="#1F4728" />
                        <stop offset="100%" stop-color="#122E19" />
                    </linearGradient>

                    <linearGradient id="tier-mid-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#478E56" />
                        <stop offset="65%" stop-color="#2C6138" />
                        <stop offset="100%" stop-color="#1B3E23" />
                    </linearGradient>

                    <linearGradient id="tier-top-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#7AC98B" />
                        <stop offset="50%" stop-color="#478E56" />
                        <stop offset="100%" stop-color="#26522E" />
                    </linearGradient>
                </defs>

                <!-- 1. Grid Base -->
                <g class="grid-layer">
                    <template v-for="x in GRID_WIDTH" :key="'col-' + x">
                        <template v-for="y in GRID_HEIGHT" :key="'cell-' + x + '-' + y">
                            <rect :x="(x - 1) * TILE_SIZE" :y="(y - 1) * TILE_SIZE" :width="TILE_SIZE"
                                :height="TILE_SIZE" :fill="isForestTile(x - 1, y - 1) ? '#18331C' : '#EFF1E8'"
                                :stroke="isForestTile(x - 1, y - 1) ? '#122916' : '#E1E4D7'" stroke-width="1" />
                        </template>
                    </template>
                </g>

                <!-- 2. River -->
                <g class="river-layer">
                    <path :d="riverPathD" fill="#5AA9E6" stroke="#4A98D5" stroke-width="2" />
                </g>

                <!-- 3. Dolomites Massif -->
                <g class="dolomites-east" filter="url(#tile-shadow)">
                    <path
                        d="M 720,0 C 700,50 675,80 680,140 C 685,200 655,240 660,320 C 665,390 635,460 640,560 L 800,560 L 800,0 Z"
                        fill="url(#mnt-slope-dark)" />
                    <path
                        d="M 745,0 C 730,60 700,100 710,160 C 720,220 685,270 690,360 C 695,430 665,490 670,560 L 800,560 L 800,0 Z"
                        fill="url(#mnt-slope-light)" />
                    <path
                        d="M 770,0 C 755,70 730,120 738,190 C 745,250 715,310 720,410 C 725,480 695,520 705,560 L 800,560 L 800,0 Z"
                        fill="url(#mnt-slope-dark)" opacity="0.25" />
                    <path d="M 770,0 C 755,70 730,120 738,190 L 752,185 C 742,120 768,70 782,0 Z"
                        fill="url(#snow-crest-grad)" />
                    <path d="M 738,190 C 745,250 715,310 720,410 L 734,405 C 728,310 758,250 752,185 Z"
                        fill="url(#snow-crest-grad)" opacity="0.9" />
                    <text :x="(GRID_WIDTH - 1.8) * TILE_SIZE" :y="2.2 * TILE_SIZE" fill="#1F232B" font-weight="900"
                        font-size="10" letter-spacing="1.5" style="text-shadow: 1px 1px 0px #FFFFFF;">PITLA CIR</text>
                </g>

                <!-- 4. Roads -->
                <g class="roads" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
                    <path v-for="(road, idx) in roadSegments" :key="'road-' + idx" :d="getRoadPathD(road)"
                        stroke-width="12" fill="none" filter="url(#tile-shadow)" />
                </g>

                <g class="footpaths" stroke-linecap="round">
                    <path v-for="path in footpaths" :key="path.id" :d="getRoadPathD([path.from, path.to])"
                        :stroke="path.upgraded ? '#FFFFFF' : '#B7791F'" :stroke-width="path.upgraded ? 8 : 3"
                        :stroke-dasharray="path.upgraded ? undefined : '5 4'" fill="none"
                        :class="{ 'upgradeable-path': !path.upgraded }"
                        @click.stop="upgradePath(path.id)">
                        <title>{{ path.upgraded ? 'Road' : 'Click to upgrade to road' }}</title>
                    </path>
                </g>

                <!-- 5. Ski Lift Cables Layer -->
                <g class="ski-lift-cables">
                    <!-- Permanent Cables -->
                    <line v-for="(c, idx) in skiLiftCables" :key="'cable-' + idx" :x1="c.x1 * TILE_SIZE + TILE_SIZE / 2"
                        :y1="c.y1 * TILE_SIZE + TILE_SIZE / 2" :x2="c.x2 * TILE_SIZE + TILE_SIZE / 2"
                        :y2="c.y2 * TILE_SIZE + TILE_SIZE / 2" stroke="#1D3557" stroke-width="3"
                        stroke-dasharray="6,4" />
                    <!-- Active Ski Lift 2nd Station Drag Cable Preview -->
                    <line v-if="pendingSkiLiftSource" :x1="pendingSkiLiftSource.x * TILE_SIZE + TILE_SIZE / 2"
                        :y1="pendingSkiLiftSource.y * TILE_SIZE + TILE_SIZE / 2"
                        :x2="hoverTile.x * TILE_SIZE + TILE_SIZE / 2" :y2="hoverTile.y * TILE_SIZE + TILE_SIZE / 2"
                        stroke="#E63946" stroke-width="3" stroke-dasharray="4,4" />
                </g>

                <!-- 6. Placed Buildings -->
                <g class="destinations" filter="url(#tile-shadow)">
                    <g v-for="b in buildings" :key="'b-' + b.id">
                        <rect :x="b.x * TILE_SIZE + 4" :y="b.y * TILE_SIZE + 4" :width="(b.w || 1) * TILE_SIZE - 8"
                            :height="(b.h || 1) * TILE_SIZE - 8" :fill="b.color"
                            :class="{ 'pulse-highlight': pendingSkiLiftSource && pendingSkiLiftSource.id === b.id }"
                            rx="8" />
                        <text v-if="b.icon" :x="b.x * TILE_SIZE + ((b.w || 1) * TILE_SIZE) / 2"
                            :y="b.y * TILE_SIZE + ((b.h || 1) * TILE_SIZE) / 2 + 5" text-anchor="middle" font-size="16">
                            {{ b.icon }}
                        </text>
                        <template v-if="b.type === 'hotel'">
                            <circle :cx="b.x * TILE_SIZE + (b.w || 1) * TILE_SIZE - 10" :cy="b.y * TILE_SIZE + 10"
                                r="10" fill="#1D3557" stroke="#FFFFFF" stroke-width="1.5" />
                            <text :x="b.x * TILE_SIZE + (b.w || 1) * TILE_SIZE - 10" :y="b.y * TILE_SIZE + 14"
                                text-anchor="middle" font-size="11" font-weight="700" fill="#FFFFFF">
                                {{ getHotelGuestCount(b) }}
                            </text>
                        </template>
                    </g>
                </g>

                <!-- 7. Swaying Pine Forest Layer -->
                <g class="pine-forest">
                    <g v-for="(tree, i) in allPineTrees" :key="'tree-' + i"
                        :transform="`translate(${tree.cx}, ${tree.cy}) scale(${tree.scale})`" class="angled-tree">
                        <ellipse cx="0" cy="5" rx="15" ry="5.5" fill="#000000" opacity="0.3" />
                        <path
                            d="M 0,-14 C 5,-14 12,-4 18,3 C 14,7 10,4 6,7 C 2,4 -2,4 -6,7 C -10,4 -14,7 -18,3 C -12,-4 -5,-14 0,-14 Z"
                            fill="url(#tier-base-grad)" />
                        <g class="sway-mid-tier"
                            :style="{ transformOrigin: '0px -10px', animationDelay: `${tree.animDelay}s` }">
                            <path
                                d="M 0,-26 C 4,-26 10,-16 15,-8 C 11,-5 8,-7 4,-4 C 1,-6 -1,-6 -4,-4 C -8,-7 -11,-5 -15,-8 C -10,-16 -4,-26 0,-26 Z"
                                fill="url(#tier-mid-grad)" />
                        </g>
                        <g class="sway-top-tier"
                            :style="{ transformOrigin: '0px -20px', animationDelay: `${tree.animDelay}s` }">
                            <path
                                d="M 0,-42 C 3,-42 7,-30 11,-20 C 8,-17 5,-19 2,-16 C 0,-17 0,-17 -2,-16 C -5,-19 -8,-17 -11,-20 C -7,-30 -3,-42 0,-42 Z"
                                fill="url(#tier-top-grad)" />
                            <path d="M 0,-42 L 3,-30 Q 0,-27 -3,-30 Z" fill="#A2EAA2" opacity="0.4" />
                        </g>
                    </g>
                </g>

                <!-- 8. Pending Drag & Drop State / Ghost Preview Layer -->
                <g v-if="activePreview" class="pending-preview" style="pointer-events: none;">
                    <rect :x="activePreview.x * TILE_SIZE + 4" :y="activePreview.y * TILE_SIZE + 4"
                        :width="activePreview.w * TILE_SIZE - 8" :height="activePreview.h * TILE_SIZE - 8"
                        :fill="activePreview.valid ? 'rgba(46, 196, 182, 0.35)' : 'rgba(230, 57, 70, 0.35)'"
                        :stroke="activePreview.valid ? '#2EC4B6' : '#E63946'" stroke-width="2" stroke-dasharray="4,4"
                        rx="8" />
                    <text v-if="activePreview.icon" :x="activePreview.x * TILE_SIZE + (activePreview.w * TILE_SIZE) / 2"
                        :y="activePreview.y * TILE_SIZE + (activePreview.h * TILE_SIZE) / 2 + 5" text-anchor="middle"
                        font-size="16" opacity="0.8">
                        {{ activePreview.icon }}
                    </text>

                    <g v-if="!activePreview.valid"
                        :transform="`translate(${activePreview.x * TILE_SIZE + activePreview.w * TILE_SIZE - 12}, ${activePreview.y * TILE_SIZE + 4})`">
                        <circle cx="6" cy="6" r="10" fill="#E63946" />
                        <path d="M 2,2 L 10,10 M 10,2 L 2,10" stroke="#FFFFFF" stroke-width="2.5"
                            stroke-linecap="round" />
                    </g>
                </g>

                <!-- 9. Animated Visitors Layer -->
                <g class="visitor-layer">
                    <g v-for="v in store.activeVisitors" :key="'visitor-' + v.id"
                        :transform="`translate(${v.x * TILE_SIZE + TILE_SIZE / 2}, ${v.y * TILE_SIZE + TILE_SIZE / 2})`"
                        class="visitor-sprite">
                        <circle cx="0" cy="0" r="12" fill="#FFFFFF" stroke="#1D3557" stroke-width="2" />
                        <text x="0" y="4" text-anchor="middle" font-size="12">
                            {{ getTravelModeIcon(v.travelMode) }}
                        </text>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore.js'

const props = defineProps({
    draggedItem: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['facility-placed'])

const store = useGameStore()
let animationFrame
let lastAnimationTime

function animateVisitors(timestamp) {
    if (lastAnimationTime === undefined) lastAnimationTime = timestamp
    const deltaSeconds = Math.min((timestamp - lastAnimationTime) / 1000, 0.1)
    lastAnimationTime = timestamp

    if (!store.isPaused && !store.isDrafting) {
        store.moveVisitors(deltaSeconds)
    }

    animationFrame = window.requestAnimationFrame(animateVisitors)
}

onMounted(() => {
    animationFrame = window.requestAnimationFrame(animateVisitors)
})

onUnmounted(() => {
    window.cancelAnimationFrame(animationFrame)
})

const TILE_SIZE = 40
const GRID_WIDTH = 20
const GRID_HEIGHT = 14

const inventoryTypes = [
    { type: 'ski_lift', label: 'Ski Lift', icon: '🚡', color: '#E63946', width: 1, height: 1 },
    { type: 'bus_stop', label: 'Bus Stop', icon: '🚌', color: '#FFB703', width: 1, height: 1 },
    { type: 'train_station', label: 'Train Station', icon: '🚉', color: '#1D3557', width: 2, height: 1 }
]

const mountainPineCoords = [
    { cx: 700, cy: 70, scale: 0.45 },
    { cx: 730, cy: 110, scale: 0.5 },
    { cx: 685, cy: 160, scale: 0.4 },
    { cx: 715, cy: 200, scale: 0.55 },
    { cx: 675, cy: 250, scale: 0.45 },
    { cx: 705, cy: 290, scale: 0.6 },
    { cx: 665, cy: 350, scale: 0.5 },
    { cx: 695, cy: 390, scale: 0.65 },
    { cx: 650, cy: 440, scale: 0.55 },
    { cx: 680, cy: 490, scale: 0.7 },
    { cx: 660, cy: 530, scale: 0.65 }
]

const roadSegments = ref([
    [{ x: 0, y: 3 }, { x: 3, y: 6 }, { x: 8, y: 6 }, { x: 13, y: 11 }, { x: 15, y: 11 }],
    [{ x: 8, y: 6 }, { x: 8, y: 3 }, { x: 6, y: 1 }]
])

const pineForestZones = [
    { minX: 1, maxX: 5, minY: 0, maxY: 2 },
    { minX: 9, maxX: 14, minY: 0, maxY: 3 },
    { minX: 1, maxX: 5, minY: 8, maxY: 12 },
    { minX: 8, maxX: 14, minY: 12, maxY: 13 }
]

const buildings = ref([])

const footpaths = computed(() => store.infrastructurePaths)

const skiLiftCables = ref([])
const pendingSkiLiftSource = ref(null)

const isDraggingOver = ref(false)
const hoverTile = ref({ x: 0, y: 0 })

function updateHoverTile(event) {
    const svgRect = event.currentTarget.getBoundingClientRect()
    if (!svgRect.width || !svgRect.height) return

    const scaleX = (GRID_WIDTH * TILE_SIZE) / svgRect.width
    const scaleY = (GRID_HEIGHT * TILE_SIZE) / svgRect.height

    const mouseX = (event.clientX - svgRect.left) * scaleX
    const mouseY = (event.clientY - svgRect.top) * scaleY

    hoverTile.value = {
        x: Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(mouseX / TILE_SIZE))),
        y: Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(mouseY / TILE_SIZE)))
    }
}

function onDragOver(event) {
    isDraggingOver.value = true
    updateHoverTile(event)
}

function onDragLeave() {
    isDraggingOver.value = false
}

function onMouseMove(event) {
    if (pendingSkiLiftSource.value) {
        updateHoverTile(event)
    }
}

function getTravelModeIcon(mode) {
    switch (mode) {
        case 'car': return '🚗'
        case 'bus': return '🚌'
        case 'train': return '🚆'
        case 'cable_car': return '🚡'
        case 'walking': return '🚶'
    }
}

const activePreview = computed(() => {
    if (isDraggingOver.value && props.draggedItem) {
        const item = props.draggedItem
        const valid = isValidPlacement(item.type, hoverTile.value.x, hoverTile.value.y, item.width, item.height)
        return {
            x: hoverTile.value.x,
            y: hoverTile.value.y,
            w: item.width,
            h: item.height,
            icon: item.icon,
            valid
        }
    }

    if (pendingSkiLiftSource.value) {
        const valid = isValidPlacement('ski_lift', hoverTile.value.x, hoverTile.value.y, 1, 1)
        return {
            x: hoverTile.value.x,
            y: hoverTile.value.y,
            w: 1,
            h: 1,
            icon: '🚡',
            valid
        }
    }

    return null
})

function isValidPlacement(itemType, tileX, tileY, w = 1, h = 1) {
    if (tileX < 0 || tileY < 0 || tileX + w > GRID_WIDTH || tileY + h > GRID_HEIGHT) {
        return false
    }

    const overlapsBuilding = buildings.value.some(b => {
        const bw = b.w || 1
        const bh = b.h || 1
        return tileX < b.x + bw && tileX + w > b.x && tileY < b.y + bh && tileY + h > b.y
    })
    if (overlapsBuilding) return false

    if (itemType === 'bus_stop') {
        if (!isAdjacentToRoad(tileX, tileY, w, h)) {
            return false
        }
    }

    if (itemType === 'ski_lift' && pendingSkiLiftSource.value) {
        if (pendingSkiLiftSource.value.x === tileX && pendingSkiLiftSource.value.y === tileY) {
            return false
        }
    }

    return true
}

function isAdjacentToRoad(x, y, w, h) {
    const roadTiles = getOccupiedRoadTiles()

    for (let px = x; px < x + w; px++) {
        for (let py = y; py < y + h; py++) {
            const touchesRoad = roadTiles.some(
                rt => Math.abs(rt.x - px) <= 1 && Math.abs(rt.y - py) <= 1
            )
            if (touchesRoad) return true
        }
    }

    return false
}

function getOccupiedRoadTiles() {
    const tiles = []
    roadSegments.value.forEach(segment => {
        for (let i = 0; i < segment.length - 1; i++) {
            const p1 = segment[i]
            const p2 = segment[i + 1]
            const steps = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)) * 4
            for (let s = 0; s <= steps; s++) {
                const rx = Math.round(p1.x + (p2.x - p1.x) * (s / (steps || 1)))
                const ry = Math.round(p1.y + (p2.y - p1.y) * (s / (steps || 1)))
                if (!tiles.some(t => t.x === rx && t.y === ry)) {
                    tiles.push({ x: rx, y: ry })
                }
            }
        }
    })
    return tiles
}

function onDrop(event) {
    const itemType = event.dataTransfer?.getData('text/plain')
    const itemConfig = props.draggedItem?.type === itemType
        ? props.draggedItem
        : inventoryTypes.find((i) => i.type === itemType)
    if (!itemConfig) return

    updateHoverTile(event)
    const { x, y } = hoverTile.value

    if (!isValidPlacement(itemType, x, y, itemConfig.width, itemConfig.height)) {
        return
    }

    const newBuilding = {
        id: `${itemConfig.type}-${Date.now()}`,
        type: itemConfig.type,
        color: itemConfig.color,
        icon: itemConfig.icon,
        x,
        y,
        w: itemConfig.width,
        h: itemConfig.height
    }

    const placed = store.placeFacility({
        type: itemConfig.type,
        label: itemConfig.label,
        icon: itemConfig.icon,
        x,
        y,
        capacity: itemConfig.capacity,
        width: itemConfig.width,
        height: itemConfig.height
    })

    if (!placed) return

    buildings.value.push(newBuilding)

    if (itemType === 'ski_lift') {
        pendingSkiLiftSource.value = newBuilding
    }

    emit('facility-placed', itemConfig)

    isDraggingOver.value = false
}

function onBoardClick(event) {
    if (!pendingSkiLiftSource.value) return

    updateHoverTile(event)
    const { x, y } = hoverTile.value

    if (!isValidPlacement('ski_lift', x, y, 1, 1)) return

    const itemConfig = inventoryTypes.find(i => i.type === 'ski_lift')
    const secondStation = {
        id: `ski_lift-${Date.now()}`,
        color: itemConfig.color,
        icon: itemConfig.icon,
        x,
        y,
        w: 1,
        h: 1
    }

    buildings.value.push(secondStation)

    skiLiftCables.value.push({
        x1: pendingSkiLiftSource.value.x,
        y1: pendingSkiLiftSource.value.y,
        x2: x,
        y2: y
    })

    pendingSkiLiftSource.value = null
}

function upgradePath(pathId) {
    store.upgradeInfrastructurePath(pathId)
}

function cancelPendingSkiLift() {
    pendingSkiLiftSource.value = null
}

const riverPathD = computed(() => {
    const S = TILE_SIZE
    return `
    M 0,${1 * S}
    L ${4 * S},${5 * S}
    L ${7 * S},${5 * S}
    L ${12 * S},${10 * S}
    L ${15 * S},${10 * S}
    L ${15 * S},${11.5 * S}
    L ${11.5 * S},${11.5 * S}
    L ${6.5 * S},${6.5 * S}
    L ${3.5 * S},${6.5 * S}
    L 0,${2 * S}
    Z
  `
})

function isForestTile(x, y) {
    return pineForestZones.some(
        z => x >= z.minX && x <= z.maxX && y >= z.minY && y <= z.maxY
    )
}

function isBuildingOnTile(x, y) {
    return buildings.value.some(b => {
        const bw = b.w || 1
        const bh = b.h || 1
        return x >= b.x && x < b.x + bw && y >= b.y && y < b.y + bh
    })
}

function getHotelGuestCount(building) {
    return store.facilities.find(
        (facility) => facility.type === 'hotel' && facility.x === building.x && facility.y === building.y
    )?.currentOccupancy || 0
}

function isNearRiver(cx, cy) {
    const S = TILE_SIZE
    if (cx < 5 * S && cy < 6 * S && Math.abs(cy - (cx + S)) < 25) return true
    if (cx >= 4 * S && cx <= 7 * S && cy >= 4.5 * S && cy <= 7 * S) return true
    if (cx > 6 * S && cy > 5 * S && Math.abs(cy - (cx - S)) < 30) return true
    return false
}

function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
}

const allPineTrees = computed(() => {
    const trees = []
    let seed = 120

    pineForestZones.forEach(zone => {
        for (let x = zone.minX; x <= zone.maxX; x++) {
            for (let y = zone.minY; y <= zone.maxY; y++) {
                if (isBuildingOnTile(x, y)) continue

                const slots = [
                    { sx: 10, sy: 12 },
                    { sx: 30, sy: 12 },
                    { sx: 10, sy: 32 },
                    { sx: 30, sy: 32 }
                ]

                slots.forEach(slot => {
                    const jitterX = (seededRandom(seed++) - 0.5) * 6
                    const jitterY = (seededRandom(seed++) - 0.5) * 6
                    const cx = x * TILE_SIZE + slot.sx + jitterX
                    const cy = y * TILE_SIZE + slot.sy + jitterY

                    if (isNearRiver(cx, cy)) return

                    const scale = 0.85 + seededRandom(seed++) * 0.45

                    trees.push({
                        cx,
                        cy,
                        scale: Number(scale.toFixed(2)),
                        animDelay: Number((seededRandom(seed++) * 3).toFixed(2))
                    })
                })
            }
        }
    })

    mountainPineCoords.forEach(mt => {
        trees.push({
            cx: mt.cx,
            cy: mt.cy,
            scale: mt.scale,
            animDelay: Number((seededRandom(seed++) * 3).toFixed(2))
        })
    })

    return trees.sort((a, b) => a.cy - b.cy)
})

function getRoadPathD(points) {
    return points.reduce((acc, point, index) => {
        const cx = point.x * TILE_SIZE + TILE_SIZE / 2
        const cy = point.y * TILE_SIZE + TILE_SIZE / 2
        return index === 0 ? `M ${cx} ${cy}` : `${acc} L ${cx} ${cy}`
    }, '')
}
</script>

<style scoped>
.game-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 900px;
    outline: none;
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

.pulse-highlight {
    animation: pulseStation 1.2s infinite alternate ease-in-out;
}

.pending-preview {
    pointer-events: none;
}

@keyframes pulseStation {
    0% {
        opacity: 0.6;
        stroke: #E63946;
        stroke-width: 2px;
    }

    100% {
        opacity: 1.0;
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