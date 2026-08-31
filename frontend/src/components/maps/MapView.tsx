import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  icon?: string;
  phone?: string;
}

interface MapViewProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MarkerData) => void;
}

export default function MapView({ markers, center, zoom = 12, height = '400px', onMarkerClick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = center || [28.6139, 77.2090];

    mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng]).addTo(mapRef.current!);

      const popupContent = `
        <div style="min-width: 200px;">
          <strong style="font-size: 14px;">${m.title}</strong>
          ${m.description ? `<p style="margin: 4px 0; font-size: 12px;">${m.description}</p>` : ''}
          ${m.phone ? `<p style="margin: 4px 0;"><a href="tel:${m.phone}" style="color: #10b981;">📞 ${m.phone}</a></p>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(m));
      }
    });
  }, [markers]);

  return <div ref={mapContainerRef} style={{ height, width: '100%', borderRadius: '0.5rem' }} />;
}
