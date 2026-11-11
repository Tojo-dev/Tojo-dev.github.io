/* Formats d'affichage : montants, poids, dates, noms de fichiers. */

export const p2 = n => String(n).padStart(2, '0');
export const ar = n => Math.round(n || 0).toLocaleString('fr-FR') + ' Ar';
export const gr = n => (+n).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' g';
export const padNum = n => String(n || 0).padStart(4, '0');

export const day0 = iso => {
  const d = iso ? new Date(iso + 'T00:00') : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
export const daysTo = iso => Math.round((day0(iso).getTime() - day0().getTime()) / 864e5);
export const fdate = iso => day0(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const isoDate = (add = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + add);
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
};
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const MOIS    = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
export const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const monthKey = (d = new Date()) => d.getFullYear() + '-' + p2(d.getMonth() + 1);
export const backupName = (d = new Date()) => `sauvegarde_${MOIS[d.getMonth()]}_${d.getFullYear()}.json`;

export const slug = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 24) || 'client';
