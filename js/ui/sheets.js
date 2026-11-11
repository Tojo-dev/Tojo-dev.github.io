/* Panneaux plein écran empilés. Le bouton Retour d'Android ferme le panneau du dessus. */

import { $, $$ } from '../core/dom.js';

const stack = [];

export const isOpen = id => stack.includes(id);

export function openSheet(id){
  const el = $(id);
  el.style.zIndex = String(20 + stack.length + 1);
  el.hidden = false;
  el.scrollTop = 0;
  stack.push(id);
  history.pushState({ sheet: id }, '');
}

export function closeTop(){
  if (stack.length) history.back();
}

export function initSheets(){
  window.addEventListener('popstate', () => { if (stack.length) $(stack.pop()).hidden = true; });
  $$('[data-back]').forEach(b => b.addEventListener('click', closeTop));
}
