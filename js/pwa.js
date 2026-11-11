/* Mode hors-ligne : enregistre le service worker (uniquement en https ou sur localhost). */

export function registerServiceWorker(){
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  const register = () => navigator.serviceWorker.register('sw.js').catch(() => {});
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
