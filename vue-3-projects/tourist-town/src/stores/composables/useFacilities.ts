import type { ActivityType, Facility, GameState } from '../gameTypes'
import { ACTIVITY_COLORS } from '../gameConstants'
import type { InfrastructureApi } from './useInfrastructure'

export interface FacilityInput {
  type: ActivityType
  label: string
  icon: string
  x: number
  y: number
  width?: number
  height?: number
  capacity: number
  cost?: number
}

export function useFacilities(state: GameState, infrastructure: InfrastructureApi) {
  function getActivityColor(type: ActivityType): string {
    return ACTIVITY_COLORS[type] || '#4B5563'
  }

  function placeFacility(input: FacilityInput): boolean {
    const width = input.width || 1
    const height = input.height || 1
    if (input.x < 0 || input.y < 0 || input.x + width > state.gridWidth || input.y + height > state.gridHeight) return false
    if (input.cost !== undefined && state.money < input.cost) return false
    const occupied = state.facilities.some((facility) => {
      const existingWidth = facility.width || 1
      const existingHeight = facility.height || 1
      return input.x < facility.x + existingWidth && input.x + width > facility.x && input.y < facility.y + existingHeight && input.y + height > facility.y
    })
    if (occupied) return false
    if (input.cost) state.money -= input.cost

    const facility: Facility = {
      id: `fac-${Date.now()}-${state.facilities.length}`,
      type: input.type,
      label: input.label,
      icon: input.icon,
      color: ACTIVITY_COLORS[input.type] || '#D97706',
      x: input.x,
      y: input.y,
      width,
      height,
      capacity: input.capacity,
      currentOccupancy: 0,
      serviceUntil: 0,
      overdriveUntil: 0,
      maintenance: 100
    }
    state.facilities.push(facility)
    if (!infrastructure.isFacilityRoadAccessible(facility)) {
      state.infrastructurePaths.push({
        id: `path-${facility.id}`,
        from: { x: facility.x, y: facility.y },
        to: infrastructure.findNearestRoadPoint(facility.x, facility.y),
        upgraded: false
      })
    }
    return true
  }

  function addFacility(facility: Facility): void {
    placeFacility(facility)
  }

  function serviceFacility(facilityId: string, gameTime: number): boolean {
    if (state.money < 75) return false
    const facility = state.facilities.find((item) => item.id === facilityId)
    if (!facility) return false
    state.money -= 75
    facility.serviceUntil = gameTime + 6
    return true
  }

  function quickCleanHotel(facilityId: string, gameTime: number): boolean {
    if (state.money < 100) return false
    const facility = state.facilities.find((item) => item.id === facilityId && item.type === 'hotel')
    if (!facility) return false
    state.money -= 100
    facility.serviceUntil = gameTime + 8
    facility.overdriveUntil = gameTime + 4
    return true
  }

  function repairFacility(facilityId: string): boolean {
    if (state.money < 120) return false
    const facility = state.facilities.find((item) => item.id === facilityId)
    if (!facility) return false
    state.money -= 120
    facility.maintenance = 100
    return true
  }

  function tickMaintenance(): void {
    state.facilities.forEach((facility) => {
      if (facility.currentOccupancy > 0) facility.maintenance = Math.max(0, facility.maintenance - facility.currentOccupancy * 0.08)
    })
  }

  function getEffectiveCapacity(facility: Facility, gameTime: number): number {
    return facility.overdriveUntil > gameTime ? facility.capacity * 2 : facility.capacity
  }

  function getFacilitySummary() {
    const summaryMap = new Map<string, { label: string; icon: string; color: string; count: number; totalCapacity: number; usedOccupancy: number }>()
    state.facilities.forEach((facility) => {
      const item = summaryMap.get(facility.type)
      if (item) {
        item.count++
        item.totalCapacity += facility.capacity
        item.usedOccupancy += facility.currentOccupancy
      } else {
        summaryMap.set(facility.type, { label: facility.label, icon: facility.icon, color: facility.color, count: 1, totalCapacity: facility.capacity, usedOccupancy: facility.currentOccupancy })
      }
    })
    return Array.from(summaryMap.values())
  }

  return { getActivityColor, placeFacility, addFacility, serviceFacility, quickCleanHotel, repairFacility, tickMaintenance, getEffectiveCapacity, getFacilitySummary }
}
