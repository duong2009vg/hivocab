# Hi Vocabulary Clipper

Extension Manifest V3 cho Chrome. Bôi đen một từ/cụm từ trên trang web, bấm nút `Hi`, xem nghĩa Việt + ví dụ, chọn topic rồi thêm vào app.

## Cài đặt

1. Mở `chrome://extensions`.
2. Bật `Developer mode`.
3. Chọn `Load unpacked` và chọn thư mục `chrome-extension`.
4. Mở app Hi - Master Vocabulary trong một tab và đăng nhập.
5. Tải lại trang sau khi cài extension.

Extension tìm tab app theo title `Hi - Master Vocabulary`, nên title trong `index.html` phải giữ nguyên.

## Luồng dữ liệu

- Free Dictionary API lấy IPA, định nghĩa tiếng Anh và ví dụ nếu có.
- Groq proxy hiện tại của app tạo nghĩa Việt ngắn và ví dụ fallback.
- Khi bấm thêm, extension gửi yêu cầu sang tab app; app gọi `HiDB.addWord`, vì vậy Supabase RLS và session hiện tại vẫn được giữ nguyên.
