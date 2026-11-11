/* Mini bus d'événements : évite que les modules s'importent les uns les autres en boucle.
   Événements utilisés :
   - 'fiches:changed'  les fiches ont été modifiées (la liste, le détail, les clients se réaffichent)
   - 'storage:error'   l'enregistrement dans le téléphone a échoué
   - 'settings:open'   le panneau Réglages s'ouvre (chaque section se met à jour) */

const handlers = new Map();

export function on(name, fn){
  if (!handlers.has(name)) handlers.set(name, []);
  handlers.get(name).push(fn);
}

export function emit(name, payload){
  (handlers.get(name) || []).forEach(fn => fn(payload));
}
