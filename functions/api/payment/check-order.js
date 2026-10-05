// functions/api/payment/check-order.js
// Cloudflare Pages Function alias: GET /api/payment/check-order?orderCode=123456
// Đảm bảo tương thích ngược 100% cho mọi client gọi check-order hoặc check-status

export { onRequest, onRequestGet, onRequestOptions } from './check-status.js';
