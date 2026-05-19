/**
 * MEDROUTE OPTIMIZER - INTERACTIVE DEMO
 * 
 * Paste this into a Node.js online compiler (like OnlineGDB or Programiz)
 * to see how the app's core logic handles your real-time inputs.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n\x1b[36m%s\x1b[0m", "========================================");
  console.log("\x1b[36m%s\x1b[0m", "      MED SUPPLY ROUTE OPTIMIZER    ");
  console.log("\x1b[36m%s\x1b[0m", "========================================\n");

  // --- PART 1: CARGO OPTIMIZATION (KNAPSACK) ---
  console.log("\x1b[33m%s\x1b[0m", "[1/2] CARGO OPTIMIZATION (KNAPSACK)");
  const capacityInput = await ask("Vehicle Payload Capacity (kg): ");
  const capacity = parseInt(String(capacityInput) || "50");
  const numItemsInput = await ask("Number of supply items available?: ");
  const numItems = parseInt(String(numItemsInput) || "3");

  const supplies = [];
  for (let i = 0; i < numItems; i++) {
    console.log(`\n--- Item #${i + 1} ---`);
    const nameInput = await ask("Item Name: ");
    const name = String(nameInput);
    const weightInput = await ask("Weight (kg): ");
    const weight = parseInt(String(weightInput) || "0");
    const valueInput = await ask("Importance Value (1-100): ");
    const value = parseInt(String(valueInput) || "0");
    supplies.push({ name, weight, value });
  }

  // Dynamic Programming Logic for Knapsack
  const nS = supplies.length;
  const dp = Array.from({ length: nS + 1 }, () => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= nS; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (supplies[i - 1].weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], supplies[i - 1].value + dp[i - 1][w - supplies[i - 1].weight]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Solution extraction
  const packedItems = [];
  const infeasibleItems = []; // Items that physically exceed total capacity
  const skippedItems = [];    // Items that fit but were not selected or ran out of space
  
  let wRemaining = capacity;
  const packedIndices = new Set();

  // Backtrack through DP table to find the optimal set of supplies
  for (let i = nS; i > 0; i--) {
    if (wRemaining >= supplies[i - 1].weight && dp[i][wRemaining] !== dp[i - 1][wRemaining]) {
      packedItems.push(supplies[i - 1]);
      wRemaining -= supplies[i - 1].weight;
      packedIndices.add(i - 1);
    }
  }

  // Categorize every item provided as input
  supplies.forEach((item, index) => {
    if (packedIndices.has(index)) return;
    if (item.weight > capacity) {
      infeasibleItems.push(item);
    } else {
      skippedItems.push(item);
    }
  });

  console.log("\x1b[32m%s\x1b[0m", "\n>> PACKED ITEMS (OPTIMAL LOAD):");
  if (packedItems.length === 0) {
    console.log("  (No items could be fit into the vehicle)");
  } else {
    packedItems.forEach(item => console.log(`  [✓] ${item.name} (${item.weight}kg, Value: ${item.value})`));
  }

  if (infeasibleItems.length > 0) {
    console.log("\x1b[31m%s\x1b[0m", "\n>> NOT FEASIBLE (OVER TOTAL CAPACITY):");
    infeasibleItems.forEach(item => console.log(`  [!] ${item.name} (${item.weight}kg) - IS OVER THE ${capacity}kg LIMIT`));
  }
  
  if (skippedItems.length > 0) {
    console.log("\x1b[33m%s\x1b[0m", "\n>> NOT SELECTED (SUB-OPTIMAL OR NO SPACE):");
    skippedItems.forEach(item => console.log(`  [-] ${item.name} (${item.weight}kg, Value: ${item.value})`));
  }

  const totalUsedWeight = capacity - wRemaining;
  console.log(`\n----------------------------------------`);
  console.log(`FINAL PAYLOAD: ${totalUsedWeight}/${capacity}kg`);
  console.log(`OPTIMIZED VALUE: ${dp[nS][capacity]}`);
  console.log(`UTILIZATION: ${((totalUsedWeight / capacity) * 100).toFixed(1)}%`);
  console.log(`----------------------------------------\n`);


  // --- PART 2: ROUTE OPTIMIZATION (TSP) ---
  console.log("\x1b[33m%s\x1b[0m", "[2/2] ROUTE OPTIMIZATION (TSP)");
  const numHospitalsInput = await ask("How many hospitals to visit?: ");
  const numHospitals = parseInt(String(numHospitalsInput) || "2");
  
  const hospitals = [];
  for (let i = 0; i < numHospitals; i++) {
    console.log(`\n--- Hospital #${i + 1} ---`);
    const name = await ask("Hospital Name: ");
    const distanceInput = await ask("Distance from Depot (km): ");
    const distance = parseFloat(String(distanceInput) || "0");
    hospitals.push({ name, distance });
  }

  // Sorting by distance to simulate an efficient path (Nearest Neighbor approach)
  const optimizedRoute = [...hospitals].sort((a, b) => a.distance - b.distance);
  
  console.log("\x1b[32m%s\x1b[0m", "\n>> OPTIMIZED DELIVERY SEQUENCE:");
  console.log("  1. START: Central Depot");
  
  let totalDistance = 0;
  let currentPos = 0;

  optimizedRoute.forEach((h, index) => {
    totalDistance += Math.abs(h.distance - currentPos);
    console.log(`  ${index + 2}. VISIT: ${h.name} (Total: ${totalDistance.toFixed(1)} km)`);
    currentPos = h.distance;
  });

  // Return to depot
  totalDistance += currentPos;
  console.log(`  ${optimizedRoute.length + 2}. RETURN: Central Depot (Total: ${totalDistance.toFixed(1)} km)`);

  console.log("\x1b[1m%s\x1b[0m", `\nTOTAL TRAVEL DISTANCE: ${totalDistance.toFixed(2)} km`);

  console.log("\n\x1b[36m%s\x1b[0m", "========================================");
  console.log("  PLAN GENERATED. READY FOR DISPATCH.");
  console.log("\x1b[36m%s\x1b[0m", "========================================\n");

  rl.close();
}

main().catch(err => {
  console.error("Error running application:", err);
  rl.close();
});
