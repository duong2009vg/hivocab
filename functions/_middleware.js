// Apply security headers consistently on Cloudflare Pages, including routes
// served by Functions where dashboard-level headers may override _headers.
export async function onRequest(context) {
  const response = await context.next();

  // Never clone or wrap a WebSocket 101 Switching Protocols response;
  // doing so strips response.webSocket and breaks the handshake.
  if (
    response.status === 101 ||
    response.webSocket ||
    context.request.headers.get('Upgrade')?.toLowerCase() === 'websocket'
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/') && !headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
