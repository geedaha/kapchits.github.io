import { json } from 'itty-router-extras'
import fetch from 'node-fetch'

export async function onRequestPost({ request, env }) {
  // Читаем JSON из тела POST-запроса
  const { code } = await request.json()

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'Missing code parameter' }),
      { status: 400 }
    )
  }

  // Делаем POST на GitHub, чтобы обменять code -> access_token
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
  })

  const data = await response.json()
  // Возвращаем клиенту JSON с { access_token, scope, token_type }
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}
