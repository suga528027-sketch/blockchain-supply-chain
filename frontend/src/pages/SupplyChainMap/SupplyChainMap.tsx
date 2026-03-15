import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Package, User, CheckCircle, Navigation, Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Fix leaflet default icon issue as requested
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create custom SVG markers
const getPinColor = (type: string) => {
  switch (type) {
    case 'BATCH_CREATED': return '#1A8C5B'; // Green
    case 'IN_TRANSIT': return '#F4A300'; // Orange
    case 'DELIVERED': return '#3B82F6'; // Blue
    default: return '#6B7280'; // Gray
  }
};

const createSvgIcon = (color: string) => L.divIcon({
  className: 'bg-transparent border-none',
  html: `<div style="transform: translate(-50%, -100%); width: 32px; height: 32px;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -32]
});

interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  status: string;
  farmer: { fullName: string };
}

interface TrackingEvent {
  id: number;
  eventType: string;
  locationName?: string;
  location?: string;
  latitude: number | null;
  longitude: number | null;
  eventTimestamp: string;
  notes: string;
}

const SupplyChainMap: React.FC = () => {
  const [searchCode, setSearchCode] = useState('');
  const [batch, setBatch] = useState<Batch | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India default
  const [zoomLevel, setZoomLevel] = useState(5);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.warning('Please enter a batch code');
      return;
    }

    setLoading(true);
    setBatch(null);
    setEvents([]);

    try {
      // Fetch batch details
      const trimmedCode = searchCode.trim();
      const batchRes = await api.get(`/batch/track/${trimmedCode}`);
      if (!batchRes.data.success) throw new Error(batchRes.data.message);
      
      const batchData = batchRes.data.data;
      setBatch(batchData);

      // Fetch tracking events
      const eventsRes = await api.get(`/tracking/batch/${batchData.id}`);
      if (eventsRes.data.success) {
        let eventsData: TrackingEvent[] = eventsRes.data.data;
        
        // Filter events that have valid coordinates for the map
        const validMapEvents = eventsData.filter(e => e.latitude != null && e.longitude != null);
        if (validMapEvents.length > 0) {
          const lastEvent = validMapEvents[validMapEvents.length - 1];
          setMapCenter([parseFloat(lastEvent.latitude as any), parseFloat(lastEvent.longitude as any)]);
          setZoomLevel(6);
        }
        setEvents(eventsData);
      }
      toast.success('Batch found successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error tracking batch. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Extract plottable points for Polyline
  const routePoints: [number, number][] = events
    .filter(e => e.latitude != null && e.longitude != null)
    .map(e => [parseFloat(e.latitude as any), parseFloat(e.longitude as any)]);

  return (
    <div className="text-slate-900 dark:text-white space-y-6">
      {/* Header & Search */}
       <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white dark:bg-opacity-5 rounded-2xl p-6 border border-slate-200 dark:border-white dark:border-opacity-10 backdrop-blur-md shadow-xl dark:shadow-2xl"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl flex items-center gap-3 font-bold text-slate-800 dark:text-white">
              <MapPin className="text-[#1A8C5B]" />
              Supply Chain Interactive Map
            </h1>
            <p className="text-gray-400 mt-1">Track the origin, journey, and delivery of agricultural products</p>
          </div>
          <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter Batch Code"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full md:w-80 bg-slate-100 dark:bg-[#0F2027] text-slate-900 dark:text-white border border-slate-200 dark:border-gray-600 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#1A8C5B] transition-colors"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#1A8C5B] to-emerald-500 hover:from-emerald-500 hover:to-[#1A8C5B] text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Track Batch'
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full lg:h-[700px]">
        {/* Left Sidebar (Batch Details & Timeline) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto"
        >
          {/* Batch Details Card */}
           <div className="bg-white dark:bg-white dark:bg-opacity-5 rounded-2xl p-6 border border-slate-200 dark:border-white dark:border-opacity-10 backdrop-blur-md relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A8C5B] to-[#F4A300]"></div>
            
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
              <Package className="text-[#F4A300]" />
              Batch Information
            </h2>
            
            {batch ? (
              <div className="space-y-4">
                 <div className="p-3 bg-slate-50 dark:bg-white dark:bg-opacity-5 rounded-xl border border-slate-100 dark:border-white dark:border-opacity-5">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Name</div>
                  <div className="text-lg font-medium text-green-600 dark:text-[#1A8C5B]">{batch.productName}</div>
                </div>
                
                 <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-white dark:bg-opacity-5 rounded-xl border border-slate-100 dark:border-white dark:border-opacity-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Status</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{batch.status}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-white dark:bg-opacity-5 rounded-xl border border-slate-100 dark:border-white dark:border-opacity-5">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Package className="w-3 h-3"/> Quantity</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{batch.quantityKg} kg</div>
                  </div>
                </div>

                 <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Batch Code</span>
                    <span className="font-mono bg-green-500 bg-opacity-10 dark:bg-[#1A8C5B] dark:bg-opacity-20 text-green-700 dark:text-[#1A8C5B] px-2 py-1 rounded">{batch.batchCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                    <span className="text-gray-500 dark:text-gray-400">Farmer</span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4"/> {batch.farmer?.fullName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10 text-gray-600" />
                <p>Search for a batch to view its details above.</p>
              </div>
            )}
          </div>

           {/* Timeline */}
          <div className="bg-white dark:bg-white dark:bg-opacity-5 rounded-2xl p-6 border border-slate-200 dark:border-white dark:border-opacity-10 backdrop-blur-md flex-1 overflow-hidden flex flex-col shadow-sm dark:shadow-none">
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
              <Navigation className="text-[#3B82F6]" />
              Journey Timeline
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {events.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#1A8C5B] before:via-[#F4A300] before:to-[#3B82F6]">
                  {events.map((event, index) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={event.id} 
                      className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0F2027] bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" style={{ backgroundColor: getPinColor(event.eventType), color: 'white' }}>
                        <CheckCircle className="w-5 h-5 mx-auto" />
                      </div>
                      
                        {/* Content Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white dark:bg-white dark:bg-opacity-5 border border-slate-200 dark:border-white dark:border-opacity-10 backdrop-blur-sm shadow-lg">
                        <div className="flex items-center justify-between space-x-2 mb-2">
                          <div className="font-bold text-sm" style={{ color: getPinColor(event.eventType) }}>{event.eventType.replace(/_/g, ' ')}</div>
                          <time className="text-xs text-gray-400 font-medium">{new Date(event.eventTimestamp).toLocaleDateString()}</time>
                        </div>
                         <div className="text-sm text-slate-600 dark:text-gray-300 flex flex-col gap-1">
                          {(event.locationName || event.location) && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 text-xs">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.locationName || event.location}
                            </div>
                          )}
                          <div className="mt-1">{event.notes || 'Status updated'}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                 <div className="text-center py-8 text-gray-500">
                  <p>No journey data available.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Area (Leaflet Map) */}
         <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-slate-200 dark:bg-[#0F2027] rounded-2xl overflow-hidden border border-slate-300 dark:border-white dark:border-opacity-10 shadow-2xl relative min-h-[400px]"
        >
          {/* Map Layer */}
          <MapContainer 
            key={`${mapCenter[0]}-${mapCenter[1]}-${zoomLevel}`} // Force re-render when changing center substantially
            center={mapCenter} 
            zoom={zoomLevel} 
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            scrollWheelZoom={true}
          >
            {/* OpenStreetMap Tiles (Free, No API Key) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <AnimatePresence>
              {events.map((event) => {
                if (event.latitude == null || event.longitude == null) return null;
                
                const position: [number, number] = [parseFloat(event.latitude as any), parseFloat(event.longitude as any)];
                const pinColor = getPinColor(event.eventType);
                
                return (
                  <Marker 
                    key={event.id} 
                    position={position}
                    icon={createSvgIcon(pinColor)}
                  >
                    <Popup className="custom-popup">
                      <div className="text-slate-800 p-1">
                        <strong className="block text-sm mb-1" style={{ color: pinColor }}>
                          {event.eventType.replace(/_/g, ' ')}
                        </strong>
                        {(event.locationName || event.location) && <div className="text-xs mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.locationName || event.location}</div>}
                        <div className="text-xs text-gray-500 mb-2">{new Date(event.eventTimestamp).toLocaleString()}</div>
                        <p className="text-xs m-0 border-t pt-2 border-gray-200">{event.notes || 'Status validated'}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </AnimatePresence>
            
            {/* Polyline connecting tracking points */}
            {routePoints.length > 1 && (
              <Polyline 
                positions={routePoints} 
                pathOptions={{ 
                  color: '#F4A300', 
                  weight: 4, 
                  opacity: 0.7, 
                  dashArray: '10, 10', 
                  lineCap: 'round'
                }} 
              />
            )}
            
          </MapContainer>

           {/* Map Overlay Loading State */}
          {loading && (
            <div className="absolute inset-0 bg-slate-50 dark:bg-[#0F2027] bg-opacity-70 backdrop-blur-sm z-[1000] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-[#1A8C5B] border-t-transparent rounded-full animate-spin"></div>
               <p className="font-medium tracking-wide text-slate-800 dark:text-white">Retrieving coordinates...</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        /* Custom Scrollbar for timeline */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        /* Style for leaflet popup */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-container {
           font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default SupplyChainMap;