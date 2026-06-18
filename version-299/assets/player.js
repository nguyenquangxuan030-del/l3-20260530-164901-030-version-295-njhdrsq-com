
import { H as Hls } from './hls-dru42stk.js';

function setupPlayer(container) {
  const video = container.querySelector('video');
  const overlay = container.querySelector('.movie-player__overlay');
  const source = container.dataset.video;
  let hlsInstance = null;
  let ready = false;

  const attachSource = () => {
    if (ready || !source || !video) return;
    ready = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
    } else if (Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
    } else {
      video.src = source;
    }
  };

  const play = () => {
    attachSource();
    if (overlay) overlay.classList.add('is-hidden');
    video.controls = true;
    const promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        if (overlay) overlay.classList.remove('is-hidden');
      });
    }
  };

  if (overlay) overlay.addEventListener('click', play);
  if (video) video.addEventListener('click', () => {
    if (!ready || video.paused) play();
  });
  window.addEventListener('pagehide', () => {
    if (hlsInstance) hlsInstance.destroy();
  });
}

document.querySelectorAll('.js-player').forEach(setupPlayer);
