/* Constantes et clés de stockage de l'application. */

export const COUNTRY_CODE = '261';          // indicatif ajouté aux numéros qui commencent par 0

export const KEYS = {
  fiches:     'carnet-atelier-v1',
  counter:    'carnet-atelier-compteur',
  atelier:    'carnet-atelier-reglages',
  lastBackup: 'carnet-atelier-derniere-sauvegarde',
  snapPrefix: 'carnet-atelier-copie-',
  github:     'carnet-atelier-github',
  githubLast: 'carnet-atelier-github-dernier-envoi',
  account:    'carnet-atelier-compte',
  pin:        'carnet-atelier-pin',
  fails:      'carnet-atelier-essais',
  lockDelay:  'carnet-atelier-delai-verrou',
  lastActive: 'carnet-atelier-derniere-activite',
  locked:     'carnet-atelier-verrouille',
  external:   'carnet-atelier-sortie-appli'
};

export const LOCK = {
  defaultDelay: 60000,                       // verrouillage après 1 minute sans toucher l'écran
  delays: [30000, 60000, 120000, 300000],    // choix proposés dans les réglages
  externalGrace: 10 * 60000,                 // retour de WhatsApp / téléphone / partage : pas de verrouillage pendant 10 min
  quickPinMaxAge: 12 * 3600000               // le code PIN rapide n'est accepté que 12 h après la dernière connexion
};

export const PBKDF2_ITERATIONS = 150000;

export const TYPES = { commande: 'Commande', transformation: 'Transformation' };
export const STATUTS = { encours: 'En cours', pret: 'Prêt', livre: 'Livré' };
