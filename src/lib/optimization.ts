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

export const solveTSP = (hospitals: Hospital[], depot: Hospital): TSPResult => {
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

  return {
    route: steps,
    totalDistance: dFinal,
    nnDistance: dNN,
    nnTime,
    twoOptTime,
    improvement: dNN > 0 ? ((dNN - dFinal) / dNN) * 100 : 0,
    swaps
  };
};

// 0/1 Knapsack: Dynamic Programming
export const solveKnapsack = (items: Supply[], capacity: number): KnapsackResult => {
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

  return {
    packedItems: packedItems.reverse(),
    totalValue,
    totalWeight,
    utilization: capacity > 0 ? (totalWeight / capacity) * 100 : 0,
    computeTime: performance.now() - startTime
  };
};
