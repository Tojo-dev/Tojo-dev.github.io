/* Point d'entrée : charge les données, branche chaque module, puis décide s'il faut demander l'accès. */

import { loadFiches } from './domain/fiches.js';
import { initToast } from './ui/toast.js';
import { initSheets } from './ui/sheets.js';
import { initList, renderList } from './features/list.js';
import { initForm } from './features/form.js';
import { initDetail } from './features/detail.js';
import { initClientsUi } from './features/clients-ui.js';
import { initReceipt } from './features/receipt.js';
import { initBackup, snapshotMonth } from './features/backup.js';
import { initGithub, autoPush } from './features/github-backup.js';
import { initAtelier } from './features/atelier.js';
import { initSettings } from './features/settings.js';
import { initAccessSettings } from './auth/settings-ui.js';
import { initGate, startGate } from './auth/gate.js';
import { isLoggedIn } from './auth/session.js';
import { registerServiceWorker } from './pwa.js';

function boot(){
  loadFiches();

  initToast();
  initSheets();
  initList();
  initForm();
  initDetail();
  initClientsUi();
  initReceipt();
  initBackup();
  initGithub();
  initAtelier();
  initSettings();
  initAccessSettings();
  initGate();

  startGate();            // affiche la page d'accès si nécessaire, avant tout le reste
  snapshotMonth();
  if (isLoggedIn()) renderList();     // rien n'est dessiné tant que personne n'est connecté
  autoPush();

  document.body.classList.remove('booting');
  registerServiceWorker();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
}

try {
  boot();
} catch (err) {
  // Sur un téléphone sans console : on affiche l'erreur au lieu d'une page blanche
  document.body.classList.remove('booting');
  const box = document.createElement('pre');
  box.className = 'boot-error';
  box.textContent = 'Erreur de démarrage : ' + (err && err.message ? err.message : err);
  document.body.prepend(box);
}
