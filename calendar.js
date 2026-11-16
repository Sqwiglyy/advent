async function openDoor(day) {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  document.querySelector('#video-title').textContent = 'December ' + day;
  videoStatus.textContent = 'Opening the door…';
  player.replaceChildren();
  dialog.showModal();

  try {
    const url = api + '/video/' + day;
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    if (response.status === 403) throw new Error('This door is still locked.');
    if (response.status === 404) throw new Error('There’s no video set for this day yet.');
    if (!response.ok) throw new Error('The video is unavailable. Try again shortly.');
    if (controller.signal.aborted) return;

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.style.cssText = 'display:block;width:100%;max-height:65dvh;background:#000';
    video.setAttribute('aria-label', 'Meme for December ' + day);
    video.addEventListener('error', () => {
      if (!controller.signal.aborted) {
        videoStatus.textContent = 'This clip could not be played.';
      }
    });

    player.append(video);
    video.src = url;
    videoStatus.textContent = '';
  } catch (error) {
    if (!controller.signal.aborted) videoStatus.textContent = error.message;
  }
}

dialog.addEventListener('close', () => {
  request?.abort();
  const video = player.querySelector('video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  player.replaceChildren();
});
