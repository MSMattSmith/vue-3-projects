<template>
    <aside class="visitor-sidebar">
        <!-- Header Stats -->
        <div class="economy-panel">
            <div class="stat-card">
                <span class="label">Treasury</span>
                <span class="value money">€{{ store.money }}</span>
            </div>
            <div class="stat-card">
                <span class="label">Town Rating</span>
                <span class="value rating">⭐ {{ store.averageRating }}</span>
            </div>
            <div class="tax-control">
                <label>Tourist Tax: <strong>{{ (store.taxRate * 100).toFixed(0) }}%</strong></label>
                <input type="range" min="0" max="0.5" step="0.05" :value="store.taxRate"
                    @input="e => store.setTaxRate(parseFloat(e.target.value))" />
            </div>
        </div>

        <!-- Incoming Visitors Queue -->
        <div class="section">
            <h3>Incoming Tourists ({{ store.queue.length }})</h3>
            <div class="queue-list">
                <div v-for="v in store.queue" :key="v.id" class="visitor-card waiting">
                    <div class="v-header">
                        <span>{{ v.avatar }} {{ v.name }} ({{ v.type }})</span>
                    </div>

                    <div class="arrival-time">
                        <span>Arriving on {{ formatArrival(v) }}</span>
                    </div>

                    <div class="itinerary">
                        <div v-for="(task, idx) in v.itinerary" :key="idx" class="task-item">
                            <div class="task-info">
                                <div class="task-icon" :style="{ backgroundColor: store.getActivityColor(task.type) }">
                                </div>
                                <span>⏳ {{ task.label }}</span>
                            </div>
                            <span class="price">€{{ task.price }}</span>
                        </div>
                    </div>

                    <div class="arrival-bar">
                        <div class="fill" :style="{ width: getArrivalProgress(v.countdown) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Visitors -->
        <div class="section">
            <h3>Current Visitors ({{ store.activeVisitors.length }})</h3>
            <div class="active-list">
                <div v-for="v in store.activeVisitors" :key="v.id" class="visitor-card">
                    <div class="v-header">
                        <span>{{ v.avatar }} {{ v.name }}<strong v-if="v.isVip" class="vip-badge"> VIP</strong></span>
                        <span class="timer">⏱ {{ formatStay(v.duration) }} left</span>
                    </div>

                    <button class="dispatch-button" :disabled="!store.canExpressDispatch(v)"
                        title="Spend €40 to make this visitor move 3x faster for 6 game hours and restore patience"
                        @click="store.expressDispatch(v.id)">
                        {{ store.canExpressDispatch(v) ? 'Speed boost · 3x for 6h · €40' : 'No destination available' }}
                    </button>

                    <!-- Satisfaction Bar -->
                    <div class="satisfaction-bar">
                        <div class="fill"
                            :style="{ width: v.satisfaction + '%', backgroundColor: getSatisfactionColor(v.satisfaction) }">
                        </div>
                    </div>

                    <div class="patience-bar" title="Patience">
                        <div class="fill"
                            :style="{ width: Math.max(0, v.patience) + '%', backgroundColor: getPatienceColor(v.patience) }">
                        </div>
                    </div>

                    <div class="visitor-status-line">{{ getVisitorStatus(v) }}</div>

                    <div class="visitor-alert" :class="v.satisfactionState">
                        {{ v.satisfactionState }} · {{ Math.round(v.satisfaction) }}% satisfaction
                        <span v-if="v.patienceCountdown">💣 {{ v.patienceCountdown }}s</span>
                    </div>

                    <button v-if="v.satisfaction < 40" class="voucher-button" @click="store.voucherVisitor(v.id)">
                        Voucher surge €50 (+35%)
                    </button>

                    <!-- Itinerary Checklist -->
                    <div class="itinerary">
                        <div v-for="(task, idx) in v.itinerary" :key="idx" class="task-item"
                            :class="{ completed: task.completed, active: idx === v.currentTaskIndex }">
                            <div class="task-info">
                                <div class="task-icon" :style="{ backgroundColor: store.getActivityColor(task.type) }">
                                </div>
                                <span>{{ task.completed ? '✅' : '⏳' }} {{ task.label }}</span>
                            </div>
                            <span class="price">€{{ task.price }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Latest Reviews -->
        <div class="section reviews">
            <h3>Recent Guest Reviews</h3>
            <div v-for="r in store.reviews.slice(-3).reverse()" :key="r.id" class="review-card">
                <div class="r-header">
                    <strong>{{ r.author }}</strong>
                    <span>{{ '⭐'.repeat(r.rating) }}</span>
                </div>
                <p class="comment">"{{ r.comment }}"</p>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()
const INITIAL_COUNTDOWN_MAX = 180

onMounted(() => {
    store.startGameLoop()
})

onUnmounted(() => {
    store.stopGameLoop()
})

function getSatisfactionColor(score) {
    if (score > 70) return '#2EC4B6'
    if (score > 35) return '#FFB703'
    return '#E63946'
}

function getPatienceColor(score) {
    if (score > 60) return '#38bdf8'
    if (score > 25) return '#fbbf24'
    return '#ef4444'
}

function getVisitorStatus(visitor) {
    const task = visitor.itinerary[visitor.currentTaskIndex]
    if (!task) return 'Finished activities · enjoying the town'
    if (visitor.isStuck) return `Waiting for ${task.label}`
    if (!visitor.route?.length || visitor.routeIndex >= visitor.route.length) return `At ${task.label}`
    const mode = visitor.travelMode === 'car' ? 'Driving' : 'Walking'
    return `${mode} to ${task.label}`
}

function formatArrival(visitor) {
    // If the visitor already has a fixed arrival timestamp stored, use it directly
    if (visitor.arrivalTime) {
        return visitor.arrivalTime
    }

    // Otherwise, compute it relative to the current time + remaining countdown once
    const currentDay = store.day ?? 1
    const currentHour = store.hour ?? 0
    const currentMinute = (store.gameTime ?? 0) % 60

    const totalArrivalMinutes = (currentHour * 60) + currentMinute + visitor.countdown

    const extraDays = Math.floor(totalArrivalMinutes / (24 * 60))
    const minutesInArrivalDay = totalArrivalMinutes % (24 * 60)

    const arrivalDay = currentDay + extraDays
    const arrivalHour = Math.floor(minutesInArrivalDay / 60)
    const arrivalMin = minutesInArrivalDay % 60

    const hh = arrivalHour.toString().padStart(2, '0')
    const mm = arrivalMin.toString().padStart(2, '0')

    return `Day ${arrivalDay} at ${hh}:${mm}`
}

function formatStay(durationMinutes) {
    const hours = Math.floor(durationMinutes / 60)
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    if (!days && !remainingHours) return `${durationMinutes}m`
    if (!days) return `${hours}h`
    if (!remainingHours) return `${days}d`
    return `${days}d ${remainingHours}h`
}

function getArrivalProgress(countdown) {
    const elapsed = INITIAL_COUNTDOWN_MAX - countdown
    const progress = (elapsed / INITIAL_COUNTDOWN_MAX) * 100
    return Math.min(100, Math.max(0, progress))
}
</script>

<style scoped>
.visitor-sidebar {
    width: 320px;
    height: 100vh;
    background: #111827;
    color: #f3f4f6;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    overflow-y: auto;
}

.economy-panel {
    background: #1f2937;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-card .money {
    color: #10b981;
    font-weight: bold;
    font-size: 18px;
}

.stat-card .rating {
    color: #fbbf24;
    font-weight: bold;
}

.tax-control {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    margin-top: 6px;
}

.visitor-card {
    background: #1f2937;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
    font-size: 13px;
}

.visitor-card.waiting {
    border-left: 4px solid #3b82f6;
}

.v-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.vip-badge {
    color: #fbbf24;
    font-size: 10px;
    letter-spacing: 0.5px;
}

.satisfaction-bar {
    height: 6px;
    background: #374151;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;
}

.satisfaction-bar .fill {
    height: 100%;
    transition: width 0.3s ease;
}

.patience-bar {
    height: 4px;
    margin: 4px 0 8px;
    background: #374151;
    border-radius: 2px;
    overflow: hidden;
}

.patience-bar .fill {
    height: 100%;
    transition: width 0.3s ease;
}

.visitor-status-line {
    margin: 2px 0 7px;
    color: #cbd5e1;
    font-size: 11px;
    line-height: 1.3;
}

.dispatch-button {
    border: 1px solid #38bdf8;
    border-radius: 4px;
    padding: 4px 7px;
    margin-bottom: 7px;
    background: #164e63;
    color: #e0f2fe;
    font-size: 10px;
    cursor: pointer;
}

.dispatch-button:disabled {
    border-color: #4b5563;
    background: #1f2937;
    color: #6b7280;
    cursor: not-allowed;
}

.visitor-alert {
    margin: 2px 0 6px;
    color: #86efac;
    font-size: 10px;
    text-transform: uppercase;
}

.visitor-alert.frustrated {
    color: #fbbf24;
}

.visitor-alert.furious {
    color: #f87171;
    font-weight: 700;
}

.voucher-button {
    border: 1px solid #fbbf24;
    border-radius: 4px;
    padding: 4px 7px;
    margin-bottom: 7px;
    background: #713f12;
    color: #fef3c7;
    font-size: 10px;
    cursor: pointer;
}

.itinerary {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.task-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

.task-icon {
    width: 4px;
    height: 16px;
    border-radius: 8px;
}

.task-item {
    display: flex;
    justify-content: space-between;
    opacity: 0.5;
    font-size: 11px;
}

.task-item.completed {
    opacity: 1;
    color: #10b981;
}

.task-item.active {
    opacity: 1;
    font-weight: bold;
}

.review-card {
    background: #1f2937;
    padding: 8px;
    border-radius: 6px;
    margin-bottom: 6px;
    font-size: 12px;
}

.review-card .comment {
    font-style: italic;
    margin: 4px 0 0 0;
    color: #9ca3af;
}

.arrival-time {
    font-size: 11px;
    color: #38bdf8;
    margin-bottom: 6px;
    font-weight: 500;
}

.arrival-bar {
    height: 6px;
    background: #374151;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 8px;
}

.arrival-bar .fill {
    height: 100%;
    background: #3b82f6;
    transition: width 1s linear;
    will-change: width;
}
</style>