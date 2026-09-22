# Báo cáo QA cuối trước phát hành — HiVocab

**Ngày kiểm thử:** 22/09/2026  
**Môi trường:** `https://hivocab.site` production  
**Phạm vi:** Landing page, tài khoản PRO được cung cấp, dashboard, Chủ đề, bài đọc song ngữ, bài tập đục lỗ, Sổ từ, Tra từ, Thư viện, Luyện đề, Cài đặt, Privacy/Terms và một số kiểm tra HTTP/static asset.

## Kết luận phát hành

**NO-GO tạm thời cho phát hành thương mại.** Các luồng học chính của tài khoản PRO hoạt động tốt, nhưng còn các lỗi ảnh hưởng trực tiếp đến khả năng đăng nhập từ deep-link, liên hệ hỗ trợ/pháp lý và SEO.

## Lỗi cần sửa trước khi phát hành

| ID | Mức độ | Phát hiện | Bằng chứng / tác động | Khuyến nghị |
|---|---|---|---|---|
| QA-01 | **P1 — Cao** | Deep-link đăng nhập không mở form đăng nhập | Truy cập trực tiếp `/login` hoặc `/#login` khi chưa đăng nhập trả về landing page; form chỉ xuất hiện khi đi qua thao tác “Đăng nhập/Đăng ký” trong footer. Người dùng mở bookmark/link đăng nhập có thể không đăng nhập được. | Xử lý route `/login` về `/#login` và bảo đảm bootstrap SPA gọi `navigateTo('login')` khi hash là `login`. Thêm test hard-refresh cho `/login`, `/#login`. |
| QA-02 | **P1 — Cao** | Email hỗ trợ trong legal không nhất quán và mailto bị lỗi | Footer dùng `support@hivocab.site`, trong Privacy/Terms lại dùng `support@hivocab.com`; một liên kết Terms có `mailto:%3C!--email_off--%3E...`, không phải mailto hợp lệ. Đây là rủi ro mất liên hệ hỗ trợ và giảm độ tin cậy pháp lý. | Chọn một email chính thức, đồng bộ toàn website/legal, kiểm tra `href="mailto:..."` thực tế sau Cloudflare email obfuscation. |
| QA-03 | **P2 — Trung bình** | `sitemap.xml` không phải XML | `/robots.txt` trỏ tới `https://hivocab.site/sitemap.xml`, nhưng endpoint trả `text/html` và toàn bộ HTML landing page. | Tạo sitemap XML hợp lệ với `Content-Type: application/xml` và chỉ chứa URL canonical cần index. |
| QA-04 | **P2 — Trung bình** | Asset `/tom-and-jerry.jpg` trả HTML | URL trả HTTP 200 nhưng `Content-Type: text/html`, không phải ảnh JPEG. Nếu modal quà tặng hiển thị, hình sẽ hỏng. | Upload/khôi phục ảnh đúng MIME `image/jpeg` hoặc bỏ tham chiếu asset không dùng. |
| QA-05 | **P2 — Trung bình** | Chưa bật HSTS | HTTPS hoạt động và HTTP trả 301, nhưng response HTTPS không có `Strict-Transport-Security`. | Sau khi xác nhận toàn bộ subdomain đã dùng HTTPS, bật HSTS với thời hạn phù hợp. |
| QA-06 | **P3 — Thấp** | Một số input thiếu nhãn liên kết theo accessibility | AX tree chỉ nhận diện generic “text field” cho auth email/password và một số ô tìm kiếm; HTML có label nhưng thiếu `for`/`aria-label` tương ứng. | Gắn `for` với `id` hoặc thêm accessible name; kiểm tra lại bằng screen reader/axe. |

## Các luồng đã PASS

- Đăng nhập email/password bằng tài khoản PRO thành công; hiển thị đúng tên tài khoản và badge **PRO**.
- Dashboard tải dữ liệu SRS, số từ cần ôn và lịch học.
- Chủ đề tải đầy đủ các nhóm; IELTS Vol 1 hiển thị 10 test, 30 bài đọc và 4.863 từ.
- Bài đọc song ngữ tải đủ nội dung; chuyển chế độ Song ngữ/English hoạt động.
- Bài tập đục lỗ tải được 40 câu; không gửi đáp án để tránh làm thay đổi tiến độ tài khoản.
- Sổ từ tải dữ liệu; tìm kiếm `grain` trả đúng 1 kết quả và có thể xóa bộ lọc.
- Tra từ `serendipity` trả nghĩa tiếng Việt và các nút phát âm/lưu từ.
- Thư viện tải dữ liệu; tìm kiếm `Destination` lọc đúng bộ từ liên quan.
- Luyện đề tải **38 đề**; tìm kiếm `Hà Nội` trả **3 đề**.
- Privacy và Terms đều mở HTTP 200, có nội dung và liên kết qua lại.
- API tạo đơn hàng không có token trả HTTP 401 — kiểm tra auth gate cơ bản đạt.

