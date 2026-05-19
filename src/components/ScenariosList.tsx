import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { FolderOpen, Clock, Trash2, ChevronRight, RefreshCw } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  selectedHospitalIds: string[];
  selectedSupplyIds: string[];
  selectedVehicleId: string;
  createdAt: Timestamp;
}

interface ScenariosListProps {
  onLoad: (scenario: Scenario) => void;
  onClose: () => void;
}

export default function ScenariosList({ onLoad, onClose }: ScenariosListProps) {
  const { user } = useFirebase();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScenarios() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'scenarios'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const scenarioData: Scenario[] = [];
        querySnapshot.forEach((doc) => {
          scenarioData.push({ id: doc.id, ...doc.data() } as Scenario);
        });
        setScenarios(scenarioData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'scenarios');
      } finally {
        setLoading(false);
      }
    }

    fetchScenarios();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-300">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FolderOpen size={20} className="text-blue-600" />
              SAVED PLANS
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cloud Storage Retrieval</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-mono font-bold">ESC</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw size={32} className="text-blue-600 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accessing Database...</span>
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
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                  onClick={() => onLoad(s)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-slate-800 tracking-tight group-hover:text-blue-700 transition-colors">{s.name}</h3>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.createdAt.toDate().toLocaleDateString()}
                    </span>
                    <span>{s.selectedHospitalIds.length} Hospitals</span>
                    <span>{s.selectedSupplyIds.length} Supplies</span>
                  </div>
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
