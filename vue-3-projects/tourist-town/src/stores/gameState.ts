import type { GameState } from './gameTypes'
import { ROAD_SEGMENTS } from './gameConstants'

export function createInitialGameState(): GameState {
  const roads = new Map()
  ROAD_SEGMENTS.forEach((segment) => segment.forEach((point, index) => {
    const next = segment[index + 1]
    if (!next) return
    const steps = Math.max(Math.abs(next.x - point.x), Math.abs(next.y - point.y))
    for (let step = 0; step <= steps; step++) {
      const x = Math.round(point.x + (next.x - point.x) * (step / (steps || 1)))
      const y = Math.round(point.y + (next.y - point.y) * (step / (steps || 1)))
      roads.set(`${x},${y}`, { x, y, type: 'dirt', speedMultiplier: 1, currentOccupants: 0, base: true })
    }
  }))

  return {
    money: 1500,
    taxRate: 0.15,
    reviews: [],
    visitors: [],
    queue: [],
    facilities: [],
    infrastructurePaths: [],
    roads,
    luggage: [],
    nextVisitorId: 1,
    gridWidth: 20,
    gridHeight: 14,
    isPaused: false,
    isFastForwarding: false,
    difficulty: 'intro',
    hour: 8,
    day: 1,
    week: 1,
    gameTime: 0,
    isDrafting: false,
    draftOffers: [],
    gameInterval: null,
    forecastEvent: null,
    activeEvent: null,
    eventHoursRemaining: 0,
    emergencyUntil: 0
  }
}
