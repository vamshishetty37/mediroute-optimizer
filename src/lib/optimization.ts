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

// Enforce priority ordering: urgent hospitals must precede non-urgent hospitals
export const isValidPrecedence = (r: Hospital[]): boolean => {
  let foundNormal = false;
  for (let i = 1; i < r.length; i++) {
    if (!r[i].isUrgent) {
      foundNormal = true;
    } else if (foundNormal) {
      // Found an urgent node after a normal node
      return false;
    }
  }
  return true;
};

// TSP: Nearest Neighbor Algorithm with Priority (Urgent first)
export const solveTSPNearestNeighbor = (hospitals: Hospital[], startNode: Hospital): Hospital[] => {
  const unvisitedUrgent = [...hospitals].filter(h => h.id !== startNode.id && h.isUrgent);
  const unvisitedNormal = [...hospitals].filter(h => h.id !== startNode.id && !h.isUrgent);
  const route = [startNode];
  let current = startNode;

  // 1. Visit all urgent nodes first
  while (unvisitedUrgent.length > 0) {
    let nearestIdx = 0;
    let minDist = getDistance(current.lat, current.lng, unvisitedUrgent[0].lat, unvisitedUrgent[0].lng);

    for (let i = 1; i < unvisitedUrgent.length; i++) {
      const dist = getDistance(current.lat, current.lng, unvisitedUrgent[i].lat, unvisitedUrgent[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisitedUrgent.splice(nearestIdx, 1)[0];
    route.push(current);
  }

  // 2. Visit all normal nodes next
  while (unvisitedNormal.length > 0) {
    let nearestIdx = 0;
    let minDist = getDistance(current.lat, current.lng, unvisitedNormal[0].lat, unvisitedNormal[0].lng);

    for (let i = 1; i < unvisitedNormal.length; i++) {
      const dist = getDistance(current.lat, current.lng, unvisitedNormal[i].lat, unvisitedNormal[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    current = unvisitedNormal.splice(nearestIdx, 1)[0];
    route.push(current);
  }

  return route;
};

// TSP: 2-Opt Refinement that maintains Priority constraint
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

        if (isValidPrecedence(newRoute) && calculateTotalDist(newRoute) < calculateTotalDist(bestRoute)) {
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
  weight?: number;
  time: number;
}

// TSP: Brute Force (O(n!)) respecting priority sorting constraints
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
      if (isValidPrecedence(fullRoute)) {
        const dist = calculateTotalDist(fullRoute);
        if (dist < minDistance) {
          minDistance = dist;
          bestRoute = fullRoute;
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        // Early prune: cannot place a normal node if there are unvisited urgent nodes remaining
        const currentIsNormal = !arr[i].isUrgent;
        const hasUrgentLeft = arr.some(h => h.isUrgent);
        if (currentIsNormal && hasUrgentLeft) {
          continue;
        }

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
    const weightInclude = include.w + items[idx].weight;

    if (valInclude > exclude.v) {
      return { v: valInclude, w: weightInclude };
    } else if (valInclude === exclude.v) {
      // If values are equal, prefer the one with less weight
      return weightInclude < exclude.w ? { v: valInclude, w: weightInclude } : exclude;
    }
    return exclude;
  };

  const result = solve(items.length - 1, capacity);
  return { value: result.v, weight: result.w, time: performance.now() - startTime };
};

// 0/1 Knapsack: Dynamic Programming with optional weight tie-breaking
export const solveKnapsack = (items: Supply[], capacityInput: number, runBruteForce: boolean = false): KnapsackResult & { bruteForce?: BruteForceResult } => {
  const startTime = performance.now();
  const capacity = Math.max(0, Math.floor(capacityInput));
  const n = items.length;
  
  // Ensure all weights are integers that match the DP table indices
  // Flooring weights to match capacity flooring, prevents array index issues
  const integerItems = items.map(item => ({
    ...item,
    weight: Math.floor(Number(item.weight)),
    value: Number(item.value)
  }));

  // dp[i][w] stores the maximum value for first i items and weight w
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
  // weights[i][w] stores the total weight for the maximum value configuration
  const weights: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    const item = integerItems[i - 1];
    for (let w = 0; w <= capacity; w++) {
      if (item.weight <= w) {
        const valWith = dp[i - 1][w - item.weight] + item.value;
        const weightWith = weights[i - 1][w - item.weight] + item.weight;
        const valWithout = dp[i - 1][w];
        const weightWithout = weights[i - 1][w];
        
        if (valWith > valWithout) {
          dp[i][w] = valWith;
          weights[i][w] = weightWith;
        } else if (valWith === valWithout) {
          // Tie-break: prefer lower weight for the same value
          if (weightWith < weightWithout) {
            dp[i][w] = valWith;
            weights[i][w] = weightWith;
          } else {
            dp[i][w] = valWithout;
            weights[i][w] = weightWithout;
          }
        } else {
          dp[i][w] = valWithout;
          weights[i][w] = weightWithout;
        }
      } else {
        dp[i][w] = dp[i - 1][w];
        weights[i][w] = weights[i - 1][w];
      }
    }
  }

  // Backtrack to find items
  const packedItems: Supply[] = [];
  const packedIndices = new Set<number>();
  let w = capacity;
  for (let i = n; i > 0 && w >= 0; i--) {
    const item = integerItems[i - 1];
    
    if (item.weight <= w) {
      const valWith = dp[i - 1][w - item.weight] + item.value;
      const weightWith = weights[i - 1][w - item.weight] + item.weight;
      const valWithout = dp[i - 1][w];
      const weightWithout = weights[i - 1][w];
      
      const betterValue = valWith > valWithout;
      const betterWeight = valWith === valWithout && weightWith < weightWithout;
      
      if (betterValue || betterWeight) {
        packedItems.push(items[i - 1]); // Use original item reference
        packedIndices.add(i - 1);
        w -= item.weight;
      }
    }
  }

  // Categorize rest
  const infeasibleItems: Supply[] = [];
  const skippedItems: Supply[] = [];

  items.forEach((item, index) => {
    if (packedIndices.has(index)) return;
    if (item.weight > capacity) {
      infeasibleItems.push(item);
    } else {
      skippedItems.push(item);
    }
  });

  const finalValue = dp[n][capacity];
  const finalWeight = weights[n][capacity];

  const result: KnapsackResult & { bruteForce?: BruteForceResult } = {
    packedItems: packedItems.reverse(),
    skippedItems,
    infeasibleItems,
    totalValue: finalValue,
    totalWeight: finalWeight,
    capacity,
    utilization: capacity > 0 ? (finalWeight / capacity) * 100 : 0,
    computeTime: performance.now() - startTime
  };

  if (runBruteForce && items.length <= 20) {
    const bf = solveKnapsackRecursive(items, capacity);
    result.bruteForce = {
      value: bf.value,
      weight: bf.weight,
      time: bf.time
    };
  }

  return result;
};
