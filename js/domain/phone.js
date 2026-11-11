/* Numéros de téléphone au format international (pour WhatsApp et les appels). */

import { COUNTRY_CODE } from '../config.js';

export function waNumber(t){
  const n = (t || '').replace(/[^\d+]/g, '');
  if (n.startsWith('+')) return n.slice(1);
  if (n.startsWith('00')) return n.slice(2);
  if (n.startsWith('0')) return COUNTRY_CODE + n.slice(1);
  return n.startsWith(COUNTRY_CODE) ? n : COUNTRY_CODE + n;
}
