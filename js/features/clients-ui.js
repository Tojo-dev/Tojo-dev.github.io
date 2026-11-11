/* Clients : liste, fiche client (total, reste dû, commandes), appel et WhatsApp. */

import { $, esc } from '../core/dom.js';
import { on } from '../core/events.js';
import { ar } from '../core/format.js';
import { getClients } from '../domain/clients.js';
import { waNumber } from '../domain/phone.js';
import { openSheet, isOpen } from '../ui/sheets.js';
import { markExternal } from '../auth/session.js';
import { cardHTML } from './list.js';
import { openDetail } from './detail.js';
import { openForm } from './form.js';
import { callNumber } from './call.js';

let currentClient = null;

export function renderClients(){
  const q = $('#qClients').value.trim().toLowerCase();
  const list = getClients()
    .filter(c => !q || (c.nom + ' ' + c.tel).toLowerCase().includes(q))
    .sort((a, b) => b.dette - a.dette || a.nom.localeCompare(b.nom, 'fr'));
  $('#clientsList').innerHTML = list.length ? list.map(c => `<button class="card" data-client="${esc(c.key)}">
      <div class="row"><strong class="nom">${esc(c.nom)}</strong><span class="pay ${c.dette ? 'due' : 'paid'}">${c.dette ? 'Doit ' + ar(c.dette) : 'À jour'}</span></div>
      <div class="meta"><span>${esc(c.tel) || 'Pas de numéro'}</span><span>${c.fiches.length} commande${c.fiches.length > 1 ? 's' : ''}</span></div>
    </button>`).join('') : '<p class="empty">Aucun client pour le moment.</p>';
}

export function renderClient(){
  const c = getClients().find(x => x.key === currentClient);
  if (!c){ $('#clientBody').innerHTML = '<p class="empty">Aucune commande pour ce client.</p>'; return; }
  const list = [...c.fiches].sort((a, b) => (b.num || 0) - (a.num || 0));
  const num = c.tel ? waNumber(c.tel) : '';
  $('#clientBody').innerHTML = `
    <h3 class="client-name">${esc(c.nom)}</h3>
    <p class="client-tel">${esc(c.tel) || 'Pas de numéro'}</p>
    <dl class="det">
      <div><dt>Commandes</dt><dd>${list.length}</dd></div>
      <div><dt>Montant total</dt><dd>${ar(c.total)}</dd></div>
      <div><dt>Déjà payé</dt><dd>${ar(c.avance)}</dd></div>
      <div><dt>Reste dû</dt><dd class="pay ${c.dette ? 'due' : 'paid'}">${c.dette ? ar(c.dette) : 'À jour'}</dd></div>
    </dl>
    ${num ? `<a class="btn wa" href="https://wa.me/${num}" target="_blank" rel="noopener">Écrire sur WhatsApp</a><button class="btn" data-cact="call">Appeler</button>` : ''}
    <button class="btn primary" data-cact="new">Nouvelle commande pour ce client</button>
    <h3 class="sec">Commandes</h3>
    ${list.map(cardHTML).join('')}`;
}

export function openClient(key){
  currentClient = key;
  renderClient();
  openSheet('#sheetClient');
}

function onClientBodyClick(e){
  if (e.target.closest('a[href^="https://wa.me"]')) markExternal();
  const card = e.target.closest('[data-id]');
  if (card) return openDetail(card.dataset.id);
  const c = getClients().find(x => x.key === currentClient);
  if (e.target.closest('[data-cact="call"]')){
    if (c && c.tel) callNumber(c.tel);
    return;
  }
  if (e.target.closest('[data-cact="new"]')){
    openForm(null, c ? { nom: c.nom, tel: c.tel } : null);
  }
}

export function initClientsUi(){
  $('#btnClients').addEventListener('click', () => {
    $('#qClients').value = '';
    renderClients();
    openSheet('#sheetClients');
  });
  $('#qClients').addEventListener('input', renderClients);
  $('#clientsList').addEventListener('click', e => {
    const b = e.target.closest('[data-client]');
    if (b) openClient(b.dataset.client);
  });
  $('#clientBody').addEventListener('click', onClientBodyClick);
  on('fiches:changed', () => {
    if (isOpen('#sheetClients')) renderClients();
    if (isOpen('#sheetClient')) renderClient();
  });
}
