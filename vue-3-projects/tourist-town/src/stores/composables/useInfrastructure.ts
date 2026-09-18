import type { GameState, Facility, InfrastructurePath, Point, RoadTile, RoadType } from '../gameTypes'
import { ROAD_NETWORK, ROAD_SEGMENTS } from '../gameConstants'

export function useInfrastructure(state: GameState) {
  function getRoadPoints(): Point[] {
    const points: Point[] = []
    ROAD_SEGMENTS.forEach((segment) => segment.forEach((point) => {
      if (!points.some((existing) => existing.x === point.x && existing.y === point.y)) points.push(point)
    }))
    state.infrastructurePaths.filter((path) => path.upgraded).forEach((path) => points.push(path.from, path.to))

    // Support state.roads as an Array (both direct RoadTile or single-key object wrappers)
    if (Array.isArray(state.roads)) {
      state.roads.forEach((entry: any) => {
        const road = entry.x !== undefined ? entry : Object.values(entry)[0] as RoadTile
        if (road) points.push({ x: road.x, y: road.y })
      })
    } else if (state.roads instanceof Map) {
      state.roads.forEach((road) => points.push({ x: road.x, y: road.y }))
    }
    return points
  }

  function getTileSpeedMultiplier(x: number, y: number): number {
    const tileX = Math.floor(x)
    const tileY = Math.floor(y)

    let road: RoadTile | undefined

    if (Array.isArray(state.roads)) {
      // Look up within array format
      const found = state.roads.find((entry: any) => {
        if (entry.x === tileX && entry.y === tileY) return true
        const key = `${tileX},${tileY}`
        return Boolean(entry[key])
      })
      road = found?.x !== undefined ? found : found?.[`${tileX},${tileY}`]
    } else if (state.roads instanceof Map) {
      road = state.roads.get(`${tileX},${tileY}`)
    } else if (state.roads) {
      road = state.roads[`${tileX},${tileY}`]
    }

    if (!road) return 0.5 // Off-road speed penalty

    const baseSpeed = road.type === 'paved' ? 1.3 : 1
    if (road.currentOccupants > 5) return baseSpeed * 0.3
    if (road.currentOccupants > 3) return baseSpeed * 0.6
    return baseSpeed
  }

  function placeRoad(x: number, y: number, type: RoadType = 'dirt'): boolean {
    if (x < 0 || y < 0 || x >= state.gridWidth || y >= state.gridHeight) return false

    const tileX = Math.floor(x)
    const tileY = Math.floor(y)
    const key = `${tileX},${tileY}`

    if (!Array.isArray(state.roads)) {
      // If initialized incorrectly, convert state.roads to an Array
      state.roads = []
    }

    // Find existing road index inside state.roads Array
    const existingIndex = (state.roads as unknown as any[]).findIndex((entry) => {
      if (entry.x === tileX && entry.y === tileY) return true
      if (entry[key]) return true
      return false
    })

    const existingEntry = existingIndex !== -1 ? (state.roads as unknown as any[])[existingIndex] : null
    const existing = existingEntry?.x !== undefined ? existingEntry : existingEntry?.[key]

    if (existing?.type === 'paved' && type === 'dirt') return false
    if (existing?.type === type) return false

    const cost = type === 'paved' ? 30 : 10
    if (state.money < cost) return false

    state.money -= cost

    const roadTile: RoadTile = {
      x: tileX,
      y: tileY,
      type,
      speedMultiplier: type === 'paved' ? 1.3 : 1,
      currentOccupants: existing?.currentOccupants || 0,
      base: existing?.base
    }

    if (existingIndex !== -1) {
      // Update existing item in reactive array
      (state.roads as unknown as any[])[existingIndex] = roadTile
    } else {
      // Append new tile to reactive array
      (state.roads as unknown as any[]).push(roadTile)
    }

    return true
  }

  function findPath(start: Point, target: Point): Point[] {
    const queue: Point[][] = [[start]]
    const visited = new Set([`${start.x},${start.y}`])
    const directions = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
    while (queue.length) {
      const path = queue.shift()!
      const current = path[path.length - 1]!
      if (current.x === target.x && current.y === target.y) return path
      directions.forEach((direction) => {
        const next = { x: current.x + direction.x, y: current.y + direction.y }
        const key = `${next.x},${next.y}`
        if (next.x >= 0 && next.x < state.gridWidth && next.y >= 0 && next.y < state.gridHeight && !visited.has(key)) {
          visited.add(key)
          queue.push([...path, next])
        }
      })
    }
    return [start]
  }

  function getRoadAt(x: number, y: number): RoadTile | undefined {
    const tileX = Math.floor(x)
    const tileY = Math.floor(y)
    const key = `${tileX},${tileY}`

    if (Array.isArray(state.roads)) {
      const entry = state.roads.find((item: any) =>
        (item.x === tileX && item.y === tileY) || Boolean(item[key])
      )
      return entry?.x !== undefined ? entry : entry?.[key]
    }
    if (state.roads instanceof Map) return state.roads.get(key)
    if (state.roads) return state.roads[key]
    return undefined
  }

  function updateOccupancy(oldPos: Point | null, newPos: Point): void {
    if (oldPos) {
      const oldRoad = getRoadAt(oldPos.x, oldPos.y)
      if (oldRoad && oldRoad.currentOccupants > 0) oldRoad.currentOccupants--
    }
    const newRoad = getRoadAt(newPos.x, newPos.y)
    if (newRoad) newRoad.currentOccupants++
  }

  function findNearestRoadPoint(x: number, y: number): Point {
    return getRoadPoints().reduce((nearest, point) => {
      const nearestDistance = Math.hypot(nearest.x - x, nearest.y - y)
      const pointDistance = Math.hypot(point.x - x, point.y - y)
      return pointDistance < nearestDistance ? point : nearest
    }, ROAD_NETWORK[0]!)
  }

  function isNearRoad(x: number, y: number): boolean {
    return getRoadPoints().some((point) => Math.hypot(point.x - x, point.y - y) <= 1.5)
  }

  function isFacilityRoadAccessible(facility: Facility): boolean {
    return isNearRoad(facility.x, facility.y) || state.infrastructurePaths.some(
      (path) => path.id === `path-${facility.id}` && path.upgraded
    )
  }

  function findRoadPath(start: Point, end: Point): Point[] {
    const points = getRoadPoints()
    const distances = new Map<string, number>()
    const previous = new Map<string, string>()
    const unvisited = new Set(points.map((point) => `${point.x},${point.y}`))
    const pointByKey = new Map(points.map((point) => [`${point.x},${point.y}`, point]))
    const edges = new Map<string, string[]>()

    ROAD_SEGMENTS.forEach((segment) => segment.forEach((point, index) => {
      const key = `${point.x},${point.y}`
      const neighbors = edges.get(key) || []
      if (index > 0) neighbors.push(`${segment[index - 1]!.x},${segment[index - 1]!.y}`)
      if (index < segment.length - 1) neighbors.push(`${segment[index + 1]!.x},${segment[index + 1]!.y}`)
      edges.set(key, neighbors)
    }))

    const iterateRoads = (road: RoadTile) => {
      const key = `${road.x},${road.y}`
      const neighbors = edges.get(key) || []
        ;[{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }].forEach((direction) => {
          const nx = road.x + direction.x
          const ny = road.y + direction.y
          const neighborKey = `${nx},${ny}`

          // Check array, map, and object formats
          let exists = false
          if (Array.isArray(state.roads)) {
            exists = state.roads.some((entry: any) =>
              (entry.x === nx && entry.y === ny) || Boolean(entry[neighborKey])
            )
          } else if (state.roads instanceof Map) {
            exists = state.roads.has(neighborKey)
          } else if (state.roads) {
            exists = Boolean(state.roads[neighborKey])
          }

          if (exists) neighbors.push(neighborKey)
        })
      edges.set(key, neighbors)
    }

    if (Array.isArray(state.roads)) {
      state.roads.forEach((entry: any) => {
        const road = entry.x !== undefined ? entry : Object.values(entry)[0] as RoadTile
        if (road) iterateRoads(road)
      })
    } else if (state.roads instanceof Map) {
      state.roads.forEach(iterateRoads)
    } else if (state.roads) {
      Object.values(state.roads).forEach((road: any) => iterateRoads(road))
    }

    state.infrastructurePaths.filter((path) => path.upgraded).forEach((path) => {
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
        ; (edges.get(currentKey) || []).forEach((neighborKey) => {
          if (!unvisited.has(neighborKey)) return
          const neighbor = pointByKey.get(neighborKey)!
          const stepCost = getTileMovementCost(neighbor.x, neighbor.y)
          const distance = (distances.get(currentKey) || 0) + stepCost
          if (distance < (distances.get(neighborKey) ?? Infinity)) {
            distances.set(neighborKey, distance)
            previous.set(neighborKey, currentKey)
          }
        })
    }

    const result: Point[] = []
    let key: string | undefined = endKey
    while (key) {
      const point = pointByKey.get(key)
      if (point) result.unshift(point)
      key = previous.get(key)
    }
    return result.length ? result : [start]
  }

  function upgradeInfrastructurePath(pathId: string): boolean {
    const path = state.infrastructurePaths.find((item) => item.id === pathId)
    if (!path || path.upgraded) return false
    path.upgraded = true
    return true
  }

  function getTileMovementCost(x: number, y: number): number {
    const road = getRoadAt(x, y)

    if (road) {
      // Paved roads cost less than dirt roads, encouraging preference for paved routes
      return road.type === 'paved' ? 1 : 1.5
    }

    // Extremely high cost for non-road terrain to keep vehicles on roads
    return 9999
  }

  return { getRoadPoints, getTileSpeedMultiplier, placeRoad, findPath, updateOccupancy, findNearestRoadPoint, isNearRoad, isFacilityRoadAccessible, findRoadPath, upgradeInfrastructurePath, getTileMovementCost }
}

export type InfrastructureApi = ReturnType<typeof useInfrastructure>
export type InfrastructureState = Pick<GameState, 'infrastructurePaths'>
export type { InfrastructurePath }