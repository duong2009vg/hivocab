// pricing.js — HiVocab Pricing Modal & PayOS Embedded Checkout Module
// Hỗ trợ chọn gói cước và nhúng giao diện thanh toán VietQR chính thức của PayOS

(function() {
    'use strict';

    let currentSelectedPlan = 'pro_6m';
    let pollingInterval = null;
    let currentOrderCode = null;

    const PLANS = {
        pro_1m: {
            id: 'pro_1m',
            name: 'Gói 1 Tháng',
            badge: 'Trải Nghiệm',
            badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            priceFormatted: '29.000đ',
            monthlyEquivalent: '29.000đ / tháng',
            savings: 'Giá siêu rẻ',
            amount: 29000,
            durationDays: 30,
        },
        pro_6m: {
            id: 'pro_6m',
            name: 'Gói 6 Tháng',
            badge: '⭐ Phổ Biến Nhất',
            badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
            priceFormatted: '149.000đ',
            monthlyEquivalent: '~24.800đ / tháng',
            savings: 'Đúng chuẩn 25k/tháng',
            amount: 149000,
            durationDays: 180,
            recommended: true,
        },
        pro_1y: {
            id: 'pro_1y',
            name: 'Gói 1 Năm',
            badge: '🔥 Tiết Kiệm Nhất',
            badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            priceFormatted: '249.000đ',
            monthlyEquivalent: '~20.700đ / tháng',
            savings: 'Tiết kiệm hơn 40%',
            amount: 249000,
            durationDays: 365,
        },
        pro_lifetime: {
            id: 'pro_lifetime',
            name: 'Gói Trọn Đời',
            badge: '👑 Vĩnh Viễn',
            badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
            priceFormatted: '499.000đ',
            monthlyEquivalent: 'Mua 1 lần dùng mãi mãi',
            savings: 'Không gia hạn thêm',
            amount: 499000,
            durationDays: 36500,
        },
    };

    /**
     * Tạo hoặc lấy container Modal Bảng giá
     */
    function getOrCreateModal() {
        let modal = document.getElementById('hivocab-pricing-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'hivocab-pricing-modal';
            modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
            modal.innerHTML = `
                <div class="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-3xl bg-white/95 dark:bg-[#16181f]/95 border border-white/60 dark:border-white/10 shadow-2xl p-5 sm:p-8 flex flex-col transition-all transform scale-95" id="pricing-modal-card">
                    <!-- Close button -->
                    <button onclick="window.closePricingModal()" class="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10" aria-label="Đóng">
                        <span class="material-symbols-outlined text-xl">close</span>
                    </button>

                    <!-- View 1: Pricing Table Selection -->
                    <div id="pricing-view-selection" class="space-y-6">
                        <!-- Header -->
                        <div class="text-center space-y-2 pr-8 sm:pr-0">
                            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                <span class="material-symbols-outlined text-[15px]">diamond</span>
                                <span>HiVocab PRO Membership</span>
                            </div>
                            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Bứt Phá Điểm Số &amp; Làm Chủ Từ Vựng
                            </h2>
                            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                                Mở khóa toàn bộ kho tài liệu IELTS Cambridge, Destination C1-C2, SAT và tính năng học Spaced Repetition không giới hạn.
                            </p>
                        </div>

                        <!-- Pricing Cards Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2" id="pricing-cards-grid">
                            <!-- Injected dynamically via JS -->
                        </div>

                        <!-- Feature Comparison List -->
                        <div class="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 space-y-3">
                            <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Quyền lợi độc quyền của thành viên PRO:
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span class="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                    <span>Mở khóa toàn bộ <strong>IELTS CAM (10-21)</strong> song ngữ</span>
                                </div>
                                <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span class="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                    <span>Kho sách <strong>Destination C1-C2 &amp; SAT 3500</strong></span>
                                </div>
                                <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span class="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                    <span>Luyện tập <strong>Spaced Repetition không giới hạn</strong></span>
                                </div>
                                <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <span class="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                    <span>Đồng bộ 100% với <strong>Chrome Extension</strong> tra từ</span>
                                </div>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <div class="pt-1 flex flex-col items-center gap-2">
                            <button id="btn-proceed-payment" onclick="window.startPayOSCheckout()" class="w-full sm:w-auto min-w-[280px] py-3.5 px-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer">
                                <span class="material-symbols-outlined text-xl">qr_code_scanner</span>
                                <span>Thanh toán VietQR Ngay</span>
                            </button>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                                Thanh toán tức thì qua App Ngân hàng (VietQR / Napas 247). Tự động kích hoạt sau 3 giây.
                            </p>
                        </div>
                    </div>

                    <!-- View 2: PayOS Embedded Checkout Container -->
                    <div id="pricing-view-checkout" class="hidden space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                            <div class="flex items-center gap-2">
                                <button onclick="window.backToPricingSelection()" class="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors">
                                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                                </button>
                                <div>
                                    <h3 class="text-base font-bold text-slate-900 dark:text-white" id="checkout-plan-title">Thanh toán Gói Pro</h3>
                                    <p class="text-xs text-slate-500 dark:text-slate-400" id="checkout-plan-amount">Số tiền: ...</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Đang chờ chuyển khoản</span>
                            </div>
                        </div>

                        <!-- PayOS Embedded / VietQR Target Container -->
                        <div id="payos-embedded-container" class="w-full min-h-[420px] rounded-2xl overflow-hidden bg-slate-50 dark:bg-black/20 flex items-center justify-center">
                            <div class="text-center py-12 space-y-3 text-slate-500 dark:text-slate-400 text-xs">
                                <span class="material-symbols-outlined text-3xl animate-spin text-amber-500">sync</span>
                                <p>Đang khởi tạo mã VietQR từ PayOS...</p>
                            </div>
                        </div>
                    </div>

                    <!-- View 3: Payment Success Screen -->
                    <div id="pricing-view-success" class="hidden text-center py-8 space-y-5">
                        <div class="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                            <span class="material-symbols-outlined text-5xl">verified</span>
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                Nâng Cấp PRO Thành Công! 🎉
                            </h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto" id="success-desc-text">
                                Cảm ơn bạn đã đồng hành cùng HiVocab. Toàn bộ tính năng cao cấp đã được mở khóa ngay bây giờ!
                            </p>
                        </div>
                        <div class="pt-2">
                            <button onclick="window.finishProUpgrade()" class="py-3 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer">
                                Bắt đầu học ngay 🚀
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        return modal;
    }

    /**
     * Render các thẻ chọn gói cước
     */
    function renderPricingCards() {
        const grid = document.getElementById('pricing-cards-grid');
        if (!grid) return;

        grid.innerHTML = Object.values(PLANS).map(plan => {
            const isSelected = plan.id === currentSelectedPlan;
            const borderClass = isSelected
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/[0.04]'
                : 'border-slate-200/80 dark:border-white/10 hover:border-amber-500/50 bg-white/50 dark:bg-white/[0.02]';

            return `
                <div onclick="window.selectPlan('${plan.id}')" class="relative rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer ${borderClass}">
                    ${plan.badge ? `
                        <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${plan.badgeColor} whitespace-nowrap">
                            ${plan.badge}
                        </div>
                    ` : ''}

                    <div class="space-y-2 text-center pt-1">
                        <div class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">${plan.name}</div>
                        <div class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">${plan.priceFormatted}</div>
                        <div class="text-[11px] font-semibold text-amber-600 dark:text-amber-400">${plan.monthlyEquivalent}</div>
                    </div>

                    <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 text-center">
                        <span class="text-[10px] font-medium text-slate-500 dark:text-slate-400">${plan.savings}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Mở modal bảng giá
     */
    window.openPricingModal = async function(initialPlanId) {
        // Kiểm tra xem đã đăng nhập chưa
        if (window.HiDB && typeof window.HiDB.getCurrentUser === 'function') {
            const user = await window.HiDB.getCurrentUser();
            if (!user) {
                if (confirm('Vui lòng đăng nhập tài khoản để nâng cấp gói PRO!')) {
                    if (typeof window.navigateTo === 'function') {
                        window.navigateTo('login');
                    }
                }
                return;
            }
        }

        if (initialPlanId && PLANS[initialPlanId]) {
            currentSelectedPlan = initialPlanId;
        }

        const modal = getOrCreateModal();
        renderPricingCards();
        window.backToPricingSelection();

        modal.classList.remove('opacity-0', 'pointer-events-none');
        const card = document.getElementById('pricing-modal-card');
        if (card) {
            card.classList.remove('scale-95');
            card.classList.add('scale-100');
        }
    };

    /**
     * Đóng modal
     */
    window.closePricingModal = function() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        const modal = document.getElementById('hivocab-pricing-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'pointer-events-none');
            const card = document.getElementById('pricing-modal-card');
            if (card) {
                card.classList.remove('scale-100');
                card.classList.add('scale-95');
            }
        }
    };

    /**
     * Chọn gói cước
     */
    window.selectPlan = function(planId) {
        if (PLANS[planId]) {
            currentSelectedPlan = planId;
            renderPricingCards();
        }
    };

    /**
     * Quay lại màn hình chọn gói
     */
    window.backToPricingSelection = function() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        document.getElementById('pricing-view-selection')?.classList.remove('hidden');
        document.getElementById('pricing-view-checkout')?.classList.add('hidden');
        document.getElementById('pricing-view-success')?.classList.add('hidden');
    };

    /**
     * Bắt đầu tạo đơn hàng và hiển thị PayOS Embedded Form
     */
    window.startPayOSCheckout = async function() {
        const btn = document.getElementById('btn-proceed-payment');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-lg animate-spin">sync</span><span>Đang kết nối PayOS...</span>';
        }

        try {
            // Lấy token đăng nhập
            let token = '';
            if (window.HiDB && window.HiDB.getClient) {
                const { data: { session } } = await window.HiDB.getClient().auth.getSession();
                token = session?.access_token || '';
            }

            if (!token) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                window.closePricingModal();
                window.navigateTo && window.navigateTo('login');
                return;
            }

            // Gọi API tạo đơn hàng
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ planId: currentSelectedPlan }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Không thể khởi tạo thanh toán với PayOS.');
            }

            currentOrderCode = data.orderCode;

            // Chuyển sang View Checkout
            document.getElementById('pricing-view-selection')?.classList.add('hidden');
            document.getElementById('pricing-view-checkout')?.classList.remove('hidden');

            const plan = PLANS[currentSelectedPlan];
            const titleEl = document.getElementById('checkout-plan-title');
            if (titleEl) titleEl.textContent = `Thanh toán ${plan.name}`;
            const amountEl = document.getElementById('checkout-plan-amount');
            if (amountEl) amountEl.textContent = `Số tiền: ${plan.priceFormatted}`;
            const fallbackEl = document.getElementById('fallback-content');
            if (fallbackEl) fallbackEl.textContent = data.description || `HV${data.orderCode}`;

            // Hiển thị trực tiếp mã VietQR và thông tin chuyển khoản chính xác 100%
            const container = document.getElementById('payos-embedded-container');
            if (!container) return;
            const accNum = data.accountNumber || '0846407898';
            const accName = data.accountName || 'DANG TUNG DUONG';
            const desc = data.description || `HV${data.orderCode}`;
            const qrImgUrl = `https://img.vietqr.io/image/KLB-${accNum}-compact2.png?amount=${plan.amount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(accName)}`;

            container.innerHTML = `
                <div class="w-full flex flex-col md:flex-row items-center justify-center gap-6 p-4 sm:p-6 bg-white dark:bg-[#1f222e] rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10">
                    <!-- Left: VietQR Code -->
                    <div class="flex flex-col items-center gap-2.5 shrink-0">
                        <div class="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center">
                            <img src="${qrImgUrl}" alt="Mã VietQR thanh toán" class="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl" loading="eager" />
                        </div>
                        <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <span class="material-symbols-outlined text-[15px] text-emerald-500">verified</span>
                            <span>Mã VietQR tự động khớp tiền &amp; nội dung</span>
                        </div>
                    </div>

                    <!-- Right: Bank transfer info & copy buttons -->
                    <div class="flex-1 w-full max-w-sm space-y-3 text-left">
                        <div class="p-3.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200/70 dark:border-white/10 space-y-2.5 text-xs">
                            <div class="flex items-center justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
                                <span class="font-bold text-slate-800 dark:text-slate-100">KienlongBank (KLB)</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="font-mono font-bold text-slate-900 dark:text-white text-sm">${accNum}</span>
                                    <button type="button" onclick="window.copyText('${accNum}', 'btn-c-acc')" id="btn-c-acc" class="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-colors cursor-pointer">Chép</button>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                                <span class="font-bold text-slate-800 dark:text-slate-100">${accName}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-slate-500 dark:text-slate-400">Số tiền:</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm">${plan.priceFormatted}</span>
                                    <button type="button" onclick="window.copyText('${plan.amount}', 'btn-c-amt')" id="btn-c-amt" class="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-colors cursor-pointer">Chép</button>
                                </div>
                            </div>
                            <div class="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                                <span class="text-amber-800 dark:text-amber-300 font-bold">Nội dung CK:</span>
                                <div class="flex items-center gap-1.5">
                                    <span class="font-mono font-black text-amber-900 dark:text-amber-200 text-sm">${desc}</span>
                                    <button type="button" onclick="window.copyText('${desc}', 'btn-c-desc')" id="btn-c-desc" class="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700 transition-colors shadow-xs cursor-pointer">Chép</button>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <span>Tự động kích hoạt PRO sau 3 giây khi nhận tiền!</span>
                        </div>

                        <div class="pt-1 text-center">
                            <a href="${data.checkoutUrl}" target="_blank" rel="noopener noreferrer" 
                               class="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-primary hover:underline transition-colors">
                                <span>Mở trang thanh toán PayOS trong tab mới</span>
                                <span class="material-symbols-outlined text-xs">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;

            // Bật Polling kiểm tra trạng thái mỗi 2.5 giây
            startPollingOrderStatus(data.orderCode);

        } catch (err) {
            console.error('[startPayOSCheckout Error]', err);
            alert('Lỗi tạo đơn hàng: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-xl">qr_code_scanner</span><span>Thanh toán VietQR Ngay</span>';
            }
        }
    };

    /**
     * Polling kiểm tra trạng thái đơn hàng
     */
    function startPollingOrderStatus(orderCode) {
        if (pollingInterval) clearInterval(pollingInterval);

        pollingInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/payment/check-status?orderCode=${orderCode}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.status === 'PAID') {
                        clearInterval(pollingInterval);
                        pollingInterval = null;
                        handlePaymentSuccess();
                    }
                }
            } catch (_) {}
        }, 3000);
    }

    /**
     * Xử lý khi thanh toán thành công
     */
    function handlePaymentSuccess() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // Ẩn view checkout, hiện view success
        document.getElementById('pricing-view-checkout')?.classList.add('hidden');
        document.getElementById('pricing-view-success')?.classList.remove('hidden');

        // Phát âm thanh chúc mừng nếu có soundEngine
        if (window.HiSound && typeof window.HiSound.playSuccess === 'function') {
            window.HiSound.playSuccess();
        }

        // Xóa cache profile để lấy quyền PRO mới
        if (window.HiDB && typeof window.HiDB.getUserProfile === 'function') {
            window.HiDB.getUserProfile(true);
        }
    }

    /**
     * Kết thúc nâng cấp và cập nhật giao diện
     */
    window.finishProUpgrade = function() {
        window.closePricingModal();
        window.location.reload();
    };

    /**
     * Copy text helper với visual feedback
     */
    window.copyText = function(text, btnId) {
        if (!text) return;
        navigator.clipboard.writeText(String(text)).then(() => {
            const btn = document.getElementById(btnId);
            if (btn) {
                const orig = btn.innerHTML;
                btn.textContent = 'Đã chép ✓';
                btn.classList.add('bg-emerald-500', 'text-white');
                setTimeout(() => {
                    btn.innerHTML = orig;
                    btn.classList.remove('bg-emerald-500', 'text-white');
                }, 1800);
            }
        }).catch(() => {
            // Fallback
            prompt('Sao chép thông tin:', text);
        });
    };

})();
