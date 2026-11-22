import type { Domain } from '../types';

const u = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

/** Photos libres de droits (Unsplash), vérifiées une par une. */
export const PHOTOS = {
  cows: [u('1500595046743-cd271d694d30'), u('1570042225831-d98fa7577f1e'), u('1546445317-29f4545e9d53'), u('1527153857715-3908f2bae5e8')],
  olives: [u('1474979266404-7eaacbcd87c5'), u('1586771107445-d3ca888129ff'), u('1563514227147-6d2ff665a6a0'), u('1582515073490-39981397c445')],
  chickens: [u('1548550023-2bdb3c5beed7'), u('1612170153139-6f881ff067e0')],
  strawberries: [u('1464965911861-746a04b4bca6'), u('1524486361537-8ad15938e1a3'), u('1518635017498-87f514b751ba'), u('1543528176-61b239494933')],
  sheep: [u('1484557985045-edf25e08da73'), u('1511117833895-4b473c0b85d6'), u('1533415648777-407b626eb0fa')],
  vegetables: [u('1592841200221-a6898f307baa'), u('1588252303782-cb80119abd6d'), u('1561136594-7f68413baa99'), u('1523348837708-15d4a09cfac2')],
  bees: [u('1473973266408-ed4e27abdd47'), u('1568526381923-caf3fd520382'), u('1558642452-9d2a7deb7f62'), u('1471943311424-646960669fbc')],
  fodder: [u('1499529112087-3cb3b73cec95'), u('1560493676-04071c5f467b'), u('1625246333195-78d9c38ad449')],
  dates: [u('1500382017468-9049fed747ef'), u('1620200423727-8127f75d7f53')],
  lands: [u('1500382017468-9049fed747ef'), u('1499529112087-3cb3b73cec95'), u('1560493676-04071c5f467b'), u('1620200423727-8127f75d7f53'), u('1535379453347-1ffd615e2e08'), u('1500076656116-558758c991c1')],
  work: [u('1530836369250-ef72a3f5cda8'), u('1605000797499-95a51c5269ae'), u('1589923188900-85dae523342b'), u('1416879595882-3373a0480b5b'), u('1505471768190-275e2ad7b3f9')],
  hero: u('1500382017468-9049fed747ef', 1800),
};

export const AVATARS = {
  m1: u('1507003211169-0a1dd7228f2d', 300),
  m2: u('1500648767791-00dcc994a43e', 300),
  m3: u('1506794778202-cad84cf45f1d', 300),
  m4: u('1472099645785-5658abf4ff4e', 300),
  f1: u('1494790108377-be9c29b29330', 300),
  f2: u('1438761681033-6461ffad8d80', 300),
  f3: u('1544005313-94ddf0286df2', 300),
};

export const DOMAIN_PHOTOS: Record<Domain, string[]> = {
  olives: PHOTOS.olives,
  dairy: PHOTOS.cows,
  poultry: PHOTOS.chickens,
  sheep: PHOTOS.sheep,
  strawberries: PHOTOS.strawberries,
  vegetables: PHOTOS.vegetables,
  beekeeping: PHOTOS.bees,
  fodder: PHOTOS.fodder,
  dates: PHOTOS.dates,
};

/** Réduit une image choisie par l'utilisateur (aperçu local, stockable en localStorage). */
export function fileToDataUrl(file: File, maxSize = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
