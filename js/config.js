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
  session:    'carnet-atelier-session'
};

export const PBKDF2_ITERATIONS = 150000;

export const TYPES = { commande: 'Commande', transformation: 'Transformation' };
export const STATUTS = { encours: 'En cours', pret: 'Prêt', livre: 'Livré' };
