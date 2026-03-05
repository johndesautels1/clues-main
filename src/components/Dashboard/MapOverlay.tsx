/**
 * Map Overlay — High-res flat map that appears when the globe reaches city level.
 * Uses Leaflet with CartoDB Dark tiles (matching our dark theme) and optional
 * Esri satellite imagery. No API keys required.
 */

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapOverlay.css';

const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: 'Dark',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    label: 'Satellite',
  },
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: 'Street',
  },
} as const;

type LayerKey = keyof typeof TILE_LAYERS;

/** Syncs the Leaflet map center when the parent lat/lng changes */
function MapSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevCoords = useRef({ lat, lng });

  useEffect(() => {
    if (lat !== prevCoords.current.lat || lng !== prevCoords.current.lng) {
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.8 });
      prevCoords.current = { lat, lng };
    }
  }, [lat, lng, map]);

  return null;
}

interface Props {
  lat: number;
  lng: number;
  visible: boolean;
  onBackToGlobe: () => void;
}

export function MapOverlay({ lat, lng, visible, onBackToGlobe }: Props) {
  const [layer, setLayer] = useState<LayerKey>('dark');
  const tile = TILE_LAYERS[layer];

  if (!visible) return null;

  return (
    <div className={`map-overlay ${visible ? 'map-overlay--visible' : ''}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        className="map-overlay__map"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={19} />
        <MapSync lat={lat} lng={lng} />
      </MapContainer>

      {/* Controls bar */}
      <div className="map-overlay__controls">
        <button
          className="map-overlay__back-btn"
          onClick={onBackToGlobe}
          type="button"
          aria-label="Return to 3D globe view"
        >
          <span className="map-overlay__back-icon" aria-hidden="true">&#x1F310;</span>
          Globe View
        </button>

        <div className="map-overlay__layer-toggle" role="radiogroup" aria-label="Map style">
          {(Object.keys(TILE_LAYERS) as LayerKey[]).map((key) => (
            <button
              key={key}
              className={`map-overlay__layer-btn ${layer === key ? 'map-overlay__layer-btn--active' : ''}`}
              onClick={() => setLayer(key)}
              type="button"
              role="radio"
              aria-checked={layer === key}
            >
              {TILE_LAYERS[key].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
