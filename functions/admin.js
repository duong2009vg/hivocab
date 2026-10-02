export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/';
  const res = await context.env.ASSETS.fetch(url);
  return new Response(res.body, {
    status: 200,
    headers: res.headers,
  });
}
