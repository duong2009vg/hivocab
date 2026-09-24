-- ============================================================
-- HIVOCAB: NÂNG QUYỀN ADMIN CHO CÁC TÀI KHOẢN QUẢN TRỊ
-- Dự án: swehdtrqjyklmsefkjdf
-- ============================================================

-- 1. Cập nhật role = 'admin' trong bảng public.profiles
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) IN ('bach97847@gmail.com', 'mitthoi60@gmail.com');

-- 2. Đồng bộ phòng ngừa từ auth.users nếu cần
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE lower(email) IN ('bach97847@gmail.com', 'mitthoi60@gmail.com')
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 3. Xác minh kết quả phân quyền
SELECT id, email, role, tier, subscription_status, created_at
FROM public.profiles
WHERE lower(email) IN ('bach97847@gmail.com', 'mitthoi60@gmail.com', 'mitthoi604@gmail.com');
