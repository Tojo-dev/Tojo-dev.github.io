/* Appel : ouvre le clavier du téléphone avec le numéro déjà saisi (Android exige un dernier appui sur le bouton vert). */

import { waNumber } from '../domain/phone.js';
import { toast } from '../ui/toast.js';

async function copyText(text){
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
}

export function callNumber(tel){
  const n = '+' + waNumber(tel);
  let left = false;
  const onVis = () => { if (document.hidden) left = true; };
  document.addEventListener('visibilitychange', onVis);
  window.location.href = 'tel:' + n;
  setTimeout(async () => {
    document.removeEventListener('visibilitychange', onVis);
    if (left) return;                                   // le téléphone s'est ouvert : rien à faire
    toast((await copyText(n))
      ? 'Le téléphone ne s’est pas ouvert. Numéro copié : colle-le dans le clavier d’appel.'
      : 'Le téléphone ne s’est pas ouvert. Numéro : ' + n);
  }, 1800);
}
