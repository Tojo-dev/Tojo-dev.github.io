/* Hachage : le mot de passe n'est jamais conservé, seulement son empreinte (PBKDF2-SHA256 avec sel). */

import { PBKDF2_ITERATIONS } from '../config.js';

const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const hasSubtle = () => !!(globalThis.crypto && globalThis.crypto.subtle);

/** Repli minimal, utilisé seulement hors contexte sécurisé (http sans localhost). */
const weak = text => { let h = 5381; for (const b of enc.encode(text)) h = ((h << 5) + h + b) | 0; return 'x' + h; };

export function randomHex(bytes = 16){
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

export async function pbkdf2(secret, saltHex, iterations = PBKDF2_ITERATIONS){
  if (!hasSubtle()) return weak(saltHex + ':' + secret);
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(saltHex), iterations }, key, 256);
  return toHex(bits);
}

/** Ancien format des codes PIN (version 1) : SHA-256 de « sel:code ». Gardé pour ne pas perdre les PIN déjà créés. */
export async function sha256Pin(pin, salt){
  if (!hasSubtle()) return weak(salt + ':' + pin);
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(salt + ':' + pin)));
}

/* Code de secours : 12 caractères sans 0, 1, O, I pour éviter les confusions (60 bits). */
const REC_ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const normRec = t => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function makeRecovery(){
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  const c = [...a].map(b => REC_ALPHA[b % 32]);
  return c.slice(0, 4).join('') + '-' + c.slice(4, 8).join('') + '-' + c.slice(8).join('');
}
