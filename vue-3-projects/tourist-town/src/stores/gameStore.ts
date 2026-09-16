import { defineStore } from 'pinia'

export type ActivityType =
  | 'hotel'
  | 'cafe'
  | 'cable_car'
  | 'hike'
  | 'biking'
  | 'skiing'
  | 'train_station'
  | 'neighbouring_town'

export type Difficulty = 'intro' | 'easy' | 'medium' | 'hard' | 'very hard' | 'extreme' | 'chaos'

// Centralized Theme Colors
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  hotel: '#D97706',            // Warm Amber Hotel Color
  cafe: '#7C3AED',             // Purple
  cable_car: '#0284C7',        // Sky Blue
  hike: '#16A34A',             // Forest Green
  biking: '#EA580C',           // Orange
  skiing: '#38BDF8',           // Ice Blue
  train_station: '#475569',    // Steel Gray
  neighbouring_town: '#6B7280' // Slate Gray
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
}

export interface InfrastructurePath {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  upgraded: boolean
}

export interface Visitor {
  id: number
  name: string
  type: string
  avatar: string
  countdown: number
  duration: number
  satisfaction: number
  status: 'waiting' | 'active' | 'turned_away' | 'departed'
  currentTaskIndex: number
  itinerary: ItineraryTask[]
  x: number
  y: number
  targetX: number
  targetY: number
  travelMode: 'walking' | 'car' | 'bus' | 'train' | 'cable_car'
  route?: Array<{ x: number; y: number }>
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
}

export interface GameState {
  money: number
  taxRate: number
  reviews: Review[]
  visitors: Visitor[]
  queue: Visitor[]
  facilities: Facility[]
  infrastructurePaths: InfrastructurePath[]
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
}

const ROAD_NETWORK = [
  { x: 0, y: 3 },
  { x: 3, y: 6 },
  { x: 8, y: 6 },
  { x: 13, y: 11 },
  { x: 15, y: 11 }
]

const ROAD_BRANCH = [
  { x: 8, y: 6 },
  { x: 8, y: 3 },
  { x: 6, y: 1 }
]

const ROAD_SEGMENTS = [ROAD_NETWORK, ROAD_BRANCH]

const VISITOR_REQUESTS: Array<{ type: ActivityType; label: string; price: number }> = [
  { type: 'cafe', label: 'Visit an Alpine Café', price: 15 },
  { type: 'hike', label: 'Take a mountain hike', price: 20 },
  { type: 'biking', label: 'Rent a mountain bike', price: 25 },
  { type: 'skiing', label: 'Go skiing', price: 35 },
  { type: 'cable_car', label: 'Ride the cable car', price: 30 },
  { type: 'train_station', label: 'Take a scenic train', price: 30 }
]

const DIFFICULTY_SETTINGS: Record<Difficulty, { spawnHours: number; maxRequests: number }> = {
  intro: { spawnHours: 24, maxRequests: 1 },
  easy: { spawnHours: 18, maxRequests: 1 },
  medium: { spawnHours: 14, maxRequests: 2 },
  hard: { spawnHours: 11, maxRequests: 2 },
  'very hard': { spawnHours: 9, maxRequests: 2 },
  extreme: { spawnHours: 7, maxRequests: 3 },
  chaos: { spawnHours: 5, maxRequests: 3 }
}

