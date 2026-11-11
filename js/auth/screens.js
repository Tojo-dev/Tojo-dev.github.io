/* Écrans d'accès : code PIN, connexion, création de l'accès, mot de passe oublié, code de secours. */

import { $, $$ } from '../core/dom.js';
import { ls } from '../core/storage.js';
import { KEYS } from '../config.js';
import * as auth from './service.js';

const VIEWS = ['pin', 'login', 'setup', 'recover'];
const viewId = name => '#view' + name[0].toUpperCase() + name.slice(1);
const lockables = () => $$('header.top, main, .fab, .sheet');
const say = (selector, text) => { $(selector).textContent = text; };
const busy = (selector, on) => { $(selector).disabled = on; };
const waitText = () => `Trop d’essais. Réessaie dans ${auth.waitSeconds()} s.`;
const DIFFERENT = 'Les deux mots de passe sont différents.';

let onSuccess = () => {};
let entry = '';
let working = false;
let recStage = 1;
let recCodeTyped = '';
let recShowCurrent = '';
let afterRecovery = () => {};

export const setOnSuccess = fn => { onSuccess = fn; };
export const isGateOpen = () => !$('#gate').hidden;

/* ----- Affichage de la barrière d'accès ----- */
export function showGate(view, msg){
  $$('.toast').forEach(t => t.remove());      // aucun message de l'application ne doit rester visible sur l'écran verrouillé
  $('#gate').hidden = false;
  lockables().forEach(el => { el.inert = true; });
  ls.set(KEYS.locked, '1');
  showView(view, msg);
}
export function concealGate(){ $('#gate').hidden = true; }
export function releaseGate(){
  $('#gate').hidden = true;
  lockables().forEach(el => { el.inert = false; });
}

export function showView(name, msg){
  VIEWS.forEach(v => { $(viewId(v)).hidden = v !== name; });
  if (name === 'pin'){
    entry = ''; renderDots();
    say('#pinMsg', msg || 'Entre ton code PIN');
    $('#pinToLogin').hidden = !auth.hasAccount();
  } else if (name === 'login'){
    const acc = auth.account();
    $('#loginUser').value = acc ? acc.user : '';
    $('#loginPass').value = '';
    say('#loginMsg', msg || 'Connecte-toi pour ouvrir l’application.');
    $('#loginToPin').hidden = !auth.quickAllowed();
  } else if (name === 'setup'){
    ['#setupUser', '#setupPass', '#setupPass2'].forEach(s => { $(s).value = ''; });
    say('#setupMsg', msg || 'Choisis un identifiant et un mot de passe. Ils restent dans ce téléphone et fonctionnent sans internet.');
  } else if (name === 'recover'){
    recStage = 1; recCodeTyped = '';
    $('#recCodeWrap').hidden = false; $('#recNewWrap').hidden = true;
    ['#recCode', '#recPass', '#recPass2'].forEach(s => { $(s).value = ''; });
    $('#recGo').textContent = 'Continuer';
    say('#recoverMsg', 'Entre ton code de secours pour choisir un nouveau mot de passe.');
  }
}

