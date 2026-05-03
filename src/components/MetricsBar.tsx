import { OptimizationResult, Vehicle } from '../types';

interface MetricsBarProps {
  result: OptimizationResult;
  selectedVehicle: Vehicle;
}

export default function MetricsBar({ result, selectedVehicle }: MetricsBarProps) {
  const metrics = [
    { 
      label: 'TOTAL DISTANCE', 
      value: result.tsp?.totalDistance.toFixed(3) || '0.000', 
      unit: 'km',
      color: 'text-blue-700'
    },
    { 
      label: 'VALUE LOADED', 
      value: result.knapsack?.totalValue.toString() || '0', 
      unit: 'pts',
      color: 'text-emerald-600'
    },
    { 
      label: 'WEIGHT LOADED', 
      value: result.knapsack?.totalWeight.toString() || '0', 
      unit: `kg / ${selectedVehicle.capacity} kg`,
      color: 'text-slate-900'
    },
    { 
      label: 'UTILIZATION', 
      value: Math.round(result.knapsack?.utilization || 0).toString(), 
      unit: '%',
      color: 'text-slate-900'
    },
    { 
      label: 'HOSPITALS SERVED', 
      value: (result.tsp?.route.length ? result.tsp.route.length - 1 : 0).toString(), 
      unit: '',
      color: 'text-slate-900'
    },
    { 
      label: '2-OPT IMPROVEMENT', 
      value: result.tsp?.improvement.toFixed(2) || '0.00', 
      unit: '%',
      color: 'text-blue-700'
    },
  ];

  return (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center px-6 divide-x divide-slate-100">
      {metrics.map((m, i) => (
        <div key={i} className="flex-1 first:pl-0 pl-6 h-full flex flex-col justify-center">
          <div className="scannable-header mb-1">{m.label}</div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold tracking-tight data-value ${m.color}`}>
              {m.value}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {m.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
