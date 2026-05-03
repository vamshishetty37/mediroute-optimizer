import { Hospital, Supply, TSPResult, KnapsackResult, RouteStep } from '../types';

// Distance calculation using Haversine formula
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// TSP: Nearest Neighbor Algorithm
export const solveTSPNearestNeighbor = (hospitals: Hospital[], startNode: Hospital): Hospital[] => {
  const unvisited = [...hospitals].filter(h => h.id !== startNode.id);
  const route = [startNode];
  let current = startNode;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = getDistance(current.lat, current.lng, unvisited[0].lat, unvisited[0].lng);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = getDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    route.push(current);
  }

  return route;
};

// TSP: 2-Opt Refinement
export const refineTSP2Opt = (route: Hospital[]): { route: Hospital[]; swaps: number } => {
  let bestRoute = [...route];
  let improved = true;
  let swaps = 0;

  const calculateTotalDist = (r: Hospital[]) => {
    let d = 0;
    for (let i = 0; i < r.length - 1; i++) {
      d += getDistance(r[i].lat, r[i].lng, r[i+1].lat, r[i+1].lng);
    }
    return d;
  };

  while (improved) {
    improved = false;
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        // Try reversing the segment from i to j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];

        if (calculateTotalDist(newRoute) < calculateTotalDist(bestRoute)) {
          bestRoute = newRoute;
          improved = true;
          swaps++;
        }
      }
    }
  }

  return { route: bestRoute, swaps };
};

export interface BruteForceResult {
  distance?: number;
  value?: number;
  time: number;
}

// TSP: Brute Force (O(n!))
export const solveTSPBruteForce = (hospitals: Hospital[], startNode: Hospital): { route: Hospital[]; totalDistance: number; time: number } => {
  const startTime = performance.now();
  const others = hospitals.filter(h => h.id !== startNode.id);
  
  if (others.length > 8) {
    // Safety break: don't brute force more than 8 others (9 total)
    return { route: [], totalDistance: 0, time: 0 };
  }

  let bestRoute: Hospital[] = [];
  let minDistance = Infinity;

  const calculateTotalDist = (r: Hospital[]) => {
    let d = 0;
    for (let i = 0; i < r.length - 1; i++) {
      d += getDistance(r[i].lat, r[i].lng, r[i+1].lat, r[i+1].lng);
    }
    return d;
  };

  const permute = (arr: Hospital[], m: Hospital[] = []) => {
    if (arr.length === 0) {
      const fullRoute = [startNode, ...m];
      const dist = calculateTotalDist(fullRoute);
      if (dist < minDistance) {
        minDistance = dist;
        bestRoute = fullRoute;
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  permute(others);
  
  return { 
    route: bestRoute, 
    totalDistance: minDistance, 
    time: performance.now() - startTime 
  };
};

export const solveTSP = (hospitals: Hospital[], depot: Hospital, runBruteForce: boolean = false): TSPResult & { bruteForce?: BruteForceResult } => {
  const startTime = performance.now();
  
  // NN
  const nnStartTime = performance.now();
  const nnRoute = solveTSPNearestNeighbor(hospitals, depot);
  const nnTime = performance.now() - nnStartTime;
  
  let dNN = 0;
  for (let i = 0; i < nnRoute.length - 1; i++) {
    dNN += getDistance(nnRoute[i].lat, nnRoute[i].lng, nnRoute[i+1].lat, nnRoute[i+1].lng);
  }

  // 2-Opt
  const optStartTime = performance.now();
  const { route: finalRoute, swaps } = refineTSP2Opt(nnRoute);
  const twoOptTime = performance.now() - optStartTime;

  let dFinal = 0;
  const steps: RouteStep[] = [];
  for (let i = 0; i < finalRoute.length; i++) {
    const prev = i > 0 ? finalRoute[i-1] : null;
    const dist = prev ? getDistance(prev.lat, prev.lng, finalRoute[i].lat, finalRoute[i].lng) : 0;
    dFinal += dist;
    steps.push({ hospital: finalRoute[i], distanceFromPrevious: dist });
  }

  const result: TSPResult & { bruteForce?: BruteForceResult } = {
    route: steps,
    totalDistance: dFinal,
    nnDistance: dNN,
    nnTime,
    twoOptTime,
    improvement: dNN > 0 ? ((dNN - dFinal) / dNN) * 100 : 0,
    swaps
  };

  if (runBruteForce && hospitals.length <= 9) {
    const bf = solveTSPBruteForce(hospitals, depot);
    result.bruteForce = {
      distance: bf.totalDistance,
      time: bf.time
    };
  }

  return result;
};

// 0/1 Knapsack: Brute Force (Recursive O(2^n))
export const solveKnapsackRecursive = (items: Supply[], capacity: number): { value: number; weight: number; time: number } => {
  const startTime = performance.now();
  
  if (items.length > 20) {
    return { value: 0, weight: 0, time: 0 };
  }

  const solve = (idx: number, currentCap: number): { v: number; w: number } => {
    if (idx < 0 || currentCap === 0) return { v: 0, w: 0 };
    
    if (items[idx].weight > currentCap) {
      return solve(idx - 1, currentCap);
    }
    
    const include = solve(idx - 1, currentCap - items[idx].weight);
    const exclude = solve(idx - 1, currentCap);
    
    const valInclude = include.v + items[idx].value;
    if (valInclude > exclude.v) {
      return { v: valInclude, w: include.w + items[idx].weight };
    }
    return exclude;
  };

  const result = solve(items.length - 1, capacity);
  return { value: result.v, weight: result.w, time: performance.now() - startTime };
};

// 0/1 Knapsack: Dynamic Programming
export const solveKnapsack = (items: Supply[], capacity: number, runBruteForce: boolean = false): KnapsackResult & { bruteForce?: BruteForceResult } => {
  const startTime = performance.now();
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      if (item.weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - item.weight] + item.value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find items
  const packedItems: Supply[] = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const item = items[i - 1];
      packedItems.push(item);
      w -= item.weight;
    }
  }

  const totalValue = dp[n][capacity];
  const totalWeight = packedItems.reduce((sum, item) => sum + item.weight, 0);

  const result: KnapsackResult & { bruteForce?: BruteForceResult } = {
    packedItems: packedItems.reverse(),
    totalValue,
    totalWeight,
    utilization: capacity > 0 ? (totalWeight / capacity) * 100 : 0,
    computeTime: performance.now() - startTime
  };

  if (runBruteForce && items.length <= 20) {
    const bf = solveKnapsackRecursive(items, capacity);
    result.bruteForce = {
      value: bf.value,
      time: bf.time
    };
  }

  return result;
};
