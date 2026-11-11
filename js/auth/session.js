/* Règles de verrouillage : quand l'application doit-elle demander l'accès ?
   - après le délai choisi sans toucher l'écran (1 minute par défaut) ;
   - dès que l'application est réduite ;
   - jamais après une actualisation de la page si on vient de toucher l'écran ;
   - jamais au retour de WhatsApp, du téléphone ou du partage lancés depuis l'application (10 min de tolérance). */

import { KEYS, LOCK } from '../config.js';
import { ls } from '../core/storage.js';

export function lockDelay(){
  const v = +ls.get(KEYS.lockDelay) || LOCK.defaultDelay;
  return LOCK.delays.includes(v) ? v : LOCK.defaultDelay;
}

let lastTouch = 0;
export const idleMs = () => Date.now() - lastTouch;
export const lastActive = () => +ls.get(KEYS.lastActive) || 0;

/** Note qu'on vient de toucher l'écran (au plus une fois par seconde). */
export function touchActive(force = false){
  const now = Date.now();
  if (!force && now - lastTouch < 1000) return;
  lastTouch = now;
  ls.set(KEYS.lastActive, now);
}

/** À appeler juste avant de quitter volontairement l'application (WhatsApp, appel, partage, choix de fichier…). */
export function markExternal(){
  ls.set(KEYS.external, Date.now());
  touchActive(true);
}

export const inExternalGrace = () => {
  const t = +ls.get(KEYS.external) || 0;
  return t > 0 && Date.now() - t <= LOCK.externalGrace;
};
export const clearExternal = () => ls.del(KEYS.external);

/** Sortie annulée (ex. partage fermé) : on n'attend pas 10 minutes pour reprendre la protection. */
export function dropStaleExternal(){
  const t = +ls.get(KEYS.external) || 0;
  if (t && Date.now() - t > 1500 && !document.hidden) ls.del(KEYS.external);
}

export function clearLockFlags(){
  ls.del(KEYS.locked);
  ls.del(KEYS.external);
}

/** Décision au démarrage de la page, y compris après une actualisation. */
export function shouldLockAtStart(){
  if (ls.get(KEYS.locked) === '1') return true;              // l'appli avait été réduite ou laissée inactive
  if (inExternalGrace()){ clearExternal(); return false; }   // retour de WhatsApp / téléphone, même si Android a rechargé la page
  clearExternal();
  const last = lastActive();
  return !last || Date.now() - last > lockDelay();           // actualisation : pas de verrouillage si l'écran vient d'être touché
}
