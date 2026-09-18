import type { DraftOffer, GameState } from '../gameTypes'
import { FACILITY_BLUEPRINTS } from '../gameConstants'
import type { FacilityInput } from './useFacilities'

export function useDrafting(state: GameState, placeFacility: (facility: FacilityInput) => boolean) {
  function endWeekAndDraft(): void {
    state.isDrafting = true
    const unlocked = FACILITY_BLUEPRINTS.filter((offer) => (offer.unlockWeek || offer.unlockedAtWeek || 1) <= state.week)
    state.draftOffers = [...unlocked].sort(() => Math.random() - 0.5).slice(0, 3)
  }

  function selectDraftOffer(offer: DraftOffer, tileX: number, tileY: number): void {
    if (placeFacility({ type: offer.type, label: offer.label, icon: offer.icon, x: tileX, y: tileY, capacity: offer.capacity, cost: offer.cost })) {
      state.week++
      state.day = 1
      state.isDrafting = false
    }
  }

  function claimDraftOffer(offer: DraftOffer): boolean {
    if (state.money < offer.cost) return false
    state.money -= offer.cost
    state.week++
    state.day = 1
    state.isDrafting = false
    return true
  }

  return { endWeekAndDraft, selectDraftOffer, claimDraftOffer }
}
