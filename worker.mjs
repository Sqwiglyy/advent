const year = 2026;
const timeZone = 'Europe/London';
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone, year: 'numeric', month: 'numeric', day: 'numeric'
});

export function unlockedThrough(now) {
  const parts = Object.fromEntries(dateFormat.formatToParts(now).map(({ type, value }) => [type, Number(value)]));
  if (parts.year > year) return 24;
  if (parts.year < year || parts.month < 12) return 0;
  return Math.min(parts.day, 24);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    const reply = (value, status = 200) => Response.json(value, { status, headers });
    if (!env.SITE_ORIGIN || origin !== env.SITE_ORIGIN) {
      return reply({ error: 'Site origin is not allowed.' }, 403);
    }
    headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      return new Response(null, { status: 204, headers });
    }

    const path = new URL(request.url).pathname;
    const available = unlockedThrough(new Date());
    if (request.method === 'GET' && path === '/calendar') {
      return reply({ year, timeZone, available });
    }

    const door = /^\/door\/([1-9]|1[0-9]|2[0-4])$/.exec(path);
    if (request.method === 'GET' && door) {
      const day = Number(door[1]);
      if (day > available) return reply({ error: 'This door is still locked.' }, 403);
      let id;
      try {
        id = JSON.parse(env.VIDEO_IDS || '{}')[day];
      } catch {
        return reply({ error: 'The video schedule is unavailable.' }, 503);
      }
      if (typeof id !== 'string' || !/^[\w-]{11}$/.test(id)) {
        return reply({ error: 'There’s no video set for this day yet.' }, 404);
      }
      return reply({ id });
    }

    if (request.method === 'POST' && path === '/feedback') {
      if (!env.FEEDBACK_CODE || !env.DISCORD_WEBHOOK_URL) {
        return reply({ error: 'Feedback is waiting to be connected.' }, 503);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return reply({ error: 'Invalid message.' }, 400);
      }
      if (body?.code !== env.FEEDBACK_CODE) return reply({ error: 'Check your feedback code.' }, 403);
      const content = typeof body.message === 'string' ? body.message.trim() : '';
      if (!content || content.length > 1000) return reply({ error: 'Enter 1–1,000 characters.' }, 400);
      try {
        const webhook = new URL(env.DISCORD_WEBHOOK_URL);
        webhook.searchParams.set('wait', 'true');
        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, allowed_mentions: { parse: [] } })
        });
        if (response.ok) return reply({ sent: true });
      } catch {
        // Keep upstream errors and credentials out of browser responses.
      }
      return reply({ error: 'Discord could not confirm delivery. Try again shortly.' }, 502);
    }

    return reply({ error: 'Page not found.' }, 404);
  }
};
