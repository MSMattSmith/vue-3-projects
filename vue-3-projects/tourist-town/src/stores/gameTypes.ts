export type ActivityType =
  | 'hotel'
  | 'cafe'
  | 'cable_car'
  | 'hike'
  | 'sightseeing'
  | 'biking'
  | 'skiing'
  | 'train_station'
  | 'neighbouring_town'
  | 'information_kiosk'
  | 'parking_lot'
  | 'alpine_bistro'
  | 'shuttle_bus'
  | 'bike_park'
  | 'express_lane'
  | 'alpine_express'
  | 'grand_resort'
  | 'boutique_hotel'
  | 'observation_deck'
  | 'maintenance_hub'

export type Difficulty = 'intro' | 'easy' | 'medium' | 'hard' | 'very hard' | 'extreme' | 'chaos'
export type RoadType = 'dirt' | 'paved'

export interface Point {
  x: number
  y: number
}

export interface RoadTile extends Point {
  type: RoadType
  speedMultiplier: number
  currentOccupants: number
  base?: boolean
}

export interface ItineraryTask {
  type: ActivityType
  label: string
  price: number
  completed: boolean
  failed: boolean
}

export interface Facility {
  id: string
  type: ActivityType
  label: string
  icon: string
  color: string
  x: number
  y: number
  width?: number
  height?: number
  capacity: number
  currentOccupancy: number
  serviceUntil: number
  overdriveUntil: number
  maintenance: number
}

export interface EventCard {
  id: string
  name: string
  category: 'weather' | 'event'
  description: string
  movementMultiplier: number
  patienceMultiplier: number
  arrivalMultiplier: number
  revenueMultiplier: number
  duration: number
  emergencyCost: number
}

export interface InfrastructurePath {
  id: string
  from: Point
  to: Point
  upgraded: boolean
}

export interface LuggageObstacle {
  id: number
  x: number
  y: number
  expiresAt: number
}

export interface Visitor {
  id: number
  name: string
  type: string
  avatar: string
  isVip: boolean
  visitorClass: 'day_tripper' | 'budget_sightseer' | 'family' | 'motorist' | 'thrill_seeker' | 'luxury_vacationer' | 'vip'
  countdown: number
  arrivalTime?: string
  duration: number
  satisfaction: number
  patience: number
  maxPatience: number
  patienceCountdown: number
  satisfactionState: 'happy' | 'frustrated' | 'furious' | 'rage_quit'
  isStuck: boolean
  taskTimer?: number
  expressUntil: number
  status: 'waiting' | 'active' | 'turned_away' | 'departed'
  currentTaskIndex: number
  itinerary: ItineraryTask[]
  x: number
  y: number
  targetX: number
  targetY: number
  travelMode: 'walking' | 'car' | 'bus' | 'train' | 'cable_car'
  route?: Point[]
  routeIndex?: number
}

export interface Review {
  id: number
  author: string
  rating: number
  comment: string
}

export interface DraftOffer {
  type: ActivityType
  label: string
  icon: string
  capacity: number
  cost: number
  description: string
  unlockWeek?: number
  unlockedAtWeek?: number
}

export interface GameState {
  state: never[]
  money: number
  taxRate: number
  reviews: Review[]
  visitors: Visitor[]
  queue: Visitor[]
  facilities: Facility[]
  infrastructurePaths: InfrastructurePath[]
  roads: RoadTile[] | Map<string, RoadTile>
  luggage: LuggageObstacle[]
  nextVisitorId: number
  gridWidth: number
  gridHeight: number
  isPaused: boolean
  isFastForwarding: boolean
  difficulty: Difficulty
  hour: number
  day: number
  week: number
  gameTime: number
  isDrafting: boolean
  draftOffers: DraftOffer[]
  gameInterval: number | null
  forecastEvent: EventCard | null
  activeEvent: EventCard | null
  eventHoursRemaining: number
  emergencyUntil: number
}
