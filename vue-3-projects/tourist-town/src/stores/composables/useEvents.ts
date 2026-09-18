import type { EventCard, GameState } from '../gameTypes'
import { EVENT_DECK } from '../gameConstants'

export function useEvents(state: GameState) {
  function chooseNextEvent(): EventCard {
    const availableEvents = state.week >= 3
      ? EVENT_DECK
      : EVENT_DECK.filter((event) => event.id !== 'vip')
    return availableEvents[Math.floor(Math.random() * availableEvents.length)]!
  }

  function ensureForecast(): void {
    if (!state.forecastEvent && state.gameTime > 0 && state.gameTime % 24 === 0) {
      state.forecastEvent = chooseNextEvent()
    }
  }

  function activateForecast(): void {
    if (!state.forecastEvent) return
    state.activeEvent = state.forecastEvent
    state.eventHoursRemaining = state.forecastEvent.duration
    state.forecastEvent = null
  }

  function tickEvents(): void {
    ensureForecast()
    if (state.eventHoursRemaining > 0) {
      state.eventHoursRemaining--
      if (state.eventHoursRemaining === 0) {
        state.activeEvent = null
        state.emergencyUntil = 0
      }
    } else if (state.forecastEvent && state.gameTime % 24 === 12) {
      activateForecast()
    }
  }

  function movementMultiplier(): number {
    if (state.emergencyUntil > state.gameTime) return 1
    return state.activeEvent?.movementMultiplier || 1
  }

  function patienceMultiplier(): number {
    if (state.emergencyUntil > state.gameTime) return 1
    return state.activeEvent?.patienceMultiplier || 1
  }

  function arrivalMultiplier(): number {
    return state.activeEvent?.arrivalMultiplier || 1
  }

  function revenueMultiplier(): number {
    return state.activeEvent?.revenueMultiplier || 1
  }

  function useEmergencyMeasure(): boolean {
    const event = state.activeEvent
    if (!event || state.money < event.emergencyCost || state.emergencyUntil > state.gameTime) return false
    state.money -= event.emergencyCost
    state.emergencyUntil = state.gameTime + event.duration
    return true
  }

  return { tickEvents, movementMultiplier, patienceMultiplier, arrivalMultiplier, revenueMultiplier, useEmergencyMeasure }
}

export type EventsApi = ReturnType<typeof useEvents>
