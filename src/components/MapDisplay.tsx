import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Hospital, RouteStep } from '../types';
import L from 'leaflet';
import { useEffect, useState, useMemo } from 'react';

const createNumberIcon = (number: string | number, color: string, isDepot: boolean) => L.divIcon({
  className: 'custom-number-icon',
  html: `<div style="
    background-color: ${color}; 
    color: white; 
    width: ${isDepot ? '26px' : '22px'}; 
    height: ${isDepot ? '26px' : '22px'}; 
    border-radius: ${isDepot ? '2px' : '50%'}; 
    border: 2px solid white; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-family: 'JetBrains Mono', monospace;
    font-weight: 800; 
    font-size: ${isDepot ? '14px' : '11px'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  ">${number}</div>`,
  iconSize: [isDepot ? 26 : 22, isDepot ? 26 : 22],
  iconAnchor: [isDepot ? 13 : 11, isDepot ? 13 : 11],
});

interface MapDisplayProps {
  activeHospitals: Hospital[];
  route: RouteStep[];
  hoveredHospitalId: string | null;
  onHover: (id: string | null) => void;
  centerNode: Hospital | null;
}

function MapBoundsHelper({ hospitals, centerNode }: { hospitals: Hospital[]; centerNode: Hospital | null }) {
  const map = useMap();
  useEffect(() => {
    if (centerNode) {
      map.flyTo([centerNode.lat, centerNode.lng], 10, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else if (hospitals.length > 0) {
      const bounds = L.latLngBounds(hospitals.map(h => [h.lat, h.lng]));
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [hospitals, map, centerNode]);

  return null;
}

export default function MapDisplay({ 
  activeHospitals, 
  route, 
  hoveredHospitalId,
  onHover,
  centerNode
}: MapDisplayProps) {
  const polylinePositions = useMemo(() => route.map(step => [step.hospital.lat, step.hospital.lng] as [number, number]), [route]);
  
  const [currentPosIdx, setCurrentPosIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Reset animation when route changes
  useEffect(() => {
    setCurrentPosIdx(0);
    setProgress(0);
    setIsFinished(false);
  }, [route]);

  // Handle replay event
  useEffect(() => {
    const handleReplay = () => {
      setCurrentPosIdx(0);
      setProgress(0);
      setIsFinished(false);
    };
    window.addEventListener('replay-simulation', handleReplay);
    return () => window.removeEventListener('replay-simulation', handleReplay);
  }, []);

  useEffect(() => {
    if (route.length < 2 || isFinished) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          if (currentPosIdx >= route.length - 2) {
            setIsFinished(true);
            return 1;
          }
          setCurrentPosIdx(curr => curr + 1);
          return 0;
        }
        return prev + 0.1; 
      });
    }, 30);

    return () => clearInterval(interval);
  }, [route, currentPosIdx, isFinished]);

  // Create a map of hospital ID to route index
  const routeIndexes = useMemo(() => {
    const map = new Map<string, number>();
    route.forEach((step, idx) => {
      map.set(step.hospital.id, idx);
    });
    return map;
  }, [route]);

  // Calculate the path that has been revealed so far
  const revealedPath = useMemo(() => {
    if (route.length < 2) return [];
    const path = polylinePositions.slice(0, currentPosIdx + 1);
    
    // Add the current animated segment
    if (!isFinished && currentPosIdx < route.length - 1) {
      const start = route[currentPosIdx].hospital;
      const end = route[currentPosIdx + 1].hospital;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      path.push([lat, lng]);
    } else if (isFinished) {
      return polylinePositions;
    }
    
    return path;
  }, [route, polylinePositions, currentPosIdx, progress, isFinished]);

  return (
    <MapContainer 
      center={[12.9716, 77.5946]} 
      zoom={6} 
      className="absolute inset-0 z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapBoundsHelper hospitals={activeHospitals} centerNode={centerNode} />

      {activeHospitals.map(h => {
        const idx = routeIndexes.get(h.id);
        const isRevealed = isFinished || h.id === 'depot' || (idx !== undefined && idx <= currentPosIdx);
        const isHovered = hoveredHospitalId === h.id;
        
        const label = h.id === 'depot' ? 'D' : (idx !== undefined ? idx.toString() : '');
        const baseColor = h.isUrgent ? '#EF4444' : (h.id === 'depot' ? '#0F172A' : '#1D4ED8');
        const color = isHovered ? '#F59E0B' : baseColor;
        const icon = createNumberIcon(label, color, h.id === 'depot' || isHovered);

        return (
          <Marker 
            key={h.id} 
            position={[h.lat, h.lng]} 
            icon={icon}
            zIndexOffset={h.id === 'depot' || isHovered ? 500 : 100}
            opacity={isRevealed ? 1 : 0.2}
            eventHandlers={{
              mouseover: () => onHover(h.id),
              mouseout: () => onHover(null),
            }}
          >
            <Popup>
              <div className="font-bold">{h.name}</div>
              <div className="text-xs text-slate-500">{h.city}</div>
            </Popup>
          </Marker>
        );
      })}

      {polylinePositions.length > 1 && (
        <>
          {/* Revealed active route */}
          <Polyline 
            positions={revealedPath} 
            pathOptions={{ color: '#1D4ED8', weight: 4, opacity: 1, lineJoin: 'round' }} 
          />
          {!isFinished && revealedPath.length > 0 && (
            <Marker 
              position={revealedPath[revealedPath.length - 1] as [number, number]} 
              icon={L.divIcon({
                className: 'transit-pulse',
                html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
                         <div style="position: absolute; width: 32px; height: 32px; background-color: #3b82f6; border-radius: 9999px; opacity: 0.4; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                         <div style="position: relative; width: 14px; height: 14px; background-color: #1d4ed8; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);"></div>
                       </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })} 
              zIndexOffset={1000} 
            />
          )}
        </>
      )}
    </MapContainer>
  );
}