## Chưa thực hiện

- Không thực hiện thanh toán thật, không tạo order, không kiểm tra webhook/refund PayOS.
- Không gửi đáp án bài học, không tạo/xóa từ, không đổi mật khẩu, không thay đổi dữ liệu học.
- Chưa kiểm tra đầy đủ trên Chrome/Edge/Safari thật và các viewport mobile/tablet/desktop độc lập.
- Chưa kiểm tra Google OAuth, email verification, reset password và email notification end-to-end.

## Ưu tiên xử lý

1. Sửa QA-01 và QA-02, sau đó retest hard-refresh/login/link legal.
2. Sửa QA-03 và QA-04 để tránh lỗi index/hiển thị asset.
3. Bật HSTS và hoàn thiện accessible labels.
4. Chạy một vòng UAT thanh toán bằng sandbox hoặc giao dịch kiểm thử có hoàn tiền, rồi mới sign-off thương mại.

**Trạng thái sau kiểm thử:** tài khoản PRO đã được đăng xuất; không có thao tác thanh toán hay thay đổi dữ liệu học được gửi.

## Đánh giá cấu trúc và hiệu năng

### Cấu trúc hiện tại

Website **chưa thật sự gọn**, nhưng chưa cần viết lại toàn bộ ngay trước phát hành. Repo đang dùng song song:

- SPA ESM trong `src/` với router/component/service nhỏ.
- Nhiều script legacy ở thư mục gốc như `app.js`, `dataLayer.js`, `thptExam.js`, `sessionUI.js`, `library.js`, `bilingualReading.js`, `pricing.js`.
- `vite.config.js` phải copy thủ công các script legacy và re-inject chúng vào `dist/index.html`.
- HTML lớn chứa gần như toàn bộ page/modal markup; `index.html` khoảng 193 KB, `admin.html` khoảng 370 KB.
- CSS bị phân tán giữa `src/styles`, `public/themes.css` và `css/hivocab.min.css`; service worker còn precache cả hai stylesheet.
- Repo có khoảng 578 file và dữ liệu đề thi `public/data/thpt_exams.json` khoảng 6,2 MB.
- `package.json` chưa có script test/lint/type-check tự động.

Đây là dấu hiệu của kiến trúc chuyển tiếp. Nó vẫn vận hành được, nhưng mỗi lần sửa route/auth/modal có rủi ro ảnh hưởng script khác hoặc thứ tự tải.

### Đo nhanh production

- HTML landing: khoảng 341 KB raw, khoảng 60–61 KB truyền qua Brotli.
- TTFB đo từ nhiều lần request: khoảng 0,31–1,12 giây; tổng request landing khoảng 0,41–1,24 giây.
- Các script/CSS/font first-party được tham chiếu ban đầu cộng lại khoảng 1,4 MB compressed; riêng Material Symbols font khoảng 1,13 MB.
- `app.js` khoảng 260 KB raw / 53 KB Brotli; `themes.css` khoảng 152 KB raw / 108 KB Brotli.
- `thpt_exams.json` khoảng 6,18 MB raw / khoảng 0,95 MB Brotli; request riêng mất khoảng 1,2–1,56 giây.
- Cloudflare đang nén Brotli tốt, nhưng landing đang báo `cf-cache-status: DYNAMIC`; HTML không được edge-cache lâu.

**Đánh giá:** tốc độ hiện tại **chấp nhận được trên desktop/mạng nhanh**, nhưng **chưa tối ưu cho lần truy cập đầu trên mobile/3G/4G yếu**. Service worker giúp các lần truy cập sau nhanh hơn, nhưng không giải quyết tải lần đầu.

### Khuyến nghị refactor

1. Trước launch: sửa các blocker QA-01/02/03, không rewrite toàn bộ.
2. Sau launch: chọn một entry architecture; chuyển dần logic đang dùng trong các script gốc vào `src/`, rồi bỏ cơ chế copy/re-inject legacy của Vite.
3. Lazy-load module theo route; landing không nên tải logic luyện đề, thư viện, thanh toán và session cùng lúc.
4. Chia `thpt_exams.json` theo đề/năm hoặc tải qua API khi mở trang Luyện đề.
5. Thay font Material Symbols full bằng subset cần dùng hoặc SVG/icon component; xóa file âm thanh trùng tên/nội dung.
6. Thêm `npm run lint`, test router/auth và smoke E2E cho login, dashboard, payment gate và các route chính; đặt performance budget cho HTML/JS/CSS/font.

**Kết luận hiệu năng:** chưa cần tối ưu khẩn cấp ở tầng server, nhưng nên tối ưu payload và lazy-loading trước khi chạy marketing lớn hoặc mở rộng người dùng.
