<template>
    <div v-if="store.isDrafting" class="modal-backdrop">
        <div class="modal-card">
            <h2>🗓️ Week {{ store.week }} Complete!</h2>
            <p class="subtitle">Choose 1 unlocked facility blueprint for your town:</p>

            <div class="offers-grid">
                <div v-for="offer in store.draftOffers" :key="offer.label" class="offer-card"
                    :class="{ disabled: store.money < offer.cost }" @click="selectOffer(offer)">
                    <div class="icon">{{ offer.icon }}</div>
                    <h3>{{ offer.label }}</h3>
                    <p class="desc">{{ offer.description }}</p>
                    <div class="stats">
                        <span>Capacity: <strong>{{ offer.capacity }}</strong></span>
                        <span class="cost">Cost: <strong>€{{ offer.cost }}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGameStore, type DraftOffer } from '../stores/gameStore'

const store = useGameStore()

const emit = defineEmits<{
    'offer-selected': [offer: DraftOffer]
}>()

function selectOffer(offer: DraftOffer) {
    if (store.claimDraftOffer(offer)) {
        emit('offer-selected', offer)
    }
}
</script>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
}

.modal-card {
    background: #1e293b;
    color: #f8fafc;
    padding: 32px;
    border-radius: 16px;
    width: min(620px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    text-align: center;
}

.offers-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 24px;
}

.offer-card {
    flex: 1;
    background: #334155;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    border: 2px solid #475569;
    transition: transform 0.2s, border-color 0.2s;
}

.offer-card:hover:not(.disabled) {
    transform: translateY(-4px);
    border-color: #38bdf8;
}

.offer-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.icon {
    font-size: 36px;
    margin-bottom: 8px;
}

.stats {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
}

@media (max-width: 560px) {
    .offers-grid {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 561px) and (max-width: 760px) {
    .offers-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.cost {
    color: #34d399;
}
</style>