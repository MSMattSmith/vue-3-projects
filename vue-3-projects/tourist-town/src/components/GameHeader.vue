<template>
    <header class="game-header">
        <div class="time-widget">
            <div class="clock-display">
                <span class="icon">🕒</span>
                <span class="time">{{ store.formattedClock }}</span>
            </div>
            <div class="calendar-display">
                <span class="day">Day {{ store.day }}</span>
                <span class="week">Week {{ store.week }}</span>
            </div>
        </div>

        <div class="time-controls">
            <div v-if="store.forecastEvent || store.activeEvent" class="event-status">
                <span v-if="store.forecastEvent">Forecast: {{ store.forecastEvent.name }}</span>
                <span v-else>⚠ {{ store.activeEvent?.name }} · {{ store.eventHoursRemaining }}h</span>
                <button v-if="store.activeEvent" class="emergency-btn" :disabled="store.emergencyUntil > store.gameTime"
                    @click="store.useEmergencyMeasure">
                    {{ store.emergencyUntil > store.gameTime ? 'Emergency Active' : `Emergency
                    €${store.activeEvent.emergencyCost}` }}
                </button>
            </div>
            <button class="speed-btn" :class="{ active: store.isFastForwarding }" :aria-pressed="store.isFastForwarding"
                title="Toggle fast forward" @click="store.toggleFastForward">
                <span>⏩ {{ store.isFastForwarding ? 'Fast' : '1x' }}</span>
            </button>
            <button v-if="store.hour >= 22 || store.hour < 6" class="skip-morning-btn" @click="store.skipToMorning">
                ☀️ Skip to Morning
            </button>
            <label class="difficulty-control">
                <span>Difficulty</span>
                <select :value="store.difficulty" @change="setDifficulty">
                    <option v-for="difficulty in difficulties" :key="difficulty" :value="difficulty">
                        {{ difficulty }}
                    </option>
                </select>
            </label>
            <button class="pause-btn" :class="{ paused: store.isPaused }" @click="store.togglePause">
                <span v-if="store.isPaused">▶ Resume</span>
                <span v-else>⏸ Pause</span>
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useGameStore, type Difficulty } from '../stores/gameStore'

const store = useGameStore()
const difficulties: Difficulty[] = ['intro', 'easy', 'medium', 'hard', 'very hard', 'extreme', 'chaos']

function setDifficulty(event: Event) {
    store.setDifficulty((event.target as HTMLSelectElement).value as Difficulty)
}
</script>

<style scoped>
.game-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1e293b;
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.time-widget {
    display: flex;
    align-items: center;
    gap: 20px;
}

.clock-display {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 700;
    color: #38bdf8;
}

.calendar-display {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #94a3b8;
}

.calendar-display .day {
    font-weight: 700;
    color: #f8fafc;
    font-size: 14px;
}

.pause-btn {
    background: #3b82f6;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.time-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.event-status {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 280px;
    color: #fbbf24;
    font-size: 11px;
}

.emergency-btn {
    border: 1px solid #f59e0b;
    border-radius: 5px;
    padding: 4px 7px;
    background: #78350f;
    color: #fef3c7;
    font-size: 10px;
    cursor: pointer;
}

.emergency-btn:disabled {
    opacity: 0.65;
    cursor: default;
}

.speed-btn {
    background: #475569;
    color: #ffffff;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.speed-btn.active {
    background: #f59e0b;
    color: #1e293b;
}

.difficulty-control {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 600;
}

.difficulty-control select {
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #64748b;
    border-radius: 6px;
    padding: 7px 8px;
    font-size: 12px;
    text-transform: capitalize;
}

.pause-btn:hover {
    background: #2563eb;
}

.pause-btn.paused {
    background: #10b981;
}

.skip-morning-btn {
    background: #f59e0b;
    color: #1e293b;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.skip-morning-btn:hover {
    background: #fbbf24;
}
</style>