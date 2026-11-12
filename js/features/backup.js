/* Sauvegardes dans le téléphone : fichier mensuel, partage, restauration et copies automatiques. */

import { $ } from '../core/dom.js';
import { KEYS } from '../config.js';
import { ls, readJSON } from '../core/storage.js';
import { on } from '../core/events.js';
import { MOIS_FR, monthKey, backupName } from '../core/format.js';
import { state, replaceAll } from '../domain/fiches.js';
import { closeTop } from '../ui/sheets.js';
import { toast } from '../ui/toast.js';

let bannerDismissed = false;

/* ----- Rappel mensuel ----- */
export function updateBanner(){
  const due = state.fiches.length > 0 && ls.get(KEYS.lastBackup) !== monthKey() && !bannerDismissed;
  $('#backupBanner').hidden = !due;
  if (due){
    const d = new Date();
    $('#bannerText').textContent = `La sauvegarde de ${MOIS_FR[d.getMonth()]} ${d.getFullYear()} n’est pas encore faite.`;
  }
}

export function markBackedUp(){
  ls.set(KEYS.lastBackup, monthKey());
  updateBanner();
}

/* ----- Fichier de sauvegarde ----- */
const backupJson = () => JSON.stringify(state.fiches, null, 1);

export function downloadBackup(){
  const blob = new Blob([backupJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = backupName();
  document.body.appendChild(a); a.click(); a.remove();
  markBackedUp();
  toast('Fichier ' + backupName() + ' enregistré dans Téléchargements');
}

async function shareBackup(){
  const file = new File([backupJson()], backupName(), { type: 'text/plain' });
  if (navigator.canShare && navigator.canShare({ files: [file] })){
    try { await navigator.share({ files: [file], title: 'Sauvegarde carnet d’atelier' }); markBackedUp(); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  downloadBackup();
}

function onImportFile(e){
  const file = e.target.files[0];
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(String(rd.result));
      if (!Array.isArray(data) || data.some(x => !x.id || !x.nom)) throw new Error('format');
      if (confirm(`Remplacer les fiches actuelles par ${data.length} fiche(s) de la sauvegarde ?`)){
        replaceAll(data);
        closeTop();
        toast('Sauvegarde restaurée');
      }
    } catch (err) { toast('Fichier de sauvegarde invalide'); }
    e.target.value = '';
  };
  rd.readAsText(file);
}

/* ----- Copies automatiques (3 derniers mois, gardées dans l'application) ----- */
export function snapshotMonth(){
  if (!state.fiches.length) return;
  const key = KEYS.snapPrefix + monthKey();
  if (ls.get(key) === null) ls.set(key, JSON.stringify(state.fiches));
  ls.keys(KEYS.snapPrefix).sort().slice(0, -3).forEach(k => ls.del(k));
}

function renderSnaps(){
  const keys = ls.keys(KEYS.snapPrefix).sort().reverse();
  $('#snapList').innerHTML = keys.length ? keys.map(k => {
    const [y, m] = k.slice(KEYS.snapPrefix.length).split('-');
    const data = readJSON(k, []);
    const n = Array.isArray(data) ? data.length : 0;
    return `<button class="btn" data-snap="${k}">Début ${MOIS_FR[+m - 1]} ${y} : ${n} fiche(s), restaurer</button>`;
  }).join('') : '<p class="hint">Aucune copie pour le moment.</p>';
}

function onSnapClick(e){
  const b = e.target.closest('[data-snap]');
  if (!b) return;
  if (!confirm('Remplacer les fiches actuelles par cette copie ? Les modifications faites depuis seront perdues.')) return;
  const data = readJSON(b.dataset.snap, null);
  if (!Array.isArray(data)) return toast('Copie illisible');
  replaceAll(data);
  closeTop();
  toast('Copie restaurée');
}

export function initBackup(){
  on('fiches:changed', updateBanner);
  on('settings:open', () => {
    $('#backupInfo').textContent = `${state.fiches.length} fiche(s) enregistrée(s) dans ce téléphone.`;
    renderSnaps();
  });
  $('#btnExport').addEventListener('click', downloadBackup);
  $('#btnShare').addEventListener('click', shareBackup);
  $('#bannerSave').addEventListener('click', downloadBackup);
  $('#bannerLater').addEventListener('click', () => { bannerDismissed = true; updateBanner(); });
  $('#snapList').addEventListener('click', onSnapClick);
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', onImportFile);
  document.addEventListener('visibilitychange', () => { if (!document.hidden){ snapshotMonth(); updateBanner(); } });
  updateBanner();
}
