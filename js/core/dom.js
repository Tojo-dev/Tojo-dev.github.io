/* Petits outils pour le DOM. */

export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const radio = (name, value) => { document.querySelector(`input[name=${name}][value=${value}]`).checked = true; };
export const radioVal = name => document.querySelector(`input[name=${name}]:checked`).value;
