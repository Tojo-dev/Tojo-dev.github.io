/* Sauvegarde en ligne : envoi automatique d'une copie dans un dépôt GitHub privé (dossier « sauvegardes »). */

import { $ } from '../core/dom.js';
import { KEYS } from '../config.js';
import { ls, readJSON, writeJSON } from '../core/storage.js';
import { on } from '../core/events.js';
import { backupName, isoDate } from '../core/format.js';
import { state } from '../domain/fiches.js';
import { toast } from '../ui/toast.js';
import { markBackedUp } from './backup.js';

const cfg = () => readJSON(KEYS.github, null);
const api = (c, path) => `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}${path}`;
const headers = c => ({ Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' });

function renderGh(){
  const c = cfg();
  $('#ghOwner').value = c ? c.owner : '';
  $('#ghRepo').value = c ? c.repo : '';
  $('#ghToken').value = '';
  $('#ghToken').placeholder = c ? '(enregistré : laisse vide pour le garder)' : 'github_pat_…';
  const last = ls.get(KEYS.githubLast);
  $('#ghStatus').textContent = c
    ? (last ? 'Activé. Dernier envoi réussi le ' + last.split('-').reverse().join('/') + '.' : 'Activé. Aucun envoi pour le moment.')
    : 'Non activé.';
  $('#ghNow').hidden = !c;
  $('#ghOff').hidden = !c;
}

async function pushGithub(manual){
  const c = cfg();
  if (!c || (!state.fiches.length && !manual)) return;
  if (!navigator.onLine){ if (manual) toast('Pas de connexion internet'); return; }
  try {
    const url = api(c, '/contents/sauvegardes/' + backupName());
    const r0 = await fetch(url, { headers: headers(c) });
    let sha;
    if (r0.ok) sha = (await r0.json()).sha; else if (r0.status !== 404) throw r0.status;
    const bytes = new TextEncoder().encode(JSON.stringify(state.fiches, null, 1));
    let bin = '';
    bytes.forEach(b => { bin += String.fromCharCode(b); });
    const r = await fetch(url, {
      method: 'PUT',
      headers: { ...headers(c), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Sauvegarde ' + backupName(), content: btoa(bin), sha })
    });
    if (!r.ok) throw r.status;
    ls.set(KEYS.githubLast, isoDate());
    markBackedUp();
    renderGh();
    if (manual) toast('Sauvegarde en ligne envoyée');
  } catch (e) {
    if (manual) toast(e === 401 || e === 403 ? 'Jeton refusé : vérifie ses droits' : e === 404 ? 'Dépôt introuvable' : 'Envoi impossible pour le moment');
  }
}

/** Envoi automatique : une fois par jour, quand le téléphone a internet. */
export function autoPush(){
  if (cfg() && state.fiches.length && ls.get(KEYS.githubLast) !== isoDate()) pushGithub(false);
}

async function saveConfig(){
  const old = cfg();
  const owner = $('#ghOwner').value.trim(), repo = $('#ghRepo').value.trim();
  const token = $('#ghToken').value.trim() || (old && old.token) || '';
  if (!owner || !repo || !token) return toast('Remplis les trois champs');
  const c = { owner, repo, token };
  try {
    const r = await fetch(api(c, ''), { headers: headers(c) });
    if (r.status === 401) return toast('Jeton invalide');
    if (r.status === 404) return toast('Dépôt introuvable, ou jeton sans accès à ce dépôt');
    if (!r.ok) return toast('Test impossible (erreur ' + r.status + ')');
    const info = await r.json();
    if (!info.private) return toast('Ce dépôt est public : crée un dépôt privé');
    if (info.permissions && !info.permissions.push) return toast("Le jeton n'a pas le droit d'écrire");
    writeJSON(KEYS.github, c);
    renderGh();
    toast('Connexion réussie');
    pushGithub(true);
  } catch (e) { toast('Pas de connexion internet'); }
}

export function initGithub(){
  on('settings:open', renderGh);
  $('#ghSave').addEventListener('click', saveConfig);
  $('#ghNow').addEventListener('click', () => pushGithub(true));
  $('#ghOff').addEventListener('click', () => {
    if (!confirm('Désactiver la sauvegarde en ligne ? Les fichiers déjà envoyés restent sur GitHub.')) return;
    ls.del(KEYS.github);
    ls.del(KEYS.githubLast);
    renderGh();
    toast('Sauvegarde en ligne désactivée');
  });
  window.addEventListener('online', autoPush);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) autoPush(); });
}
