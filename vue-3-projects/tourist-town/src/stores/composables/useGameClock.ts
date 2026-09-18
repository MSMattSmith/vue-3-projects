import type { Difficulty, GameState } from '../gameTypes'
import { DIFFICULTY_SETTINGS } from '../gameConstants'

const TICK_INTERVAL_MS = 1000

export function useGameClock(
  state: GameState,
  tickVisitors: () => void,
  endWeekAndDraft: () => void,
  spawnVisitor: (delay?: number) => void,
  tickEvents: () => void,
  tickMaintenance: () => void,
  isNightTime: () => boolean
) {
  const formattedClock = () => {
    const currentMinute = state.gameTime % 60
    const currentHour = state.hour
    return `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
  }
  const getArrivalText = (countdownHours: number) => {
    const totalArrivalHours = state.hour + countdownHours
    const arrivalDay = state.day + Math.floor(totalArrivalHours / 24)
    return `Day ${arrivalDay} at ${(totalArrivalHours % 24).toString().padStart(2, '0')}:00`
  }
  const getSpawnInterval = () => Math.max(4, DIFFICULTY_SETTINGS[state.difficulty].spawnHours - Math.floor((state.week - 1) / 2))
  const togglePause = () => { state.isPaused = !state.isPaused }
  const toggleFastForward = () => { state.isFastForwarding = !state.isFastForwarding }
  const setDifficulty = (difficulty: Difficulty) => { state.difficulty = difficulty }

  function tick(): void {
    // Advance 1 in-game minute per tick
    state.gameTime++

    const previousHour = state.hour
    state.hour = Math.floor(state.gameTime / 60) % 24

    // Run daily draft modal at midnight (00:00)
    if (state.hour === 0 && previousHour === 23 && state.gameTime % 60 === 0) {
      state.day++
      endWeekAndDraft()
      return
    }

    // Trigger hourly maintenance & events when the hour rolls over
    if (state.hour !== previousHour) {
      tickEvents()
      tickMaintenance()
    }

    // Process visitor logic during daytime hours
    if (!isNightTime()) {
      tickVisitors()
    }
  }

  function startGameLoop(): void {
    if (state.gameInterval !== null) return
    if (state.queue.length === 0 && state.gameTime === 0) spawnVisitor(24)
    state.gameInterval = window.setInterval(() => {
      if (!state.isPaused && !state.isDrafting) {
        const ticks = state.isFastForwarding ? 4 : 1
        for (let step = 0; step < ticks; step++) {
          tick()
          if (state.isDrafting) break
        }
      }
    }, 1000)
  }

  function stopGameLoop(): void {
    if (state.gameInterval !== null) {
      clearInterval(state.gameInterval)
      state.gameInterval = null
    }
  }

  function skipToMorning(): void {
    // Only allow skipping during night hours (22:00 - 06:00)
    if (state.hour < 22 && state.hour >= 6) return

    let hoursToAdvance = 0
    if (state.hour >= 22) {
      hoursToAdvance = (24 - state.hour) + 6
    } else { // 00:00 - 05:59
      hoursToAdvance = 6 - state.hour
    }

    const currentMinute = state.gameTime % 60
    const minutesToAdvance = (hoursToAdvance * 60) - currentMinute

    state.gameTime += minutesToAdvance
    state.hour = 6

    // If skipping crossed midnight, advance the day and check for daily draft
    if (state.hour < 22 && hoursToAdvance >= 8) {
      state.day++
      endWeekAndDraft()
    }
  }

  return { formattedClock, getArrivalText, getSpawnInterval, togglePause, toggleFastForward, skipToMorning, setDifficulty, tick, startGameLoop, stopGameLoop }
}
