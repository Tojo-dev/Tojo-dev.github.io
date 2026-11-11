/* Lecture et écriture des données d'accès (compte, code PIN, essais ratés). Tout reste dans le téléphone. */

import { KEYS } from '../config.js';
import { ls, readJSON, writeJSON } from '../core/storage.js';

export const getAccount = () => readJSON(KEYS.account, null);
export const saveAccount = acc => writeJSON(KEYS.account, acc);
export const getPin = () => readJSON(KEYS.pin, null);
export const savePin = cfg => writeJSON(KEYS.pin, cfg);
export const clearPin = () => ls.del(KEYS.pin);

/* Limitation des essais : 5 erreurs → 30 s, 10 → 2 min, 15 → 8 min, puis 30 min au maximum. */
export const failState = () => readJSON(KEYS.fails, { n: 0, until: 0 });

export function registerFail(){
  const s = failState();
  s.n++;
  if (s.n % 5 === 0) s.until = Date.now() + Math.min(30000 * 4 ** (s.n / 5 - 1), 1800000);
  writeJSON(KEYS.fails, s);
  return s;
}

export const clearFails = () => ls.del(KEYS.fails);
export const waitSeconds = () => Math.max(0, Math.ceil((failState().until - Date.now()) / 1000));
