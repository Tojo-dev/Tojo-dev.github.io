/* Accès au localStorage qui ne plante jamais (stockage plein, navigation privée…). */

export const ls = {
  get: key => { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, String(value)); return true; } catch (e) { return false; } },
  del: key => { try { localStorage.removeItem(key); } catch (e) { /* ignoré */ } },
  keys: prefix => { try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch (e) { return []; } }
};

/** @param {string} key @param {any} [fallback] */
export function readJSON(key, fallback = null){
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}

export function writeJSON(key, value){ return ls.set(key, JSON.stringify(value)); }
