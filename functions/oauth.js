export default async function onRequest(context) {
  const { request } = context;
  // Всегда возвращаем JSON с методом, чтобы проверить, что функция вообще вызывается
  return new Response(
    JSON.stringify({ ok: true, method: request.method }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
