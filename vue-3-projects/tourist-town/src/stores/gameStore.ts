import { computed, reactive, toRefs } from 'vue'
import { defineStore } from 'pinia'
import { createInitialGameState } from './gameState'
import { ACTIVITY_COLORS, FACILITY_BLUEPRINTS } from './gameConstants'
import { useInfrastructure } from './composables/useInfrastructure'
import { useFacilities } from './composables/useFacilities'
import { useVisitors } from './composables/useVisitors'
import { useDrafting } from './composables/useDrafting'
import { useGameClock } from './composables/useGameClock'
import { useEvents } from './composables/useEvents'

export { ACTIVITY_COLORS }
export type {
  ActivityType,
  RoadType,
  RoadTile,
  Difficulty,
  ItineraryTask,
  Facility,
  InfrastructurePath,
  Visitor,
  Review,
  DraftOffer,
  GameState,
  Point
} from './gameTypes'

export const useGameStore = defineStore('game', () => {
  const state = reactive(createInitialGameState())
  const infrastructure = useInfrastructure(state)
  const facilities = useFacilities(state, infrastructure)
  const events = useEvents(state)
  const visitors = useVisitors(state, infrastructure, events, facilities)
  const drafting = useDrafting(state, facilities.placeFacility)
  const clock = useGameClock(state, visitors.tickVisitors, drafting.endWeekAndDraft, visitors.spawnVisitor, events.tickEvents, facilities.tickMaintenance, visitors.isNightTime)

  const formattedClock = computed(clock.formattedClock)
  const averageRating = computed(() => {
    if (!state.reviews.length) return '5.0'
    const sum = state.reviews.reduce((total, review) => total + review.rating, 0)
    return (sum / state.reviews.length).toFixed(1)
  })
  const activeVisitors = computed(visitors.activeVisitors)
  const facilitySummary = computed(facilities.getFacilitySummary)
  const availableOffersForCurrentWeek = computed(() => FACILITY_BLUEPRINTS.filter(
    (offer) => (offer.unlockWeek || offer.unlockedAtWeek || 1) <= state.week
  ))
  const spawnSettings = computed(() => {
    const settings = state.week === 1
      ? { spawnInterval: 12, maxQueue: 3, types: ['Day Tripper', 'Budget Sightseer'] }
      : state.week === 2
        ? { spawnInterval: 8, maxQueue: 6, types: ['Family', 'Motorist'] }
        : state.week === 3
          ? { spawnInterval: 4, maxQueue: 12, types: ['Thrill-Seeker', 'VIP Delegate'] }
          : { spawnInterval: 2, maxQueue: 25, types: ['Tour Bus Group', 'Luxury Vacationer'] }
    return settings
  })
  const getActivityColor = facilities.getActivityColor

  function setTaxRate(rate: number): void {
    state.taxRate = rate
  }

  function $reset(): void {
    Object.assign(state, createInitialGameState())
  }

  return {
    ...toRefs(state),
    formattedClock,
    averageRating,
    activeVisitors,
    facilitySummary,
    availableOffersForCurrentWeek,
    spawnSettings,
    getActivityColor,
    getArrivalText: clock.getArrivalText,
    togglePause: clock.togglePause,
    toggleFastForward: clock.toggleFastForward,
    getSpawnInterval: clock.getSpawnInterval,
    setDifficulty: clock.setDifficulty,
    startGameLoop: clock.startGameLoop,
    stopGameLoop: clock.stopGameLoop,
    tick: clock.tick,
    skipToMorning: clock.skipToMorning,
    spawnVisitor: visitors.spawnVisitor,
    attemptTask: visitors.attemptTask,
    expressDispatch: visitors.expressDispatch,
    canExpressDispatch: visitors.canExpressDispatch,
    voucherVisitor: visitors.voucherVisitor,
    clearLuggage: visitors.clearLuggage,
    moveVisitors: visitors.moveVisitors,
    moveVisitor: visitors.moveVisitor,
    checkoutVisitor: visitors.checkoutVisitor,
    placeFacility: facilities.placeFacility,
    addFacility: facilities.addFacility,
    upgradeInfrastructurePath: infrastructure.upgradeInfrastructurePath,
    getRoadPoints: infrastructure.getRoadPoints,
    getTileSpeedMultiplier: infrastructure.getTileSpeedMultiplier,
    placeRoad: infrastructure.placeRoad,
    findPath: infrastructure.findPath,
    updateOccupancy: infrastructure.updateOccupancy,
    findNearestRoadPoint: infrastructure.findNearestRoadPoint,
    isFacilityRoadAccessible: infrastructure.isFacilityRoadAccessible,
    isNearRoad: infrastructure.isNearRoad,
    findRoadPath: infrastructure.findRoadPath,
    buildRoute: visitors.buildRoute,
    endWeekAndDraft: drafting.endWeekAndDraft,
    selectDraftOffer: drafting.selectDraftOffer,
    claimDraftOffer: drafting.claimDraftOffer,
    serviceFacility: facilities.serviceFacility,
    quickCleanHotel: facilities.quickCleanHotel,
    repairFacility: facilities.repairFacility,
    useEmergencyMeasure: events.useEmergencyMeasure,
    movementMultiplier: events.movementMultiplier,
    patienceMultiplier: events.patienceMultiplier,
    setTaxRate,
    $reset
  }
})
