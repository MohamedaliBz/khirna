import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from '../types';
import { TUNISIA_CENTER } from '../lib/geo';

export interface MapMarker {
  id: string;
  position: LatLng;
  label: string;
  tone?: 'green' | 'wheat' | 'olive' | 'gray';
  active?: boolean;
  onClick?: () => void;
}

const PIN_COLORS = { green: '#1F5D3A', wheat: '#D4A537', olive: '#6B8E23', gray: '#7A887F' };

function pinIcon(tone: MapMarker['tone'] = 'green', active = false) {
  const color = PIN_COLORS[tone];
  const s = active ? 40 : 30;
  return L.divIcon({
    className: 'khirna-pin',
    iconSize: [s, s],
    iconAnchor: [s / 2, s],
    tooltipAnchor: [0, -s],
    html: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6" fill="white" stroke="none"/></svg>`,
  });
}

function FitBounds({ points, center, zoom }: { points: LatLng[]; center?: LatLng; zoom?: number }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|') + (center ? center.join(',') : '');
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [30, 30], maxZoom: 9 });
    else if (points.length === 1) map.setView(points[0], zoom ?? 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function ClickPicker({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]) });
  return null;
}

/** Carte Leaflet + OpenStreetMap. Forcée en LTR pour que les contrôles restent corrects en arabe. */
export function MapView({
  markers = [],
  center,
  zoom = 6,
  height = 'h-72',
  onPick,
  picked,
}: {
  markers?: MapMarker[];
  center?: LatLng;
  zoom?: number;
  height?: string;
  onPick?: (p: LatLng) => void;
  picked?: LatLng;
}) {
  const points = markers.map((m) => m.position);
  return (
    <div dir="ltr" className={`overflow-hidden rounded-2xl border border-ink/10 ${height} ${onPick ? 'cursor-crosshair' : ''}`}>
      <MapContainer center={center ?? points[0] ?? TUNISIA_CENTER} zoom={zoom} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} center={center} zoom={zoom} />
        {onPick && <ClickPicker onPick={onPick} />}
        {markers.map((m) => (
          <Marker key={m.id} position={m.position} icon={pinIcon(m.tone, m.active)} eventHandlers={m.onClick ? { click: m.onClick } : undefined}>
            <Tooltip direction="top">{m.label}</Tooltip>
          </Marker>
        ))}
        {picked && <Marker position={picked} icon={pinIcon('wheat', true)} />}
      </MapContainer>
    </div>
  );
}
