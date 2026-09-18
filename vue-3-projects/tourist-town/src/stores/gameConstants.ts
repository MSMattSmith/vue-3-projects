import type { ActivityType, Difficulty, DraftOffer, Point } from './gameTypes'
import type { EventCard } from './gameTypes'

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  hotel: '#D97706',
  cafe: '#7C3AED',
  cable_car: '#0284C7',
  hike: '#16A34A',
  sightseeing: '#B45309',
  biking: '#EA580C',
  skiing: '#38BDF8',
  train_station: '#475569',
  neighbouring_town: '#6B7280',
  information_kiosk: '#0EA5E9',
  parking_lot: '#64748B',
  alpine_bistro: '#DC2626',
  shuttle_bus: '#F59E0B',
  bike_park: '#65A30D',
  express_lane: '#14B8A6',
  alpine_express: '#334155',
  grand_resort: '#B45309',
  boutique_hotel: '#A16207',
  observation_deck: '#0891B2',
  maintenance_hub: '#7C3AED'
}

export const ROAD_NETWORK: Point[] = [
  { x: 0, y: 3 }, { x: 3, y: 6 }, { x: 8, y: 6 }, { x: 13, y: 11 }, { x: 15, y: 11 }
]

export const ROAD_BRANCH: Point[] = [
  { x: 8, y: 6 }, { x: 8, y: 3 }, { x: 6, y: 1 }
]

export const ROAD_SEGMENTS = [ROAD_NETWORK, ROAD_BRANCH]

export const VISITOR_REQUESTS: Array<{ type: ActivityType; label: string; price: number }> = [
  { type: 'sightseeing', label: 'Go Sightseeing', price: 10 },
  { type: 'hike', label: 'Go Hiking', price: 20 },
  { type: 'cafe', label: 'Visit an Alpine Café', price: 15 },
  { type: 'biking', label: 'Rent a mountain bike', price: 25 },
  { type: 'skiing', label: 'Go skiing', price: 35 },
  { type: 'cable_car', label: 'Ride the cable car', price: 30 },
  { type: 'train_station', label: 'Take a scenic train', price: 30 }
  ,{ type: 'alpine_bistro', label: 'Dine at the Alpine Bistro', price: 45 }
  ,{ type: 'observation_deck', label: 'Visit the Peak Observation Deck', price: 200 }
]

export const DIFFICULTY_SETTINGS: Record<Difficulty, { spawnHours: number; maxRequests: number }> = {
  intro: { spawnHours: 24, maxRequests: 1 }, easy: { spawnHours: 18, maxRequests: 1 }, medium: { spawnHours: 14, maxRequests: 2 },
  hard: { spawnHours: 11, maxRequests: 2 }, 'very hard': { spawnHours: 9, maxRequests: 2 }, extreme: { spawnHours: 7, maxRequests: 3 }, chaos: { spawnHours: 5, maxRequests: 3 }
}

export const FACILITY_BLUEPRINTS: DraftOffer[] = [
  { type: 'cafe', label: 'Small Café', icon: '☕', capacity: 3, cost: 150, description: 'Fast, affordable food service.', unlockWeek: 1 },
  { type: 'hotel', label: 'Budget Motel', icon: '🏨', capacity: 4, cost: 200, description: 'Simple rooms for overnight guests.', unlockWeek: 1 },
  { type: 'information_kiosk', label: 'Information Kiosk', icon: 'ℹ️', capacity: 2, cost: 100, description: 'Reduces nearby lost and stuck visitors.', unlockWeek: 1 },
  { type: 'parking_lot', label: 'Parking Lot', icon: '🅿️', capacity: 8, cost: 300, description: 'Transfers motorists into walking traffic.', unlockWeek: 2 },
  { type: 'cable_car', label: 'Cable Car Station', icon: '🚡', capacity: 8, cost: 600, description: 'Moves guests quickly to altitude.', unlockWeek: 2 },
  { type: 'alpine_bistro', label: 'Alpine Bistro', icon: '🍷', capacity: 6, cost: 400, description: 'Premium meals with higher revenue.', unlockWeek: 2 },
  { type: 'bike_park', label: 'Mountain Bike Park', icon: '🚵', capacity: 10, cost: 750, description: 'High-yield extreme sports attraction.', unlockWeek: 3 },
  { type: 'shuttle_bus', label: 'Shuttle Bus Stop', icon: '🚌', capacity: 8, cost: 500, description: 'Runs fast transfers between distant nodes.', unlockWeek: 3 },
  { type: 'boutique_hotel', label: 'Boutique Hotel', icon: '🏨', capacity: 10, cost: 800, description: 'Luxury rooms with fast check-in.', unlockWeek: 3 },
  { type: 'express_lane', label: 'Express Lane', icon: '⚡', capacity: 4, cost: 100, description: 'Reduces slowdown at busy intersections.', unlockWeek: 3 },
  { type: 'alpine_express', label: 'Alpine Express Train', icon: '🚆', capacity: 20, cost: 2000, description: 'High-volume arrival hub.', unlockWeek: 4 },
  { type: 'grand_resort', label: 'Grand Mountain Resort', icon: '🏔️', capacity: 25, cost: 3500, description: 'Generates prestige and handles mass tourism.', unlockWeek: 4 },
  { type: 'observation_deck', label: 'Peak Observation Deck', icon: '🔭', capacity: 12, cost: 1800, description: 'Premium high-altitude destination.', unlockWeek: 4 },
  { type: 'maintenance_hub', label: 'Automated Maintenance Hub', icon: '🛠️', capacity: 4, cost: 1200, description: 'Repairs nearby facilities and clears luggage.', unlockWeek: 4 }
]

