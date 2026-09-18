<template>
    <aside class="facilities-panel">
        <h3>Town Facilities</h3>

        <div class="facility-list">
            <div v-for="item in store.facilitySummary" :key="item.label" class="facility-card">
                <span class="icon">{{ item.icon }}</span>
                <div class="details">
                    <span class="name">{{ item.label }}</span>
                    <span class="count">Built: {{ item.count }}</span>
                        <span class="capacity">Capacity: {{ item.usedOccupancy }} / {{ item.totalCapacity }}</span>
                        <span class="maintenance">Maintenance: {{ facilityMaintenance(item.label) }}%</span>
                        <div class="facility-actions">
                            <button @click="serviceType(item.label)">Rush service €75</button>
                            <button v-if="item.label.includes('Hotel')" @click="cleanHotel">Quick clean €100</button>
                                <button @click="repairType(item.label)">Repair €120</button>
                        </div>
                </div>
            </div>

            <div v-if="!store.facilities.length" class="empty-state">
                No facilities placed yet. Drag infrastructure onto the board!
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

function serviceType(label: string) {
    const facility = store.facilities.find((item) => item.label === label)
    if (facility) store.serviceFacility(facility.id, store.gameTime)
}

function cleanHotel() {
    const hotel = store.facilities.find((facility) => facility.type === 'hotel')
    if (hotel) store.quickCleanHotel(hotel.id, store.gameTime)
}

function facilityMaintenance(label: string) {
    return Math.round(store.facilities.find((facility) => facility.label === label)?.maintenance || 0)
}

function repairType(label: string) {
    const facility = store.facilities.find((item) => item.label === label)
    if (facility) store.repairFacility(facility.id)
}
</script>

<style scoped>
.facilities-panel {
    width: 260px;
    height: 100vh;
    background: #111827;
    color: #f3f4f6;
    padding: 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.facilities-panel h3 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #9ca3af;
    margin: 0 0 8px 0;
}

.facility-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.facility-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #1f2937;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #374151;
}

.facility-card .icon {
    font-size: 20px;
}

.details {
    display: flex;
    flex-direction: column;
}

.name {
    font-size: 13px;
    font-weight: 600;
}

.count {
    font-size: 11px;
    color: #10b981;
}

.maintenance {
    font-size: 10px;
    color: #fbbf24;
}

.empty-state {
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
}

.facility-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 5px;
}

.facility-actions button {
    border: 1px solid #4b5563;
    border-radius: 4px;
    padding: 3px 5px;
    background: #374151;
    color: #d1d5db;
    font-size: 10px;
    cursor: pointer;
}

</style>