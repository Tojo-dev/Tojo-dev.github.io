/* Barrière d'accès : décide quand afficher l'écran de connexion (démarrage, inactivité, application réduite). */

import { getAccount, getPin } from './store.js';
import { quickAllowed } from './service.js';
import { showGate, releaseGate, isGateOpen, setOnSuccess, initScreens } from './screens.js';
import {
  touchActive, idleMs, lastActive, lockDelay, inExternalGrace, clearExternal,
  dropStaleExternal, clearLockFlags, shouldLockAtStart
} from './session.js';

/** Quel écran afficher ? PIN rapide si autorisé, sinon identifiant + mot de passe. */
function chooseView(){
  if (!getAccount()) return getPin() ? 'pin' : 'setup';   // ancien code PIN seul : il garde l'accès jusqu'à la création du compte
  return quickAllowed() ? 'pin' : 'login';
}

export function lockNow(){
  if (!isGateOpen()) showGate(chooseView());
}

export function unlockApp(){
  if (!getAccount()){ showGate('setup'); return; }        // l'accès par identifiant est obligatoire
  releaseGate();
  clearLockFlags();
  touchActive(true);
}

/** Au démarrage de la page (y compris après une actualisation). */
export function startGate(){
  if (!getAccount()){ showGate(getPin() ? 'pin' : 'setup'); return; }
  if (shouldLockAtStart()) showGate(chooseView());
  else touchActive(true);
}

export function initGate(){
  initScreens();
  setOnSuccess(unlockApp);

  // Activité : chaque toucher repousse le verrouillage
  ['pointerdown', 'touchstart', 'keydown', 'scroll', 'input'].forEach(ev =>
    document.addEventListener(ev, () => {
      if (isGateOpen()) return;
      touchActive();
      dropStaleExternal();
    }, { passive: true, capture: true }));

  // Application réduite : verrouillage immédiat (sauf départ volontaire vers WhatsApp, le téléphone…).
  // Lors d'une actualisation, le navigateur signale aussi la page comme « masquée » juste avant de la décharger :
  // ce n'est pas une réduction. On attend donc un instant, et on ignore le cas où la page se décharge ('pagehide').
  let unloading = false;
  window.addEventListener('pagehide', () => { unloading = true; });
  window.addEventListener('pageshow', () => { unloading = false; });

  let hiddenAt = 0;                 // gardé en mémoire seulement : une actualisation l'efface, donc ne verrouille pas

  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      hiddenAt = Date.now();
      setTimeout(() => {
        if (document.hidden && !unloading && !isGateOpen() && !inExternalGrace()) lockNow();
      }, 0);
      return;
    }
    const wasHidden = hiddenAt;
    hiddenAt = 0;
    if (isGateOpen()) return;
    if (inExternalGrace()){ clearExternal(); touchActive(true); return; }
    // réduite puis rouverte : on verrouille même si le minuteur n'a pas eu le temps de s'exécuter
    if (wasHidden || Date.now() - lastActive() > lockDelay()) lockNow();
  });

  // Inactivité : verrouillage après le délai choisi sans toucher l'écran
  setInterval(() => {
    if (document.hidden || isGateOpen() || inExternalGrace()) return;
    if (idleMs() > lockDelay()) lockNow();
  }, 5000);
}
