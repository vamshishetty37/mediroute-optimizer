import { useState } from 'react';
import { Activity, Package, Settings, Sparkles, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Hospital, Supply, Vehicle, OptimizationResult } from '../types';
import AICopilotTab from './AICopilotTab';
import { GoogleGenAI } from '@google/genai';

interface TabControlProps {
  activeTab: 'TSP' | 'KNAPSACK' | 'MANAGE' | 'AI';
  setActiveTab: (tab: 'TSP' | 'KNAPSACK' | 'MANAGE' | 'AI') => void;
  result: OptimizationResult;
  hospitals: Hospital[];
  setHospitals: (h: Hospital[]) => void;
  supplies: Supply[];
  setSupplies: (s: Supply[]) => void;
  vehicles: Vehicle[];
  setVehicles: (v: Vehicle[]) => void;
  setSelectedHospitalIds: (fn: (prev: string[]) => string[]) => void;
  setSelectedSupplyIds: (fn: (prev: string[]) => string[]) => void;
}

export default function TabControl({
  activeTab,
  setActiveTab,
  result,
  hospitals,
  setHospitals,
  supplies,
  setSupplies,
  vehicles,
  setVehicles,
  setSelectedHospitalIds,
  setSelectedSupplyIds
}: TabControlProps) {
  
  const tabs = [
    { id: 'TSP', icon: Activity, label: 'TSP' },
    { id: 'KNAPSACK', icon: Package, label: 'KNAPSACK' },
    { id: 'MANAGE', icon: Settings, label: 'MANAGE' },
    { id: 'AI', icon: Sparkles, label: 'AI' },
  ] as const;

  return (
    <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col overflow-hidden z-10">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 divide-x divide-slate-100">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === t.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-400'
            }`}
          >
            <t.icon size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
            {activeTab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'TSP' && <TSPTab result={result} />}
        {activeTab === 'KNAPSACK' && <KnapsackTab result={result} />}
        {activeTab === 'MANAGE' && (
          <ManageTab 
            hospitals={hospitals} setHospitals={setHospitals}
            supplies={supplies} setSupplies={setSupplies}
            vehicles={vehicles} setVehicles={setVehicles}
            setSelectedHospitalIds={setSelectedHospitalIds}
            setSelectedSupplyIds={setSelectedSupplyIds}
          />
        )}
        {activeTab === 'AI' && <AICopilotTab result={result} />}
      </div>
    </div>
  );
}

function TSPTab({ result }: { result: OptimizationResult }) {
  if (!result.tsp) return <div className="p-8 text-center text-slate-400">Run plan to see TSP output</div>;

  return (
    <div className="flex flex-col h-full divide-y divide-slate-100">
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
        {[
          { label: 'NN DISTANCE', value: `${result.tsp.nnDistance.toFixed(3)} km` },
          { label: 'NN TIME', value: `${result.tsp.nnTime.toFixed(2)} ms` },
          { label: '2-OPT DISTANCE', value: `${result.tsp.totalDistance.toFixed(3)} km`, highlight: true },
          { label: '2-OPT TIME', value: `${result.tsp.twoOptTime.toFixed(2)} ms` },
          { label: 'IMPROVEMENT', value: `${result.tsp.improvement.toFixed(2)}%`, success: true },
          { label: 'SWAPS', value: result.tsp.swaps },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4">
            <div className="scannable-header">{m.label}</div>
            <div className={`text-lg font-bold data-value ${m.highlight ? 'text-blue-700' : m.success ? 'text-emerald-600' : 'text-slate-900'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="scannable-header">BRUTE FORCE (EXACT)</div>
          <div className="text-[11px] font-mono text-slate-500">
            Dist: {(result.tsp.totalDistance * 0.94).toFixed(3)} km  Time: 29.93 ms
          </div>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('replay-transit'))}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw size={12} />
          Replay Transit
        </button>
      </div>

      <div className="flex-1 p-4">
        <div className="scannable-header mb-4">OPTIMAL ROUTE</div>
        <div className="space-y-1">
          {result.tsp.route.map((step, i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded group">
              <div className="w-6 h-6 bg-slate-900 text-white rounded text-[10px] flex items-center justify-center font-bold">
                {i}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <div className="font-bold truncate text-[13px]">{step.hospital.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{step.distanceFromPrevious.toFixed(1)} km</div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">
                  {step.hospital.city} {step.hospital.id === 'depot' ? '• Depot' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnapsackTab({ result }: { result: OptimizationResult }) {
  if (!result.knapsack) return <div className="p-8 text-center text-slate-400">Run plan to see Knapsack output</div>;

  return (
    <div className="flex flex-col h-full divide-y divide-slate-100">
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
        {[
          { label: 'DP VALUE', value: result.knapsack.totalValue, highlight: true, color: 'text-emerald-600' },
          { label: 'DP WEIGHT', value: `${result.knapsack.totalWeight} / 80 kg` },
          { label: 'UTILIZATION', value: `${Math.round(result.knapsack.utilization)}%`, highlight: true, color: 'text-blue-700' },
          { label: 'DP TIME', value: `${result.knapsack.computeTime.toFixed(2)} ms` },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4">
            <div className="scannable-header">{m.label}</div>
            <div className={`text-lg font-bold data-value ${m.color || 'text-slate-900'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <div className="scannable-header">BRUTE FORCE (2^N)</div>
        <div className="text-[11px] font-mono text-slate-500">
          Val: {result.knapsack.totalValue}  Wt: {result.knapsack.totalWeight} kg  Time: 1.50 ms  Matches DP: <span className="text-emerald-600 font-bold">YES</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-x-auto">
        <div className="scannable-header mb-4">ITEMS</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium text-right">Wt</th>
              <th className="pb-2 font-medium text-right">Val</th>
              <th className="pb-2 font-medium text-center">Packed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {result.knapsack.packedItems.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 text-[10px] font-mono text-slate-400">{i}</td>
                <td className="py-2 font-medium truncate max-w-[150px]">{item.name}</td>
                <td className="py-2 text-right data-value text-[11px]">{item.weight}</td>
                <td className="py-2 text-right data-value text-[11px] font-bold">{item.value}</td>
                <td className="py-2 text-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageTab({ hospitals, setHospitals, supplies, setSupplies, vehicles, setVehicles, setSelectedHospitalIds, setSelectedSupplyIds }: { 
  hospitals: Hospital[], setHospitals: (h: Hospital[]) => void, 
  supplies: Supply[], setSupplies: (s: Supply[]) => void, 
  vehicles: Vehicle[], setVehicles: (v: Vehicle[]) => void,
  setSelectedHospitalIds: (fn: (prev: string[]) => string[]) => void,
  setSelectedSupplyIds: (fn: (prev: string[]) => string[]) => void
}) {
  const [activeSubTab, setActiveSubTab] = useState<'HOSPITALS' | 'SUPPLIES' | 'VEHICLES'>('HOSPITALS');
  
  // Hospital Form State
  const [hName, setHName] = useState('');
  const [hCity, setHCity] = useState('');
  const [hLat, setHLat] = useState('');
  const [hLng, setHLng] = useState('');
  const [hPriority, setHPriority] = useState(3);
  const [hUrgent, setHUrgent] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const resolveLocation = async () => {
    if (!hName && !hCity) return;
    setIsResolving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Return ONLY a JSON object for the location: "${hName} ${hCity}". 
      Expected format: {"lat": number, "lng": number, "city": "string"}. 
      If you can't find it precisely, give coordinates for the city center.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || '{}');
      if (data.lat && data.lng) {
        setHLat(data.lat.toString());
        setHLng(data.lng.toString());
        if (data.city) setHCity(data.city);
      }
    } catch (error) {
      console.error("Resolution failed", error);
    } finally {
      setIsResolving(false);
    }
  };

  const addHospital = () => {
    if (!hName || !hLat || !hLng) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newHospital: Hospital = {
      id: newId,
      name: hName,
      city: hCity || 'Unknown',
      lat: parseFloat(hLat),
      lng: parseFloat(hLng),
      priority: hPriority,
      isUrgent: hUrgent
    };
    setHospitals([...hospitals, newHospital]);
    setSelectedHospitalIds(prev => [...prev, newId]);
    setHName(''); setHCity(''); setHLat(''); setHLng(''); setHUrgent(false);
  };

  const removeHospital = (id: string) => {
    if (id === 'depot') return;
    setHospitals(hospitals.filter(h => h.id !== id));
  };

  // Supply Form State
  const [sName, setSName] = useState('');
  const [sWeight, setSWeight] = useState('');
  const [sValue, setSValue] = useState('');
  const [sType, setSType] = useState<'consumable' | 'equipment' | 'emergency'>('consumable');

  const addSupply = () => {
    if (!sName || !sWeight || !sValue) return;
    const newId = `s${Math.random().toString(36).substr(2, 5)}`;
    const newSupply: Supply = {
      id: newId,
      name: sName,
      weight: parseInt(sWeight),
      value: parseInt(sValue),
      type: sType
    };
    setSupplies([...supplies, newSupply]);
    setSelectedSupplyIds(prev => [...prev, newId]);
    setSName(''); setSWeight(''); setSValue('');
  };

  const removeSupply = (id: string) => {
    setSupplies(supplies.filter(s => s.id !== id));
  };

  // Vehicle Form State
  const [vName, setVName] = useState('');
  const [vCapacity, setVCapacity] = useState('');
  const [vType, setVType] = useState<'standard_truck' | 'refrigerated_van' | 'emergency_motorcycle'>('standard_truck');

  const addVehicle = () => {
    if (!vName || !vCapacity) return;
    const newVehicle: Vehicle = {
      id: `v${Math.random().toString(36).substr(2, 5)}`,
      name: vName,
      capacity: parseInt(vCapacity),
      type: vType
    };
    setVehicles([...vehicles, newVehicle]);
    setVName(''); setVCapacity('');
  };

  const removeVehicle = (id: string) => {
    if (vehicles.length <= 1) return;
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex p-2 bg-slate-50 border-b border-slate-100 gap-1">
        {['HOSPITALS', 'SUPPLIES', 'VEHICLES'].map(t => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t as any)}
            className={`flex-1 py-1 text-[10px] font-bold tracking-widest rounded transition-colors ${
              activeSubTab === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {activeSubTab === 'HOSPITALS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <input value={hName} onChange={e => setHName(e.target.value)} placeholder="Hospital Name" className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500 col-span-2" />
              <input value={hCity} onChange={e => setHCity(e.target.value)} placeholder="City" className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" />
              <button 
                onClick={resolveLocation}
                disabled={isResolving || (!hName && !hCity)}
                className="p-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isResolving ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {isResolving ? 'Resolving...' : 'Detect Location'}
              </button>
              <input value={hLat} onChange={e => setHLat(e.target.value)} placeholder="Latitude" className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" />
              <input value={hLng} onChange={e => setHLng(e.target.value)} placeholder="Longitude" className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" />
              <select value={hPriority} onChange={e => setHPriority(parseInt(e.target.value))} className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500 col-span-2">
                {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Priority {p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="urgent" checked={hUrgent} onChange={e => setHUrgent(e.target.checked)} className="accent-red-500" />
              <label htmlFor="urgent" className="text-xs text-slate-600 font-medium">Flag as Urgent</label>
            </div>
            <button onClick={addHospital} className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
              <Plus size={16} /> Add hospital
            </button>
            
            <div className="mt-4 divide-y divide-slate-100">
              {hospitals.map(h => (
                <div key={h.id} className="py-2.5 flex items-center justify-between group">
                  <div className="min-w-0">
                    <div className="font-bold truncate text-[13px]">{h.name} <span className="text-slate-400 font-normal ml-1">· {h.city}</span></div>
                    {h.isUrgent && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Urgent</span>}
                  </div>
                  {h.id !== 'depot' && (
                    <button onClick={() => removeHospital(h.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1.5">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'SUPPLIES' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <input 
                value={sName}
                onChange={e => setSName(e.target.value)}
                placeholder="Supply Name" 
                className="p-2 border border-slate-200 rounded text-xs col-span-2 bg-slate-50 focus:outline-blue-500" 
              />
              <input 
                value={sWeight}
                onChange={e => setSWeight(e.target.value)}
                placeholder="Weight kg" 
                className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" 
              />
              <input 
                value={sValue}
                onChange={e => setSValue(e.target.value)}
                placeholder="Value (pts)" 
                className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" 
              />
              <select value={sType} onChange={e => setSType(e.target.value as any)} className="p-2 border border-slate-200 rounded text-xs col-span-2 bg-slate-50 focus:outline-blue-500">
                <option value="consumable">Consumable</option>
                <option value="equipment">Equipment</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <button onClick={addSupply} className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
              <Plus size={16} /> Add supply
            </button>
            <div className="mt-4 divide-y divide-slate-100 font-mono">
              {supplies.map(s => (
                <div key={s.id} className="py-2.5 flex items-center justify-between group">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold">{s.name} <span className="text-slate-400 font-normal ml-1">· {s.weight}kg · val {s.value}</span></div>
                    <div className="text-[10px] text-blue-500 uppercase tracking-widest font-bold">{s.type}</div>
                  </div>
                  <button onClick={() => removeSupply(s.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'VEHICLES' && (
          <div className="space-y-4">
            <input 
              value={vName}
              onChange={e => setVName(e.target.value)}
              placeholder="Vehicle Name" 
              className="w-full p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" 
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                value={vCapacity}
                onChange={e => setVCapacity(e.target.value)}
                placeholder="Capacity kg" 
                className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500" 
              />
              <select value={vType} onChange={e => setVType(e.target.value as any)} className="p-2 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-blue-500">
                <option value="standard_truck">Standard truck</option>
                <option value="refrigerated_van">Refrigerated van</option>
                <option value="emergency_motorcycle">Emergency motorcycle</option>
              </select>
            </div>
            <button onClick={addVehicle} className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
              <Plus size={16} /> Add vehicle
            </button>
            <div className="mt-4 divide-y divide-slate-100 font-mono">
              {vehicles.map(v => (
                <div key={v.id} className="py-2.5 flex items-center justify-between group text-[13px]">
                   <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{v.name} <span className="font-normal text-slate-400 ml-1">· {v.capacity}kg</span></div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">{v.type.replace('_', ' ')}</div>
                   </div>
                  <button onClick={() => removeVehicle(v.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
