import { applyHtmlSecurityHeaders } from './_security.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/';
  const res = await context.env.ASSETS.fetch(url);
  const headers = new Headers(res.headers);
  applyHtmlSecurityHeaders(headers, { noStore: false });
  return new Response(res.body, {
    status: 200,
    headers,
  });
}
