/* Petit message qui s'affiche en bas de l'écran. */

import { on } from '../core/events.js';

let timer;

export function toast(msg){
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.setAttribute('role', 'status');
  document.body.appendChild(el);
  clearTimeout(timer);
  timer = setTimeout(() => el.remove(), 2600);
}

export function initToast(){
  on('storage:error', () => toast('Enregistrement impossible : espace insuffisant'));
}
