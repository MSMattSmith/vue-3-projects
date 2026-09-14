<template>
  <div class="inventory-bar">
    <span class="inventory-title">Inventory</span>
    <div class="inventory-items">
      <div
        v-for="item in items"
        :key="item.type"
        class="inventory-card"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        @dragend="onDragEnd"
      >
        <span class="item-icon">{{ item.icon }}</span>
        <span class="item-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['drag-start', 'drag-end'])

// Create a single transparent 1x1 image instance to hide the native drag preview
const emptyDragImage = new Image()
emptyDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function onDragStart(event, item) {
  event.dataTransfer.setData('text/plain', item.type)
  
  // Hides the default ghost card from floating under the cursor
  if (event.dataTransfer.setDragImage) {
    event.dataTransfer.setDragImage(emptyDragImage, 0, 0)
  }

  emit('drag-start', item)
}

function onDragEnd() {
  emit('drag-end')
}
</script>

<style scoped>
.inventory-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.inventory-title {
  font-weight: 700;
  font-size: 14px;
  color: #4a4e57;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.inventory-items {
  display: flex;
  gap: 12px;
}

.inventory-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #f4f5f0;
  border: 2px solid #e1e4d7;
  border-radius: 8px;
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.inventory-card:hover {
  transform: translateY(-2px);
  border-color: #5aa9e6;
}

.inventory-card:active {
  cursor: grabbing;
}

.item-icon {
  font-size: 18px;
}

.item-label {
  font-size: 13px;
  font-weight: 600;
  color: #2f333b;
}
</style>