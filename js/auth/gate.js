/* Barrière d'accès : la page de connexion s'affiche à la première utilisation et après une déconnexion.
   Tant que l'utilisateur ne se déconnecte pas, la session reste ouverte (application réduite, fermée ou actualisée). */

import { $$ } from '../core/dom.js';
import { emit } from '../core/events.js';
import { getAccount, getPin } from './store.js';
import { quickAllowed } from './service.js';
import { showGate, releaseGate, setOnSuccess, initScreens } from './screens.js';
import { isLoggedIn, openSession, closeSession } from './session.js';

/** Quel écran afficher ? PIN rapide s'il existe, sinon identifiant + mot de passe. */
function chooseView(){
  if (!getAccount()) return getPin() ? 'pin' : 'setup';   // ancien code PIN seul : il garde l'accès jusqu'à la création du compte
  return quickAllowed() ? 'pin' : 'login';
}

export function unlockApp(){
  if (!getAccount()){ showGate('setup'); return; }        // l'accès par identifiant est obligatoire
  openSession();
  releaseGate();
  emit('session:opened');                                  // les écrans se dessinent seulement maintenant
}

/** Au démarrage de la page (y compris après une actualisation ou une réouverture). */
export function startGate(){
  if (!getAccount()){ showGate(getPin() ? 'pin' : 'setup'); return; }
  if (!isLoggedIn()) showGate(chooseView());
}

/** Déconnexion : on recharge la page pour effacer tout ce qui était affiché (fiches, reçus, clients…). */
export function logout(){
  if (!confirm('Se déconnecter ? Il faudra ressaisir ton accès pour rouvrir l’application.')) return;
  closeSession();
  location.reload();
}

export function initGate(){
  initScreens();
  setOnSuccess(unlockApp);
  $$('[data-logout]').forEach(b => b.addEventListener('click', logout));
}
