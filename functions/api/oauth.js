export async function onRequestPost({ request, env }) {
  // Читаем JSON-тело
  const { code } = await request.json().catch(() => ({}));
  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Missing code parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Обмениваем code → access_token
  const gh = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await gh.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Базовый ответ на GET (чтобы /api/oauth в браузере не давал 404)
export async function onRequestGet() {
  return new Response('Use POST', { status: 405 });
}