const FACILITY_BLUEPRINTS: DraftOffer[] = [
  { type: 'cafe', label: 'Alpine Café', icon: '☕', capacity: 4, cost: 150, description: 'Serves snacks and strudel.' },
  { type: 'biking', label: 'Mountain Bike Hub', icon: '🚵', capacity: 6, cost: 200, description: 'Offers mountain bike rentals.' },
  { type: 'skiing', label: 'Ski Lodge', icon: '🎿', capacity: 8, cost: 250, description: 'Opens the mountain slopes.' },
  { type: 'hotel', label: 'Boutique Hotel', icon: '🏨', capacity: 5, cost: 300, description: 'Adds 5 rooms for tourists.' },
  { type: 'cable_car', label: 'Cable Car Station', icon: '🚡', capacity: 8, cost: 325, description: 'Carries guests up the mountain.' },
  { type: 'train_station', label: 'Scenic Train Station', icon: '🚉', capacity: 8, cost: 400, description: 'Connects the town to the valley.' }
]

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    money: 1500,
    taxRate: 0.15,
    reviews: [],
    visitors: [],
    queue: [],
    facilities: [],
    infrastructurePaths: [],
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
    gameInterval: null
  }),

  getters: {
    formattedClock: (state): string => {
      const hh = state.hour.toString().padStart(2, '0')
      return `${hh}:00`
    },

    averageRating: (state): string => {
      if (!state.reviews.length) return '5.0'
      const sum = state.reviews.reduce((acc, r) => acc + r.rating, 0)
      return (sum / state.reviews.length).toFixed(1)
    },

    activeVisitors: (state): Visitor[] => state.visitors.filter((v) => v.status === 'active'),

    getActivityColor: () => (type: ActivityType): string => {
      return ACTIVITY_COLORS[type] || '#4B5563'
    },

    facilitySummary: (state) => {
      const summaryMap = new Map<
        string,
        { label: string; icon: string; color: string; count: number; totalCapacity: number; usedOccupancy: number }
      >()

      state.facilities.forEach((f) => {
        if (summaryMap.has(f.type)) {
          const item = summaryMap.get(f.type)!
          item.count++
          item.totalCapacity += f.capacity
          item.usedOccupancy += f.currentOccupancy
        } else {
          summaryMap.set(f.type, {
            label: f.label,
            icon: f.icon,
            color: f.color,
            count: 1,
            totalCapacity: f.capacity,
            usedOccupancy: f.currentOccupancy
          })
        }
      })

      return Array.from(summaryMap.values())
    },

    getArrivalText: (state) => (countdownHours: number): string => {
      const totalArrivalHours = state.hour + countdownHours
      const daysToAdd = Math.floor(totalArrivalHours / 24)
      const arrivalHour = totalArrivalHours % 24

      const arrivalDay = state.day + daysToAdd
      const hh = arrivalHour.toString().padStart(2, '0')

      return `Day ${arrivalDay} at ${hh}:00`
    }
  },

  actions: {
    togglePause(): void {
      this.isPaused = !this.isPaused
    },

    toggleFastForward(): void {
      this.isFastForwarding = !this.isFastForwarding
    },

    getSpawnInterval(): number {
      const settings = DIFFICULTY_SETTINGS[this.difficulty]
      return Math.max(4, settings.spawnHours - Math.floor((this.week - 1) / 2))
    },

    setDifficulty(difficulty: Difficulty): void {
      this.difficulty = difficulty
    },

    startGameLoop(): void {
      if (this.gameInterval !== null) return

      if (this.queue.length === 0 && this.gameTime === 0) {
        this.spawnVisitor(24)
      }

      this.gameInterval = window.setInterval(() => {
        if (!this.isPaused && !this.isDrafting) {
          const ticks = this.isFastForwarding ? 4 : 1
          for (let step = 0; step < ticks; step++) {
            this.tick()
            if (this.isDrafting) break
          }
        }
      }, 1000)
    },

    stopGameLoop(): void {
      if (this.gameInterval !== null) {
        clearInterval(this.gameInterval)
        this.gameInterval = null
      }
    },

    tick(): void {
      this.gameTime++

      this.hour++
      if (this.hour >= 24) {
        this.hour = 0
        this.day++

        if (this.day > 7) {
          this.endWeekAndDraft()
          return
        }
      }

      // 1. Process Visitor Queue Countdowns
      this.queue.forEach((v) => {
        if (v.countdown > 0) {
          v.countdown--
        } else {
          v.status = 'active'
        }
      })

      const arrived = this.queue.filter((v) => v.status === 'active')
      if (arrived.length) {
        this.visitors.push(...arrived)
        this.queue = this.queue.filter((v) => v.status === 'waiting')
      }

      // 2. Spawn incoming tourists over time
      if (this.gameTime % this.getSpawnInterval() === 0 && this.queue.length < 3) {
        this.spawnVisitor(this.getSpawnInterval())
      }

      // 3. Process Active Visitors
      this.visitors.forEach((v) => {
        if (v.status !== 'active') return
        v.duration--

        const currentTask = v.itinerary[v.currentTaskIndex]
        if (currentTask && !currentTask.completed) {
          this.attemptTask(v, currentTask)
        }

        if (v.duration <= 0) {
          this.checkoutVisitor(v)
        }
      })
    },

    spawnVisitor(delayInTicks: number = 24): void {
      const nextArrival = this.queue.reduce(
        (latest, visitor) => Math.max(latest, visitor.countdown),
        delayInTicks - 1
      ) + 1
      const settings = DIFFICULTY_SETTINGS[this.difficulty]
      const requestCount = Math.min(
        settings.maxRequests,
        1 + Math.floor(Math.random() * settings.maxRequests)
      )
      const requestStart = Math.floor(Math.random() * VISITOR_REQUESTS.length)
      const requests = Array.from({ length: requestCount }, (_, index) =>
        VISITOR_REQUESTS[(requestStart + index) % VISITOR_REQUESTS.length]!
      )
      const duration = 48 + requestCount * 24 + Math.floor(Math.random() * 24)

      this.queue.push({
        id: this.nextVisitorId++,
        name: `Visitor #${this.nextVisitorId}`,
        type: 'Overnight Guest',
        avatar: '🧳',
        countdown: nextArrival,
        duration,
        satisfaction: 100,
        status: 'waiting',
        currentTaskIndex: 0,
        x: 0,
        y: 3,
        targetX: 0,
        targetY: 3,
        travelMode: 'car',
        route: [...ROAD_NETWORK],
        routeIndex: 0,
        itinerary: [
          { type: 'hotel', label: 'Check into Hotel', price: 40, completed: false, failed: false },
          ...requests.map((request) => ({
            type: request.type,
            label: request.label,
            price: request.price,
            completed: false,
            failed: false
          }))
        ]
      })
    },

    placeFacility(facility: {
      type: ActivityType
      label: string
      icon: string
      x: number
      y: number
      width?: number
      height?: number
      capacity: number
      cost?: number
    }): boolean {
      const w = facility.width || 1
      const h = facility.height || 1

      if (
        facility.x < 0 ||
        facility.y < 0 ||
        facility.x + w > this.gridWidth ||
        facility.y + h > this.gridHeight
      ) {
        return false
      }

      if (facility.cost !== undefined && this.money < facility.cost) {
        return false
      }

      const isOccupied = this.facilities.some((f) => {
        const existingW = f.width || 1
        const existingH = f.height || 1
        return (
          facility.x < f.x + existingW &&
          facility.x + w > f.x &&
          facility.y < f.y + existingH &&
          facility.y + h > f.y
        )
      })

      if (isOccupied) return false

      if (facility.cost) {
        this.money -= facility.cost
      }

      this.facilities.push({
        id: `fac-${Date.now()}-${this.facilities.length}`,
        type: facility.type,
        label: facility.label,
        icon: facility.icon,
        color: ACTIVITY_COLORS[facility.type] || '#D97706',
        x: facility.x,
        y: facility.y,
        width: w,
        height: h,
        capacity: facility.capacity,
        currentOccupancy: 0
      })

      const placedFacility = this.facilities[this.facilities.length - 1]!
      if (!this.isFacilityRoadAccessible(placedFacility)) {
        this.infrastructurePaths.push({
          id: `path-${placedFacility.id}`,
          from: { x: placedFacility.x, y: placedFacility.y },
          to: this.findNearestRoadPoint(placedFacility.x, placedFacility.y),
          upgraded: false
        })
      }

      return true
    },

    addFacility(facility: Facility): void {
      this.placeFacility(facility)
    },

    upgradeInfrastructurePath(pathId: string): boolean {
      const path = this.infrastructurePaths.find((path) => path.id === pathId)
      if (!path || path.upgraded) return false
      path.upgraded = true
      return true
    },

    getRoadPoints(): Array<{ x: number; y: number }> {
      const points: Array<{ x: number; y: number }> = []
      ROAD_SEGMENTS.forEach((segment) => segment.forEach((point) => {
        if (!points.some((existing) => existing.x === point.x && existing.y === point.y)) {
          points.push(point)
        }
      }))
      this.infrastructurePaths.filter((path) => path.upgraded).forEach((path) => {
        points.push(path.from, path.to)
      })
      return points
    },

    findNearestRoadPoint(x: number, y: number): { x: number; y: number } {
      return this.getRoadPoints().reduce((nearest, point) => {
        const nearestDistance = Math.hypot(nearest.x - x, nearest.y - y)
        const pointDistance = Math.hypot(point.x - x, point.y - y)
        return pointDistance < nearestDistance ? point : nearest
      }, ROAD_NETWORK[0]!)
    },

    isFacilityRoadAccessible(facility: Facility): boolean {
      return this.isNearRoad(facility.x, facility.y) || this.infrastructurePaths.some(
        (path) => path.id === `path-${facility.id}` && path.upgraded
      )
    },

    isNearRoad(x: number, y: number): boolean {
      return this.getRoadPoints().some((point) => Math.hypot(point.x - x, point.y - y) <= 1.5)
    },

    findRoadPath(start: { x: number; y: number }, end: { x: number; y: number }): Array<{ x: number; y: number }> {
      const points = this.getRoadPoints()
      const distances = new Map<string, number>()
      const previous = new Map<string, string>()
      const unvisited = new Set(points.map((point) => `${point.x},${point.y}`))
      const pointByKey = new Map(points.map((point) => [`${point.x},${point.y}`, point]))
      const edges = new Map<string, string[]>()

      ROAD_SEGMENTS.forEach((segment) => {
        segment.forEach((point, index) => {
          const key = `${point.x},${point.y}`
          const neighbors = edges.get(key) || []
          if (index > 0) neighbors.push(`${segment[index - 1]!.x},${segment[index - 1]!.y}`)
          if (index < segment.length - 1) neighbors.push(`${segment[index + 1]!.x},${segment[index + 1]!.y}`)
          edges.set(key, neighbors)
        })
      })
      this.infrastructurePaths.filter((path) => path.upgraded).forEach((path) => {
        const from = `${path.from.x},${path.from.y}`
        const to = `${path.to.x},${path.to.y}`
        edges.set(from, [...(edges.get(from) || []), to])
        edges.set(to, [...(edges.get(to) || []), from])
      })

      const startKey = `${start.x},${start.y}`
      const endKey = `${end.x},${end.y}`
      distances.set(startKey, 0)
      while (unvisited.size) {
        const currentKey = [...unvisited].reduce((best, key) =>
          (distances.get(key) ?? Infinity) < (distances.get(best) ?? Infinity) ? key : best
        )
        if ((distances.get(currentKey) ?? Infinity) === Infinity) break
        unvisited.delete(currentKey)
        if (currentKey === endKey) break
        const current = pointByKey.get(currentKey)!
        ;(edges.get(currentKey) || []).forEach((neighborKey) => {
          if (!unvisited.has(neighborKey)) return
          const neighbor = pointByKey.get(neighborKey)!
          const distance = (distances.get(currentKey) || 0) + Math.hypot(neighbor.x - current.x, neighbor.y - current.y)
          if (distance < (distances.get(neighborKey) ?? Infinity)) {
            distances.set(neighborKey, distance)
            previous.set(neighborKey, currentKey)
          }
        })
      }

      const result: Array<{ x: number; y: number }> = []
      let key: string | undefined = endKey
      while (key) {
        const point = pointByKey.get(key)
        if (point) result.unshift(point)
        key = previous.get(key)
      }
      return result.length ? result : [start, end]
    },

    buildRoute(visitor: Visitor, facility: Facility): { route: Array<{ x: number; y: number }>; byCar: boolean } {
      const start = this.findNearestRoadPoint(visitor.x, visitor.y)
      const end = this.findNearestRoadPoint(facility.x, facility.y)
      const roadPath = this.findRoadPath(start, end)
      return {
        route: [{ x: visitor.x, y: visitor.y }, ...roadPath.slice(1), { x: facility.x, y: facility.y }],
        byCar: this.isFacilityRoadAccessible(facility)
      }
    },

    attemptTask(visitor: Visitor, task: ItineraryTask): void {
      const availableFacility = this.facilities.find(
        (f) => f.type === task.type && f.currentOccupancy < f.capacity
      )

      if (availableFacility) {
        const routePlan = this.buildRoute(visitor, availableFacility)
        visitor.travelMode = task.type === 'hotel' && routePlan.byCar ? 'car' : 'walking'

        if (visitor.targetX !== availableFacility.x || visitor.targetY !== availableFacility.y || !visitor.route) {
          visitor.route = routePlan.route
          visitor.routeIndex = 0
        }
        visitor.targetX = availableFacility.x
        visitor.targetY = availableFacility.y

        if (Math.abs(visitor.x - visitor.targetX) <= 1 && Math.abs(visitor.y - visitor.targetY) <= 1) {
          availableFacility.currentOccupancy++
          task.completed = true
          visitor.satisfaction = Math.min(100, visitor.satisfaction + 20)
          this.money += Math.round(task.price * (1 + this.taxRate))
          visitor.currentTaskIndex++
        }
      } else {
        if (task.type !== 'hotel') {
          task.failed = true
          visitor.currentTaskIndex++
          visitor.satisfaction = Math.max(0, visitor.satisfaction - 25)
          return
        }

        visitor.satisfaction = 0
        visitor.status = 'turned_away'
        this.checkoutVisitor(visitor, 'No room was available! Left town unhappy.')
      }
    },

    moveVisitors(deltaSeconds = 1): void {
      this.visitors.forEach((visitor) => {
        if (visitor.status === 'active') {
          this.moveVisitor(visitor, deltaSeconds)
        }
      })
    },

    moveVisitor(v: Visitor, deltaSeconds = 1): void {
      const route = v.route
      if (!route?.length || v.routeIndex === undefined || v.routeIndex >= route.length) return

      const waypoint = route[v.routeIndex]
      if (!waypoint) return
      const dx = waypoint.x - v.x
      const dy = waypoint.y - v.y
      const distance = Math.hypot(dx, dy)
      const baseSpeed = v.travelMode === 'car' ? 2.5 : 0.35
      const speed = baseSpeed * deltaSeconds * (this.isFastForwarding ? 4 : 1)

      if (distance <= speed) {
        v.x = waypoint.x
        v.y = waypoint.y
        v.routeIndex++
        return
      }

      v.x += (dx / distance) * speed
      v.y += (dy / distance) * speed
    },

    checkoutVisitor(visitor: Visitor, reasonOverride?: string): void {
      visitor.itinerary.forEach((task) => {
        if (task.completed) {
          const fac = this.facilities.find((f) => f.type === task.type && f.currentOccupancy > 0)
          if (fac) fac.currentOccupancy--
        }
      })

      visitor.status = 'departed'
      const rating = visitor.satisfaction > 75 ? 5 : visitor.satisfaction > 40 ? 3 : 1
      const missedActivity = visitor.itinerary.some((task) => task.failed && task.type !== 'hotel')
      const comment = reasonOverride || (
        missedActivity ? 'A lovely stay, but some activities were unavailable.' :
          rating === 5 ? 'Wonderful hotel and town!' : 'No place to stay!'
      )

      this.reviews.push({ id: Date.now(), author: visitor.name, rating, comment })
      this.visitors = this.visitors.filter((v) => v.id !== visitor.id)
    },

    endWeekAndDraft(): void {
      this.isDrafting = true
      const maximumCost = Math.min(400, 200 + (this.week - 1) * 100)
      const unlocked = FACILITY_BLUEPRINTS.filter((offer) => offer.cost <= maximumCost)
      const start = (this.week * 3 + 1) % unlocked.length
      this.draftOffers = [
        unlocked[start]!,
        unlocked[(start + 1) % unlocked.length]!
      ]
    },

    selectDraftOffer(offer: DraftOffer, tileX: number, tileY: number): void {
      const placed = this.placeFacility({
        type: offer.type,
        label: offer.label,
        icon: offer.icon,
        x: tileX,
        y: tileY,
        capacity: offer.capacity,
        cost: offer.cost
      })

      if (placed) {
        this.week++
        this.day = 1
        this.isDrafting = false
      }
    },

    claimDraftOffer(offer: DraftOffer): boolean {
      if (this.money < offer.cost) return false

      this.money -= offer.cost
      this.week++
      this.day = 1
      this.isDrafting = false
      return true
    },

    setTaxRate(rate: number): void {
      this.taxRate = rate
    }
  }
})