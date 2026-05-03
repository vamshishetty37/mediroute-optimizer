/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Truck, Activity, Package, Map as MapIcon, ChevronRight, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Hospital, Supply, Vehicle, OptimizationResult } from './types';
import { INITIAL_HOSPITALS, INITIAL_SUPPLIES, INITIAL_VEHICLES } from './constants';
import { solveTSP, solveKnapsack } from './lib/optimization';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import TabControl from './components/TabControl';
import { GoogleGenAI } from '@google/genai';

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col border-l border-slate-100 pl-6 h-12 justify-center">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-2xl font-bold font-mono tracking-tighter text-blue-600">
        {value} <span className="text-xs font-medium text-slate-300 ml-1 italic">{unit}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [supplies, setSupplies] = useState<Supply[]>(INITIAL_SUPPLIES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>(INITIAL_HOSPITALS.map(h => h.id));
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>(INITIAL_SUPPLIES.map(s => s.id));
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(INITIAL_VEHICLES[0].id);

  const [activeTab, setActiveTab] = useState<'TSP' | 'KNAPSACK' | 'MANAGE' | 'AI'>('TSP');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult>({ tsp: null, knapsack: null });
  const [isCalculating, setIsCalculating] = useState(false);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId) || vehicles[0], [vehicles, selectedVehicleId]);
  const activeHospitals = useMemo(() => hospitals.filter(h => selectedHospitalIds.includes(h.id)), [hospitals, selectedHospitalIds]);
  const activeSupplies = useMemo(() => supplies.filter(s => selectedSupplyIds.includes(s.id)), [supplies, selectedSupplyIds]);

  const runFullPlan = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const tsp = solveTSP(activeHospitals, hospitals.find(h => h.id === 'depot') || hospitals[0]);
      const knapsack = solveKnapsack(activeSupplies, selectedVehicle.capacity);
      setOptimizationResult({ tsp, knapsack });
      setIsCalculating(false);
    }, 500);
  };

  const runTSPOny = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const tsp = solveTSP(activeHospitals, hospitals.find(h => h.id === 'depot') || hospitals[0]);
      setOptimizationResult(prev => ({ ...prev, tsp }));
      setIsCalculating(false);
    }, 300);
  };

  const runKnapsackOnly = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const knapsack = solveKnapsack(activeSupplies, selectedVehicle.capacity);
      setOptimizationResult(prev => ({ ...prev, knapsack }));
      setIsCalculating(false);
    }, 300);
  };

  useEffect(() => {
    runFullPlan();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm selection:bg-slate-200">
      {/* Unified Professional Header & Stats */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600" size={24} strokeWidth={3} />
              MEDROUTE/OPTIMIZER
            </h1>
            <div className="flex gap-6 mt-1.5">
              <button className="text-[10px] font-extrabold text-blue-600 uppercase tracking-[0.2em] border-b-2 border-blue-600 pb-0.5">TSP</button>
              <button className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] hover:text-slate-500 transition-colors">0/1 KNAPSACK</button>
              <button className="text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.2em] hover:text-slate-500 transition-colors">CONTROL ROOM</button>
            </div>
          </div>

          <div className="flex-1 max-w-4xl grid grid-cols-4 px-12">
            <StatBox label="Total Distance" value={optimizationResult.tsp?.totalDistance.toFixed(3) || '0.000'} unit="km" />
            <StatBox label="Value Loaded" value={optimizationResult.knapsack?.totalValue.toString() || '0'} unit="pts" />
            <StatBox label="Weight Loaded" value={optimizationResult.knapsack?.totalWeight.toString() || '0'} unit="kg" />
            <StatBox label="Utilization" value={Math.round(optimizationResult.knapsack?.utilization || 0).toString()} unit="%" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Selectors */}
        <Sidebar 
          hospitals={hospitals} 
          supplies={supplies} 
          vehicles={vehicles}
          selectedHospitalIds={selectedHospitalIds}
          setSelectedHospitalIds={setSelectedHospitalIds}
          selectedSupplyIds={selectedSupplyIds}
          setSelectedSupplyIds={setSelectedSupplyIds}
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicleId={setSelectedVehicleId}
          runTSPOny={runTSPOny}
          runKnapsackOnly={runKnapsackOnly}
        />

        {/* Center: Map */}
        <div className="flex-1 relative bg-slate-100">
          <MapDisplay 
            activeHospitals={activeHospitals} 
            route={optimizationResult.tsp?.route || []} 
          />
        </div>

        {/* Right Tab Panel */}
        <TabControl 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          result={optimizationResult}
          hospitals={hospitals}
          setHospitals={setHospitals}
          supplies={supplies}
          setSupplies={setSupplies}
          vehicles={vehicles}
          setVehicles={setVehicles}
          setSelectedHospitalIds={setSelectedHospitalIds}
          setSelectedSupplyIds={setSelectedSupplyIds}
        />
      </main>
    </div>
  );
}
