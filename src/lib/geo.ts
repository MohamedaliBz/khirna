import type { Governorate, LatLng } from '../types';

/** Distance à vol d'oiseau en km (formule de haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const TUNISIA_CENTER: LatLng = [34.6, 9.6];

/** Chef-lieu de chaque gouvernorat. */
export const GOV_COORDS: Record<Governorate, LatLng> = {
  tunis: [36.8065, 10.1815],
  ariana: [36.8625, 10.1956],
  ben_arous: [36.7531, 10.2189],
  manouba: [36.8101, 10.0956],
  nabeul: [36.4513, 10.7357],
  zaghouan: [36.4029, 10.1429],
  bizerte: [37.2744, 9.8739],
  beja: [36.7256, 9.1817],
  jendouba: [36.5011, 8.7802],
  kef: [36.1742, 8.7049],
  siliana: [36.0849, 9.3708],
  sousse: [35.8256, 10.6084],
  monastir: [35.7643, 10.8113],
  mahdia: [35.5047, 11.0622],
  sfax: [34.7406, 10.7603],
  kairouan: [35.6781, 10.0963],
  kasserine: [35.1676, 8.8365],
  sidi_bouzid: [35.0382, 9.4849],
  gabes: [33.8815, 10.0982],
  medenine: [33.3549, 10.5055],
  tataouine: [32.9297, 10.4518],
  gafsa: [34.425, 8.7842],
  tozeur: [33.9197, 8.1335],
  kebili: [33.705, 8.969],
};

export const GOVERNORATES = Object.keys(GOV_COORDS) as Governorate[];
