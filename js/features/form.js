/* Formulaire d'une fiche de travail (création et modification), avec calcul du reste et du prix. */

import { $, $$, esc, radio, radioVal } from '../core/dom.js';
import { ar, gr, isoDate } from '../core/format.js';
import { addFiche, updateFiche, findFiche } from '../domain/fiches.js';
import { getClients, digits } from '../domain/clients.js';
import { openSheet, closeTop } from '../ui/sheets.js';
import { toast } from '../ui/toast.js';

function updateReste(){
  const total = +$('#fTotal').value || 0;
  const full = radioVal('pay') === 'tout';
  $('#avanceWrap').hidden = full;
  const av = full ? total : Math.min(total, +$('#fAvance').value || 0);
  $('#fReste').textContent = ar(total - av);
}

/** Recalcule le métal fourni par l'atelier et, si un prix du gramme est saisi, le montant total. */
function recalc(fromUser){
  const poids = +$('#fPoids').value || 0;
  const apport = Math.min(poids, +$('#fApport').value || 0);
  const atelier = poids - apport;
  $('#fAtelier').textContent = gr(atelier);
  const prixG = +$('#fPrixG').value || 0;
  if (fromUser && prixG > 0){
    $('#fTotal').value = String(Math.round(atelier * prixG + (+$('#fFacon').value || 0)));
  }
  updateReste();
}

/** Propose les clients déjà connus dans les champs nom et téléphone. */
export function fillClientLists(){
  const cs = getClients().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  $('#dlNoms').innerHTML = cs.map(c => `<option value="${esc(c.nom)}" label="${esc(c.tel)}"></option>`).join('');
  $('#dlTels').innerHTML = cs.filter(c => c.tel).map(c => `<option value="${esc(c.tel)}" label="${esc(c.nom)}"></option>`).join('');
}

export function openForm(id, prefill){
  fillClientLists();
  const f = id ? findFiche(id) : null;
  $('#form').reset();
  $('#form').dataset.id = f ? f.id : '';
  $('#calc').open = false;
  $('#formTitle').textContent = f ? 'Modifier la fiche' : 'Nouvelle fiche';
  if (f){
    radio('type', f.type); radio('metal', f.metal);
    $('#fNom').value = f.nom; $('#fTel').value = f.tel; $('#fPoids').value = f.poids;
    $('#fLibelle').value = f.libelle; $('#fTotal').value = f.total;
    radio('pay', f.avance >= f.total && f.total > 0 ? 'tout' : 'avance');
    $('#fAvance').value = f.avance; $('#fDate').value = f.date;
    $('#fApport').value = f.apport || ''; $('#fPrixG').value = f.prixG || ''; $('#fFacon').value = f.facon || '';
    $('#calc').open = !!(f.prixG || f.facon);
  } else {
    $('#fDate').value = isoDate(7);
    if (prefill){ $('#fNom').value = prefill.nom || ''; $('#fTel').value = prefill.tel || ''; }
  }
  recalc(false);
  openSheet('#sheetForm');
}

function onSubmit(e){
  e.preventDefault();
  const total = +$('#fTotal').value || 0;
  const full = radioVal('pay') === 'tout';
  const poids = +$('#fPoids').value || 0;
  const data = {
    type: radioVal('type'), metal: radioVal('metal'),
    nom: $('#fNom').value.trim(), tel: $('#fTel').value.trim(),
    poids, apport: Math.min(poids, +$('#fApport').value || 0),
    prixG: +$('#fPrixG').value || 0, facon: +$('#fFacon').value || 0,
    libelle: $('#fLibelle').value.trim(),
    total, avance: full ? total : Math.min(total, +$('#fAvance').value || 0),
    date: $('#fDate').value
  };
  const id = $('#form').dataset.id;
  if (id) updateFiche(id, data); else addFiche(data);
  closeTop();
  toast('Fiche enregistrée');
}

export function initForm(){
  $('#btnNew').addEventListener('click', () => openForm());
  $('#form').addEventListener('submit', onSubmit);
  ['#fTotal', '#fAvance'].forEach(s => $(s).addEventListener('input', updateReste));
  ['#fPoids', '#fApport', '#fPrixG', '#fFacon'].forEach(s => $(s).addEventListener('input', () => recalc(true)));
  $$('input[name=pay]').forEach(r => r.addEventListener('change', updateReste));

  $('#fNom').addEventListener('change', () => {
    if ($('#fTel').value.trim()) return;
    const n = $('#fNom').value.trim().toLowerCase();
    const c = getClients().find(x => x.nom.trim().toLowerCase() === n);
    if (c && c.tel) $('#fTel').value = c.tel;
  });
  $('#fTel').addEventListener('change', () => {
    if ($('#fNom').value.trim()) return;
    const d = digits($('#fTel').value).slice(-9);
    if (d.length < 6) return;
    const c = getClients().find(x => digits(x.tel).slice(-9) === d);
    if (c) $('#fNom').value = c.nom;
  });
}
