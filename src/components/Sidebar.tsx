import { Hospital, Supply, Vehicle } from '../types';
import { AlertTriangle, CheckSquare, Square, ChevronDown } from 'lucide-react';

interface SidebarProps {
  hospitals: Hospital[];
  supplies: Supply[];
  vehicles: Vehicle[];
  selectedHospitalIds: string[];
  onHospitalToggle: (id: string | 'ALL' | 'NONE') => void;
  selectedSupplyIds: string[];
  onSupplyToggle: (id: string | 'ALL' | 'NONE') => void;
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  runTSPOnly: () => void;
  runKnapsackOnly: () => void;
  hoveredHospitalId: string | null;
  setHoveredHospitalId: (id: string | null) => void;
  onHospitalFocus: (hospital: Hospital) => void;
}

export default function Sidebar({
  hospitals,
  supplies,
  vehicles,
  selectedHospitalIds,
  onHospitalToggle,
  selectedSupplyIds,
  onSupplyToggle,
  selectedVehicleId,
  onVehicleSelect,
  runTSPOnly,
  runKnapsackOnly,
  hoveredHospitalId,
  setHoveredHospitalId,
  onHospitalFocus
}: SidebarProps) {
  
  return (
    <aside className="w-[320px] bg-white border-r border-slate-300 flex flex-col overflow-hidden">
      {/* Vehicle Selector */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="relative group">
          <select 
            value={selectedVehicleId} 
            onChange={(e) => onVehicleSelect(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 rounded px-4 py-3 text-[18px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all cursor-pointer"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.capacity} kg
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">
            <ChevronDown size={20} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hospitals Segment */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <span className="text-[13px] font-mono font-bold text-slate-800 uppercase tracking-[0.2em] relative z-10">
                HOSPITALS ({hospitals.length})
              </span>
              <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-slate-800 opacity-40" />
            </div>
            <div className="flex gap-2 text-[11px] font-medium text-slate-400">
              <button 
                onClick={() => onHospitalToggle('ALL')}
                className="hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                ALL
              </button>
              <span className="opacity-30">|</span>
              <button 
                onClick={() => onHospitalToggle('NONE')}
                className="hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                NONE
              </button>
            </div>
          </div>
          
          <div className="space-y-1 mb-5 max-h-80 overflow-y-auto pr-1">
            <div className="border border-slate-200 rounded-sm bg-slate-50/20 p-1">
              {hospitals.map(h => (
                <div 
                  key={h.id}
                  onMouseEnter={() => setHoveredHospitalId(h.id)}
                  onMouseLeave={() => setHoveredHospitalId(null)}
                  onClick={() => onHospitalFocus(h)}
                  className={`flex items-center gap-4 p-3 rounded-sm cursor-pointer transition-all ${
                    selectedHospitalIds.includes(h.id) ? 'bg-white shadow-sm border border-slate-100' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  } ${hoveredHospitalId === h.id ? 'ring-2 ring-blue-500/20 bg-blue-50/10' : ''}`}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); // Don't trigger focus when clicking checkbox
                      onHospitalToggle(h.id);
                    }}
                    className={selectedHospitalIds.includes(h.id) ? 'text-blue-600' : 'text-slate-300'}
                  >
                    {selectedHospitalIds.includes(h.id) ? (
                      <div className="w-5 h-5 bg-blue-700 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      </div>
                    ) : (
                      <Square size={20} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 truncate tracking-tight">{h.name}</div>
                    <div className="text-[11px] font-mono text-slate-700 uppercase tracking-wider mt-0.5">
                      {h.id === 'depot' ? 'Logistic Hub' : `${h.city} • P${h.priority}`}
                    </div>
                  </div>
                  {h.isUrgent && (
                    <AlertTriangle size={18} fill="#EF4444" className="text-white" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={runTSPOnly}
            className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-[16px] rounded-sm transition-all tracking-tight"
          >
            Run TSP only
          </button>
        </div>

        {/* Supplies Segment */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/10">
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <span className="text-[13px] font-mono font-bold text-slate-800 uppercase tracking-[0.2em] relative z-10">
                SUPPLIES ({supplies.length})
              </span>
              <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-slate-800 opacity-40" />
            </div>
            <div className="flex gap-2 text-[11px] font-medium text-slate-400">
              <button 
                onClick={() => onSupplyToggle('ALL')}
                className="hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                ALL
              </button>
              <span className="opacity-30">|</span>
              <button 
                onClick={() => onSupplyToggle('NONE')}
                className="hover:text-blue-600 transition-colors uppercase tracking-widest"
              >
                NONE
              </button>
            </div>
          </div>
          
          <div className="space-y-1 mb-5 max-h-80 overflow-y-auto pr-1">
            <div className="border border-slate-100 rounded-sm bg-slate-50/20 p-1">
              {supplies.map(s => (
                <div 
                  key={s.id}
                  onClick={() => onSupplyToggle(s.id)}
                  className={`flex items-center gap-4 p-3 rounded-sm cursor-pointer transition-all ${
                    selectedSupplyIds.includes(s.id) ? 'bg-white shadow-sm border border-slate-100' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                  }`}
                >
                  <div className={selectedSupplyIds.includes(s.id) ? 'text-blue-600' : 'text-slate-300'}>
                    {selectedSupplyIds.includes(s.id) ? (
                      <div className="w-5 h-5 bg-blue-700 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      </div>
                    ) : (
                      <Square size={20} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 truncate tracking-tight">{s.name}</div>
                    <div className="text-[11px] font-mono text-slate-700 uppercase tracking-widest mt-0.5">
                      {s.weight} kg • val {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={runKnapsackOnly}
            className="w-full py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold text-[16px] rounded-sm transition-all tracking-tight"
          >
            Run Knapsack only
          </button>
        </div>
      </div>
    </aside>
  );
}
