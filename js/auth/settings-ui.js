/* Réglages d'accès : mot de passe, code de secours, code PIN rapide, délai de verrouillage. */

import { $ } from '../core/dom.js';
import { on } from '../core/events.js';
import { toast } from '../ui/toast.js';
import * as auth from './service.js';
import { showRecovery } from './screens.js';

function render(){
  const acc = auth.account();
  $('#accStatus').textContent = acc ? `Identifiant : ${acc.user}.` : '';
  $('#accRecStatus').textContent = acc && acc.rhash ? 'Code de secours : en place.' : 'Code de secours : pas encore créé.';
  const hasPin = auth.hasPin();
  $('#pinStatus').textContent = hasPin ? `Code PIN activé (${auth.pinLength()} chiffres).` : 'Code PIN non activé.';
  $('#pinSet').textContent = hasPin ? 'Changer le code PIN' : 'Activer le code PIN';
  $('#pinOff').hidden = !hasPin;
  ['#accCur', '#accNew', '#accNew2', '#pinNew', '#pinNew2'].forEach(s => { $(s).value = ''; });
}

function explain(status){
  if (status === 'bad-password') return 'Mot de passe actuel incorrect.';
  if (status === 'wait') return `Trop d’essais. Réessaie dans ${auth.waitSeconds()} s.`;
  return 'Enregistrement impossible.';
}

const needCurrent = () => {
  if ($('#accCur').value) return true;
  toast('Entre ton mot de passe actuel.');
  return false;
};

async function changePassword(){
  if (!needCurrent()) return;
  const acc = auth.account();
  const n = $('#accNew').value, n2 = $('#accNew2').value;
  const err = auth.validatePassword(n, acc ? acc.user : '') || (n !== n2 ? 'Les deux mots de passe sont différents.' : '');
  if (err) return toast(err);
  const status = await auth.changePassword($('#accCur').value, n);
  if (status !== 'ok') return toast(explain(status));
  render();
  toast('Mot de passe modifié');
}

async function newRecoveryCode(){
  if (!needCurrent()) return;
  const { status, code } = await auth.newRecoveryCode($('#accCur').value);
  if (status !== 'ok') return toast(explain(status));
  render();
  showRecovery(code, render);
}

async function setPin(){
  if (!needCurrent()) return;
  const n = $('#pinNew').value.trim();
  if (!auth.validatePin(n)) return toast('Le code PIN doit avoir 4 à 6 chiffres.');
  if (n !== $('#pinNew2').value.trim()) return toast('Les deux codes sont différents.');
  const status = await auth.setPin($('#accCur').value, n);
  if (status !== 'ok') return toast(explain(status));
  render();
  toast('Code PIN enregistré');
}

async function removePin(){
  if (!needCurrent()) return;
  const status = await auth.removePin($('#accCur').value);
  if (status !== 'ok') return toast(explain(status));
  render();
  toast('Code PIN désactivé');
}

export function initAccessSettings(){
  on('settings:open', render);
  $('#accChange').addEventListener('click', changePassword);
  $('#accRecNew').addEventListener('click', newRecoveryCode);
  $('#pinSet').addEventListener('click', setPin);
  $('#pinOff').addEventListener('click', removePin);
}
