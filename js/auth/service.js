/* Authentification locale, sans serveur ni internet : la vérification se fait dans le téléphone. */

import { PBKDF2_ITERATIONS } from '../config.js';
import {
  getAccount, saveAccount, getPin, savePin, clearPin,
  registerFail, clearFails, waitSeconds
} from './store.js';
import { pbkdf2, sha256Pin, randomHex, makeRecovery, normRec } from './crypto.js';

export { waitSeconds, normRec };
export const MIN_PASSWORD = 4;

export const account = getAccount;
export const hasAccount = () => !!getAccount();
export const hasPin = () => !!getPin();
export const pinLength = () => { const c = getPin(); return c ? c.len : 0; };

/* ----- Contrôles de saisie ----- */
export function validateUser(user){
  const u = String(user || '').trim();
  if (u.length < 3) return 'L’identifiant doit avoir au moins 3 caractères.';
  if (u.length > 32) return 'L’identifiant est trop long (32 caractères maximum).';
  return '';
}

export function validatePassword(pass, user = ''){
  const p = String(pass || '');
  if (p.length < MIN_PASSWORD) return `Le mot de passe doit avoir au moins ${MIN_PASSWORD} caractères.`;
  if (user && p.toLowerCase() === String(user).trim().toLowerCase()) return 'Le mot de passe ne doit pas être identique à l’identifiant.';
  return '';
}

export const validatePin = pin => /^\d{4,6}$/.test(String(pin || ''));

/* ----- Création du compte ----- */
/** Crée l'accès et renvoie le code de secours (à afficher une seule fois). */
export async function createAccount(user, password){
  const code = makeRecovery();
  const salt = randomHex(16), rsalt = randomHex(16);
  const acc = {
    v: 2, user: String(user).trim(), iter: PBKDF2_ITERATIONS,
    salt, hash: await pbkdf2(password, salt, PBKDF2_ITERATIONS),
    rsalt, rhash: await pbkdf2(normRec(code), rsalt, PBKDF2_ITERATIONS),
    loginAt: Date.now()
  };
  if (!saveAccount(acc)) throw new Error('storage');
  clearFails();
  return code;
}

/* ----- Connexion ----- */
export async function login(user, password){
  const acc = getAccount();
  if (!acc || waitSeconds() > 0) return false;
  const hash = await pbkdf2(password, acc.salt, acc.iter);      // calculé dans tous les cas : même durée si l'identifiant est faux
  const ok = hash === acc.hash && String(user || '').trim().toLowerCase() === acc.user.toLowerCase();
  if (ok){ saveAccount({ ...acc, loginAt: Date.now() }); clearFails(); }
  else registerFail();
  return ok;
}

export async function checkPassword(password){
  const acc = getAccount();
  if (!acc || waitSeconds() > 0) return false;
  const ok = (await pbkdf2(password, acc.salt, acc.iter)) === acc.hash;
  if (ok) clearFails(); else registerFail();
  return ok;
}

/** Vérifie le mot de passe actuel avant une action sensible. Renvoie 'ok', 'bad-password' ou 'wait'. */
async function guard(current){
  if (!getAccount()) return 'bad-password';
  if (waitSeconds() > 0) return 'wait';
  if (await checkPassword(current)) return 'ok';
  return waitSeconds() > 0 ? 'wait' : 'bad-password';
}

/* ----- Réglages d'accès (chacun demande le mot de passe actuel) ----- */
export async function changePassword(current, next){
  const g = await guard(current); if (g !== 'ok') return g;
  const acc = getAccount(), salt = randomHex(16);
  return saveAccount({ ...acc, salt, iter: PBKDF2_ITERATIONS, hash: await pbkdf2(next, salt, PBKDF2_ITERATIONS) }) ? 'ok' : 'storage';
}

export async function newRecoveryCode(current){
  const g = await guard(current); if (g !== 'ok') return { status: g, code: '' };
  const acc = getAccount(), code = makeRecovery(), rsalt = randomHex(16);
  const saved = saveAccount({ ...acc, rsalt, rhash: await pbkdf2(normRec(code), rsalt, acc.iter) });
  return saved ? { status: 'ok', code } : { status: 'storage', code: '' };
}

export async function setPin(current, pin){
  const g = await guard(current); if (g !== 'ok') return g;
  const salt = randomHex(16);
  const ok = savePin({ v: 2, salt, iter: PBKDF2_ITERATIONS, hash: await pbkdf2(pin, salt, PBKDF2_ITERATIONS), len: String(pin).length });
  return ok ? 'ok' : 'storage';
}

export async function removePin(current){
  const g = await guard(current); if (g !== 'ok') return g;
  clearPin();
  return 'ok';
}

/* ----- Mot de passe oublié : code de secours à usage unique ----- */
export async function verifyRecoveryCode(code){
  const acc = getAccount();
  if (!acc || waitSeconds() > 0) return false;
  const ok = (await pbkdf2(normRec(code), acc.rsalt, acc.iter)) === acc.rhash;
  if (ok) clearFails(); else registerFail();
  return ok;
}

/** Choisit un nouveau mot de passe grâce au code de secours. Renvoie le NOUVEAU code de secours, ou null. */
export async function resetPasswordWithCode(code, newPassword){
  if (!(await verifyRecoveryCode(code))) return null;
  const acc = getAccount();
  const salt = randomHex(16), rsalt = randomHex(16), newCode = makeRecovery();
  const next = {
    ...acc, salt, iter: PBKDF2_ITERATIONS, hash: await pbkdf2(newPassword, salt, PBKDF2_ITERATIONS),
    rsalt, rhash: await pbkdf2(normRec(newCode), rsalt, PBKDF2_ITERATIONS), loginAt: Date.now()
  };
  return saveAccount(next) ? newCode : null;
}

/* ----- Code PIN rapide ----- */
export async function verifyPin(pin){
  const c = getPin();
  if (!c || waitSeconds() > 0) return false;
  const hash = c.v === 2 ? await pbkdf2(pin, c.salt, c.iter) : await sha256Pin(pin, c.salt);   // v1 : PIN créés avant l'authentification
  const ok = hash === c.hash;
  if (ok) clearFails(); else registerFail();
  return ok;
}

/** Si un code PIN existe, il est proposé à chaque connexion (le mot de passe reste toujours possible). */
export const quickAllowed = () => !!getPin() && !!getAccount();