/* ----- Code PIN rapide ----- */
function renderDots(){
  const n = auth.pinLength() || 4;
  $('#dots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < entry.length ? 'on' : ''}"></i>`).join('');
}

async function onPad(e){
  const b = e.target.closest('[data-k]');
  if (!b || working) return;
  const len = auth.pinLength();
  if (!len) return;
  if (auth.waitSeconds() > 0) return say('#pinMsg', waitText());
  const k = b.dataset.k;
  if (k === '⌫'){ entry = entry.slice(0, -1); renderDots(); return; }
  if (entry.length >= len) return;
  entry += k; renderDots();
  if (entry.length < len) return;
  working = true;
  const ok = await auth.verifyPin(entry);
  working = false;
  entry = ''; renderDots();
  if (ok) onSuccess();
  else say('#pinMsg', auth.waitSeconds() > 0 ? waitText() : 'Code incorrect');
}

/* ----- Connexion ----- */
async function onLogin(e){
  e.preventDefault();
  if (auth.waitSeconds() > 0) return say('#loginMsg', waitText());
  busy('#loginGo', true);
  try {
    const ok = await auth.login($('#loginUser').value, $('#loginPass').value);
    if (ok){ $('#loginPass').value = ''; onSuccess(); }
    else say('#loginMsg', auth.waitSeconds() > 0 ? waitText() : 'Identifiant ou mot de passe incorrect.');
  } finally { busy('#loginGo', false); }
}

/* ----- Création de l'accès (première utilisation) ----- */
async function onSetup(e){
  e.preventDefault();
  const user = $('#setupUser').value, p1 = $('#setupPass').value, p2 = $('#setupPass2').value;
  const err = auth.validateUser(user) || auth.validatePassword(p1, user) || (p1 !== p2 ? DIFFERENT : '');
  if (err) return say('#setupMsg', err);
  busy('#setupGo', true);
  try {
    const code = await auth.createAccount(user, p1);
    concealGate();
    showRecovery(code, () => onSuccess());
  } catch (e2) {
    say('#setupMsg', 'Enregistrement impossible : espace insuffisant ?');
  } finally { busy('#setupGo', false); }
}

/* ----- Mot de passe oublié ----- */
async function onRecover(e){
  e.preventDefault();
  if (recStage === 1){
    if (auth.waitSeconds() > 0) return say('#recoverMsg', waitText());
    busy('#recGo', true);
    let ok = false;
    try { ok = await auth.verifyRecoveryCode($('#recCode').value); } finally { busy('#recGo', false); }
    if (!ok) return say('#recoverMsg', auth.waitSeconds() > 0 ? waitText() : 'Code de secours incorrect.');
    recCodeTyped = $('#recCode').value;
    recStage = 2;
    $('#recCodeWrap').hidden = true; $('#recNewWrap').hidden = false;
    say('#recoverMsg', 'Code accepté. Choisis un nouveau mot de passe.');
    $('#recGo').textContent = 'Enregistrer le nouveau mot de passe';
    return;
  }
  const p1 = $('#recPass').value, p2 = $('#recPass2').value;
  const acc = auth.account();
  const err = auth.validatePassword(p1, acc ? acc.user : '') || (p1 !== p2 ? DIFFERENT : '');
  if (err) return say('#recoverMsg', err);
  busy('#recGo', true);
  let newCode = null;
  try { newCode = await auth.resetPasswordWithCode(recCodeTyped, p1); } finally { busy('#recGo', false); }
  if (!newCode) return say('#recoverMsg', 'Code de secours refusé. Recommence.');
  recCodeTyped = '';
  concealGate();
  showRecovery(newCode, () => onSuccess());     // l'ancien code est consommé : un nouveau est affiché
}

/* ----- Affichage unique du code de secours ----- */
export function showRecovery(code, after){
  recShowCurrent = code;
  afterRecovery = after || (() => {});
  say('#recShowCode', code);
  $('#recShowCheck').value = '';
  say('#recShowErr', '');
  $('#recShow').hidden = false;
}

function onRecShowOk(){
  const last4 = recShowCurrent.replace(/-/g, '').slice(-4);
  if (auth.normRec($('#recShowCheck').value) !== last4){
    return say('#recShowErr', 'Recopie les 4 derniers caractères du code pour continuer.');
  }
  $('#recShow').hidden = true;
  recShowCurrent = '';
  const next = afterRecovery;
  afterRecovery = () => {};
  next();
}

/* ----- Branchement des événements ----- */
export function initScreens(){
  $('#pad').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
    .map(k => k === '' ? '<span></span>'
      : `<button type="button" data-k="${k}" aria-label="${k === '⌫' ? 'Effacer' : k}">${k}</button>`).join('');
  $('#pad').addEventListener('click', onPad);
  $('#pinToLogin').addEventListener('click', () => showView('login'));
  $('#loginToPin').addEventListener('click', () => showView('pin'));
  $('#loginForgot').addEventListener('click', () => showView('recover'));
  $('#recBack').addEventListener('click', () => showView(auth.hasAccount() ? 'login' : 'setup'));
  $('#viewLogin').addEventListener('submit', onLogin);
  $('#viewSetup').addEventListener('submit', onSetup);
  $('#viewRecover').addEventListener('submit', onRecover);
  $('#recShowOk').addEventListener('click', onRecShowOk);
}
