import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// HIVOCAB LOAD TEST SCRIPT (k6)
// Mô phỏng học viên truy cập web và học từ vựng đồng thời
// ============================================================

// 1. Cấu hình kịch bản test (Tăng dần số lượng Virtual Users - VUs)
export const options = {
    batchPerHost: 10,
    stages: [
        { duration: '30s', target: 100 },  // Khởi động: tăng lên 100 người dùng trong 30s
        { duration: '1m',  target: 300 },  // Tăng tốc: lên 300 người dùng trong 1 phút
        { duration: '1m',  target: 500 },  // Đỉnh điểm: đạt 500 người dùng đồng thời (500 CCU)
        { duration: '1m',  target: 500 },  // Giữ tải nặng: 500 người dùng học liên tục trong 1 phút
        { duration: '30s', target: 0 },    // Hạ nhiệt: giảm dần về 0
    ],
    thresholds: {
        // 95% request phải phản hồi dưới 2 giây dưới tải 500 CCU
        http_req_duration: ['p(95)<2000'],
        // Tỷ lệ lỗi mạng/server 5xx phải dưới 5%
        http_req_failed: ['rate<0.05'],
    },
};

// Sử dụng domain chính thức có Cloudflare
const BASE_URL = 'https://hivocab.site'; 
const SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

export default function () {
    // --------------------------------------------------------
    // KỊCH BẢN 1: Học viên truy cập web (Vercel CDN + Cloudflare)
    // --------------------------------------------------------
    const homeRes = http.get(BASE_URL);
    check(homeRes, {
        'Home status 200': (r) => r.status === 200,
        'Home load nhanh (<1s)': (r) => r.timings.duration < 1000,
    });

    // Nghỉ 1-2 giây giống người dùng thật đọc màn hình
    sleep(1.5);

    // --------------------------------------------------------
    // KỊCH BẢN 2: Lấy danh sách Topic từ Supabase (Test Database 500 CCU)
    // --------------------------------------------------------
    const topicsRes = http.get(
        `${SUPABASE_URL}/rest/v1/topics?select=id,name,icon,category&limit=20`,
        {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
        }
    );

    check(topicsRes, {
        'Supabase topics 200': (r) => r.status === 200,
        'DB query nhanh (<600ms)': (r) => r.timings.duration < 600,
    });

    sleep(2);

    // --------------------------------------------------------
    // KỊCH BẢN 3: Gọi AI (Mô phỏng thực tế: ~10% học viên cần gợi ý AI)
    // --------------------------------------------------------
    if (Math.random() < 0.10) {
        const examplePayload = JSON.stringify({
            term: 'perseverance',
            isPhrase: false,
        });

        const exampleRes = http.post(`${BASE_URL}/api/example`, examplePayload, {
            headers: { 'Content-Type': 'application/json' },
        });

        check(exampleRes, {
            'API example ok (200 hoặc 429)': (r) => r.status === 200 || r.status === 429,
        });
    }

    // Nghỉ 3-5 giây trước câu tiếp theo của Virtual User
    sleep(3);
}