export const EVENT_DECK: EventCard[] = [
  { id: 'snowstorm', name: 'Heavy Snowstorm', category: 'weather', description: 'Ground paths freeze. Cable cars earn more.', movementMultiplier: 0.5, patienceMultiplier: 1, arrivalMultiplier: 1, revenueMultiplier: 1.5, duration: 12, emergencyCost: 200 },
  { id: 'fog', name: 'Thick Alpine Fog', category: 'weather', description: 'Visitors move cautiously and indoor venues earn more.', movementMultiplier: 0.7, patienceMultiplier: 1.4, arrivalMultiplier: 1, revenueMultiplier: 1.4, duration: 10, emergencyCost: 150 },
  { id: 'heatwave', name: 'Heatwave Surge', category: 'weather', description: 'Outdoor demand spikes while patience drops faster.', movementMultiplier: 1, patienceMultiplier: 1.3, arrivalMultiplier: 1.25, revenueMultiplier: 1.2, duration: 12, emergencyCost: 175 },
  { id: 'downpour', name: 'Torrential Downpour', category: 'weather', description: 'Outdoor routes slow and cafés become the hot spot.', movementMultiplier: 0.75, patienceMultiplier: 1.2, arrivalMultiplier: 1, revenueMultiplier: 1.5, duration: 8, emergencyCost: 150 },
  { id: 'powder-blitz', name: 'Powder Day Blitz', category: 'weather', description: 'A rush of extreme-sports tourists arrives with low patience.', movementMultiplier: 1, patienceMultiplier: 2, arrivalMultiplier: 2, revenueMultiplier: 1.8, duration: 12, emergencyCost: 250 },
  { id: 'vip', name: 'VIP Delegation', category: 'event', description: 'High-value guests demand fast service and reward perfect routing.', movementMultiplier: 1.15, patienceMultiplier: 1.8, arrivalMultiplier: 1, revenueMultiplier: 2, duration: 12, emergencyCost: 250 },
  { id: 'bus-breakdown', name: 'Tour Bus Breakdown', category: 'event', description: 'Traffic is disrupted until emergency towing clears the route.', movementMultiplier: 0.6, patienceMultiplier: 1.5, arrivalMultiplier: 1, revenueMultiplier: 1, duration: 6, emergencyCost: 200 },
  { id: 'food-fest', name: 'Local Food & Wine Fest', category: 'event', description: 'Cafés are booming, but nearby paths are crowded.', movementMultiplier: 0.7, patienceMultiplier: 1.25, arrivalMultiplier: 1.3, revenueMultiplier: 2, duration: 12, emergencyCost: 175 },
  { id: 'outage', name: 'Power Grid Outage', category: 'event', description: 'Large hotels and cable cars temporarily lose service.', movementMultiplier: 1, patienceMultiplier: 1.7, arrivalMultiplier: 1, revenueMultiplier: 0.8, duration: 4, emergencyCost: 300 },
  { id: 'early-departure', name: 'Early Departure Craze', category: 'event', description: 'Hotel guests rush for the exit, freeing rooms but clogging roads.', movementMultiplier: 0.65, patienceMultiplier: 1.3, arrivalMultiplier: 1.5, revenueMultiplier: 1, duration: 2, emergencyCost: 100 }
]
