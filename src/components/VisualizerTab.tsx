import { useState } from 'react';
import { 
  Building2, 
  ChevronRight, 
  Clock, 
  Compass, 
  Flame, 
  Milestone, 
  Package, 
  ShieldCheck, 
  TrendingUp, 
  Truck 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Hospital, Supply, Vehicle, OptimizationResult } from '../types';

interface VisualizerTabProps {
  result: OptimizationResult;
  hospitals: Hospital[];
  supplies: Supply[];
  vehicles: Vehicle[];
}

export default function VisualizerTab({ result, hospitals, supplies, vehicles }: VisualizerTabProps) {
  const [activeSubSection, setActiveSubSection] = useState<'DELIVERY' | 'CARGO'>('DELIVERY');

  const tsp = result.tsp;
  const knapsack = result.knapsack;

  // 1. Calculate urgent count in Route
  const routeUrgentCount = tsp?.route.filter(step => step.hospital.isUrgent).length || 0;
  const totalUrgentCount = hospitals.filter(h => h.isUrgent).length;

  // 2. Identify active vehicle
  const activeVehicle = knapsack ? vehicles.find(v => v.capacity === knapsack.capacity) || vehicles[0] : vehicles[0];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Sub-tab Toggle */}
      <div className="flex p-2 bg-white border-b border-slate-200 gap-1 sticky top-0 z-10">
        <button
          onClick={() => setActiveSubSection('DELIVERY')}
          className={`flex-1 py-2 text-[10px] font-black tracking-widest rounded-md uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeSubSection === 'DELIVERY' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass size={13} />
          Route Visualizer
        </button>
        <button
          onClick={() => setActiveSubSection('CARGO')}
          className={`flex-1 py-2 text-[10px] font-black tracking-widest rounded-md uppercase transition-all flex items-center justify-center gap-1.5 ${
            activeSubSection === 'CARGO' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package size={13} />
          Cargo Bay packing
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeSubSection === 'DELIVERY' ? (
          /* SECTION 1: ROUTE & TSP ALGORITHM VISUALIZATION */
          <div className="space-y-6">
            {/* TSP Overview Metrics bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-3 flex items-center gap-2">
                <Compass size={14} className="text-blue-600" />
                TSP Algorithmic Gains
              </h3>

              {tsp ? (
                <div className="space-y-4">
                  {/* Visual Bar Comparison for Distance */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Core Distance Comparison</span>
                      <span className="text-blue-700 font-mono font-bold">-{tsp.improvement.toFixed(1)}% Optimal Reduction</span>
                    </div>

                    <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                      {/* Nearest Neighbor Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Nearest Neighbor (NN)</span>
                          <span className="font-bold text-slate-700">{tsp.nnDistance.toFixed(2)} km</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>

                      {/* 2-Opt Refined Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span className="text-blue-700 font-bold flex items-center gap-1">
                            <TrendingUp size={10} />
                            2-Opt Refinement
                          </span>
                          <span className="font-bold text-blue-700">{tsp.totalDistance.toFixed(2)} km</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${(tsp.totalDistance / tsp.nnDistance) * 100}%` }} 
                          />
                        </div>
                      </div>

                      {/* Brute Force (If configured) */}
                      {tsp.bruteForce && tsp.bruteForce.distance ? (
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span className="text-emerald-700 font-bold">Brute-Force (Exact Optimal)</span>
                            <span className="font-bold text-emerald-700">{tsp.bruteForce.distance.toFixed(2)} km</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${(tsp.bruteForce.distance / tsp.nnDistance) * 100}%` }} 
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Operational Speeds Grid */}
                  <div className="grid grid-cols-2 gap-2 text-center pt-2">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">NN Time</div>
                      <div className="text-sm font-black font-mono text-slate-800">{tsp.nnTime.toFixed(2)} <span className="text-[9px] text-slate-500">ms</span></div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">2-Opt Optimization</div>
                      <div className="text-sm font-black font-mono text-blue-700">{tsp.twoOptTime.toFixed(2)} <span className="text-[9px] text-slate-500">ms</span></div>
                    </div>
                  </div>

                  {/* Priority Order Compliance Label */}
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-black text-red-800 uppercase tracking-wide leading-none">Priority Precedence Enforced</h4>
                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                        The TSP routing engine guarantees all <strong>Urgent</strong> hospitals (denoted by the pulse <span className="text-red-500">●</span> marker) are visited <strong>first</strong>. Normal hospitals are then routed based on geometric proximity.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 italic">No TSP optimization route found.</div>
              )}
            </div>

            {/* ROUTE PROGRESS STEP-BY-STEP MAP JOURNEY */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Milestone size={14} className="text-blue-600" />
                  Route Dispatch Sequence
                </span>
                {tsp && (
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{tsp.route.length} Stop{tsp.route.length !== 1 ? 's' : ''}</span>
                )}
              </h3>

              {tsp && tsp.route.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-dashed border-slate-200 space-y-4 ml-3 py-1">
                  {tsp.route.map((step, idx) => {
                    const isDepot = step.hospital.id === 'depot';
                    const isUrgent = step.hospital.isUrgent;
                    
                    return (
                      <div key={idx} className="relative group">
                        {/* Dot Bullet indicator */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-125 z-10 ${
                          isDepot 
                            ? 'border-blue-600' 
                            : isUrgent 
                              ? 'border-red-500 bg-red-50 shadow-sm shadow-red-200' 
                              : 'border-slate-800'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isDepot ? 'bg-blue-600' : isUrgent ? 'bg-red-500 animate-pulse' : 'bg-slate-800'
                          }`} />
                        </div>

                        {/* Card body */}
                        <div className={`p-2.5 rounded-lg border transition-all ${
                          isDepot 
                            ? 'bg-blue-50/40 border-blue-100 hover:border-blue-300' 
                            : isUrgent 
                              ? 'bg-red-50/30 border-red-100 hover:border-red-300 shadow-sm' 
                              : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-bold bg-slate-900 text-white min-w-4 px-1 rounded flex items-center justify-center leading-none py-0.5">
                                  {idx === 0 ? 'START' : idx === tsp.route.length - 1 ? 'END' : idx}
                                </span>
                                <h4 className="font-black text-slate-800 text-[12px] tracking-tight">{step.hospital.name}</h4>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5 ml-6">
                                {step.hospital.city} {isDepot ? '• Central Depot' : ''}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-[10px] font-mono font-bold text-slate-500 block">
                                {idx === 0 ? '—' : `+${step.distanceFromPrevious.toFixed(1)} km`}
                              </span>
                              {isUrgent && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold text-red-600 bg-red-100/60 border border-red-200 rounded px-1.5 mt-1 tracking-wider uppercase">
                                  <Flame size={8} /> Urgent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Arrow separator (visual only) */}
                        {idx < tsp.route.length - 1 && (
                          <div className="flex justify-center w-fit ml-2 my-1 text-slate-300">
                            <ChevronRight size={14} className="rotate-95 opacity-50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 italic">No hops in route list</div>
              )}
            </div>
          </div>
        ) : (
          /* SECTION 2: CARGO BAY PACKING VISUALIZER */
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck size={14} className="text-blue-600" />
                  Vehicle Cargo Bay Usage
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 uppercase font-bold">
                  {activeVehicle.name} ({activeVehicle.capacity}kg max)
                </span>
              </h3>

              {knapsack ? (
                <div className="space-y-4">
                  {/* Radial Outline Gauge represented cleanly as an SVG progress loop */}
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          stroke="#e2e8f0" 
                          strokeWidth="5" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          stroke={knapsack.utilization > 90 ? "#f97316" : "#2563eb"} 
                          strokeWidth="5" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - knapsack.utilization / 100)}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute font-mono text-[11px] font-black text-slate-800">
                        {Math.round(knapsack.utilization)}%
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-none">Space Allocated</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Loaded <strong className="text-slate-800">{knapsack.totalWeight} kg</strong> out of a maximum payload container limit of <strong className="text-slate-800">{knapsack.capacity} kg</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded">
                      <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-1">Supplies Value</div>
                      <div className="text-base font-black font-mono text-emerald-600">+{knapsack.totalValue} <span className="text-[9px] text-slate-500">pts</span></div>
                    </div>
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded">
                      <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-1">Packed item count</div>
                      <div className="text-base font-black font-mono text-slate-800">{knapsack.packedItems.length} <span className="text-[9px] text-slate-500">selected</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 italic">No cargo calculations active.</div>
              )}
            </div>

            {/* VISUAL CARGO LOADING GRID COMPARTMENTS */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-1 flex items-center gap-2">
                <Package size={14} className="text-blue-600" />
                Physical Space Pack Diagram
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">Volume proportional to item payload weights</p>

              {knapsack && knapsack.packedItems.length > 0 ? (
                <div className="space-y-4">
                  {/* Container Grid Simulator mimicking cargo blocks */}
                  <div className="border border-slate-300 bg-slate-900 rounded-lg p-3 relative h-48 overflow-hidden flex flex-col justify-end shadow-inner">
                    <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-500 font-bold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-slate-800">
                      Rear Payload Door
                    </div>
                    
                    {/* Visual representation of boxes stacked */}
                    <div className="flex flex-wrap content-end gap-1.5 h-full pt-6">
                      {knapsack.packedItems.map((item, idx) => {
                        // Find width percentage based on weight
                        const weightPct = Math.max(16, Math.min(48, (item.weight / knapsack.capacity) * 100));
                        
                        // Define custom styling colors based on type
                        const typeColors = {
                          consumable: 'from-emerald-500 to-green-600 border-emerald-400/50 hover:from-emerald-400 hover:to-green-500',
                          equipment: 'from-blue-500 to-indigo-600 border-blue-400/50 hover:from-blue-400 hover:to-indigo-500',
                          emergency: 'from-orange-500 to-red-600 border-orange-400/50 hover:from-orange-400 hover:to-red-500',
                        };

                        const gradient = typeColors[item.type] || 'from-slate-500 to-slate-600';

                        return (
                          <div 
                            key={item.id}
                            style={{ width: `${weightPct}%` }}
                            className={`p-1 bg-gradient-to-br ${gradient} border text-white rounded text-[9px] flex flex-col justify-between h-14 cursor-pointer hover:scale-[1.03] active:scale-95 transition-all text-left shadow-sm truncate`}
                            title={`${item.name} (${item.weight} kg) Value: ${item.value}`}
                          >
                            <span className="font-extrabold truncate uppercase font-mono tracking-tight text-[8px] leading-tight block">
                              {item.name}
                            </span>
                            <span className="text-[8px] font-mono bg-black/25 px-1 rounded w-fit block font-bold">
                              {item.weight} kg
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend Key */}
                  <div className="flex items-center justify-around text-[9px] font-bold uppercase tracking-wider text-slate-500 py-1 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                      <span>Consumables</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                      <span>Equipment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
                      <span>Emergency</span>
                    </div>
                  </div>

                  {/* Excluded items checklist */}
                  {knapsack.skippedItems.length > 0 && (
                    <div className="border border-slate-100 bg-slate-50 p-3 rounded-lg">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Algorithm Skip list</h4>
                      <div className="flex flex-wrap gap-1">
                        {knapsack.skippedItems.map(item => (
                          <div key={item.id} className="text-[9px] font-mono px-2 py-1 bg-white border border-slate-200 rounded text-slate-500" title="Values was too low relative to weight">
                            {item.name} ({item.weight}kg)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 italic">No cargo packed inside vehicles</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer credits info */}
      <div className="p-3 bg-white border-t border-slate-200 text-center flex items-center justify-center gap-1.5 select-none shrink-0 font-mono text-[9px] text-slate-400 font-bold">
        <span>DYNAMIC ROUTING ENGINE</span>
        <span className="text-slate-200">|</span>
        <span>VISUALIZER SUB-VIEW V1.1</span>
      </div>
    </div>
  );
}
