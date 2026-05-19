/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Truck, Activity, Package, Map as MapIcon, ChevronRight, Play, RefreshCw, AlertCircle, Sparkles, LogIn, LogOut, Save, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Hospital, Supply, Vehicle, OptimizationResult } from './types';
import { INITIAL_HOSPITALS, INITIAL_SUPPLIES, INITIAL_VEHICLES } from './constants';
import { solveTSP, solveKnapsack } from './lib/optimization';
import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import TabControl from './components/TabControl';
import { GoogleGenAI } from '@google/genai';
import { useFirebase } from './components/FirebaseProvider';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import ScenariosList from './components/ScenariosList';

function StatBox({ label, value, unit, color = "text-blue-600" }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="flex flex-col border-r border-slate-200 px-6 py-3 h-20 justify-center group hover:bg-slate-50/50 transition-colors">
      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1 pb-1 border-b border-slate-200 w-fit">
        {label}
      </div>
      <div className={`text-2xl font-black font-mono tracking-tighter ${color} flex items-baseline gap-1`}>
        <span className="opacity-10 mr-1">—</span>
        {value} 
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight ml-1">{unit}</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, signIn, signOut } = useFirebase();
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [supplies, setSupplies] = useState<Supply[]>(INITIAL_SUPPLIES);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>(INITIAL_HOSPITALS.map(h => h.id));
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<string[]>(INITIAL_SUPPLIES.map(s => s.id));
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(INITIAL_VEHICLES[0].id);
  
  const [activeTab, setActiveTab] = useState<'TSP' | 'KNAPSACK' | 'MANAGE' | 'AI'>('TSP');
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult>({ tsp: null, knapsack: null });
  const [isCalculating, setIsCalculating] = useState(false);
  const [compareBruteForce, setCompareBruteForce] = useState(false);
  const [hoveredHospitalId, setHoveredHospitalId] = useState<string | null>(null);
  const [mapCenterNode, setMapCenterNode] = useState<Hospital | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId) || vehicles[0], [vehicles, selectedVehicleId]);
  const activeHospitals = useMemo(() => hospitals.filter(h => selectedHospitalIds.includes(h.id)), [hospitals, selectedHospitalIds]);
  const activeSupplies = useMemo(() => supplies.filter(s => selectedSupplyIds.includes(s.id)), [supplies, selectedSupplyIds]);

  const handleReset = () => {
    setHospitals(INITIAL_HOSPITALS);
    setSupplies(INITIAL_SUPPLIES);
    setVehicles(INITIAL_VEHICLES);
    setSelectedHospitalIds(INITIAL_HOSPITALS.map(h => h.id));
    setSelectedSupplyIds(INITIAL_SUPPLIES.map(s => s.id));
    setSelectedVehicleId(INITIAL_VEHICLES[0].id);
    setOptimizationResult({ tsp: null, knapsack: null });
    setCompareBruteForce(false);
    setActiveTab('TSP');
    setHoveredHospitalId(null);
    setMapCenterNode(null);
  };

  const saveScenario = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const scenarioData = {
        name: `Optimization Plan ${new Date().toLocaleString()}`,
        selectedHospitalIds,
        selectedSupplyIds,
        selectedVehicleId,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'scenarios'), scenarioData);
      alert('Scenario saved to cloud storage!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scenarios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadScenario = (scenario: any) => {
    setSelectedHospitalIds(scenario.selectedHospitalIds);
    setSelectedSupplyIds(scenario.selectedSupplyIds);
    setSelectedVehicleId(scenario.selectedVehicleId);
    setShowScenarios(false);
  };

  const runFullPlan = () => {
    setIsCalculating(true);
    const tsp = solveTSP(activeHospitals, hospitals.find(h => h.id === 'depot') || hospitals[0], compareBruteForce);
    const knapsack = solveKnapsack(activeSupplies, selectedVehicle.capacity, compareBruteForce);
    setOptimizationResult({ tsp, knapsack });
    setIsCalculating(false);
  };

  const runTSPOnly = () => {
    setIsCalculating(true);
    const tsp = solveTSP(activeHospitals, hospitals.find(h => h.id === 'depot') || hospitals[0], compareBruteForce);
    setOptimizationResult(prev => ({ ...prev, tsp }));
    setIsCalculating(false);
  };

  const runKnapsackOnly = () => {
    setIsCalculating(true);
    const knapsack = solveKnapsack(activeSupplies, selectedVehicle.capacity, compareBruteForce);
    setOptimizationResult(prev => ({ ...prev, knapsack }));
    setIsCalculating(false);
  };

  useEffect(() => {
    runFullPlan();
  }, [selectedVehicleId, selectedSupplyIds, selectedHospitalIds, compareBruteForce, hospitals, supplies, vehicles]);

  const handleHospitalToggle = (id: string | 'ALL' | 'NONE') => {
    if (id === 'ALL') {
      setSelectedHospitalIds(hospitals.map(h => h.id));
    } else if (id === 'NONE') {
      setSelectedHospitalIds(['depot']);
    } else {
      if (id === 'depot') return;
      setSelectedHospitalIds(prev => 
        prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]
      );
    }
  };

  const handleSupplyToggle = (id: string | 'ALL' | 'NONE') => {
    if (id === 'ALL') {
      setSelectedSupplyIds(supplies.map(s => s.id));
    } else if (id === 'NONE') {
      setSelectedSupplyIds([]);
    } else {
      setSelectedSupplyIds(prev => 
        prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
      );
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm selection:bg-slate-200">
      {/* Brand & Global Controls Header */}
      <header className="bg-white border-b border-black h-20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-sm flex items-center justify-center text-white shadow-lg">
            <Truck size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              MEDROUTE/OPTIMIZER
            </h1>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('TSP')}
                className={`text-[10px] font-mono font-bold uppercase tracking-widest border-b pb-0.5 transition-colors ${activeTab === 'TSP' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-slate-300 hover:text-blue-600'}`}
              >
                TSP
              </button>
              <button 
                onClick={() => setActiveTab('KNAPSACK')}
                className={`text-[10px] font-mono font-bold uppercase tracking-widest border-b pb-0.5 transition-colors ${activeTab === 'KNAPSACK' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-slate-300 hover:text-blue-600'}`}
              >
                0/1 KNAPSACK
              </button>
              <button 
                onClick={() => setActiveTab('MANAGE')}
                className={`text-[10px] font-mono font-bold uppercase tracking-widest border-b pb-0.5 transition-colors ${activeTab === 'MANAGE' ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-slate-300 hover:text-blue-600'}`}
              >
                CONTROL ROOM
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCompareBruteForce(!compareBruteForce)}
            className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className={`w-4 h-4 rounded border-2 ${compareBruteForce ? 'border-orange-500 bg-orange-500' : 'border-slate-400 bg-transparent'} flex items-center justify-center group-hover:scale-110 transition-all`}>
              {compareBruteForce && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${compareBruteForce ? 'text-orange-600' : 'text-slate-600'}`}>BRUTE-FORCE COMPARE</span>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowScenarios(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                <FolderOpen size={14} className="opacity-60" />
                Open Plan
              </button>
              <button 
                onClick={saveScenario}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 border border-emerald-200 rounded-md text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                Save Plan
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Operator</span>
                  <span className="text-[11px] font-black text-slate-900 truncate max-w-[120px]">{user.displayName || user.email}</span>
                </div>
                <button 
                  onClick={signOut}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors group"
                  title="Sign Out"
                >
                  <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                <LogIn size={14} />
                Cloud Sync
              </button>
            )}
          </div>
          
          <button 
            onClick={runFullPlan}
            disabled={isCalculating}
            className="flex items-center gap-2 px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-[11px] font-black uppercase tracking-[0.2em]"
          >
            {isCalculating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            Run Full Plan
          </button>
        </div>
      </header>

      {/* Metrics Control Panel */}
      <div className="bg-white border-b border-slate-300 grid grid-cols-6 shadow-sm divide-x divide-slate-200">
        <StatBox label="Total Distance" value={optimizationResult.tsp?.totalDistance.toFixed(3) || '——'} unit="km" />
        <StatBox label="Value Loaded" value={optimizationResult.knapsack?.totalValue.toString() || '——'} unit="pts" color="text-emerald-600" />
        <StatBox label="Weight Loaded" value={optimizationResult.knapsack ? `${optimizationResult.knapsack.totalWeight}/${optimizationResult.knapsack.capacity}` : '——'} unit="kg" color="text-slate-700" />
        <StatBox label="Utilization" value={optimizationResult.knapsack ? Math.round(optimizationResult.knapsack.utilization).toString() : '——'} unit="%" color="text-slate-900" />
        <StatBox label="Hospitals Served" value={activeHospitals.length.toString() || '——'} unit="" color="text-slate-900" />
        <StatBox label="2-Opt Improvement" value={optimizationResult.tsp?.improvement.toFixed(3) || '——'} unit="%" color="text-blue-600" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Selectors */}
        <Sidebar 
          hospitals={hospitals} 
          supplies={supplies} 
          vehicles={vehicles}
          selectedHospitalIds={selectedHospitalIds}
          onHospitalToggle={handleHospitalToggle}
          selectedSupplyIds={selectedSupplyIds}
          onSupplyToggle={handleSupplyToggle}
          selectedVehicleId={selectedVehicleId}
          onVehicleSelect={setSelectedVehicleId}
          runTSPOnly={runTSPOnly}
          runKnapsackOnly={runKnapsackOnly}
          hoveredHospitalId={hoveredHospitalId}
          setHoveredHospitalId={setHoveredHospitalId}
          onHospitalFocus={setMapCenterNode}
        />

        {/* Center: Map */}
        <div className="flex-1 relative bg-slate-100 border-x border-slate-300">
          <MapDisplay 
            activeHospitals={activeHospitals} 
            route={optimizationResult.tsp?.route || []} 
            hoveredHospitalId={hoveredHospitalId}
            onHover={setHoveredHospitalId}
            centerNode={mapCenterNode}
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

      <AnimatePresence>
        {showScenarios && (
          <ScenariosList 
            onLoad={handleLoadScenario} 
            onClose={() => setShowScenarios(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
