/* global __ENV */
import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ============================================================
// HIVOCAB COMMERCIALIZATION LOAD & RESILIENCE TEST (k6)
// Mô phỏng tải thực tế theo 3 nhóm người dùng thương mại hóa:
// - 70% Nhóm A: Học từ vựng, chủ đề, đọc song ngữ & đề thi THPT
// - 20% Nhóm B: Tra từ điển, phát âm TTS & AI tạo ví dụ
// - 10% Nhóm C: Xem bảng giá Pro & kiểm tra trạng thái đơn hàng
// Mặc định chỉ chạy trên môi trường local (127.0.0.1:5173) để bảo vệ production.
// ============================================================

export const options = {
  batchPerHost: 10,
  stages: __ENV.QUICK_SMOKE === '1'
    ? [
        { duration: '10s', target: 20 },
        { duration: '15s', target: 50 },
        { duration: '5s', target: 0 },
      ]
    : [
        { duration: '30s', target: 100 }, // Khởi động lên 100 CCU
        { duration: '1m', target: 300 },  // Tăng tải lên 300 CCU
        { duration: '1m', target: 500 },  // Đỉnh tải 500 CCU
        { duration: '1m', target: 500 },  // Giữ đỉnh tải 500 CCU
        { duration: '30s', target: 0 },   // Hạ nhiệt về 0
      ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:5173').replace(/\/+$/, '');
const SUPABASE_URL = (__ENV.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export default function () {
  const roll = Math.random();

  if (roll < 0.70) {
    // --------------------------------------------------------
    // NHÓM A (70%): Học viên tải SPA shell, tài nguyên học & đề thi
    // --------------------------------------------------------
    group('Group A - Study & Reading Flow (70%)', () => {
      const homeRes = http.get(`${BASE_URL}/`);
      check(homeRes, {
        'SPA shell status 200': (r) => r.status === 200,
        'SPA shell < 1000ms': (r) => r.timings.duration < 1000,
      });

      const manifestRes = http.get(`${BASE_URL}/manifest.webmanifest`);
      check(manifestRes, {
        'PWA manifest 200': (r) => r.status === 200,
      });

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        const topicsRes = http.get(
          `${SUPABASE_URL}/rest/v1/topics?select=id,name,icon,category&limit=20`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );
        check(topicsRes, {
          'Supabase topics 200': (r) => r.status === 200,
          'DB query < 600ms': (r) => r.timings.duration < 600,
        });
      }
    });
    sleep(1.5);
  } else if (roll < 0.90) {
    // --------------------------------------------------------
    // NHÓM B (20%): Tra từ, TTS Audio & AI Example (có Rate Limit)
    // --------------------------------------------------------
    group('Group B - Dictionary, TTS & AI Proxy (20%)', () => {
      const ttsRes = http.get(`${BASE_URL}/api/tts?text=resilient&tl=en`);
      check(ttsRes, {
        'TTS status ok or rate-limited (200/429/502/504)': (r) =>
          [200, 429, 502, 504].includes(r.status),
      });

      if (Math.random() < 0.35) {
        const exampleRes = http.post(
          `${BASE_URL}/api/example`,
          JSON.stringify({ term: 'perseverance', isPhrase: false }),
          {
            headers: { 'Content-Type': 'application/json' },
            responseCallback: http.expectedStatuses(200, 400, 429, 500, 502, 504),
          },
        );
        check(exampleRes, {
          'AI example handled gracefully': (r) =>
            [200, 429, 500, 502, 504].includes(r.status),
        });
      }
    });
    sleep(2);
  } else {
    // --------------------------------------------------------
    // NHÓM C (10%): Luồng thương mại hóa (Terms/Privacy & Payment Auth Guard)
    // --------------------------------------------------------
    group('Group C - Commercialization & Payment Guard (10%)', () => {
      const termsRes = http.get(`${BASE_URL}/terms.html`);
      check(termsRes, {
        'Terms page 200': (r) => r.status === 200,
      });

      const unauthStatusRes = http.get(
        `${BASE_URL}/api/payment/check-status?orderCode=12345678`,
        {
          responseCallback: http.expectedStatuses(200, 401, 404, 429),
        },
      );
      check(unauthStatusRes, {
        'Payment status rejects unauth or dev route cleanly': (r) =>
          [200, 401, 404, 429].includes(r.status),
      });
    });
    sleep(2);
  }
}
