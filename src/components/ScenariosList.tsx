import React, { useEffect, useState } from 'react';
import { FolderOpen, Clock, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  selectedHospitalIds: string[];
  selectedSupplyIds: string[];
  selectedVehicleId: string;
  createdAt: string;
}

interface ScenariosListProps {
  onLoad: (scenario: Scenario) => void;
  onClose: () => void;
}

export default function ScenariosList({ onLoad, onClose }: ScenariosListProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (error) {
      console.error('Fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const deleteScenario = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setScenarios(prev => prev.filter(s => s.id !== id));
      } else {
        alert('Failed to delete on server');
      }
    } catch (error) {
      console.error('Delete error', error);
      alert('Failed to delete scenario');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-300">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen size={20} className="text-blue-600" />
              SAVED PLANS
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Local Server Storage Retrieval</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-mono font-bold">ESC</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw size={32} className="text-blue-600 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Database...</span>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 italic">No saved scenarios found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((s) => (
                <div 
                  key={s.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group relative"
                  onClick={() => onLoad(s)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors pr-8">{s.name}</h3>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                    <span>{s.selectedHospitalIds?.length || 0} Hospitals</span>
                  </div>
                  
                  <button 
                    onClick={(e) => deleteScenario(e, s.id)}
                    className="absolute top-4 right-10 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">End of Record Set</p>
        </div>
      </div>
    </div>
  );
}
