export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  /* ─── Шаг 1: редирект на GitHub ─── */
  if (!code) {
    const gh = new URL("https://github.com/login/oauth/authorize");
    gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    gh.searchParams.set("scope", "repo");
    gh.searchParams.set("redirect_uri", url.origin + "/api/oauth");
    return Response.redirect(gh.toString(), 302);
  }

  /* ─── Шаг 2: обмен code → token ─── */
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token } = await res.json();

  /* Страничка, передающая токен родительскому окну */
  const html = `<!doctype html>
<html><body>
<script>
  window.opener.postMessage({ token: "${access_token}" }, "*");
  window.close();
</script>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

/* Запасной путь: POST /api/oauth */
export async function onRequestPost({ request, env }) {
  const { code } = await request.json().catch(() => ({}));
  if (!code) {
    return new Response(
      JSON.stringify({ error: "Missing code" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const gh = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await gh.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
