// Cloudflare Pages Function: POST /api/oauth
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const code = body.code;
  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Missing code parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const gh = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
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

// Чтобы GET /api/oauth подсказать, что нужен POST
export async function onRequestGet() {
  return new Response('Use POST', { status: 405 });
}
