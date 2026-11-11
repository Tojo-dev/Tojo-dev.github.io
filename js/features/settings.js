/* Panneau Réglages : chaque section (atelier, accès, sauvegardes…) se met à jour à l'ouverture. */

import { $ } from '../core/dom.js';
import { emit } from '../core/events.js';
import { openSheet } from '../ui/sheets.js';

export function initSettings(){
  $('#btnMenu').addEventListener('click', () => {
    emit('settings:open');
    openSheet('#sheetSettings');
  });
}
