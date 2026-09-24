import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically set map center based on user's current location
const MapController: React.FC<{center: [number, number] | null}> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
};

const InteractiveMap: React.FC = () => {
  const findings = useLiveQuery(() => db.findings.toArray());
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('Geolocation denied or failed', err)
      );
    }
  }, []);

  const defaultCenter: [number, number] = [39.7392, -104.9903]; // Default to Denver for example

  return (
    <div className="h-screen w-full flex flex-col relative bg-zinc-900">

      {/* Floating Header */}
      <div className="absolute top-4 left-4 z-[1000] flex space-x-2">
        <Link to="/gallery" className="p-3 bg-zinc-900/90 text-white backdrop-blur-md rounded-full shadow-lg hover:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="px-4 py-3 bg-zinc-900/90 text-white backdrop-blur-md rounded-full shadow-lg font-semibold text-sm">
          Social & Geological Map
        </div>
      </div>

      <div className="flex-1">
        <MapContainer
          center={defaultCenter}
          zoom={4}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          {/* Note: In a production field app, we would load offline MBTiles here via a custom protocol/blob URL. For MVP web dev, we use public OSM tiles. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={currentLocation} />

          {/* User's current location pin */}
          {currentLocation && (
             <Marker position={currentLocation}>
                <Popup>
                   <div className="font-medium text-sm">You are here</div>
                </Popup>
             </Marker>
          )}

          {/* Saved Findings */}
          {findings?.map((finding) => {
            if (finding.lat && finding.lng) {
              return (
                <Marker key={finding.id} position={[finding.lat, finding.lng]}>
                  <Popup>
                    <div className="flex flex-col min-w-[150px]">
                      <img src={finding.imageDataUrl} alt={finding.title} className="w-full h-24 object-cover rounded mb-2" />
                      <strong className="text-sm text-zinc-900">{finding.title}</strong>
                      <span className="text-xs text-zinc-500 mt-1">
                        {new Date(finding.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>

      {/* Locate Me FAB */}
      <button
        onClick={() => {
           if (currentLocation) {
              setCurrentLocation([...currentLocation]); // Trigger effect
           }
        }}
        className="absolute bottom-8 right-4 z-[1000] p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition"
      >
        <Navigation className="w-6 h-6" />
      </button>

    </div>
  );
};

export default InteractiveMap;
