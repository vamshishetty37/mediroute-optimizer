import { Hospital, Supply, Vehicle } from '../types';
import { AlertTriangle, CheckSquare, Square, Play, Package } from 'lucide-react';

interface SidebarProps {
  hospitals: Hospital[];
  supplies: Supply[];
  vehicles: Vehicle[];
  selectedHospitalIds: string[];
  setSelectedHospitalIds: (ids: string[]) => void;
  selectedSupplyIds: string[];
  setSelectedSupplyIds: (ids: string[]) => void;
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  runTSPOny: () => void;
  runKnapsackOnly: () => void;
}

export default function Sidebar({
  hospitals,
  supplies,
  vehicles,
  selectedHospitalIds,
  setSelectedHospitalIds,
  selectedSupplyIds,
  setSelectedSupplyIds,
  selectedVehicleId,
  setSelectedVehicleId,
  runTSPOny,
  runKnapsackOnly
}: SidebarProps) {
  
  const toggleHospital = (id: string) => {
    if (id === 'depot') return; // Cannot deselect depot
    if (selectedHospitalIds.includes(id)) {
      setSelectedHospitalIds(selectedHospitalIds.filter(hId => hId !== id));
    } else {
      setSelectedHospitalIds([...selectedHospitalIds, id]);
    }
  };

  const toggleSupply = (id: string) => {
    if (selectedSupplyIds.includes(id)) {
      setSelectedSupplyIds(selectedSupplyIds.filter(sId => sId !== id));
    } else {
      setSelectedSupplyIds([...selectedSupplyIds, id]);
    }
  };

  const selectAllHospitals = () => setSelectedHospitalIds(hospitals.map(h => h.id));
  const selectNoneHospitals = () => setSelectedHospitalIds(['depot']);
  const selectAllSupplies = () => setSelectedSupplyIds(supplies.map(s => s.id));
  const selectNoneSupplies = () => setSelectedSupplyIds([]);

  return (
    <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Vehicle Selector */}
      <div className="p-4 border-b border-slate-100">
        <select 
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full p-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.capacity} kg
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Hospitals Section */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="scannable-header !mb-0">HOSPITALS ({hospitals.length})</div>
            <div className="flex gap-2 text-[10px] font-bold text-slate-400">
              <button onClick={selectAllHospitals} className="hover:text-slate-900 uppercase">All</button>
              <span className="opacity-30">|</span>
              <button onClick={selectNoneHospitals} className="hover:text-slate-900 uppercase">None</button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-64 overflow-y-auto mb-4 border border-slate-100 rounded p-2">
            {hospitals.map(h => (
              <div 
                key={h.id}
                onClick={() => toggleHospital(h.id)}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  selectedHospitalIds.includes(h.id) ? 'bg-slate-50' : 'hover:bg-slate-50 opacity-60'
                }`}
              >
                {selectedHospitalIds.includes(h.id) ? (
                  <CheckSquare size={16} className="text-blue-700 flex-shrink-0" />
                ) : (
                  <Square size={16} className="text-slate-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-[13px]">{h.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">
                    {h.city} • P{h.priority}
                  </div>
                </div>
                {h.isUrgent && <AlertTriangle size={14} className="text-red-500" />}
              </div>
            ))}
          </div>
          
          <button 
            onClick={runTSPOny}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Play size={14} fill="currentColor" /> Run TSP
          </button>
        </div>

        {/* Supplies Section */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="scannable-header !mb-0">SUPPLIES ({supplies.length})</div>
            <div className="flex gap-2 text-[10px] font-bold text-slate-400">
              <button onClick={selectAllSupplies} className="hover:text-slate-900 uppercase">All</button>
              <span className="opacity-30">|</span>
              <button onClick={selectNoneSupplies} className="hover:text-slate-900 uppercase">None</button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-64 overflow-y-auto mb-4 border border-slate-100 rounded p-2 bg-white">
            {supplies.map(s => (
              <div 
                key={s.id}
                onClick={() => toggleSupply(s.id)}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  selectedSupplyIds.includes(s.id) ? 'bg-slate-50' : 'hover:bg-slate-50 opacity-60'
                }`}
              >
                {selectedSupplyIds.includes(s.id) ? (
                  <CheckSquare size={16} className="text-blue-700 flex-shrink-0" />
                ) : (
                  <Square size={16} className="text-slate-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-[13px]">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">
                    {s.weight} kg • val {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={runKnapsackOnly}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded flex items-center justify-center gap-2 transition-all"
          >
            <Package size={14} /> Pack Items
          </button>
        </div>
      </div>
    </aside>
  );
}
