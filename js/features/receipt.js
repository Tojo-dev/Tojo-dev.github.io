/* Reçu : image dessinée sur un canvas, à partager (WhatsApp…), enregistrer ou imprimer. */

import { $ } from '../core/dom.js';
import { ar, gr, fdate, padNum, slug } from '../core/format.js';
import { findFiche, reste, atelierG } from '../domain/fiches.js';
import { openSheet } from '../ui/sheets.js';
import { toast } from '../ui/toast.js';
import { markExternal } from '../auth/session.js';
import { getReg } from './atelier.js';

let receiptId = null;

function drawReceipt(f){
  const reg = getReg();
  const W = 800, M = 48, INK = '#1d2227', MUTED = '#5b666c';
  const SERIF = 'Georgia, "Times New Roman", serif', SANS = 'system-ui, Roboto, "Segoe UI", sans-serif';

  /* Dessine le reçu. Premier passage (draw = false) : mesure la hauteur ; second passage : dessine. */
  const pass = (ctx, draw) => {
    const T = (str, x, yy, font, color, align) => {
      if (!draw) return;
      ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left';
      ctx.fillText(str, x, yy);
    };
    const rule = yy => {
      if (!draw) return;
      ctx.strokeStyle = '#d3d8d6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(M, yy); ctx.lineTo(W - M, yy); ctx.stroke();
    };
    const wrap = (str, font, maxW) => {
      ctx.font = font;
      const out = [];
      String(str).split('\n').forEach(par => {
        let line = '';
        par.split(' ').forEach(w => {
          const t = line ? line + ' ' + w : w;
          if (line && ctx.measureText(t).width > maxW){ out.push(line); line = w; } else line = t;
        });
        out.push(line);
      });
      return out;
    };
    let y;

    if (draw){ ctx.fillStyle = INK; ctx.fillRect(0, 0, W, 140); }
    T(reg.nom || 'Atelier de bijouterie', M, reg.tel ? 68 : 84, `600 38px ${SERIF}`, '#ffffff');
    if (reg.tel) T('Tél. ' + reg.tel, M, 110, `22px ${SANS}`, '#b9c2c7');

    y = 200;
    T('Reçu N° ' + padNum(f.num), M, y, `600 34px ${SERIF}`, INK);
    T('Émis le ' + new Date().toLocaleDateString('fr-FR'), W - M, y, `22px ${SANS}`, MUTED, 'right');
    y += 26; rule(y); y += 46;

    T('CLIENT', M, y, `600 17px ${SANS}`, MUTED); y += 40;
    T(f.nom, M, y, `600 30px ${SERIF}`, INK); y += 36;
    if (f.tel){ T(f.tel, M, y, `22px ${SANS}`, MUTED); y += 32; }
    y += 24;

    T(f.type === 'commande' ? 'COMMANDE' : 'TRANSFORMATION', M, y, `600 17px ${SANS}`, MUTED); y += 38;
    wrap(f.libelle, `24px ${SANS}`, W - 2 * M).forEach(l => { T(l, M, y, `24px ${SANS}`, INK); y += 34; });
    y += 16;

    const label = (f.metal === 'or' ? 'Or' : 'Argent') + '   ' + gr(f.poids);
    ctx.font = `700 24px ${SANS}`;
    const cw = ctx.measureText(label).width + 40;
    if (draw){
      const g = ctx.createLinearGradient(M, y, M + cw, y + 48);
      if (f.metal === 'or'){ g.addColorStop(0, '#ecd183'); g.addColorStop(.55, '#b98a2e'); g.addColorStop(1, '#d6ac4d'); }
      else { g.addColorStop(0, '#f4f7f9'); g.addColorStop(.4, '#dde3e8'); g.addColorStop(1, '#aeb9c2'); }
      ctx.fillStyle = g; ctx.fillRect(M, y, cw, 48);
    }
    T(label, M + 20, y + 33, `700 24px ${SANS}`, '#2a1f05');
    y += 48 + 26;
    if (f.apport > 0){
      T('Apporté par le client : ' + gr(f.apport), M, y, `22px ${SANS}`, MUTED); y += 32;
      T('Fourni par l’atelier : ' + gr(atelierG(f)), M, y, `22px ${SANS}`, MUTED); y += 32;
    }
    y += 12; rule(y); y += 50;

    const row = (l, v, big, color) => {
      T(l, M, y, `${big ? '600 ' : ''}${big ? 28 : 24}px ${SANS}`, INK);
      T(v, W - M, y, `700 ${big ? 32 : 26}px ${SANS}`, color || INK, 'right');
      y += big ? 54 : 46;
    };
    const r = reste(f);
    row('Montant total', ar(f.total));
    row('Avance versée', ar(f.avance));
    row(r ? 'Reste à payer' : 'Solde', r ? ar(r) : 'PAYÉ', true, r ? '#b0382c' : '#2a7655');
    y += 4; rule(y); y += 46;

    T(f.statut === 'livre' ? 'LIVRÉ' : 'LIVRAISON PRÉVUE', M, y, `600 17px ${SANS}`, MUTED); y += 38;
    T(fdate(f.date), M, y, `600 26px ${SERIF}`, INK); y += 52;
    rule(y); y += 52;
    T('Merci de votre confiance.', W / 2, y, `italic 24px ${SERIF}`, MUTED, 'center');
    y += 56;
    return y;
  };

  const H = pass(document.createElement('canvas').getContext('2d'), false);
  const cv = $('#receiptCanvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  pass(ctx, true);
}

export function openReceipt(id){
  const f = findFiche(id);
  if (!f) return;
  receiptId = id;
  drawReceipt(f);
  openSheet('#sheetReceipt');
}

const receiptName = f => `recu_${padNum(f.num)}_${slug(f.nom)}.png`;
const receiptBlob = () => new Promise(res => $('#receiptCanvas').toBlob(res, 'image/png'));

function saveBlob(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

async function share(){
  const f = findFiche(receiptId);
  if (!f) return;
  const blob = await receiptBlob();
  if (!blob) return toast('Impossible de créer le reçu');
  const file = new File([blob], receiptName(f), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })){
    markExternal();
    try { await navigator.share({ files: [file], title: 'Reçu N° ' + padNum(f.num) }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  saveBlob(blob, file.name);
  toast('Image enregistrée dans Téléchargements');
}

async function save(){
  const f = findFiche(receiptId);
  if (!f) return;
  const blob = await receiptBlob();
  if (!blob) return toast('Impossible de créer le reçu');
  saveBlob(blob, receiptName(f));
  toast('Image enregistrée dans Téléchargements');
}

export function initReceipt(){
  $('#rcShare').addEventListener('click', share);
  $('#rcSave').addEventListener('click', save);
  $('#rcPrint').addEventListener('click', () => { markExternal(); window.print(); });
}
