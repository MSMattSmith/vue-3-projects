<template>
    <div class="inventory-bar">
        <div v-for="item in items" :key="item.type" class="inventory-item" draggable="true"
            @dragstart="onDragStart($event, item)" @dragend="$emit('drag-end')">
            <span>{{ item.icon }} {{ item.label }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
export interface InventoryItem {
    type: string
    label: string
    icon: string
    color: string
    width: number
    height: number
    capacity: number
}

defineProps<{
    items: InventoryItem[]
}>()

const emit = defineEmits(['drag-start', 'drag-end'])

const emptyDragImage = new Image()
emptyDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function onDragStart(event: DragEvent, item: InventoryItem) {
    event.dataTransfer?.setData('text/plain', item.type)
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
    font-size: 13px;
    color: #64748b;
    text-transform: uppercase;
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
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: grab;
    user-select: none;
}

.inventory-card:hover {
    border-color: #3b82f6;
}
</style>