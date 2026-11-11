/* Clients : regroupés à partir des fiches (même numéro de téléphone = même client). */

import { state, reste } from './fiches.js';

export const digits = t => String(t || '').replace(/\D/g, '');

export const clientKey = f => digits(f.tel).length >= 6
  ? 't:' + digits(f.tel).slice(-9)
  : 'n:' + String(f.nom).trim().toLowerCase();

export function getClients(){
  const map = new Map();
  [...state.fiches]
    .sort((a, b) => (a.creeLe || '').localeCompare(b.creeLe || '') || (a.num || 0) - (b.num || 0))
    .forEach(f => {
      const key = clientKey(f);
      let c = map.get(key);
      if (!c){ c = { key, nom: f.nom, tel: f.tel, fiches: [] }; map.set(key, c); }
      c.nom = f.nom;
      if (f.tel) c.tel = f.tel;
      c.fiches.push(f);
    });
  return [...map.values()].map(c => ({
    ...c,
    total: c.fiches.reduce((s, f) => s + f.total, 0),
    avance: c.fiches.reduce((s, f) => s + Math.min(f.avance, f.total), 0),
    dette: c.fiches.reduce((s, f) => s + reste(f), 0)
  }));
}
