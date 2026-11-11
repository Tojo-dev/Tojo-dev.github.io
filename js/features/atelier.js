/* Informations de l'atelier (nom et téléphone) affichées sur les reçus. */

import { $ } from '../core/dom.js';
import { KEYS } from '../config.js';
import { readJSON, writeJSON } from '../core/storage.js';
import { on } from '../core/events.js';
import { toast } from '../ui/toast.js';

export const getReg = () => readJSON(KEYS.atelier, {});

function renderReg(){
  const r = getReg();
  $('#regNom').value = r.nom || '';
  $('#regTel').value = r.tel || '';
}

export function initAtelier(){
  on('settings:open', renderReg);
  $('#regSave').addEventListener('click', () => {
    const ok = writeJSON(KEYS.atelier, { nom: $('#regNom').value.trim(), tel: $('#regTel').value.trim() });
    toast(ok ? 'Informations enregistrées' : 'Enregistrement impossible');
  });
}
