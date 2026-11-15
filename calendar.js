// Paste the deployed Cloudflare Worker URL here, without a trailing slash.
const api = 'advent.sqwiglyy.workers.dev';
const doors = document.querySelector('#doors');
const status = document.querySelector('#status');
const dialog = document.querySelector('dialog');
const player = document.querySelector('#player');
const videoStatus = document.querySelector('#video-status');
let request;

async function call(path, options) {
  if (!api) throw new Error('The calendar is waiting for its server to be connected.');
  const response = await fetch(api + path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

async function openDoor(day) {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  document.querySelector('#video-title').textContent = 'December ' + day;
  videoStatus.textContent = 'Opening the door…';
  player.replaceChildren();
  dialog.showModal();
  try {
    const { id } = await call('/door/' + day, { signal: controller.signal });
    if (controller.signal.aborted) return;
    const video = document.createElement('iframe');
    video.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1';
    video.title = 'Meme for December ' + day;
    video.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    video.allowFullscreen = true;
    video.referrerPolicy = 'strict-origin-when-cross-origin';
    const link = document.createElement('a');
    link.href = 'https://www.youtube.com/watch?v=' + id;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Watch on YouTube';
    player.append(video, link);
    videoStatus.textContent = '';
  } catch (error) {
    if (!controller.signal.aborted) videoStatus.textContent = error.message;
  }
}

dialog.addEventListener('close', () => {
  request?.abort();
  player.replaceChildren();
});

function renderDoors(available) {
  const buttons = Array.from({ length: 24 }, (_, index) => {
    const day = index + 1;
    const button = document.createElement('button');
    const number = document.createElement('strong');
    const label = document.createElement('small');
    button.className = 'door';
    button.disabled = day > available;
    number.textContent = day;
    label.textContent = button.disabled ? 'Locked' : 'Open';
    button.setAttribute('aria-label', 'December ' + day + ', ' + label.textContent);
    button.append(number, label);
    button.addEventListener('click', () => openDoor(day));
    return button;
  });
  doors.replaceChildren(...buttons);
}

let available = 0;
renderDoors(available);
async function updateCalendar() {
  try {
    const data = await call('/calendar');
    status.textContent = data.year + ' calendar · Opens at midnight (' + data.timeZone + ')';
    if (data.available !== available) {
      available = data.available;
      renderDoors(available);
    }
  } catch (error) {
    status.textContent = error.message;
  }
}
updateCalendar();
if (api) setInterval(updateCalendar, 30000);

document.querySelector('#feedback').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const result = document.querySelector('#feedback-status');
  const fields = Object.fromEntries(new FormData(form));
  button.disabled = true;
  result.textContent = 'Sending…';
  try {
    await call('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    form.elements.message.value = '';
    result.textContent = 'Message sent!';
  } catch (error) {
    result.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
