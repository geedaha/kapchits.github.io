import { URL } from 'url'

/** Константа куда GitHub пришлёт пользователя после авторизации */
const CALLBACK_PATH = '/api/oauth';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // ───────── ШАГ 1: ещё нет code ─ redirect на GitHub ─────────
  if (!code) {
    const githubAuth = new URL('https://github.com/login/oauth/authorize');
    githubAuth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubAuth.searchParams.set('scope', 'repo');
    githubAuth.searchParams.set(
      'redirect_uri',
      url.origin + CALLBACK_PATH
    );
    // 302 → GitHub
    return Response.redirect(githubAuth.toString(), 302);
  }

  // ───────── ШАГ 2: GitHub вернул code ─ меняем на token ─────────
  const tokenRes = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    }
  );

  const { access_token } = await tokenRes.json();

  // Небольшая страничка, которая передаёт токен в окно-родитель
  const html = 
    <script>
      window.opener.postMessage(
        { token: '' },
        '*'
      );
      window.close();
    </script>
  ;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

/** Запрос fetchAccessToken из CMS (если понадобится) */
export async function onRequestPost({ request, env }) {
  const { code } = await request.json();
  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Missing code' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const gh = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
