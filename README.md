# Carnet d'atelier

Application web installable (PWA) de suivi des commandes d'un atelier de bijouterie.
Elle fonctionne **sans serveur et sans internet** : les données restent dans le téléphone.

## Structure

```
index.html              Structure de la page (panneaux, formulaires, page d'accès)
manifest.json           Nom, couleurs et icônes de l'application installée
sw.js                   Service worker : mode hors-ligne (changer VERSION à chaque mise à jour)
assets/icons/           Icônes 192 et 512 px
css/
  base.css              Variables, mise en page, en-tête, liste, cartes
  components.css        Boutons, panneaux, formulaires, détail, messages
  auth.css              Page d'accès : connexion, PIN, code de secours
  print.css             Impression du reçu
js/
  main.js               Point d'entrée : charge les données puis branche chaque module
  config.js             Constantes et clés de stockage
  pwa.js                Enregistrement du service worker
  core/                 Outils sans dépendance : dom, format, storage, events (bus d'événements)
  domain/               Règles métier : fiches, clients, téléphone, messages
  ui/                   Éléments d'interface partagés : toast, panneaux empilés
  features/             Écrans : list, form, detail, clients-ui, receipt, call, backup, github-backup, atelier, settings
  auth/                 Authentification locale : crypto, store, service, session (connecté ou non), screens, gate (connexion, déconnexion), settings-ui
```

## Conventions

- Modules ES : un fichier = une responsabilité, aucun code exécuté à l'import (tout démarre par `initXxx()` appelé dans `main.js`).
- Pas de variable globale : les données sont dans `domain/fiches.js` (`state.fiches`), les modules se préviennent par événements (`core/events.js`) plutôt que de s'importer en boucle.
- Toute modification des fiches passe par `addFiche`, `updateFiche`, `removeFiche` ou `replaceAll` : elles enregistrent puis déclenchent `fiches:changed`, qui réaffiche les écrans ouverts.
- Les clés du localStorage et les délais sont dans `config.js`.
- Le texte saisi est toujours échappé (`esc`) avant d'être inséré dans le HTML.

## Authentification (hors-ligne)

- Identifiant + mot de passe (4 caractères minimum) créés à la première ouverture. Seule une empreinte PBKDF2-SHA256 (150 000 itérations, sel aléatoire) est conservée.
- **Session persistante** : l'utilisateur reste connecté tant qu'il ne se déconnecte pas, même si l'application est réduite, fermée, actualisée ou le téléphone redémarré. Il n'y a aucun verrouillage automatique.
- **Déconnexion** : bouton dans l'en-tête et dans les Réglages. La page est rechargée pour effacer tout ce qui était affiché, puis la page de connexion s'affiche. Aucune donnée n'est dessinée tant que personne n'est connecté.
- Code de secours à usage unique (60 bits) pour choisir un nouveau mot de passe ; affiché une seule fois.
- Code PIN facultatif, proposé à la place du mot de passe à chaque connexion.
- Limitation des essais : 5 erreurs = 30 s, 10 = 2 min, 15 = 8 min, jusqu'à 30 min.
- Limites : c'est une protection de l'interface. Les fiches ne sont pas chiffrées dans le stockage du navigateur, et un mot de passe court se devine plus facilement. L'écran de verrouillage du téléphone reste la première protection.

## Lancer en local

```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000 (le service worker et le chiffrement exigent https ou localhost).

## Publier une mise à jour

1. Modifier les fichiers.
2. Dans `sw.js`, passer `VERSION` à la valeur suivante (`v12`, `v13`…) et ajouter tout nouveau fichier à la liste `FILES`.
3. Envoyer sur GitHub. Les téléphones récupèrent la nouvelle version à la prochaine ouverture avec du réseau.

Ne pas supprimer `.well-known/assetlinks.json` ni `.nojekyll` du dépôt (utiles pour l'APK).
