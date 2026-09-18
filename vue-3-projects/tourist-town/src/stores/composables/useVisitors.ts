import type { Facility, GameState, ItineraryTask, Point, Visitor } from '../gameTypes'
import { ROAD_NETWORK, VISITOR_REQUESTS, DIFFICULTY_SETTINGS } from '../gameConstants'
import type { InfrastructureApi } from './useInfrastructure'
import type { EventsApi } from './useEvents'
import type { useFacilities } from './useFacilities'

export function useVisitors(
  state: GameState,
  infrastructure: InfrastructureApi,
  events: EventsApi,
  facilityApi: ReturnType<typeof useFacilities>
) {
  const activeVisitors = () => state.visitors.filter((visitor) => visitor.status === 'active')

  // Helper moved to top to prevent ReferenceError
  function isNightTime(): boolean {
    return state.hour >= 22 || state.hour < 6
  }

  function getSpawnInterval(): number {
    if (isNightTime()) return 9999

    // REDUCED: Spawn delay in game minutes (formerly [180, 120, 90, 60, 45, 30])
    // Guests now arrive every 15-60 game minutes depending on the day
    const dayIntervals = [60, 45, 30, 20, 15, 10]
    const baseInterval = dayIntervals[Math.min(state.day - 1, dayIntervals.length - 1)] || 60

    const oneStarReviews = state.reviews.filter((review) => review.rating === 1).length
    const penalty = 1 + oneStarReviews * 0.15

    // Lower minimum threshold from 30 down to 5 game minutes
    return Math.max(5, Math.round(baseInterval * penalty))
  }

  function getQueueCapacity(): number {
    // INCREASED: Allows more visitors to wait in queue (formerly capped at 15)
    return Math.min(5 + state.day * 3, 30)
  }

  // inside useVisitors.ts
  function buildRoute(visitor: Visitor, facility: Facility): { route: Point[]; byCar: boolean } {
    const start = infrastructure.findNearestRoadPoint(visitor.x, visitor.y)
    const end = infrastructure.findNearestRoadPoint(facility.x, facility.y)

    const isAccessible = infrastructure.isFacilityRoadAccessible(facility)

    // Attempt road path generation
    let roadPath = isAccessible ? infrastructure.findRoadPath(start, end) : []

    // If a road path exists, FORCE travel by car and lock waypoints to the road network
    if (roadPath.length > 0) {
      return {
        route: [
          { x: visitor.x, y: visitor.y }, // Start position
          start,                           // Entry point onto the road network
          ...roadPath,                     // Intermediate road tiles
          end,                             // Exit point near facility
          { x: facility.x, y: facility.y } // Final facility destination
        ],
        byCar: true
      }
    }

    // Fall back to off-road walking path only if NO road path exists
    const walkingPath = infrastructure.findPath(
      { x: Math.round(visitor.x), y: Math.round(visitor.y) },
      { x: Math.round(facility.x), y: Math.round(facility.y) }
    )

    return {
      route: [
        { x: visitor.x, y: visitor.y },
        ...walkingPath,
        { x: facility.x, y: facility.y }
      ],
      byCar: false
    }
  }

  function getVisitorClass(): Visitor['visitorClass'] {
    if (state.week === 1) return Math.random() < 0.5 ? 'day_tripper' : 'budget_sightseer'
    if (state.week === 2) return Math.random() < 0.5 ? 'family' : 'motorist'
    if (state.week === 3) return Math.random() < 0.65 ? 'thrill_seeker' : 'budget_sightseer'
    return Math.random() < 0.5 ? 'luxury_vacationer' : 'thrill_seeker'
  }

  function getClassRequests(visitorClass: Visitor['visitorClass']) {
    if (visitorClass === 'day_tripper') return [VISITOR_REQUESTS[0]!]
    if (visitorClass === 'family') return [VISITOR_REQUESTS[0]!, VISITOR_REQUESTS[1]!]
    if (visitorClass === 'motorist') return [VISITOR_REQUESTS[0]!]
    if (visitorClass === 'thrill_seeker') return [VISITOR_REQUESTS[2]!, VISITOR_REQUESTS[4]!, VISITOR_REQUESTS[6]!]
    if (visitorClass === 'luxury_vacationer') return [VISITOR_REQUESTS[6]!, VISITOR_REQUESTS[7]!]
    return VISITOR_REQUESTS
  }

  function spawnVisitor(delayInTicks = 24): void {
    const nextArrival = state.queue.reduce((latest, visitor) => Math.max(latest, visitor.countdown), delayInTicks - 1) + 1
    const settings = DIFFICULTY_SETTINGS[state.difficulty]
    const visitorClass = getVisitorClass()
    const requestCount = Math.min(settings.maxRequests, visitorClass === 'day_tripper' ? 1 : 1 + Math.floor(Math.random() * settings.maxRequests))
    const classRequests = getClassRequests(visitorClass)
    const requests = Array.from({ length: requestCount }, (_, index) => classRequests[index % classRequests.length]!)

    const itinerary: ItineraryTask[] = [
      { type: 'parking_lot', label: 'Park at the Parking Lot', price: 0, completed: false, failed: false },
      ...(visitorClass === 'day_tripper' ? [] : [{ type: 'hotel' as const, label: 'Check into Hotel', price: visitorClass === 'luxury_vacationer' ? 150 : 40, completed: false, failed: false }]),
      ...requests.map((request) => ({ type: request.type, label: request.label, price: request.price, completed: false, failed: false }))
    ]

    const hasHotel = itinerary.some((task) => task.type === 'hotel')
    const patience = visitorClass === 'family' ? 150 : visitorClass === 'motorist' ? 45 : visitorClass === 'thrill_seeker' || visitorClass === 'luxury_vacationer' ? 70 : 100
    const durationInMinutes = hasHotel
      ? 1440 + Math.floor(Math.random() * 720)
      : 240 + Math.floor(Math.random() * 120)
      
    const visitor: Visitor = {
      id: state.nextVisitorId++,
      name: `Visitor #${state.nextVisitorId}`,
      type: visitorClass.replace('_', ' '),
      avatar: visitorClass === 'motorist' ? '🚗' : visitorClass === 'thrill_seeker' ? '🎒' : visitorClass === 'luxury_vacationer' ? '💼' : '🧳',
      isVip: false,
      visitorClass,
      countdown: nextArrival,
      arrivalTime: getFormattedArrivalTime(nextArrival),
      duration: durationInMinutes,
      satisfaction: 100,
      patience,
      maxPatience: patience,
      patienceCountdown: 0,
      satisfactionState: 'happy',
      isStuck: false,
      expressUntil: 0,
      status: 'waiting',
      currentTaskIndex: 0,
      x: 0,
      y: 3,
      targetX: 0,
      targetY: 3,
      travelMode: 'car',
      route: [],
      routeIndex: 0,
      itinerary
    }
    state.queue.push(visitor)
  }

  function spawnVipVisitor(delayInTicks = 1): void {
    const nextArrival = state.queue.reduce((latest, visitor) => Math.max(latest, visitor.countdown), delayInTicks - 1) + 1
    state.queue.push({
      id: state.nextVisitorId++,
      name: `VIP #${state.nextVisitorId}`,
      type: 'VIP Delegation',
      avatar: '💎',
      visitorClass: 'vip',
      countdown: nextArrival,
      arrivalTime: getFormattedArrivalTime(nextArrival),
      duration: 720,
      satisfaction: 100,
      patience: 45,
      maxPatience: 45,
      patienceCountdown: 0,
      satisfactionState: 'happy',
      isStuck: false,
      isVip: true,
      expressUntil: 0,
      status: 'waiting',
      currentTaskIndex: 0,
      x: 0,
      y: 3,
      targetX: 0,
      targetY: 3,
      travelMode: 'car',
      route: [],
      routeIndex: 0,
      itinerary: [
        { type: 'parking_lot', label: 'Park at the Parking Lot', price: 0, completed: false, failed: false },
        { type: 'hotel', label: 'VIP Check into Hotel', price: 150, completed: false, failed: false },
        { type: 'cable_car', label: 'VIP Cable Car Ride', price: 250, completed: false, failed: false },
        { type: 'cafe', label: 'VIP Alpine Dinner', price: 200, completed: false, failed: false }
      ]
    })
  }

  function checkoutVisitor(visitor: Visitor, reasonOverride?: string): void {
    visitor.itinerary.forEach((task) => {
      if (!task.completed) return
      const facility = state.facilities.find((item) => item.type === task.type && item.currentOccupancy > 0)
      if (facility) facility.currentOccupancy--
    })

    visitor.status = 'departed'
    const missedActivity = visitor.itinerary.some((task) => task.failed && task.type !== 'hotel')
    const satisfactionRating = visitor.satisfaction > 75 ? 5 : visitor.satisfaction > 40 ? 3 : 1
    const rating = missedActivity ? Math.min(2, satisfactionRating) : satisfactionRating
    const vipBonus = visitor.isVip && rating === 5 ? 1000 : 0
    const comment = reasonOverride || (visitor.isVip && rating < 5 ? 'The VIP delegation was disappointed by the town.' : missedActivity ? 'A lovely stay, but some activities were unavailable.' : rating === 5 ? 'Wonderful hotel and town!' : 'No place to stay!')

    state.money += vipBonus
    state.reviews.push({ id: Date.now(), author: visitor.name, rating, comment })
    state.visitors = state.visitors.filter((item) => item.id !== visitor.id)
  }

  function updateSatisfactionState(visitor: Visitor): void {
    if (visitor.satisfaction <= 0) visitor.satisfactionState = 'rage_quit'
    else if (visitor.satisfaction < 40) visitor.satisfactionState = 'furious'
    else if (visitor.satisfaction < 75) visitor.satisfactionState = 'frustrated'
    else visitor.satisfactionState = 'happy'
    visitor.patienceCountdown = visitor.satisfaction < 15 ? Math.ceil(Math.max(0, visitor.patience)) : 0
  }

  function changeSatisfaction(visitor: Visitor, amount: number): void {
    visitor.satisfaction = Math.max(0, Math.min(100, visitor.satisfaction + amount))
    updateSatisfactionState(visitor)
  }

  function rageQuit(visitor: Visitor, reason = 'Stuck in line for too long. Worst alpine resort ever!'): void {
    visitor.itinerary.forEach((task) => {
      if (!task.completed) return
      const facility = state.facilities.find((item) => item.type === task.type && item.currentOccupancy > 0)
      if (facility) facility.currentOccupancy--
    })
    const luggageId = Date.now() + visitor.id
    state.luggage.push({ id: luggageId, x: Math.round(visitor.x), y: Math.round(visitor.y), expiresAt: state.gameTime + 30 })
    state.money = Math.max(0, state.money - 150)
    state.visitors.filter((other) => other.id !== visitor.id && other.status === 'active').forEach((other) => {
      if (Math.hypot(other.x - visitor.x, other.y - visitor.y) <= 2) changeSatisfaction(other, -15)
    })
    visitor.satisfaction = 0
    visitor.satisfactionState = 'rage_quit'
    visitor.status = 'departed'
    state.reviews.push({ id: Date.now(), author: visitor.name, rating: 1, comment: reason })
    state.visitors = state.visitors.filter((item) => item.id !== visitor.id)
  }

  function voucherVisitor(visitorId: number): boolean {
    if (state.money < 50) return false
    const visitor = state.visitors.find((item) => item.id === visitorId && item.status === 'active')
    if (!visitor) return false
    state.money -= 50
    changeSatisfaction(visitor, 35)
    visitor.patience = visitor.maxPatience
    updateSatisfactionState(visitor)
    return true
  }

  function attemptTask(visitor: Visitor, task: ItineraryTask): void {
    const facility = state.facilities.find(
      (item) => item.type === task.type && item.maintenance > 15
    )

    if (!facility) {
      if (task.type !== 'hotel' && task.type !== 'parking_lot') {
        task.failed = true
        visitor.currentTaskIndex++
        changeSatisfaction(visitor, state.week === 1 ? -10 : -25)
      } else {
        rageQuit(visitor, `No ${task.type.replace('_', ' ')} available in town!`)
      }
      return
    }

    // --- PARKING LOT QUEUE HANDLING ---
    const maxCapacity = facilityApi.getEffectiveCapacity(facility, state.gameTime)
    const isParkingFull = task.type === 'parking_lot' && facility.currentOccupancy >= maxCapacity

    if (isParkingFull) {
      const parkRoadPoint = infrastructure.findNearestRoadPoint(facility.x, facility.y)

      // Count how many cars are already waiting in line for this parking lot
      const queueIndex = state.visitors.filter(
        (v) => v.status === 'active' && v.targetX === parkRoadPoint.x && v.targetY === parkRoadPoint.y && v.id !== visitor.id
      ).length

      // Queue up backwards along the entry road (e.g., 1 tile spacing per car)
      const offsetTarget = {
        x: parkRoadPoint.x - queueIndex,
        y: parkRoadPoint.y
      }

      visitor.targetX = offsetTarget.x
      visitor.targetY = offsetTarget.y
      visitor.isStuck = true // Triggers congestion/patience warnings for stuck drivers

      if (visitor.x !== offsetTarget.x || visitor.y !== offsetTarget.y) {
        const routePlan = infrastructure.findRoadPath(
          infrastructure.findNearestRoadPoint(visitor.x, visitor.y),
          offsetTarget
        )
        visitor.route = routePlan
        visitor.routeIndex = 0
        visitor.travelMode = 'car'
      }
      return
    }

    // Handle standard non-parking facility capacity blocks
    if (task.type !== 'parking_lot' && facility.currentOccupancy >= maxCapacity) {
      visitor.isStuck = true
      return
    }

    const routePlan = buildRoute(visitor, facility)
    visitor.travelMode = routePlan.byCar ? 'car' : 'walking'

    if (visitor.targetX !== facility.x || visitor.targetY !== facility.y || !visitor.route?.length) {
      visitor.route = routePlan.route
      visitor.routeIndex = 0
    }
    visitor.targetX = facility.x
    visitor.targetY = facility.y

    // --- ARRIVAL & ACTIVITY TIMER ---
    if (Math.abs(visitor.x - visitor.targetX) <= 1 && Math.abs(visitor.y - visitor.targetY) <= 1) {
      if (visitor.taskTimer === undefined) {
        visitor.taskTimer = task.type === 'parking_lot' ? 3 : task.type === 'cafe' ? 60 : task.type === 'hotel' ? 180 : 45
        facility.currentOccupancy++
        state.money += Math.round(task.price * (1 + state.taxRate) * events.revenueMultiplier())
        if (task.type === 'parking_lot') visitor.travelMode = 'walking'
        return
      }

      if (visitor.taskTimer > 0) {
        visitor.taskTimer--
        changeSatisfaction(visitor, 0.05)
        return
      }

      // Parking & Hotels hold occupancy for the entire trip
      if (task.type !== 'parking_lot' && task.type !== 'hotel') {
        facility.currentOccupancy--
      }

      task.completed = true
      visitor.patience = visitor.maxPatience
      visitor.taskTimer = undefined
      visitor.currentTaskIndex++
    }
  }

  function expressDispatch(visitorId: number): boolean {
    if (state.money < 40) return false
    const visitor = state.visitors.find((item) => item.id === visitorId && item.status === 'active')
    if (!visitor) return false
    const task = visitor.itinerary[visitor.currentTaskIndex]
    const facility = task && state.facilities.find((item) => item.type === task.type)
    if (!facility) return false
    const routePlan = buildRoute(visitor, facility)
    state.money -= 40
    visitor.route = routePlan.route
    visitor.routeIndex = 0
    visitor.travelMode = routePlan.byCar ? 'car' : 'walking'
    visitor.expressUntil = state.gameTime + 6
    visitor.patience = Math.min(visitor.maxPatience, visitor.patience + 20)
    return true
  }

  function canExpressDispatch(visitor: Visitor): boolean {
    if (state.money < 40 || visitor.status !== 'active') return false
    const task = visitor.itinerary[visitor.currentTaskIndex]
    const facility = task && state.facilities.find((item) => item.type === task.type)
    return Boolean(facility)
  }

  function tickVisitors(): void {
    state.luggage = state.luggage.filter((obstacle) => obstacle.expiresAt > state.gameTime)

    if (state.activeEvent?.id === 'vip' && state.eventHoursRemaining === state.activeEvent.duration) {
      for (let index = 0; index < 5; index++) spawnVipVisitor(index)
    }

    state.queue.forEach((visitor) => {
      if (visitor.countdown > 0) visitor.countdown--
      else visitor.status = 'active'
    })

    const arrived = state.queue.filter((visitor) => visitor.status === 'active')
    if (arrived.length) {
      state.visitors.push(...arrived)
      state.queue = state.queue.filter((visitor) => visitor.status === 'waiting')
    }

    if (state.gameTime % getSpawnInterval() === 0 && state.queue.length < getQueueCapacity()) {
      // Spawn up to 2-4 visitors at once instead of 1-3
      const burst = state.week >= 4 ? 4 : events.arrivalMultiplier() >= 2 ? 3 : 2
      for (let index = 0; index < burst; index++) spawnVisitor(getSpawnInterval())
    }

    state.visitors.slice().forEach((visitor) => {
      if (visitor.status !== 'active') return

      visitor.duration--
      const task = visitor.itinerary[visitor.currentTaskIndex]

      // --- HIKING / SIGHTSEEING HANDLING ---
      if (task && (task.type === 'hike' || task.type === 'sightseeing')) {
        // If no route or reached target, wander to a random nearby road point
        if (!visitor.route?.length || (visitor.routeIndex ?? 0) >= visitor.route.length) {
          const roadPoints = infrastructure.getRoadPoints()
          if (roadPoints.length > 0) {
            const randomTarget = roadPoints[Math.floor(Math.random() * roadPoints.length)]!
            visitor.route = [
              { x: visitor.x, y: visitor.y },
              ...infrastructure.findPath(
                { x: Math.round(visitor.x), y: Math.round(visitor.y) },
                randomTarget
              )
            ]
            visitor.routeIndex = 0
            visitor.travelMode = 'walking'
          }
        }

        if (visitor.taskTimer === undefined) visitor.taskTimer = 60
        if (visitor.taskTimer > 0) {
          visitor.taskTimer--
          changeSatisfaction(visitor, 0.1)
        } else {
          task.completed = true
          visitor.taskTimer = undefined
          visitor.currentTaskIndex++
        }
        return
      }

      // --- IDLE WANDERING (All tasks complete) ---
      if (!task) {
        // Periodically wander around town while enjoying their stay
        if ((!visitor.route?.length || (visitor.routeIndex ?? 0) >= visitor.route.length) && Math.random() < 0.05) {
          const roadPoints = infrastructure.getRoadPoints()
          if (roadPoints.length > 0) {
            const randomPoint = roadPoints[Math.floor(Math.random() * roadPoints.length)]!
            visitor.route = [
              { x: visitor.x, y: visitor.y },
              ...infrastructure.findPath(
                { x: Math.round(visitor.x), y: Math.round(visitor.y) },
                randomPoint
              )
            ]
            visitor.routeIndex = 0
            visitor.travelMode = 'walking'
          }
        }

        visitor.isStuck = false
        visitor.patience = Math.min(visitor.maxPatience, visitor.patience + 0.1)
        changeSatisfaction(visitor, 0.05)

        if (visitor.duration <= 0) {
          checkoutVisitor(visitor, 'Had a wonderful time exploring and relaxing in town!')
        }
        return
      }

      // --- ACTIVE TASK BEHAVIOR ---
      const congestion = getCongestion(visitor)
      const taskFacility = state.facilities.find((facility) => facility.type === task.type)
      const serviceRelief = taskFacility?.serviceUntil && taskFacility.serviceUntil >= state.gameTime ? 0.25 : 0
      const queuedAtCapacity = Boolean(taskFacility && taskFacility.currentOccupancy >= facilityApi.getEffectiveCapacity(taskFacility, state.gameTime))

      // Guests currently inside an activity (taskTimer > 0) do NOT count as stuck
      visitor.isStuck = (visitor.taskTimer ?? 0) === 0 && (congestion > 1 || queuedAtCapacity)
      const onboardingProtection = state.week === 1 ? 0.35 : 1

      const satisfactionDelta = visitor.isStuck
        ? (queuedAtCapacity ? -1.5 : -2.5) * onboardingProtection
        : 0.1

      changeSatisfaction(visitor, satisfactionDelta)

      if (visitor.isStuck) {
        visitor.patience -= congestion * congestion * 0.25 * events.patienceMultiplier()
      } else {
        visitor.patience = Math.min(visitor.maxPatience, visitor.patience + 0.1)
      }

      updateSatisfactionState(visitor)

      if (!task.completed) attemptTask(visitor, task)

      if (visitor.satisfaction <= 0 && state.visitors.some((item) => item.id === visitor.id)) {
        rageQuit(visitor, 'Stuck in line with no service!')
      } else if (visitor.patience <= 0 && state.visitors.some((item) => item.id === visitor.id)) {
        rageQuit(visitor, 'Traffic and long waits ruined the visit.')
      } else if (visitor.duration <= 0 && state.visitors.some((item) => item.id === visitor.id)) {
        checkoutVisitor(visitor)
      }
    })
  }

  function moveVisitors(deltaSeconds = 0.016): void {
    state.visitors.forEach((visitor) => {
      if (visitor.status !== 'active') return
      moveVisitor(visitor, deltaSeconds)
    })
  }

  function moveVisitor(visitor: Visitor, deltaSeconds = 0.016): void {
    const route = visitor.route
    if (!route?.length || visitor.routeIndex === undefined || visitor.routeIndex >= route.length) return
    const waypoint = route[visitor.routeIndex]
    if (!waypoint) return

    const dx = waypoint.x - visitor.x
    const dy = waypoint.y - visitor.y
    const distance = Math.hypot(dx, dy)

    const expressMultiplier = visitor.expressUntil > state.gameTime ? 2 : 1
    const moodMultiplier = visitor.satisfactionState === 'furious' ? 0 : 1
    const obstacleMultiplier = getObstaclePenalty(visitor)
    const tileSpeed = infrastructure.getTileSpeedMultiplier(waypoint.x, waypoint.y)

    // Speed in grid tiles per second
    const baseSpeed = visitor.travelMode === 'car' ? 6.0 : 1.8

    const speed = baseSpeed
      * expressMultiplier
      * moodMultiplier
      * tileSpeed
      * deltaSeconds
      * (state.isFastForwarding ? 3 : 1)
      * events.movementMultiplier()
      / getCongestion(visitor)
      / obstacleMultiplier

    if (distance <= speed) {
      visitor.x = waypoint.x
      visitor.y = waypoint.y
      visitor.routeIndex++
    } else {
      visitor.x += (dx / distance) * speed
      visitor.y += (dy / distance) * speed
    }
  }

  function getCongestion(visitor: Visitor): number {
    const nearby = state.visitors.filter((other) => other.status === 'active' && Math.round(other.x) === Math.round(visitor.x) && Math.round(other.y) === Math.round(visitor.y)).length
    return Math.max(1, nearby)
  }

  function getObstaclePenalty(visitor: Visitor): number {
    return state.luggage.some((obstacle) => Math.hypot(obstacle.x - visitor.x, obstacle.y - visitor.y) <= 1) ? 4 : 1
  }

  function clearLuggage(luggageId: number): boolean {
    if (state.money < 30) return false
    const exists = state.luggage.some((obstacle) => obstacle.id === luggageId)
    if (!exists) return false
    state.money -= 30
    state.luggage = state.luggage.filter((obstacle) => obstacle.id !== luggageId)
    return true
  }

  function getFormattedArrivalTime(countdownMinutes: number): string {
    const currentDay = state.day ?? 1
    const currentHour = state.hour ?? 0
    const currentMinute = (state.gameTime ?? 0) % 60

    const totalArrivalMinutes = currentHour * 60 + currentMinute + countdownMinutes

    const extraDays = Math.floor(totalArrivalMinutes / 1440)
    const minutesInArrivalDay = totalArrivalMinutes % 1440

    const arrivalDay = currentDay + extraDays
    const arrivalHour = Math.floor(minutesInArrivalDay / 60)
    const arrivalMin = minutesInArrivalDay % 60

    const hh = arrivalHour.toString().padStart(2, '0')
    const mm = arrivalMin.toString().padStart(2, '0')

    return `Day ${arrivalDay} at ${hh}:${mm}`
  }

  return {
    activeVisitors,
    spawnVisitor,
    attemptTask,
    expressDispatch,
    canExpressDispatch,
    voucherVisitor,
    clearLuggage,
    tickVisitors,
    moveVisitors,
    moveVisitor,
    checkoutVisitor,
    getSpawnInterval,
    getQueueCapacity,
    buildRoute,
    isNightTime
  }
}