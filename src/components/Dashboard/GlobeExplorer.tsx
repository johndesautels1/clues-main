/**
 * Globe Explorer
 * Interactive 3D world globe with progressive zoom-to-region/country/city.
 * Each click zooms deeper. User can scroll-wheel zoom freely too.
 *
 * Zoom levels:
 *  - Start: altitude ~2.5 (full globe view)
 *  - Click 1: altitude ~0.8 (region/continent)
 *  - Click 2: altitude ~0.25 (country)
 *  - Click 3+: altitude ~0.07 (city level)
 *  - Scroll wheel: free zoom all the way down to street-level distance
 */

import { useRef, useState, useCallback, useEffect, memo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { MapOverlay } from './MapOverlay';
import './GlobeExplorer.css';

// Predefined regions for labeling the user's zoom location
const REGIONS = [
  { name: 'North America', lat: 40, lng: -100, radius: 30 },
  { name: 'Central America & Caribbean', lat: 15, lng: -85, radius: 15 },
  { name: 'South America', lat: -15, lng: -60, radius: 25 },
  { name: 'Western Europe', lat: 48, lng: 5, radius: 15 },
  { name: 'Eastern Europe', lat: 50, lng: 30, radius: 15 },
  { name: 'Southern Europe / Mediterranean', lat: 40, lng: 15, radius: 12 },
  { name: 'Scandinavia & Nordics', lat: 62, lng: 15, radius: 12 },
  { name: 'UK & Ireland', lat: 54, lng: -4, radius: 8 },
  { name: 'Middle East', lat: 30, lng: 45, radius: 15 },
  { name: 'North Africa', lat: 30, lng: 10, radius: 15 },
  { name: 'Sub-Saharan Africa', lat: -5, lng: 25, radius: 25 },
  { name: 'Southern Africa', lat: -28, lng: 25, radius: 12 },
  { name: 'Central Asia', lat: 42, lng: 65, radius: 15 },
  { name: 'South Asia', lat: 22, lng: 78, radius: 15 },
  { name: 'Southeast Asia', lat: 5, lng: 110, radius: 15 },
  { name: 'East Asia', lat: 35, lng: 115, radius: 15 },
  { name: 'Oceania & Pacific', lat: -25, lng: 140, radius: 20 },
  { name: 'New Zealand', lat: -42, lng: 174, radius: 8 },
];

/** Progressive zoom altitude levels — each click goes deeper */
const ZOOM_LEVELS = [
  { altitude: 0.8,  label: 'Region',  icon: '🌍' },
  { altitude: 0.25, label: 'Country', icon: '🏳️' },
  { altitude: 0.07, label: 'City',    icon: '🏙️' },
];

function getClosestRegion(lat: number, lng: number): string {
  let closest = REGIONS[0].name;
  let minDist = Infinity;
  for (const region of REGIONS) {
    const dlat = lat - region.lat;
    const dlng = lng - region.lng;
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    if (dist < minDist) {
      minDist = dist;
      closest = region.name;
    }
  }
  return closest;
}

/** Estimate zoom depth label from current altitude */
function getZoomLabel(altitude: number): { label: string; icon: string } {
  if (altitude > 0.5) return { label: 'Region', icon: '🌍' };
  if (altitude > 0.15) return { label: 'Country', icon: '🏳️' };
  return { label: 'City', icon: '🏙️' };
}

interface Props {
  onRegionSelected: (region: string, lat: number, lng: number, zoomLevel: number) => void;
  onReset: () => void;
  globeSelection: { region: string; lat: number; lng: number; zoomLevel: number } | null;
}

export const GlobeExplorer = memo(function GlobeExplorer({ onRegionSelected, onReset, globeSelection }: Props) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomDepth, setZoomDepth] = useState(globeSelection?.zoomLevel ?? 0);
  const [zoomLabel, setZoomLabel] = useState<{ label: string; icon: string } | null>(
    globeSelection ? getZoomLabel(ZOOM_LEVELS[Math.min(globeSelection.zoomLevel - 1, 2)]?.altitude ?? 2.5) : null
  );
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(
    globeSelection ? { lat: globeSelection.lat, lng: globeSelection.lng } : null
  );
  const hasZoomed = !!globeSelection;

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, 600);
        setDimensions({ width: size, height: size });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Set initial globe appearance — allow deep zoom
  // If user has a saved globe selection, restore their position
  const hasRestored = useRef(false);
  const hasEnhancedTexture = useRef(false);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();
    if (controls) {
      controls.enableZoom = true;
      controls.minDistance = 101;  // city/street level
      controls.maxDistance = 500;  // full globe pullback
    }

    // Enhance texture quality — anisotropic filtering for sharper zoom
    if (!hasEnhancedTexture.current) {
      hasEnhancedTexture.current = true;
      const applyFiltering = () => {
        try {
          const renderer = globeRef.current?.renderer?.();
          const scene = globeRef.current?.scene?.();
          if (!renderer || !scene) return;
          const maxAniso = renderer.capabilities.getMaxAnisotropy();
          scene.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
              const mat = obj.material;
              if (mat.map) {
                mat.map.anisotropy = maxAniso;
                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                mat.map.magFilter = THREE.LinearFilter;
                mat.map.needsUpdate = true;
              }
              if (mat.bumpMap) {
                mat.bumpMap.anisotropy = maxAniso;
                mat.bumpMap.needsUpdate = true;
              }
            }
          });
        } catch { /* globe not fully ready */ }
      };
      // Texture loads async — retry a few times
      setTimeout(applyFiltering, 1000);
      setTimeout(applyFiltering, 3000);
      setTimeout(applyFiltering, 6000);
    }

    // Restore saved globe position on return
    if (globeSelection && !hasRestored.current) {
      hasRestored.current = true;
      // Stop auto-rotate since user already picked a region
      if (controls) controls.autoRotate = false;
      // Zoom to their saved position
      const altitude = ZOOM_LEVELS[Math.min(globeSelection.zoomLevel - 1, 2)]?.altitude ?? 0.8;
      globeRef.current.pointOfView(
        { lat: globeSelection.lat, lng: globeSelection.lng, altitude },
        1500
      );
      setZoomDepth(globeSelection.zoomLevel);
      setZoomLabel(getZoomLabel(altitude));
    } else if (!globeSelection) {
      // Fresh session — auto-rotate
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
      }
    }
  }, [globeSelection]);

  const handleGlobeClick = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    if (!globeRef.current || isZooming) return;

    setIsZooming(true);

    // Stop auto-rotate on first interaction
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = false;
    }

    // Get current altitude to determine next zoom step
    const currentPov = globeRef.current.pointOfView();
    const currentAltitude = currentPov?.altitude ?? 2.5;

    // Determine next zoom level based on current altitude
    let nextAltitude: number;
    let nextDepth: number;

    if (currentAltitude > 1.0) {
      // First zoom: region level
      nextAltitude = ZOOM_LEVELS[0].altitude;
      nextDepth = 1;
    } else if (currentAltitude > 0.4) {
      // Second zoom: country level
      nextAltitude = ZOOM_LEVELS[1].altitude;
      nextDepth = 2;
    } else if (currentAltitude > 0.12) {
      // Third zoom: city level
      nextAltitude = ZOOM_LEVELS[2].altitude;
      nextDepth = 3;
    } else {
      // Already at city level — re-center on new click point, stay at same depth
      nextAltitude = ZOOM_LEVELS[2].altitude;
      nextDepth = 3;
    }

    // Animate to clicked point at the new altitude
    globeRef.current.pointOfView(
      { lat, lng, altitude: nextAltitude },
      1200
    );

    const region = getClosestRegion(lat, lng);
    setZoomDepth(nextDepth);
    setZoomLabel(getZoomLabel(nextAltitude));
    setMapCenter({ lat, lng });

    setTimeout(() => {
      setIsZooming(false);
      onRegionSelected(region, lat, lng, nextDepth);
    }, 1300);
  }, [onRegionSelected, isZooming]);

  // Switch to high-res map view — read the globe's current POV so the map
  // opens exactly where the user is looking, even if they scrolled/dragged
  // without clicking.
  const handleShowMap = useCallback(() => {
    if (globeRef.current) {
      const pov = globeRef.current.pointOfView();
      if (pov?.lat != null && pov?.lng != null) {
        setMapCenter({ lat: pov.lat, lng: pov.lng });
      }
    }
    setShowMap(true);
  }, []);

  // Return from map to globe
  const handleBackToGlobe = useCallback(() => {
    setShowMap(false);
  }, []);

  // Reset zoom — pull back to full globe view
  const handleResetZoom = useCallback(() => {
    if (!globeRef.current || isZooming) return;

    setShowMap(false);
    setIsZooming(true);

    globeRef.current.pointOfView(
      { lat: 20, lng: 0, altitude: 2.5 },
      1200
    );

    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
    }

    setTimeout(() => {
      setIsZooming(false);
      setZoomDepth(0);
      setZoomLabel(null);
      onReset();
    }, 1300);
  }, [isZooming, onReset]);

  return (
    <div className="globe-explorer" ref={containerRef}>
      <div className="globe-explorer__wrapper">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="/textures/earth-8k.jpg"
          bumpImageUrl="/textures/earth-topology-4k.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          backgroundColor="#0a0e1a"
          atmosphereColor="#2563eb"
          atmosphereAltitude={0.2}
          onGlobeClick={handleGlobeClick}
          animateIn={true}
        />

        {/* High-res map overlay — appears at city level when toggled */}
        {mapCenter && showMap && (
          <MapOverlay
            lat={mapCenter.lat}
            lng={mapCenter.lng}
            visible={showMap}
            onBackToGlobe={handleBackToGlobe}
          />
        )}

        {/* Zoom depth indicator — bottom-left of globe */}
        {zoomDepth > 0 && !isZooming && !showMap && (
          <div className="globe-explorer__zoom-depth">
            {ZOOM_LEVELS.map((level, i) => (
              <span
                key={level.label}
                className={`globe-explorer__zoom-pip ${i < zoomDepth ? 'globe-explorer__zoom-pip--active' : ''}`}
                title={level.label}
              />
            ))}
            <span className="globe-explorer__zoom-depth-label">
              {zoomLabel?.icon} {zoomLabel?.label} level
            </span>
          </div>
        )}
      </div>

      {/* Zoom prompt overlay — before first click */}
      {!hasZoomed && !isZooming && (
        <div className="globe-explorer__prompt">
          <div className="globe-explorer__prompt-icon">🔍</div>
          <p className="globe-explorer__prompt-text">
            Zoom in to Your Dream Region
          </p>
          <p className="globe-explorer__prompt-hint">
            Click anywhere on the globe — keep clicking to zoom deeper
          </p>
        </div>
      )}

      {/* Keep-zooming hint — after first click but not at city level */}
      {hasZoomed && zoomDepth > 0 && zoomDepth < 3 && !isZooming && !showMap && (
        <div className="globe-explorer__deeper-hint">
          Click again to zoom to {zoomDepth === 1 ? 'country' : 'city'} level
        </div>
      )}

      {/* At city level — done message + map toggle */}
      {hasZoomed && zoomDepth >= 3 && !isZooming && !showMap && (
        <div className="globe-explorer__deeper-hint globe-explorer__deeper-hint--done">
          <span>Scroll to zoom closer, click to re-center, or </span>
          <button
            className="globe-explorer__map-toggle"
            onClick={handleShowMap}
            type="button"
          >
            switch to HD Map
          </button>
        </div>
      )}

      {/* Zooming indicator */}
      {isZooming && !showMap && (
        <div className="globe-explorer__zooming">
          <div className="globe-explorer__spinner" />
          <p>Zooming in...</p>
        </div>
      )}

      {/* Region badge + reset button */}
      {hasZoomed && globeSelection && !isZooming && !showMap && (
        <div className="globe-explorer__region-bar">
          <div className="globe-explorer__region-badge">
            <span className="globe-explorer__region-icon">📍</span>
            <span className="globe-explorer__region-name">{globeSelection.region}</span>
          </div>
          {zoomDepth >= 3 && (
            <button
              className="globe-explorer__map-btn"
              onClick={handleShowMap}
              type="button"
            >
              HD Map
            </button>
          )}
          <button
            className="globe-explorer__reset-btn"
            onClick={handleResetZoom}
            type="button"
          >
            ↩ Reset
          </button>
        </div>
      )}
    </div>
  );
});
