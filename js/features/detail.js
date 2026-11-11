/* Fiche de travail : détail, versements, statuts, WhatsApp, suppression. */

import { $, esc } from '../core/dom.js';
import { on } from '../core/events.js';
import { TYPES, STATUTS } from '../config.js';
import { ar, gr, fdate, padNum } from '../core/format.js';
import { findFiche, updateFiche, removeFiche, reste, atelierG } from '../domain/fiches.js';
import { clientKey } from '../domain/clients.js';
import { waNumber } from '../domain/phone.js';
import { waMessage } from '../domain/messages.js';
import { openSheet, closeTop, isOpen } from '../ui/sheets.js';
import { toast } from '../ui/toast.js';
import { markExternal } from '../auth/session.js';
import { openForm } from './form.js';
import { openReceipt } from './receipt.js';
import { openClient } from './clients-ui.js';

let currentId = null;

export function renderDetail(id){
  const f = findFiche(id);
  if (!f) return;
  const r = reste(f);
  $('#detailBody').innerHTML = `
    <dl class="det">
      <div><dt>Fiche</dt><dd>N° ${padNum(f.num)}</dd></div>
      <div><dt>Client</dt><dd>${esc(f.nom)}</dd></div>
      <div><dt>Numéro</dt><dd>${esc(f.tel) || '—'}</dd></div>
      <div><dt>Type</dt><dd>${TYPES[f.type]}</dd></div>
      <div><dt>Métal</dt><dd><span class="metal ${f.metal}">${f.metal === 'or' ? 'Or' : 'Argent'} ${gr(f.poids)}</span></dd></div>
      ${f.apport > 0 ? `<div><dt>Apporté par le client</dt><dd>${gr(f.apport)}</dd></div><div><dt>Fourni par l’atelier</dt><dd>${gr(atelierG(f))}</dd></div>` : ''}
      ${f.prixG > 0 ? `<div><dt>Détail du prix</dt><dd>${gr(atelierG(f))} × ${ar(f.prixG)} + façon ${ar(f.facon)}</dd></div>` : ''}
      <div><dt>Travail</dt><dd>${esc(f.libelle)}</dd></div>
      <div><dt>Montant total</dt><dd>${ar(f.total)}</dd></div>
      <div><dt>Avance reçue</dt><dd>${ar(f.avance)}</dd></div>
      <div><dt>Reste à payer</dt><dd class="pay ${r ? 'due' : 'paid'}">${r ? ar(r) : 'Tout est payé'}</dd></div>
      <div><dt>Livraison</dt><dd>${fdate(f.date)}</dd></div>
      <div><dt>Statut</dt><dd>${STATUTS[f.statut]}</dd></div>
    </dl>
    <button class="btn wa" data-act="wa">Envoyer sur WhatsApp</button>
    <button class="btn" data-act="receipt">Reçu à partager</button>
    ${r ? '<button class="btn primary" data-act="pay">Ajouter un versement</button>' : ''}
    ${f.statut === 'encours' ? '<button class="btn" data-act="pret">Marquer comme prêt</button>' : ''}
    ${f.statut !== 'livre' ? '<button class="btn" data-act="livre">Marquer comme livré</button>' : '<button class="btn" data-act="encours">Remettre en cours</button>'}
    <button class="btn" data-act="client">Voir la fiche client</button>
    <button class="btn" data-act="edit">Modifier</button>
    <button class="btn danger" data-act="del">Supprimer</button>`;
}

export function openDetail(id){
  if (!findFiche(id)) return;
  currentId = id;
  renderDetail(id);
  openSheet('#sheetDetail');
}

function onAction(e){
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const f = findFiche(currentId);
  if (!f) return;
  const act = b.dataset.act;

  if (act === 'wa'){
    if (!f.tel) return toast("Ajoute d'abord le numéro du client");
    markExternal();
    window.open(`https://wa.me/${waNumber(f.tel)}?text=${encodeURIComponent(waMessage(f))}`, '_blank');
  } else if (act === 'pay'){
    const v = prompt(`Montant du versement (reste : ${ar(reste(f))})`, String(reste(f)));
    if (v === null) return;
    const m = Math.round(+String(v).replace(/\s/g, '').replace(',', '.'));
    if (!(m > 0)) return toast('Montant invalide');
    updateFiche(f.id, { avance: Math.min(f.total, f.avance + m) });
    toast('Versement ajouté');
  } else if (['pret', 'livre', 'encours'].includes(act)){
    updateFiche(f.id, { statut: act });
    toast('Statut : ' + STATUTS[act]);
  } else if (act === 'receipt'){
    openReceipt(f.id);
  } else if (act === 'client'){
    openClient(clientKey(f));
  } else if (act === 'edit'){
    openForm(f.id);
  } else if (act === 'del'){
    if (confirm(`Supprimer la fiche de ${f.nom} ? Cette action est définitive.`)){
      removeFiche(f.id);
      closeTop();
      toast('Fiche supprimée');
    }
  }
}

export function initDetail(){
  $('#detailBody').addEventListener('click', onAction);
  on('fiches:changed', () => { if (currentId && isOpen('#sheetDetail')) renderDetail(currentId); });
}
