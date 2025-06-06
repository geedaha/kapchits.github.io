export async function onRequestPost({ request, env }) {
  // Читаем тело POST-запроса как JSON
  const body = await request.json();
  const code = body.code;

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Missing code parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Обмениваем code на access_token у GitHub
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
