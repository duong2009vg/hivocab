import React, { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useRoute } from '../../router/RouteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { supabase } from '../../lib/supabaseClient.js';

export function PageProfile() {
  const { user, signOut } = useAuth();
  const { navigateTo } = useRoute();
  const { showToast } = useToast ? useToast() : { showToast: (msg) => window.showHiToast?.(msg, 'info') };

  const [fullName, setFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [streakCount, setStreakCount] = useState(2);
  const [vocabCount, setVocabCount] = useState(81);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState({ text: '', isError: false });

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', isError: false });
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setFullName(name);
      setUserEmail(user.email || '');
      if (user.created_at) {
        const d = new Date(user.created_at);
        setCreatedAt(`Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`);
      }
    }
  }, [user]);

  // Load stats preferences
  useEffect(() => {
    try {
      const localStreak = localStorage.getItem('hivocab_streak');
      if (localStreak) setStreakCount(parseInt(localStreak, 10));
      const localVocab = localStorage.getItem('hivocab_total_words');
      if (localVocab) setVocabCount(parseInt(localVocab, 10));
    } catch (_) {}
  }, []);

  // Update Name
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameMsg({ text: 'Vui lòng nhập họ và tên!', isError: true });
      return;
    }

    setIsSavingName(true);
    setNameMsg({ text: '', isError: false });

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (error) throw error;

      // Also try updating profiles table if available
      if (user?.id) {
        supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', user.id)
          .then(() => {})
          .catch(() => {});
      }

      setNameMsg({ text: 'Cập nhật họ tên thành công! 🌿', isError: false });
      if (showToast) showToast('Đã lưu tên hiển thị mới! 🎉', 'success');
    } catch (err) {
      setNameMsg({ text: err.message || 'Lỗi khi cập nhật họ tên.', isError: true });
    } finally {
      setIsSavingName(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPwMsg({ text: 'Mật khẩu phải có ít nhất 6 ký tự!', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'Mật khẩu xác nhận không trùng khớp!', isError: true });
      return;
    }

    setIsSubmittingPw(true);
    setPwMsg({ text: '', isError: false });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPwMsg({ text: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới nhé. 🔒', isError: false });
      setNewPassword('');
      setConfirmPassword('');
      if (showToast) showToast('Đổi mật khẩu thành công! ✅', 'success');
    } catch (err) {
      setPwMsg({ text: err.message || 'Có lỗi xảy ra, vui lòng thử lại.', isError: true });
    } finally {
      setIsSubmittingPw(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản HiVocab?')) {
      setIsLoggingOut(true);
      try {
        await signOut();
        if (showToast) showToast('Đã đăng xuất tài khoản thành công! 👋', 'info');
        navigateTo('landing');
      } catch (err) {
        alert('Lỗi đăng xuất: ' + (err.message || 'Vui lòng thử lại'));
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <div id="page-profile" className="page active min-h-screen bg-[#FBF8F1] text-[#302A24] selection:bg-[#C85A3F] selection:text-white">
      <main className="lg:pl-72 min-h-screen pt-4 pb-28 lg:pb-12 px-4 sm:px-6 lg:px-10 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6 fade-in">
          
          {/* Breadcrumbs & Header Bar */}
          <header className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-[#302A24] hover:bg-[#EFE7DA] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                  <span>Về trang chủ</span>
                </button>
                <span className="text-[#786F66]">/</span>
                <span className="text-[#786F66]">Tài khoản</span>
                <span className="text-[#786F66]">/</span>
                <span className="text-[#C85A3F] font-black">Hồ sơ cá nhân</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.openBugReportModal?.()}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white text-[#302A24] rounded-xl border border-[#3D352E] shadow-[2px_2px_0px_#3D352E] hover:bg-[#EFE7DA] transition-all flex items-center gap-1.5"
                >
                  <span>⭐</span>
                  <span>Góp ý</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-12 h-12 bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center text-2xl font-bold">
                🐱
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#302A24] font-heading tracking-tight">
                    Hồ sơ học viên
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold text-[#4D6B53] bg-[#E3EDE2] rounded-md border border-[#4D6B53]/40">
                    BÀN HỌC TẬP
                  </span>
                </div>
                <p className="text-xs text-[#786F66] font-medium mt-0.5">
                  Quản lý thông tin học tập, mật khẩu và an toàn tài khoản HiVocab của bạn.
                </p>
              </div>
            </div>
          </header>

          {/* Hero Profile Card */}
          <section className="bg-gradient-to-r from-white via-white to-[#FDF8F3] border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FDE8DF] rounded-full blur-2xl opacity-60 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              
              {/* Avatar Pill */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFE8C2] border-2 border-[#3D352E] shadow-[3px_3px_0px_#3D352E] flex items-center justify-center text-4xl sm:text-5xl font-black">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-full h-full rounded-3xl object-cover"
                    />
                  ) : (
                    '🐱'
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs" title="Đang trực tuyến"></span>
                <span className="absolute -top-2 -left-2 text-xl select-none">✨</span>
              </div>

              {/* Info Block */}
              <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#302A24] font-heading truncate">
                      {fullName || userEmail.split('@')[0] || 'Bạn học HiVocab'}
                    </h2>
                    <p className="text-xs font-semibold text-[#786F66] truncate mt-0.5">
                      {userEmail || 'Chưa liên kết email'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#C85A3F] bg-[#FBECE7] px-3 py-1.5 rounded-full border border-[#C85A3F]/40 shadow-xs">
                      <span>🔥</span>
                      <span>{streakCount} ngày giữ lửa</span>
                    </span>
                    <span className="px-2.5 py-1 text-xs font-bold bg-[#EFE7DA] text-[#302A24] rounded-full border border-[#3D352E]">
                      Học viên cốt cán
                    </span>
                  </div>
                </div>

                {/* Mascot Coach Note */}
                <div className="p-3 bg-[#FFFBF3] border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] rounded-2xl flex items-center gap-3 text-left mt-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEE8D6] border-2 border-[#3D352E] flex items-center justify-center text-lg shrink-0">
                    🐯
                  </div>
                  <div className="text-xs text-[#302A24] leading-relaxed">
                    <span className="font-bold text-[#C85A3F]">Bé Hổ đồng hành:</span> "Cố gắng duy trì việc ôn từ vựng 15 phút mỗi ngày cùng mình nhé! 🐾"
                  </div>
                </div>

                {/* Badges Strip */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs font-bold text-[#786F66]">
                  <span className="bg-[#FAF7F0] border border-[#3D352E] px-3 py-1 rounded-xl flex items-center gap-1.5">
                    📖 {vocabCount} từ trong sổ
                  </span>
                  <span className="bg-[#FAF7F0] border border-[#3D352E] px-3 py-1 rounded-xl flex items-center gap-1.5">
                    🌟 Huy hiệu: Bé Siêng Năng
                  </span>
                  {createdAt && (
                    <span className="bg-[#FAF7F0] border border-[#3D352E] px-3 py-1 rounded-xl flex items-center gap-1.5">
                      🌿 Tham gia: {createdAt}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: User Info Form */}
            <section className="bg-white border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b-2 border-dashed border-[#E2D9CC] mb-4">
                  <span className="text-xl">✏️</span>
                  <h3 className="font-bold text-base text-[#302A24] font-heading">
                    Thông tin hiển thị
                  </h3>
                </div>

                <form onSubmit={handleSaveName} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#302A24] mb-1.5">
                      Họ và tên của bạn:
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên..."
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#4D6B53] font-bold text-[#302A24]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#302A24] mb-1.5">
                      Địa chỉ Email đăng nhập:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#FAF7F0] rounded-2xl border-2 border-[#3D352E]/40 font-bold text-[#786F66] cursor-not-allowed"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs">🔒</span>
                    </div>
                    <span className="text-[10px] text-[#786F66] mt-1 block font-medium">
                      Email dùng để đồng bộ tiến độ học và xác thực tài khoản an toàn.
                    </span>
                  </div>

                  {nameMsg.text && (
                    <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border-2 ${
                      nameMsg.isError
                        ? 'bg-[#FBECE7] text-[#C85A3F] border-[#C85A3F]'
                        : 'bg-[#E3EDE2] text-[#4D6B53] border-[#4D6B53]'
                    }`}>
                      <span>{nameMsg.isError ? '⚠️' : '✅'}</span>
                      <span>{nameMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="w-full py-2.5 px-4 text-xs sm:text-sm font-heading font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all active:translate-y-0.5 disabled:opacity-50"
                  >
                    <span>{isSavingName ? 'Đang lưu...' : 'Lưu họ và tên 💾'}</span>
                  </button>
                </form>
              </div>
            </section>

            {/* Card 2: Password Form */}
            <section className="bg-white border-2 border-[#3D352E] shadow-[3px_4px_0px_#3D352E] rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b-2 border-dashed border-[#E2D9CC] mb-4">
                  <span className="text-xl">🔑</span>
                  <h3 className="font-bold text-base text-[#302A24] font-heading">
                    Đổi mật khẩu tài khoản
                  </h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#302A24] mb-1.5">
                      Mật khẩu mới (tối thiểu 6 ký tự):
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#4D6B53] font-bold text-[#302A24]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#302A24] mb-1.5">
                      Nhập lại mật khẩu mới:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] focus:outline-none focus:ring-2 focus:ring-[#4D6B53] font-bold text-[#302A24]"
                    />
                  </div>

                  {pwMsg.text && (
                    <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border-2 ${
                      pwMsg.isError
                        ? 'bg-[#FBECE7] text-[#C85A3F] border-[#C85A3F]'
                        : 'bg-[#E3EDE2] text-[#4D6B53] border-[#4D6B53]'
                    }`}>
                      <span>{pwMsg.isError ? '⚠️' : '✅'}</span>
                      <span>{pwMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingPw}
                    className="w-full py-2.5 px-4 text-xs sm:text-sm font-heading font-bold text-white bg-[#4D6B53] hover:bg-[#3D5642] rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] flex items-center justify-center gap-2 transition-all active:translate-y-0.5 disabled:opacity-50"
                  >
                    <span>{isSubmittingPw ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới 🔒'}</span>
                  </button>
                </form>
              </div>
            </section>

            {/* Card 3: Danger Zone / Log out */}
            <section className="bg-[#FFF9F7] border-2 border-[#C85A3F] shadow-[3px_4px_0px_#3D352E] rounded-3xl p-6 md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#FBECE7] border-2 border-[#C85A3F] text-[#C85A3F] flex items-center justify-center text-2xl font-bold shrink-0 shadow-xs">
                  🚪
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#302A24] font-heading">
                    Đăng xuất khỏi tài khoản
                  </h4>
                  <p className="text-xs text-[#786F66] mt-0.5 font-medium">
                    Toàn bộ từ vựng và chuỗi ngày giữ lửa của bạn đã được sao lưu an toàn trên đám mây.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#C85A3F] hover:bg-[#B34D34] text-white font-heading font-bold text-xs sm:text-sm rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] transition-all active:translate-y-0.5 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <span>{isLoggingOut ? 'Đang xử lý...' : 'Đăng xuất tài khoản'}</span>
                <span>➔</span>
              </button>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

export default PageProfile;
