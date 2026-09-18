<template>
  <div class="app-layout">
    <!-- 1. Left Column: Incoming tourists, satisfaction & town treasury -->
    <VisitorSidebar />

    <!-- 2. Center Column: Header bar, Inventory palette, SVG Game Board -->
    <main class="game-area">
      <GameHeader />
      
      <InventoryBar
        :items="inventoryItems"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      />

      <GameBoard
        :dragged-item="activeDraggedItem"
        @facility-placed="removeInventoryItem"
      />
    </main>

    <!-- 3. Right Column: Placed town facilities summary -->
    <TownFacilitiesPanel />

    <!-- 4. Overlay: End of week facility draft popup -->
    <WeeklyDraftModal @offer-selected="addInventoryItem" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VisitorSidebar from './components/VisitorSidebar.vue'
import GameHeader from './components/GameHeader.vue'
import InventoryBar, { type InventoryItem } from './components/InventoryBar.vue'
import GameBoard from './components/GameBoard.vue'
import TownFacilitiesPanel from './components/TownFacilitiesPanel.vue'
import WeeklyDraftModal from './components/WeeklyDraftModal.vue'
import { ACTIVITY_COLORS, type DraftOffer } from './stores/gameStore.js'

// Give the opening town the basic hotel-and-food loop before introducing harsher systems.
const inventoryItems = ref<InventoryItem[]>([
  {
    type: 'hotel',
    label: 'Alpine Hotel',
    icon: '🏨',
    color: ACTIVITY_COLORS['hotel'],
    width: 2,
    height: 2,
    capacity: 6
  },
  {
    type: 'cafe',
    label: 'Small Café',
    icon: '☕',
    color: ACTIVITY_COLORS['cafe'],
    width: 1,
    height: 1,
    capacity: 3
  },
  {
    type: 'parking_lot',
    label: 'Parking Lot',
    icon: '🅿️',
    color: ACTIVITY_COLORS['parking_lot'],
    width: 2,
    height: 1,
    capacity: 8
  }
])

const activeDraggedItem = ref<InventoryItem | null>(null)

function handleDragStart(item: InventoryItem) {
  activeDraggedItem.value = item
}

function handleDragEnd() {
  activeDraggedItem.value = null
}

function removeInventoryItem(item: InventoryItem) {
  inventoryItems.value = inventoryItems.value.filter((availableItem) => availableItem.type !== item.type)
}

function addInventoryItem(offer: DraftOffer) {
  const isHotel = offer.type === 'hotel'
  inventoryItems.value.push({
    type: offer.type,
    label: offer.label,
    icon: offer.icon,
    color: ACTIVITY_COLORS[offer.type],
    width: isHotel ? 2 : 1,
    height: isHotel ? 2 : 1,
    capacity: offer.capacity
  })
}
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0f172a;
}

.game-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow: hidden;
}
</style>

<style>
body {
  margin: 0;
}
</style>