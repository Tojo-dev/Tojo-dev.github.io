/* Liste des fiches : onglets (en cours, prêts, livrés), recherche, cartes, total à encaisser. */

import { $, esc } from '../core/dom.js';
import { on } from '../core/events.js';
import { TYPES } from '../config.js';
import { ar, gr, padNum, day0, daysTo } from '../core/format.js';
import { state, reste } from '../domain/fiches.js';
import { openDetail } from './detail.js';

let filter = 'encours';

export function badgeFor(f){
  if (f.statut === 'livre') return '';
  if (f.statut === 'pret') return '<span class="badge ok">Prêt</span>';
  const d = daysTo(f.date);
  if (d < 0)   return `<span class="badge late">En retard de ${-d} j</span>`;
  if (d === 0) return '<span class="badge soon">Aujourd’hui</span>';
  if (d === 1) return '<span class="badge soon">Demain</span>';
  return `<span class="badge">Dans ${d} j</span>`;
}

export function cardHTML(f){
  const r = reste(f);
  return `<button class="card" data-id="${f.id}">
    <div class="row"><strong class="nom">${esc(f.nom)}</strong>${badgeFor(f)}</div>
    <p class="lib">${esc(f.libelle)}</p>
    <div class="row">
      <span class="metal ${f.metal}">${f.metal === 'or' ? 'Or' : 'Argent'} ${gr(f.poids)}</span>
      <span class="pay ${r ? 'due' : 'paid'}">${r ? 'Reste ' + ar(r) : 'Payé'}</span>
    </div>
    <div class="meta"><span>N° ${padNum(f.num)}</span><span>${TYPES[f.type]}</span>${f.apport > 0 ? `<span>Apport client ${gr(f.apport)}</span>` : ''}<span>Livraison le ${day0(f.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div>
  </button>`;
}

export function renderList(){
  const fiches = state.fiches;
  const q = $('#q').value.trim().toLowerCase();
  const tabs = [['encours', 'En cours'], ['pret', 'Prêts'], ['livre', 'Livrés'], ['tous', 'Tous']];
  $('#tabs').innerHTML = tabs.map(([k, l]) => {
    const n = k === 'tous' ? fiches.length : fiches.filter(f => f.statut === k).length;
    return `<button data-tab="${k}" aria-pressed="${filter === k}">${l} (${n})</button>`;
  }).join('');

  const list = fiches
    .filter(f => filter === 'tous' || f.statut === filter)
    .filter(f => !q || [f.nom, f.tel, f.libelle, padNum(f.num), 'n°' + padNum(f.num)].join(' ').toLowerCase().includes(q))
    .sort((a, b) => Number(a.statut === 'livre') - Number(b.statut === 'livre') || a.date.localeCompare(b.date));

  $('#list').innerHTML = list.length
    ? list.map(cardHTML).join('')
    : `<p class="empty">${fiches.length ? 'Aucune fiche ne correspond.' : 'Aucune fiche pour le moment. Appuie sur « Nouvelle fiche » pour commencer.'}</p>`;

  $('#dueAmount').textContent = ar(fiches.reduce((s, f) => s + reste(f), 0));
}

export function initList(){
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (b){ filter = b.dataset.tab; renderList(); }
  });
  $('#q').addEventListener('input', renderList);
  $('#list').addEventListener('click', e => {
    const c = e.target.closest('[data-id]');
    if (c) openDetail(c.dataset.id);
  });
  on('fiches:changed', renderList);
  on('session:opened', renderList);
}
