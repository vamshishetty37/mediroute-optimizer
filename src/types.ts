/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Hospital {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  priority: number; // 1-5
  isUrgent: boolean;
}

export interface Supply {
  id: string;
  name: string;
  weight: number;
  value: number;
  type: 'consumable' | 'equipment' | 'emergency';
}

export interface Vehicle {
  id: string;
  name: string;
  capacity: number;
  type: 'standard_truck' | 'refrigerated_van' | 'emergency_motorcycle';
}

export interface RouteStep {
  hospital: Hospital;
  distanceFromPrevious: number;
}

export interface BruteForceMetric {
  distance?: number;
  value?: number;
  weight?: number;
  time: number;
}

export interface TSPResult {
  route: RouteStep[];
  totalDistance: number;
  nnDistance: number;
  nnTime: number;
  twoOptTime: number;
  improvement: number;
  swaps: number;
  bruteForce?: BruteForceMetric;
}

export interface KnapsackResult {
  packedItems: Supply[];
  totalValue: number;
  totalWeight: number;
  capacity: number;
  utilization: number;
  computeTime: number;
  bruteForce?: BruteForceMetric;
}

export interface OptimizationResult {
  tsp: TSPResult | null;
  knapsack: KnapsackResult | null;
}
