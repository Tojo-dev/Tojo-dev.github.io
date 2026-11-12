/* Session : l'utilisateur reste connecté tant qu'il ne se déconnecte pas,
   même si l'application est réduite, fermée, actualisée ou le téléphone redémarré. */

import { KEYS } from '../config.js';
import { ls } from '../core/storage.js';

export const isLoggedIn = () => ls.get(KEYS.session) === '1';
export const openSession = () => { ls.set(KEYS.session, '1'); };
export const closeSession = () => { ls.del(KEYS.session); };
