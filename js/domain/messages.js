/* Texte du message WhatsApp envoyé depuis une fiche de travail. */

import { TYPES } from '../config.js';
import { ar, gr, fdate, padNum } from '../core/format.js';
import { reste, atelierG } from './fiches.js';

export function waMessage(f){
  const r = reste(f);
  const intro = f.statut === 'pret'
    ? `Bonjour ${f.nom}, votre ${f.type === 'commande' ? 'bijou' : 'travail de transformation'} est prêt. Vous pouvez passer le récupérer.`
    : f.statut === 'livre'
    ? `Bonjour ${f.nom}, merci pour votre confiance. Voici le récapitulatif de votre ${TYPES[f.type].toLowerCase()}.`
    : `Bonjour ${f.nom}, votre ${TYPES[f.type].toLowerCase()} est bien enregistrée.`;
  return [
    intro, '',
    `Fiche n° ${padNum(f.num)}`,
    `Travail : ${f.libelle}`,
    `Métal : ${f.metal === 'or' ? 'Or' : 'Argent'}, ${gr(f.poids)}`,
    ...(f.apport > 0 ? [`Métal apporté par vous : ${gr(f.apport)}`, `Métal fourni par l’atelier : ${gr(atelierG(f))}`] : []),
    `Montant total : ${ar(f.total)}`,
    `Avance versée : ${ar(f.avance)}`,
    r ? `Reste à payer : ${ar(r)}` : 'Paiement complet reçu.',
    `Livraison prévue : ${fdate(f.date)}`
  ].join('\n');
}
