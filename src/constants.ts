import { Hospital, Supply, Vehicle } from './types';

export const INITIAL_HOSPITALS: Hospital[] = [
  { id: 'depot', name: 'Central Medical Depot', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, priority: 5, isUrgent: false },
  { id: '1', name: 'Apollo Hospital', city: 'Chennai', lat: 13.0827, lng: 80.2707, priority: 5, isUrgent: true },
  { id: '2', name: 'KIMS Hospital', city: 'Hyderabad', lat: 17.3850, lng: 78.4867, priority: 4, isUrgent: false },
  { id: '3', name: 'Manipal Hospital', city: 'Mysuru', lat: 12.2958, lng: 76.6394, priority: 3, isUrgent: false },
  { id: '4', name: 'Amrita Institute', city: 'Kochi', lat: 9.9312, lng: 76.2673, priority: 5, isUrgent: true },
  { id: '5', name: 'Kasturba Medical', city: 'Mangaluru', lat: 12.9141, lng: 74.8560, priority: 2, isUrgent: false },
  { id: '6', name: 'JIPMER', city: 'Puducherry', lat: 11.9416, lng: 79.8083, priority: 4, isUrgent: false },
  { id: '7', name: 'CMC Vellore', city: 'Vellore', lat: 12.9165, lng: 79.1325, priority: 4, isUrgent: false },
];

export const INITIAL_SUPPLIES: Supply[] = [
  { id: 's1', name: 'Vaccine Vials (cold chain)', weight: 12, value: 95, type: 'emergency' },
  { id: 's2', name: 'Insulin Packs', weight: 8, value: 70, type: 'consumable' },
  { id: 's3', name: 'PPE Kits (bulk)', weight: 25, value: 40, type: 'consumable' },
  { id: 's4', name: 'Oxygen Concentrators', weight: 35, value: 120, type: 'equipment' },
  { id: 's5', name: 'Blood Bags (O-)', weight: 10, value: 110, type: 'emergency' },
  { id: 's6', name: 'Antibiotics Box', weight: 6, value: 55, type: 'consumable' },
  { id: 's7', name: 'Surgical Instruments', weight: 18, value: 65, type: 'equipment' },
  { id: 's8', name: 'IV Fluids (carton)', weight: 22, value: 50, type: 'consumable' },
  { id: 's9', name: 'Diagnostic Kits', weight: 5, value: 45, type: 'consumable' },
  { id: 's10', name: 'Portable Ventilator', weight: 40, value: 150, type: 'equipment' },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'Tempo Traveller 01', capacity: 80, type: 'refrigerated_van' },
  { id: 'v2', name: 'Light Truck 01', capacity: 150, type: 'standard_truck' },
  { id: 'v3', name: 'Emergency Bike 04', capacity: 15, type: 'emergency_motorcycle' },
];
