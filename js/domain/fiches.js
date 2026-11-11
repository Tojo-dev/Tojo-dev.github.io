/* Données : la liste des fiches de travail, son enregistrement et les calculs de base. */

import { KEYS } from '../config.js';
import { ls, readJSON, writeJSON } from '../core/storage.js';
import { emit } from '../core/events.js';
import { isoDate, newId } from '../core/format.js';

export const state = { fiches: [] };

export const reste = f => Math.max(0, f.total - f.avance);
export const atelierG = f => Math.max(0, f.poids - (f.apport || 0));
export const findFiche = id => state.fiches.find(f => f.id === id);

export function persist(){
  const ok = writeJSON(KEYS.fiches, state.fiches);
  if (!ok) emit('storage:error');
  return ok;
}

/** Enregistre puis prévient les écrans qu'ils doivent se réafficher. */
export function commit(){
  persist();
  emit('fiches:changed');
}

/** Donne un numéro (0001, 0002…) aux anciennes fiches qui n'en ont pas. */
export function migrateNums(){
  let max = 0;
  state.fiches.forEach(f => { if (f.num > max) max = f.num; });
  let changed = false;
  state.fiches.forEach(f => { if (!f.num){ f.num = ++max; changed = true; } });
  if (changed) persist();
}

export function nextNum(){
  let c = +ls.get(KEYS.counter) || 0;
  c = Math.max(c, ...state.fiches.map(f => f.num || 0)) + 1;
  ls.set(KEYS.counter, c);
  return c;
}

export function loadFiches(){
  const data = readJSON(KEYS.fiches, []);
  state.fiches = Array.isArray(data) ? data : [];
  migrateNums();
}

export function addFiche(data){
  const f = { id: newId(), num: nextNum(), statut: 'encours', creeLe: isoDate(), ...data };
  state.fiches.push(f);
  commit();
  return f;
}

export function updateFiche(id, patch){
  const f = findFiche(id);
  if (!f) return null;
  Object.assign(f, patch);
  commit();
  return f;
}

export function removeFiche(id){
  state.fiches = state.fiches.filter(f => f.id !== id);
  commit();
}

export function replaceAll(list){
  state.fiches = list;
  migrateNums();
  commit();
}
