/**
 * Globe Explorer
 * Interactive 3D world globe with zoom-to-region functionality.
 * User zooms into their dream region, then proceeds to the Paragraphical.
 *
 * Layout:
 * - 3D globe (WebGL via react-globe.gl)
 * - "Zoom in to Your Dream Region" button overlay
 * - After zoom: "Now click on the Paragraphical below and tell us about: You"
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import Globe from 'react-globe.gl';
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

interface Props {
  onRegionSelected: (region: string) => void;
  hasZoomed: boolean;
}

export function GlobeExplorer({ onRegionSelected, hasZoomed }: Props) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

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

  // Set initial globe appearance
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.minDistance = 150;
        controls.maxDistance = 500;
      }
    }
  }, []);

  const handleGlobeClick = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    if (!globeRef.current) return;

    setIsZooming(true);

    // Stop auto-rotate
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = false;
    }

    // Zoom to clicked point
    globeRef.current.pointOfView(
      { lat, lng, altitude: 1.2 },
      1500 // animation duration ms
    );

    const region = getClosestRegion(lat, lng);
    setSelectedRegion(region);

    setTimeout(() => {
      setIsZooming(false);
      onRegionSelected(region);
    }, 1600);
  }, [onRegionSelected]);

  return (
    <div className="globe-explorer" ref={containerRef}>
      <div className="globe-explorer__wrapper">
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#2563eb"
          atmosphereAltitude={0.2}
          onGlobeClick={handleGlobeClick}
          animateIn={true}
        />
      </div>

      {/* Zoom prompt overlay */}
      {!hasZoomed && !isZooming && (
        <div className="globe-explorer__prompt">
          <div className="globe-explorer__prompt-icon">🔍</div>
          <p className="globe-explorer__prompt-text">
            Zoom in to Your Dream Region
          </p>
          <p className="globe-explorer__prompt-hint">
            Click anywhere on the globe to select your region
          </p>
        </div>
      )}

      {/* Zooming indicator */}
      {isZooming && (
        <div className="globe-explorer__zooming">
          <div className="globe-explorer__spinner" />
          <p>Zooming in...</p>
        </div>
      )}

      {/* Region selected badge */}
      {hasZoomed && selectedRegion && (
        <div className="globe-explorer__region-badge">
          <span className="globe-explorer__region-icon">📍</span>
          <span className="globe-explorer__region-name">{selectedRegion}</span>
        </div>
      )}
    </div>
  );
}
