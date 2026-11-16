import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  Flame,
  RotateCcw,
  GraduationCap,
  Target,
  Flag,
  BookOpen,
  BookOpenText,
  ArrowRight,
  ArrowUpRight,
  Search,
  Plus,
  Bell,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Mic,
  FolderOpen,
  Volume2,
  BookmarkPlus,
  Shuffle,
  X,
  CheckCircle2,
  Circle,
  ListChecks,
  Lightbulb,
} from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboardStats.js';
import { useRoute } from '../../router/RouteContext.jsx';
import { useAuth } from '../../providers/AuthProvider.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { getWordsDueForReview } from '../../services/db.js';
import { IeltsGoalModal, getIeltsVocabStandard } from '../modals/IeltsGoalModal.jsx';

const DAILY_WORDS_POOL = [
  {
    word: 'embellish',
    ipa: '/ɪmˈbel.ɪʃ/',
    pos: 'động từ',
    level: 'C1 Academic',
    meaning: 'Trang trí, tô điểm hoặc thêm chi tiết để làm câu chuyện / sự vật hấp dẫn hơn.',
    example: '"He couldn\'t resist embellishing the story of his mountain adventure."',
  },
  {
    word: 'ubiquitous',
    ipa: '/juːˈbɪk.wɪ.təs/',
    pos: 'tính từ',
    level: 'IELTS 7.5+',
    meaning: 'Có mặt ở khắp mọi nơi, phổ biến rộng rãi.',
    example: '"Smartphones have become ubiquitous in modern classrooms."',
  },
  {
    word: 'resilient',
    ipa: '/rɪˈzɪl.jənt/',
    pos: 'tính từ',
    level: 'B2 Upper',
    meaning: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn hoặc biến cố.',
    example: '"Local communities proved remarkably resilient after the storm."',
  },
  {
    word: 'mitigate',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'động từ',
    level: 'C1 Academic',
    meaning: 'Làm dịu bớt, giảm nhẹ mức độ nghiêm trọng của vấn đề hoặc rủi ro.',
    example: '"Planting urban trees helps mitigate the effects of extreme heat."',
  },
  {
    word: 'pragmatic',
    ipa: '/præɡˈmæt.ɪk/',
    pos: 'tính từ',
    level: 'C1 Academic',
    meaning: 'Thực tế, giải quyết vấn đề dựa trên hiệu quả thực tiễn thay vì lý thuyết suông.',
    example: '"We need a pragmatic approach to balance study time and rest."',
  },
  {
    word: 'alleviate',
    ipa: '/əˈliː.vi.eɪt/',
    pos: 'động từ',
    level: 'IELTS 7.0+',
    meaning: 'Làm giảm bớt nỗi đau, áp lực hoặc tình trạng khó khăn.',
    example: '"Clear study schedules can alleviate pre-exam anxiety."',
  },
  {
    word: 'meticulous',
    ipa: '/məˈtɪk.jə.ləs/',
    pos: 'tính từ',
    level: 'C1 Academic',
    meaning: 'Tỉ mỉ, cẩn trọng và chú ý tới từng chi tiết nhỏ.',
    example: '"She kept meticulous notes throughout the semester."',
  },
  {
    word: 'proliferate',
    ipa: '/prəˈlɪf.ər.eɪt/',
    pos: 'động từ',
    level: 'IELTS 8.0+',
    meaning: 'Sinh sôi, phát triển hoặc tăng nhanh về số lượng.',
    example: '"Online learning platforms have proliferated over the past five years."',
  },
  {
    word: 'corroborate',
    ipa: '/kəˈrɒb.ə.reɪt/',
    pos: 'động từ',
    level: 'C1 Academic',
    meaning: 'Xác nhận, củng cố thêm bằng chứng cho một nhận định hay thông tin.',
    example: '"Recent data corroborates the scientist\'s earlier hypothesis."',
  },
  {
    word: 'ambiguous',
    ipa: '/æmˈbɪɡ.ju.əs/',
    pos: 'tính từ',
    level: 'B2–C1',
    meaning: 'Mơ hồ, nước đôi, có thể hiểu theo nhiều nghĩa khác nhau.',
    example: '"The instructions were ambiguous, so students asked for clarification."',
  },
  {
    word: 'ephemeral',
    ipa: '/ɪˈfem.ər.əl/',
    pos: 'tính từ',
    level: 'IELTS 8.0+',
    meaning: 'Chóng tàn, thoáng qua, chỉ tồn tại trong thời gian rất ngắn.',
    example: '"Fame on social media can often be ephemeral."',
  },
  {
    word: 'lucid',
    ipa: '/ˈluː.sɪd/',
    pos: 'tính từ',
    level: 'C1 Academic',
    meaning: 'Sáng sủa, mạch lạc, rõ ràng và rất dễ hiểu.',
    example: '"The teacher gave a lucid explanation of the grammar rule."',
  },
  {
    word: 'scrutinize',
    ipa: '/ˈskruː.tɪ.naɪz/',
    pos: 'động từ',
    level: 'IELTS 7.5+',
    meaning: 'Xem xét kỹ lưỡng, soi xét cẩn thận từng chi tiết.',
    example: '"Examiners scrutinize both vocabulary range and coherence in Writing."',
  },
  {
    word: 'plausible',
    ipa: '/ˈplɔː.zə.bəl/',
    pos: 'tính từ',
    level: 'B2 Upper',
    meaning: 'Hợp lý, có vẻ đáng tin và có khả năng xảy ra.',
    example: '"That sounds like a plausible explanation for the delay."',
  },
  {
    word: 'inevitable',
    ipa: '/ɪnˈev.ɪ.tə.bəl/',
    pos: 'tính từ',
    level: 'B2–C1',
    meaning: 'Không thể tránh khỏi, chắc chắn sẽ xảy ra.',
    example: '"Making mistakes is an inevitable part of mastering a new language."',
  },
  {
    word: 'eloquent',
    ipa: '/ˈel.ə.kwənt/',
    pos: 'tính từ',
    level: 'IELTS 7.5+',
    meaning: 'Hùng biện, diễn đạt lưu loát và đầy sức thuyết phục.',
    example: '"She delivered an eloquent speech at the school assembly."',
  },
];

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function readDailyQuests(dateKey) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { srsManual: false, studio: false, exam: false };
  }
  try {
    const raw = localStorage.getItem(`hivocab_daily_quests_${dateKey}`);
    if (!raw) return { srsManual: false, studio: false, exam: false };
    const parsed = JSON.parse(raw);
    return {
      srsManual: Boolean(parsed?.srsManual),
      studio: Boolean(parsed?.studio),
      exam: Boolean(parsed?.exam),
    };
  } catch {
    return { srsManual: false, studio: false, exam: false };
  }
}

function writeDailyQuests(dateKey, state) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`hivocab_daily_quests_${dateKey}`, JSON.stringify(state));
  } catch {
    /* ignore storage quota errors */
  }
}

/**
 * Computes consistent 4-level heatmap classes (`0`, `1-9`, `10-24`, `25+`) + Today highlight.
 */
function getCalendarDayClass(day, isDesktop = false) {
  const count = Number(day?.count || 0);
  const baseSize = isDesktop
    ? 'h-9 flex items-center justify-center rounded-xl text-xs transition-all cursor-pointer select-none'
    : 'py-1.5 rounded-xl text-xs transition-all cursor-pointer select-none';

  let heatClass = isDesktop
    ? 'bg-gray-50 text-gray-400 border border-transparent hover:border-gray-200'
    : 'bg-[#FAF5EB] border border-[#E3D9C8] text-[#9E8E84] font-semibold';

  if (count >= 25) {
    heatClass = 'bg-[#DE5D53] text-white border border-[#B84138] font-black shadow-xs';
  } else if (count >= 10) {
    heatClass = 'bg-orange-400 text-white border border-orange-500 font-black shadow-2xs';
  } else if (count >= 1) {
    heatClass = isDesktop
      ? 'bg-[#fae3d5] text-[#933D0D] font-black border border-orange-300'
      : 'bg-[#fae3d5] text-[#933D0D] font-bold border-2 border-[#F0783C]';
  }

  if (day?.isToday) {
    if (count === 0) {
      return `${baseSize} bg-[#E6F3FB] border-2 border-blue-600 text-blue-700 font-black shadow-sm`;
    }
    return `${baseSize} ${heatClass} ring-2 ring-blue-600 ring-offset-1`;
  }

  return `${baseSize} ${heatClass}`;
}

function DailyWordCard({
  dailyWord,
  onPlayAudio,
  onRotate,
  onSave,
  onLookup,
  variant = 'desktop',
}) {
  const isMobile = variant === 'mobile';
  const containerClass = isMobile
    ? 'bg-[#FEF9EF] p-4 border-[2.5px] border-[#382E2B] rounded-[26px] shadow-[3px_4px_0px_#382E2B] mb-4'
    : 'dashboard-desktop-card bg-[#fef9ef] rounded-3xl p-6 crayon-border relative';

  return (
    <section className={containerClass}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-black text-warmAmber uppercase tracking-wider flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 shrink-0" />
          <span>Từ vựng hôm nay</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#D8CBB8] text-[#4E4138]">
            {dailyWord.level}
          </span>
          <button
            type="button"
            onClick={onRotate}
            title="Đổi từ vựng khác"
            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white hover:bg-amber-50 border border-[#382E2B]/30 text-[#382E2B] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            <span>Đổi từ</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xl font-black text-crayonText font-quicksand tracking-tight">
            {dailyWord.word}
          </h4>
          <button
            type="button"
            onClick={() => onPlayAudio(dailyWord.word)}
            aria-label={`Nghe phát âm từ ${dailyWord.word}`}
            className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 border-2 border-[#382E2B] flex items-center justify-center text-crayonText transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs font-bold text-softMuted">
          {dailyWord.ipa} • <span className="italic font-normal">{dailyWord.pos}</span>
        </p>
        <p className="text-sm font-bold text-crayonText pt-1 leading-snug">{dailyWord.meaning}</p>
        <div className="p-2.5 rounded-xl bg-white/80 border border-dashed border-amber-300 text-xs italic text-softMuted mt-2">
          {dailyWord.example}
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave(dailyWord)}
          className="flex-1 py-2 px-3 rounded-xl bg-[#DE5D53] hover:bg-[#C84F45] text-white text-xs font-extrabold border-2 border-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Lưu vào Sổ từ</span>
        </button>
        <button
          type="button"
          onClick={() => onLookup(dailyWord.word)}
          className="py-2 px-3 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#382E2B] text-xs font-extrabold border-2 border-[#382E2B] shadow-[1.5px_2px_0px_#382E2B] active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Tra chi tiết</span>
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </section>
  );
}

function QuickHubSection({ items, onSelectItem, variant = 'desktop' }) {
  const isMobile = variant === 'mobile';

  return (
    <section
      className={
        isMobile
          ? 'mb-4'
          : 'dashboard-desktop-card bg-white rounded-3xl p-5 lg:p-6 crayon-border shadow-crayonSm space-y-3.5'
      }
    >
      <div className="flex items-center justify-between mb-2.5 lg:mb-0">
        <div>
          <h3 className="text-base lg:text-lg font-black text-crayonText font-quicksand flex items-center gap-2">
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-terracotta shrink-0" />
            <span>Học nhanh hôm nay</span>
          </h3>
          {!isMobile && (
            <p className="text-xs text-softMuted">
              Truy cập ngay 4 không gian rèn luyện trọng tâm của HiVocab
            </p>
          )}
        </div>
        <span className="text-[11px] font-extrabold text-[#6A5A50] bg-[#FAF5EB] px-2.5 py-1 rounded-full border border-[#DECDBB]">
          4 kỹ năng
        </span>
      </div>

      <div className={isMobile ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 xl:grid-cols-4 gap-3'}>
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem(item)}
              className={`group text-left rounded-2xl border-2 border-[#382E2B] ${item.bgClass} p-3.5 shadow-[2px_3px_0px_#382E2B] hover:-translate-y-0.5 active:translate-y-0 transition-all flex flex-col justify-between gap-2.5 cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <span
                  className={`w-9 h-9 rounded-xl ${item.iconBoxClass} border-2 border-[#382E2B] flex items-center justify-center shrink-0`}
                >
                  <IconComponent className="w-4.5 h-4.5" />
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.badgeClass} whitespace-nowrap`}
                >
                  {item.badge}
                </span>
              </div>
              <div>
                <div className="text-sm font-black text-[#382E2B] leading-tight group-hover:underline decoration-2 underline-offset-2">
                  {item.title}
                </div>
                <div className="text-[11px] font-semibold text-[#6A5A50] mt-0.5 leading-snug">
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DailyQuestsCard({ quests, completedCount, onToggle, onAction, variant = 'desktop' }) {
  const isMobile = variant === 'mobile';
  const progressPct = Math.round((completedCount / quests.length) * 100);

  return (
    <section
      className={
        isMobile
          ? 'bg-[#FFFDF7] p-4 border-[2.5px] border-[#382E2B] rounded-[26px] shadow-[3px_4px_0px_#382E2B] mb-4 space-y-3'
          : 'dashboard-desktop-card bg-white rounded-3xl p-5 sm:p-6 crayon-border shadow-crayonSm space-y-3.5'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks className="w-5 h-5 text-sage shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-black text-crayonText font-quicksand truncate">
              Nhiệm vụ hôm nay
            </h3>
            <p className="text-[11px] text-softMuted truncate">
              Duy trì nhịp học đều đặn mỗi ngày
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-black px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${
            completedCount === quests.length
              ? 'bg-[#EEF5EC] text-[#4B6540] border-[#86A378]'
              : 'bg-[#FAF5EB] text-[#382E2B] border-[#DECDBB]'
          }`}
        >
          {completedCount}/{quests.length} xong
        </span>
      </div>

      <div className="w-full bg-[#F1EBD9] rounded-full h-2.5 p-0.5 border border-[#382E2B]">
        <div
          className="bg-sage h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-2">
        {quests.map((q) => (
          <div
            key={q.id}
            className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border-2 transition-colors ${
              q.done
                ? 'bg-[#F2F7F0] border-[#9BB88F]'
                : 'bg-[#FAF5EB]/80 border-[#E3D9C6] hover:border-[#CBBBA0]'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(q.id)}
              aria-label={`Đánh dấu hoàn thành: ${q.label}`}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
            >
              {q.done ? (
                <CheckCircle2 className="w-5 h-5 text-[#4B6540] shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#9E8E84] shrink-0" />
              )}
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold leading-snug ${
                    q.done ? 'line-through text-[#6A7E62]' : 'text-[#382E2B]'
                  }`}
                >
                  {q.label}
                </div>
                <div className="text-[11px] font-semibold text-[#7A6B62]">{q.progressText}</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onAction(q)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black border shrink-0 transition-all cursor-pointer ${
                q.done
                  ? 'bg-white border-[#9BB88F] text-[#4B6540] hover:bg-[#EEF5EC]'
                  : 'bg-[#382E2B] border-[#382E2B] text-white hover:bg-[#2A2220]'
              }`}
            >
              {q.ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PageDashboard() {
  const { navigateTo } = useRoute();
  const { user, profile } = useAuth();
  const { openModal } = useModal();
  const {
    stats,
    heroState,
    countdown,
    calendar = {},
    ieltsGoal,
    prevMonth,
    nextMonth,
    showDayDetail,
    refresh,
  } = useDashboardStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [isIeltsModalOpen, setIsIeltsModalOpen] = useState(false);
  const [dailyWordOffset, setDailyWordOffset] = useState(0);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [bellSeen, setBellSeen] = useState(false);
  const bellRef = useRef(null);

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [questState, setQuestState] = useState(() => readDailyQuests(todayKey));

  // Sync Daily Word rotation deterministically by day of year + user cycle offset
  const baseDailyIndex = useMemo(() => getDayOfYear() % DAILY_WORDS_POOL.length, []);
  const dailyWord = DAILY_WORDS_POOL[(baseDailyIndex + dailyWordOffset) % DAILY_WORDS_POOL.length];

  const handleRotateDailyWord = useCallback(() => {
    setDailyWordOffset((prev) => (prev + 1) % DAILY_WORDS_POOL.length);
  }, []);

  const handleLookupWord = useCallback(
    (rawWord) => {
      const term = String(rawWord || '').trim();
      if (!term) return;
      if (typeof window !== 'undefined') {
        window._pendingDictionaryQuery = term;
        window.dispatchEvent(new CustomEvent('hivocab:dict-lookup', { detail: { word: term } }));
      }
      navigateTo('dictionary');
    },
    [navigateTo]
  );

  const handleSaveDailyWord = useCallback(
    (wordObj) => {
      if (!user) {
        openModal('requireLogin', {
          title: 'Đăng nhập để lưu từ vựng 🐾',
          message:
            'Bạn cần đăng nhập để lưu từ vựng vào sổ tay cá nhân và ôn tập theo thuật toán lặp lại ngắt quãng (SRS)!',
          actionName: 'Lưu từ vào sổ tay',
        });
        return;
      }
      openModal('saveWordToTopic', {
        wordData: {
          word: wordObj.word,
          phonetic: wordObj.ipa,
          pos: wordObj.pos,
          meaning: wordObj.meaning,
          example: wordObj.example,
        },
      });
    },
    [user, openModal]
  );

  const handlePlayAudio = (word) => {
    if (typeof window !== 'undefined' && window.HiAudio?.playWord) {
      window.HiAudio.playWord(word, 0.9);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleStartReview = useCallback(async () => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để ôn tập',
        message: 'Bạn cần đăng nhập để bắt đầu phiên học và kích hoạt thuật toán lặp lại ngắt quãng (SRS)!',
        actionName: 'Luyện tập ngắt quãng SRS',
      });
      return;
    }
    if (wordsDueCount > 0) {
      openModal('reviewLauncher', { wordsDueCount });
      return;
    }
    try {
      const dueWords = await getWordsDueForReview(1);
      if (dueWords && dueWords.length > 0) {
        openModal('reviewLauncher', { wordsDueCount: dueWords.length });
      } else if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
        window.showHiToast('Hiện không có từ vựng nào đến hạn ôn tập hôm nay.', 'info');
      }
    } catch (err) {
      console.warn('[Dashboard] handleStartReview error:', err);
      openModal('reviewLauncher', { wordsDueCount: 0 });
    }
  }, [user, wordsDueCount, openModal]);

  useEffect(() => {
    window.startSession = handleStartReview;
    return () => {
      delete window.startSession;
    };
  }, [handleStartReview]);

  const { memoryLevels = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 } } = stats;

  const maxLevelCount = Math.max(
    memoryLevels.lv0 || 0,
    memoryLevels.lv1 || 0,
    memoryLevels.lv2 || 0,
    memoryLevels.lv3 || 0,
    memoryLevels.lv4 || 0,
    memoryLevels.lv5 || 0,
    1
  );

  const getBarHeight = (count) => {
    if (!count || count === 0) return '6px';
    return `${Math.max(14, Math.round((count / maxLevelCount) * 100))}%`;
  };

  const handleLevelClick = (lvl) => {
    navigateTo('vocabulary');
    setTimeout(() => {
      if (typeof window !== 'undefined' && typeof window.filterVocabLevel === 'function') {
        window.filterVocabLevel(lvl);
      }
    }, 150);
  };

  const handleOpenIELTSModal = useCallback(() => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để đặt mục tiêu',
        message: 'Bạn cần đăng nhập để thiết lập và lưu lộ trình mục tiêu IELTS cá nhân!',
        actionName: 'Thiết lập mục tiêu IELTS',
      });
      return;
    }
    setIsIeltsModalOpen(true);
  }, [user, openModal]);

  useEffect(() => {
    window.openIELTSGoalModal = handleOpenIELTSModal;
    return () => {
      delete window.openIELTSGoalModal;
    };
  }, [handleOpenIELTSModal]);

  // Close desktop notification popover on outside click
  useEffect(() => {
    if (!isBellOpen) return undefined;
    const onDocClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isBellOpen]);

  const handleOpenAddWord = () => {
    if (!user) {
      openModal('requireLogin', {
        title: 'Đăng nhập để thêm từ',
        message: 'Bạn cần đăng nhập để thêm từ vựng mới vào sổ tay cá nhân của bạn!',
        actionName: 'Thêm từ mới',
      });
      return;
    }
    openModal('addWord');
  };

  const handleOpenBilingual = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window._currentPassageId &&
      window._currentPassageId !== '__unlinked__'
    ) {
      navigateTo('bilingual-reading');
      return;
    }
    if (typeof window !== 'undefined' && typeof window.showHiToast === 'function') {
      window.showHiToast('Chọn một bộ sách CAM / IELTS Reading trong Kho Chủ Đề để mở Đọc Song Ngữ!', 'info');
    }
    navigateTo('topics');
  }, [navigateTo]);

  const quickHubItems = useMemo(
    () => [
      {
        id: 'studio',
        title: 'Shadowing & Dictation',
        subtitle: 'Nghe chép & chấm phát âm AI',
        badge: 'Mới',
        icon: Mic,
        bgClass: 'bg-[#FFF5EE] hover:bg-[#FDEAE0]',
        iconBoxClass: 'bg-[#DE5D53] text-white',
        badgeClass: 'bg-[#DE5D53] text-white border-[#382E2B]',
      },
      {
        id: 'topics',
        title: 'Kho Chủ Đề',
        subtitle: 'CAM, IELTS, THPT theo bài học',
        badge: 'Tủ sách',
        icon: FolderOpen,
        bgClass: 'bg-[#F2F7F0] hover:bg-[#E5EFE1]',
        iconBoxClass: 'bg-[#557A46] text-white',
        badgeClass: 'bg-white text-[#4B6540] border-[#86A378]',
      },
      {
        id: 'exercises',
        title: 'Lộ trình THPT 2026',
        subtitle: '48 đề thi & 29 chuyên đề 9+',
        badge: '3 quyển',
        icon: GraduationCap,
        bgClass: 'bg-[#EEF6FB] hover:bg-[#DFEEF8]',
        iconBoxClass: 'bg-[#2A7BA0] text-white',
        badgeClass: 'bg-white text-[#2A7BA0] border-[#96CBE4]',
      },
      {
        id: 'bilingual',
        title: 'Đọc Song Ngữ',
        subtitle: 'Đọc Anh–Việt & điền từ ngữ cảnh',
        badge: 'IELTS',
        icon: BookOpenText,
        bgClass: 'bg-[#FEF9EC] hover:bg-[#FCF1D4]',
        iconBoxClass: 'bg-[#ECA43B] text-[#382E2B]',
        badgeClass: 'bg-white text-[#935D0B] border-[#E8C57B]',
      },
    ],
    []
  );

  const handleSelectQuickHub = useCallback(
    (item) => {
      if (item.id === 'bilingual') {
        handleOpenBilingual();
      } else {
        navigateTo(item.id);
      }
    },
    [handleOpenBilingual, navigateTo]
  );

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'bạn học';
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);
  const streak = stats.streak || 0;
  const wordsDueCount = stats.wordsDueCount || 0;
  const total =
    stats.totalWordsLearned ??
    stats.totalWordsCount ??
    (memoryLevels.lv0 || 0) +
      (memoryLevels.lv1 || 0) +
      (memoryLevels.lv2 || 0) +
      (memoryLevels.lv3 || 0) +
      (memoryLevels.lv4 || 0) +
      (memoryLevels.lv5 || 0);

  // Calendar logic
  const flatDays = useMemo(
    () => calendar.days || (calendar.weeks ? calendar.weeks.flat().filter((d) => d && d.date) : []),
    [calendar.days, calendar.weeks]
  );
  const startDayIndex =
    calendar.startDayIndex ?? (flatDays[0] ? (new Date(flatDays[0].date).getDay() + 6) % 7 : 0);
  const activeDaysCount = calendar.activeDaysCount || 0;
  const totalWords = calendar.totalWordsLearned || 0;
  const todayStudyCount = useMemo(() => {
    const todayCell = flatDays.find((d) => d?.isToday);
    return Number(todayCell?.count || 0);
  }, [flatDays]);

  // Daily Quests logic
  const dailyQuests = useMemo(() => {
    const srsDone = todayStudyCount >= 10 || Boolean(questState.srsManual);
    const srsProgressText =
      todayStudyCount >= 10
        ? `Đã đạt ${todayStudyCount} từ hôm nay`
        : `${todayStudyCount}/10 từ trong ngày`;

    return [
      {
        id: 'srs',
        label: 'Ôn tập ít nhất 10 từ vựng SRS',
        progressText: srsProgressText,
        done: srsDone,
        ctaLabel: total === 0 ? 'Chọn bài' : wordsDueCount > 0 ? 'Ôn ngay' : 'Học thêm',
      },
      {
        id: 'studio',
        label: 'Luyện Nghe & Nói 1 bài Shadowing',
        progressText: questState.studio ? 'Đã ghi nhận hôm nay' : 'Shadowing & Dictation Studio',
        done: Boolean(questState.studio),
        ctaLabel: 'Mở Studio',
      },
      {
        id: 'exam',
        label: 'Làm 1 đề THPT hoặc Đọc Song Ngữ',
        progressText: questState.exam ? 'Đã ghi nhận hôm nay' : '48 đề thi & 29 chuyên đề 9+',
        done: Boolean(questState.exam),
        ctaLabel: 'Làm ngay',
      },
    ];
  }, [todayStudyCount, questState, total, wordsDueCount]);

  const completedQuestsCount = dailyQuests.filter((q) => q.done).length;

  const updateQuestFlag = useCallback(
    (key, value) => {
      setQuestState((prev) => {
        const next = { ...prev, [key]: value };
        writeDailyQuests(todayKey, next);
        return next;
      });
    },
    [todayKey]
  );

  const handleToggleQuest = useCallback(
    (questId) => {
      if (questId === 'srs') {
        updateQuestFlag('srsManual', !questState.srsManual);
      } else if (questId === 'studio') {
        updateQuestFlag('studio', !questState.studio);
      } else if (questId === 'exam') {
        updateQuestFlag('exam', !questState.exam);
      }
    },
    [questState, updateQuestFlag]
  );

  const handleQuestAction = useCallback(
    (quest) => {
      if (quest.id === 'srs') {
        if (total === 0) {
          navigateTo('topics');
        } else if (wordsDueCount > 0) {
          handleStartReview();
        } else {
          navigateTo('topics');
        }
      } else if (quest.id === 'studio') {
        updateQuestFlag('studio', true);
        navigateTo('studio');
      } else if (quest.id === 'exam') {
        updateQuestFlag('exam', true);
        navigateTo('exercises');
      }
    },
    [total, wordsDueCount, handleStartReview, navigateTo, updateQuestFlag]
  );

  // Motion Mascot State
  const isAngry = wordsDueCount > 100;
  const [mascotPlaying, setMascotPlaying] = useState(true);
  const [mascotPlayKey, setMascotPlayKey] = useState(0);
  const [mascotInteracted, setMascotInteracted] = useState(false);

  useEffect(() => {
    const img1 = new Image();
    img1.src = '/mascot/mascot_waving_static.webp';
    const img2 = new Image();
    img2.src = '/mascot/mascot_angry_static.webp';
  }, []);

  useEffect(() => {
    setMascotPlaying(true);
    const timer = setTimeout(() => {
      setMascotPlaying(false);
      setMascotInteracted(false);
    }, 2050);
    return () => clearTimeout(timer);
  }, [isAngry, mascotPlayKey]);

  const handleMascotClick = useCallback(() => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(25);
      } catch {
        /* ignore */
      }
    }
    setMascotInteracted(true);
    setMascotPlaying(true);
    setMascotPlayKey((k) => k + 1);
  }, []);

  const baseAnim = isAngry ? '/mascot/mascot_angry.webp' : '/mascot/mascot_waving.webp';
  const baseStatic = isAngry ? '/mascot/mascot_angry_static.webp' : '/mascot/mascot_waving_static.webp';
  const mascotSrc = mascotPlaying ? `${baseAnim}?k=${mascotPlayKey}` : baseStatic;

  // Chuẩn từ vựng cốt lõi theo Band IELTS
  const currentBand = ieltsGoal?.overall || '7.0';
  const vocabStandard = getIeltsVocabStandard(currentBand);
  const targetWords = vocabStandard.target;
  const currentWordsLearned = total || stats.totalWordsLearned || 0;
  const ieltsPercent = Math.min(100, Math.round((currentWordsLearned / targetWords) * 100));

  return (
    <div
      id="page-dashboard"
      className="page active min-h-screen text-[#3d352e] font-nunito antialiased bg-[#f7f3eb]"
      style={{
        backgroundImage: 'radial-gradient(#dfd5c4 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* MOBILE LAYOUT */}
      <div className="block lg:hidden w-full">
        <div className="w-full max-w-[430px] min-h-screen flex flex-col px-4 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] relative mx-auto bg-[#FAF5EB] pwa-safe-top">
          {/* Header Section */}
          <section className="mt-1 mb-3 flex items-center justify-between">
            <div className="inline-flex items-center space-x-1.5 bg-[#382E2B] text-[#FFF9F0] py-2 px-3.5 rounded-2xl shadow-sm">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-bold tracking-wide">{streak} Ngày giữ lửa</span>
            </div>
            <button
              aria-label="Tài khoản"
              onClick={() => {
                if (typeof window !== 'undefined' && window.toggleMobileProfileDropdown) {
                  window.toggleMobileProfileDropdown();
                } else {
                  navigateTo('settings');
                }
              }}
              className="w-10 h-10 rounded-2xl border-2 border-[#382E2B] bg-[#FFFBF2] flex items-center justify-center text-[#382E2B] shadow-sm hover:bg-[#FAF5EB] transition-all overflow-hidden"
            >
              {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </section>

          {/* Mobile Quick Dictionary Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookupWord(searchQuery);
            }}
            className="mb-3 flex items-center gap-2 bg-white border-2 border-[#382E2B] rounded-full px-3 py-1.5 shadow-[1.5px_2px_0px_#382E2B]"
          >
            <Search className="w-4 h-4 text-[#7A6B62] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra nhanh từ vựng Tiếng Anh..."
              className="w-full bg-transparent text-xs font-bold text-[#382E2B] placeholder:text-[#9E8E84] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ tìm kiếm"
                className="p-1 text-[#7A6B62] hover:text-[#382E2B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 rounded-full bg-[#382E2B] text-white text-[11px] font-black shrink-0 active:scale-95 transition-transform"
            >
              Tra
            </button>
          </form>

          {/* Mascot Review Hero Card */}
          <section className="mb-5 text-center flex flex-col items-center justify-center relative select-none">
            <div className="my-1.5 relative flex justify-center items-center">
              <img
                key={`mobile-mascot-${isAngry ? 'angry' : 'waving'}-${mascotPlaying ? `anim-${mascotPlayKey}` : 'static'}`}
                src={mascotSrc}
                onClick={handleMascotClick}
                className="w-52 h-52 object-contain select-none transition-transform duration-300 hover:scale-105 active:scale-95 filter drop-shadow-sm cursor-pointer"
                title="Chạm vào bé hổ để tương tác!"
                alt={isAngry ? 'Bé Hổ tức giận' : 'Bé Hổ xin chào'}
              />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h2 className="text-2xl font-bold text-[#382E2B] tracking-tight">
                {mascotInteracted
                  ? isAngry
                    ? 'Bé Hổ đang giận dỗi đó!'
                    : 'Bé Hổ chào bạn nha!'
                  : heroState === 'countdown'
                  ? 'Đã ôn xong hôm nay!'
                  : heroState === 'empty'
                  ? 'Bắt đầu hành trình mới!'
                  : isAngry
                  ? 'Mau ôn tập thôi bạn ơi!'
                  : 'Đến giờ ôn tập rồi bạn ơi!'}
              </h2>
              <p className="text-sm text-[#6A5A50] font-medium leading-relaxed">
                {mascotInteracted ? (
                  isAngry ? (
                    <>
                      Mau củng cố <strong className="text-[#DE5D53] font-bold text-base">{wordsDueCount} từ</strong> ngay để bé hổ hết giận nhé!
                    </>
                  ) : (
                    <>Chúc bạn một ngày học từ vựng thật vui và hiệu quả nhé!</>
                  )
                ) : heroState === 'countdown' ? (
                  <>
                    Lần ôn tiếp theo sau: <strong className="text-[#F0783C] font-bold text-base">{countdown?.hours || '00'}g {countdown?.minutes || '00'}p</strong>
                  </>
                ) : heroState === 'empty' ? (
                  <>Mở <strong>Kho Chủ Đề</strong> để lưu những từ vựng đầu tiên hoặc luyện <strong>Shadowing</strong> ngay!</>
                ) : isAngry ? (
                  <>
                    Có tới <strong className="text-[#DE5D53] font-bold text-base">{wordsDueCount} từ vựng</strong> đang bị dồn lại cần ôn ngay!
                  </>
                ) : (
                  <>
                    Bạn có <strong className="text-[#F0783C] font-bold text-base">{wordsDueCount} từ vựng</strong> đang chờ được củng cố
                  </>
                )}
              </p>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
              {heroState === 'ready' && wordsDueCount > 0 ? (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleStartReview}
                    className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#759864] hover:bg-[#6A8B5A] text-white text-base font-bold rounded-full border-[2.5px] border-[#382E2B] shadow-[2px_3px_0px_#382E2B] transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white shrink-0" />
                    <span>Ôn tập ngay ({wordsDueCount} từ)</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <span className="text-[11px] font-semibold text-[#786F66]">
                    {wordsDueCount > 15
                      ? `Gợi ý phiên nhanh ~5 phút (15/${wordsDueCount} từ)`
                      : `Mất tầm ~${Math.max(1, Math.round(wordsDueCount * 0.35))} phút`}
                  </span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo('topics')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#759864] hover:bg-[#6A8B5A] text-white text-sm font-bold rounded-full border-[2.5px] border-[#382E2B] shadow-[2px_3px_0px_#382E2B] transition-transform active:scale-95"
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span>Học từ mới theo Chủ đề</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('studio')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#FAF5EB] text-[#382E2B] text-sm font-bold rounded-full border-[2.5px] border-[#382E2B] shadow-[2px_3px_0px_#382E2B] transition-transform active:scale-95"
                  >
                    <Mic className="w-4 h-4 text-[#DE5D53] shrink-0" />
                    <span>Luyện Shadowing</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Quick Hub (4 Core Features) */}
          <QuickHubSection items={quickHubItems} onSelectItem={handleSelectQuickHub} variant="mobile" />

          {/* Daily Quests Card */}
          <DailyQuestsCard
            quests={dailyQuests}
            completedCount={completedQuestsCount}
            onToggle={handleToggleQuest}
            onAction={handleQuestAction}
            variant="mobile"
          />

          {/* Daily Word of the Day Card (Mobile) */}
          <DailyWordCard
            dailyWord={dailyWord}
            onPlayAudio={handlePlayAudio}
            onRotate={handleRotateDailyWord}
            onSave={handleSaveDailyWord}
            onLookup={handleLookupWord}
            variant="mobile"
          />

          {/* SRS Analytics Card */}
          <section className="bg-[#FFFDF7] p-4 border-[2.5px] border-[#443833] rounded-[26px] shadow-[3px_4px_0px_#443833] relative overflow-hidden mb-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#DECDBB]">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-[#557A46] shrink-0" />
                <h2 className="text-xl font-bold text-[#382E2B] tracking-wide">Tổng quan SRS</h2>
                <button
                  type="button"
                  onClick={() => openModal('srsExplainer')}
                  aria-label="Tìm hiểu thuật toán SRS"
                  className="w-5 h-5 rounded-full border border-[#86756C] text-[#86756C] hover:bg-[#FAF5EB] hover:text-[#382E2B] text-xs flex items-center justify-center font-bold cursor-pointer transition-colors"
                >
                  ?
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-xs font-bold text-[#382E2B] bg-[#EADDC7] rounded-full border border-dashed border-[#86756C]">
                  {total} từ
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-[#8A796F] uppercase">
                Phân bố từ vựng theo cấp độ
              </span>
              <span
                onClick={() => navigateTo('vocabulary')}
                className="text-xs text-[#DE5D53] font-bold cursor-pointer inline-flex items-center gap-0.5"
              >
                Chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="pt-3 pb-2 flex items-end justify-between px-1 text-center">
              {[0, 1, 2, 3, 4, 5].map((lvl) => {
                const count = memoryLevels[`lv${lvl}`] || 0;
                let bgClass = '',
                  borderClass = '',
                  dims = 'w-4',
                  opacity = 'opacity-70';
                if (lvl === 0) {
                  bgClass = 'bg-[#96A0A8]';
                  opacity = 'opacity-80';
                } else if (lvl === 1) {
                  bgClass = 'bg-[#F0783C]';
                  borderClass = 'border-2 border-[#382E2B]';
                  dims = 'w-5';
                  opacity = '';
                } else if (lvl === 2) {
                  bgClass = 'bg-[#ECA43B]';
                  borderClass = 'border-2 border-[#382E2B]';
                  dims = 'w-5';
                  opacity = '';
                } else if (lvl === 3) {
                  bgClass = 'bg-[#4CA9D6]';
                } else if (lvl === 4) {
                  bgClass = 'bg-[#A682BD]';
                } else if (lvl === 5) {
                  bgClass = 'bg-[#6EB882]';
                }

                return (
                  <div
                    key={lvl}
                    onClick={() => handleLevelClick(lvl)}
                    className="flex flex-col items-center flex-1 cursor-pointer"
                  >
                    <span className="text-sm font-bold text-[#382E2B]">{count}</span>
                    <div className="h-24 flex items-end justify-center w-full py-1">
                      <div
                        className={`${dims} ${bgClass} ${borderClass} rounded-full relative shadow-sm ${opacity} transition-all`}
                        style={{ height: getBarHeight(count) }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#7A6B62] mt-1">Lvl {lvl}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2.5 border-t border-dashed border-[#DECDBB] flex items-center justify-between text-xs text-[#827165]">
              <span className="font-medium">Chu kỳ SRS v4 thông minh</span>
              <span className="bg-[#FDEAE2] text-[#DE5D53] border border-[#F6C6C2] px-2.5 py-0.5 rounded-full font-bold">
                Cần ôn: {wordsDueCount} từ
              </span>
            </div>
          </section>

          {/* Streak Calendar Card */}
          <section className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#E3D9C6]">
              <div className="flex items-center space-x-2">
                <Flame className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-[#382E2B]">Lịch giữ lửa</h3>
                  <p className="text-[11px] text-[#7C6C62]">Mức độ chuyên cần ôn luyện mỗi ngày</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E65F2B] bg-[#FDEAE2] px-2.5 py-1 rounded-full border border-[#F7BFAB]">
                {streak} ngày liên tiếp
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 mb-2 px-2 py-1.5 bg-[#FAF5EB] rounded-2xl border-2 border-[#382E2B]">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Tháng trước"
                className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75"
              >
                ‹
              </button>
              <span className="text-sm font-bold text-[#382E2B]">{calendar.monthYear}</span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Tháng sau"
                className="text-sm font-bold text-[#382E2B] px-2 hover:opacity-75"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-bold text-[#86756C] mt-2 mb-1">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold">
              {Array.from({ length: startDayIndex }).map((_, i) => (
                <span key={`empty-${i}`} className="py-1.5 opacity-0">
                  0
                </span>
              ))}
              {flatDays.map((day, i) => (
                <button
                  key={day.date || i}
                  type="button"
                  onClick={() => showDayDetail(day)}
                  className={getCalendarDayClass(day, false)}
                >
                  {day.day}
                </button>
              ))}
            </div>
            {calendar.hint && (
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#FAF5EB] border border-dashed border-[#CBBBA0] text-xs font-bold text-[#382E2B]">
                {calendar.hint}
              </div>
            )}
            <div className="mt-3 pt-2.5 border-t border-[#F0E8D9] flex flex-wrap items-center justify-between text-[11px] text-[#78685E]">
              <div className="flex items-center space-x-2">
                <span>Mức độ:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FAF5EB] border border-[#D9CDB8]"></span> 0
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fae3d5] border border-orange-300"></span> 1-9
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> 10-24
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DE5D53]"></span> 25+
                </span>
              </div>
            </div>
            <div className="mt-2 flex space-x-2 text-xs">
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">
                Đã học: {activeDaysCount} ngày
              </span>
              <span className="bg-[#FAF5EB] border border-[#D9CDB8] text-[#69574C] px-2.5 py-1 rounded-full font-bold">
                Tổng: {totalWords} từ
              </span>
            </div>
          </section>

          {/* Exam Hall Card */}
          <section className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-4">
            <div className="flex items-start space-x-3">
              <GraduationCap className="w-8 h-8 text-[#2A7BA0] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-[#2A7BA0] bg-[#E1F1FA] px-2.5 py-0.5 rounded-full border border-[#BCE1F5]">
                    PHÒNG THI TRỰC TUYẾN
                  </span>
                  <span className="text-[11px] font-bold text-[#826E5F] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#DED4C3]">
                    38+ Đề chuẩn CBT
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#382E2B] leading-snug">
                  Phòng Luyện Đề THPT Quốc Gia & IELTS
                </h3>
              </div>
            </div>
            <p className="text-xs text-[#6B5A4E] mt-2.5 leading-relaxed">
              Luyện trắc nghiệm tiếng Anh chuẩn cấu trúc đề thi chính thức mới nhất. Bấm giờ 50 phút thực tế, bảng điều hướng tức thì và giải thích chi tiết.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-[#4E4138] font-bold">
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#557A46] shrink-0" />
                <span>Chuẩn ma trận BGD</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#557A46] shrink-0" />
                <span>Bấm giờ tự động</span>
              </div>
            </div>
            <div className="mt-3.5">
              <button
                type="button"
                onClick={() => navigateTo('exercises')}
                className="w-full bg-[#382E2B] hover:bg-[#2A2220] text-white py-2.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2"
              >
                <span>Khám phá lộ trình ngay</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  3 quyển sách <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </section>

          {/* IELTS Goal Card */}
          <section
            onClick={handleOpenIELTSModal}
            className="bg-white border-[3.5px] border-[#382E2B] rounded-[28px] shadow-sm p-4 mb-5 text-center cursor-pointer active:scale-[0.99] transition-transform"
          >
            <Flag className="w-7 h-7 mx-auto mb-1 text-rose-500" />
            <h3 className="text-base font-bold text-[#382E2B]">
              Mục tiêu IELTS {ieltsGoal?.overall || '7.0'}
            </h3>
            <p className="text-xs text-[#6B5A4E] mt-1 max-w-xs mx-auto leading-relaxed">
              {vocabStandard.description}
            </p>
            <div className="mt-3 px-1 space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-bold text-[#382E2B]">
                <span>Từ vựng cốt lõi</span>
                <span className="text-[#DE5D53] font-black">{ieltsPercent}%</span>
              </div>
              <div className="w-full bg-[#f1ebd9] rounded-full h-3 p-0.5 border border-[#382E2B]">
                <div
                  className="bg-[#DE5D53] h-full rounded-full transition-all duration-500"
                  style={{ width: `${ieltsPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-[#7C6C62] font-semibold">
                <span>
                  {currentWordsLearned} / ~{targetWords.toLocaleString()} từ
                </span>
                <span className="text-[#DE5D53] font-bold">
                  {ieltsGoal?.daysLeft > 0
                    ? `Còn ${ieltsGoal.daysLeft} ngày`
                    : ieltsGoal?.examDateText
                    ? `Ngày thi: ${ieltsGoal.examDateText}`
                    : 'Chưa chọn ngày thi'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenIELTSModal();
              }}
              className="mt-3.5 bg-[#FAF5EB] hover:bg-[#F2ECE0] text-[#382E2B] py-2 px-4 rounded-2xl text-xs font-bold border-2 border-[#382E2B] inline-flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Target className="w-4 h-4 text-[#DE5D53]" />
              <span>Tinh chỉnh band điểm mục tiêu</span>
            </button>
          </section>

          <footer className="text-center py-2 mb-4">
            <p className="text-[11px] text-[#8C7B71] font-semibold">
              © 2026 HiVocab · Học từ vựng &amp; luyện thi thông minh
            </p>
          </footer>
        </div>

        {/* Mobile FAB */}
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40">
          <button
            type="button"
            onClick={handleOpenAddWord}
            aria-label="Thêm từ mới"
            className="w-12 h-12 sm:w-14 sm:h-14 p-3 bg-[#DE5D53] hover:bg-[#C84F45] text-white rounded-full border-[3px] border-[#382E2B] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="dashboard-desktop-layout hidden lg:flex flex-1 w-full min-h-screen lg:pl-[var(--sidebar-w,244px)]">
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar */}
          <header className="dashboard-desktop-header px-6 xl:px-8 py-4 border-b-2 border-[#e6dcce] bg-[#FAF5EB] sticky top-0 z-20 shadow-2xs">
            <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-3 xl:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-xl xl:text-2xl font-black text-crayonText font-quicksand truncate">
                    {greeting}, {userName} ơi!
                  </h1>
                </div>
                <p className="text-xs xl:text-sm text-softMuted mt-0.5 truncate">
                  Hôm nay là một ngày tuyệt vời để ghi nhớ thêm những từ vựng mới.
                </p>
              </div>
              <div className="flex items-center gap-2.5 xl:gap-3 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookupWord(searchQuery);
                  }}
                  className="relative w-52 xl:w-64 2xl:w-72"
                >
                  <button
                    type="submit"
                    aria-label="Tra từ vựng"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-softMuted hover:text-crayonText transition-colors cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <input
                    className="w-full pl-9 pr-8 py-2 text-xs xl:text-sm bg-white rounded-full crayon-border focus:ring-2 focus:ring-sage focus:outline-none transition-all placeholder:text-softMuted/70"
                    placeholder="Tra nhanh từ vựng..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Xóa từ khóa"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-softMuted hover:text-crayonText p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                <div className="hidden sm:flex items-center gap-1.5 px-3 xl:px-3.5 py-2 rounded-full bg-orange-100 text-terracotta font-extrabold text-xs xl:text-sm crayon-border shadow-crayonSm whitespace-nowrap shrink-0">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0 inline" />
                  <span>{streak} ngày liên tiếp</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddWord}
                  className="bg-terracotta hover:bg-terracotta-dark text-white font-bold text-xs xl:text-sm px-3.5 xl:px-4 py-2 rounded-full crayon-border shadow-crayonOrange active:translate-y-0.5 transition-all flex items-center gap-1.5 xl:gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Thêm từ mới</span>
                </button>

                <div ref={bellRef} className="relative">
                  <button
                    type="button"
                    aria-label="Nhắc nhở học tập hôm nay"
                    onClick={() => {
                      setIsBellOpen((prev) => !prev);
                      setBellSeen(true);
                    }}
                    className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-white crayon-border flex items-center justify-center text-crayonText hover:bg-cream transition-all relative shrink-0 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    {!bellSeen && (wordsDueCount > 0 || completedQuestsCount < dailyQuests.length) && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-white"></span>
                    )}
                  </button>

                  {isBellOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl p-4 border-2 border-[#382E2B] shadow-[3px_4px_0px_#382E2B] z-30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-dashed border-[#E6DCCE] pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-crayonText">
                          Nhắc nhở hôm nay
                        </span>
                        <span className="text-[11px] font-bold text-sage">
                          {completedQuestsCount}/{dailyQuests.length} nhiệm vụ
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        {wordsDueCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsBellOpen(false);
                              handleStartReview();
                            }}
                            className="w-full text-left p-2.5 rounded-xl bg-[#FEF5EE] hover:bg-[#FDEAE0] border border-[#F3B998] flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-bold text-[#382E2B]">
                              Còn {wordsDueCount} từ SRS đến hạn ôn tập
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-terracotta shrink-0" />
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-[#F2F7F0] border border-[#C6DEC0] text-[#4B6540] font-semibold">
                            Bạn đã hoàn thành hết từ vựng SRS đến hạn!
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsBellOpen(false);
                            navigateTo('studio');
                          }}
                          className="w-full text-left p-2.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F2E9DA] border border-[#E3D9C6] flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-[#382E2B]">
                            Thử ngay Shadowing &amp; Chấm phát âm AI
                          </span>
                          <Mic className="w-3.5 h-3.5 text-[#DE5D53] shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="dashboard-desktop-main p-6 lg:p-7 flex-1">
            <div className="dashboard-desktop-grid max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-7 items-start">
              {/* Left column */}
              <div className="dashboard-desktop-column lg:col-span-7 xl:col-span-8 space-y-6">
                <section className="dashboard-desktop-card dashboard-desktop-hero bg-[#fffdf9] rounded-3xl p-6 lg:p-7 crayon-border shadow-crayon relative overflow-hidden border-2">
                  <div className="relative z-1 flex flex-col md:flex-row items-center gap-5 xl:gap-6 justify-between">
                    <div className="space-y-3.5 flex-1 min-w-0">
                      <h2 className="text-2xl lg:text-3xl font-black text-crayonText font-quicksand leading-tight">
                        {heroState === 'countdown' ? (
                          <>
                            Đã ôn xong hôm nay!
                            <br />
                            <span className="text-sage">
                              Quay lại sau {countdown?.hours || '00'}g {countdown?.minutes || '00'}p.
                            </span>
                          </>
                        ) : heroState === 'empty' ? (
                          <>
                            Chào mừng bạn đến HiVocab!
                            <br />
                            <span className="text-sage">Khám phá bộ từ vựng đầu tiên nào.</span>
                          </>
                        ) : isAngry ? (
                          <>
                            Mau ôn tập thôi bạn ơi!
                            <br />
                            <span className="text-terracotta">{wordsDueCount} từ vựng</span> đang bị dồn lại kìa!
                          </>
                        ) : (
                          <>
                            Đến giờ ôn tập rồi!
                            <br />
                            <span className="text-terracotta">{wordsDueCount} từ vựng</span> đang chờ bạn.
                          </>
                        )}
                      </h2>
                      <div className="bg-cream/80 border-2 border-[#3d352e] rounded-2xl p-3 relative inline-block text-xs xl:text-sm font-semibold text-crayonText">
                        <span className="font-bold text-terracotta">Bé Hổ nhắc:</span>{' '}
                        {mascotInteracted
                          ? isAngry
                            ? '"Grừ! Mau ôn bài thôi, bé hổ đang giận vì còn nhiều từ chưa ôn đó!"'
                            : '"Chào bạn nhé! Cùng bé hổ ôn tập từ vựng thật chăm chỉ nào!"'
                          : heroState === 'countdown'
                          ? '"Tuyệt vời! Bạn đã hoàn thành hết từ SRS hôm nay. Học thêm từ mới hoặc luyện Shadowing nhé!"'
                          : heroState === 'empty'
                          ? '"Hãy mở Kho Chủ Đề để chọn bộ từ yêu thích hoặc thử luyện Shadowing cùng AI nhé!"'
                          : isAngry
                          ? `"Hơn 100 từ tích lũy rồi (${wordsDueCount} từ), mau ôn tập cùng bé hổ ngay nhé!"`
                          : wordsDueCount > 0
                          ? `"Cùng bé hổ hoàn thành ${wordsDueCount} từ hôm nay nhé!"`
                          : '"Hôm nay chưa có từ nào đến hạn, tiếp tục phát huy nhé!"'}
                        <div className="absolute -left-2 top-4 w-3 h-3 bg-cream border-l-2 border-b-2 border-crayonText rotate-45"></div>
                      </div>
                      <div className="pt-1.5 flex flex-wrap items-center gap-3">
                        {heroState === 'ready' && wordsDueCount > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={handleStartReview}
                              className="bg-terracotta hover:bg-terracotta-dark text-white text-sm xl:text-base font-black px-5 xl:px-6 py-2.5 xl:py-3 rounded-2xl crayon-border shadow-crayonOrange active:translate-y-1 transition-all flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Play className="w-4 h-4 fill-white shrink-0" />
                              <span>Ôn tập ngay ({wordsDueCount} từ SRS)</span>
                            </button>
                            <span className="text-xs font-semibold text-softMuted whitespace-nowrap">
                              {wordsDueCount > 15
                                ? `Gợi ý phiên nhanh ~5 phút (15/${wordsDueCount} từ)`
                                : `Mất tầm ~${Math.max(1, Math.round(wordsDueCount * 0.35))} phút`}
                            </span>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => navigateTo('topics')}
                              className="bg-sage hover:bg-sage-dark text-white text-sm xl:text-base font-black px-5 py-2.5 rounded-2xl crayon-border shadow-crayon active:translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <FolderOpen className="w-4 h-4 shrink-0" />
                              <span>Học từ mới theo Chủ đề</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigateTo('studio')}
                              className="bg-white hover:bg-cream text-crayonText text-sm xl:text-base font-black px-4 py-2.5 rounded-2xl crayon-border shadow-crayonSm active:translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Mic className="w-4 h-4 text-terracotta shrink-0" />
                              <span>Luyện Shadowing 5 phút</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className="dashboard-desktop-mascot flex-shrink-0 w-44 h-44 xl:w-52 xl:h-52 relative flex items-center justify-center cursor-pointer group"
                      onClick={handleMascotClick}
                      title="Bấm vào bé hổ để tương tác!"
                    >
                      <div className="absolute inset-0 bg-amber-100/50 rounded-full filter blur-xl transform -rotate-6 transition-all group-hover:scale-110"></div>
                      <img
                        key={`desktop-mascot-${isAngry ? 'angry' : 'waving'}-${mascotPlaying ? `anim-${mascotPlayKey}` : 'static'}`}
                        src={mascotSrc}
                        className="w-full h-full object-contain relative z-1 drop-shadow-sm transition-transform group-hover:scale-105 active:scale-95 duration-300"
                        alt={isAngry ? 'Bé Hổ tức giận' : 'Bé Hổ xin chào'}
                      />
                    </div>
                  </div>
                </section>

                {/* Quick Hub (4 Core Features) */}
                <QuickHubSection items={quickHubItems} onSelectItem={handleSelectQuickHub} variant="desktop" />

                {/* SRS Distribution Card */}
                <section className="dashboard-desktop-card bg-white rounded-3xl p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-crayonText font-quicksand flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-sage shrink-0" />
                        <span>Phân bố từ vựng theo cấp độ SRS</span>
                        <button
                          type="button"
                          onClick={() => openModal('srsExplainer')}
                          aria-label="Tìm hiểu thuật toán SRS"
                          title="Giải thích 6 cấp độ SRS"
                          className="w-5 h-5 rounded-full border border-softMuted text-softMuted hover:bg-cream hover:text-crayonText text-xs flex items-center justify-center font-bold cursor-pointer transition-colors"
                        >
                          ?
                        </button>
                      </h3>
                      <p className="text-xs text-softMuted">
                        Theo dõi mức độ khắc sâu vào trí nhớ dài hạn của bạn
                      </p>
                    </div>
                    <span className="text-xs font-extrabold bg-[#f5ede0] px-3 py-1 rounded-full border border-crayonText/20 whitespace-nowrap shrink-0">
                      Tổng cộng: {total} từ
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3 pt-3">
                    {[0, 1, 2, 3, 4, 5].map((lvl) => {
                      const count = memoryLevels[`lv${lvl}`] || 0;
                      let bg = '',
                        border = '';
                      if (lvl === 0) {
                        bg = 'bg-gray-200';
                        border = 'border border-dashed border-gray-400';
                      } else if (lvl === 1) {
                        bg = 'bg-terracotta';
                        border = 'border-2 border-terracotta';
                      } else if (lvl === 2) {
                        bg = 'bg-warmAmber';
                        border = 'border border-warmAmber';
                      } else if (lvl === 3) {
                        bg = 'bg-softBlue';
                        border = 'border border-dashed border-softBlue';
                      } else if (lvl === 4) {
                        bg = 'bg-softPurple';
                        border = 'border border-dashed border-softPurple';
                      } else if (lvl === 5) {
                        bg = 'bg-sage';
                        border = 'border border-dashed border-sage';
                      }

                      return (
                        <div
                          key={lvl}
                          onClick={() => handleLevelClick(lvl)}
                          className="flex flex-col items-center justify-end h-32 cursor-pointer group"
                        >
                          <div
                            className={`w-full rounded-t-lg ${bg} ${border} transition-all group-hover:opacity-80`}
                            style={{ height: getBarHeight(count) }}
                          ></div>
                          <div className="text-center mt-2">
                            <span className="block text-sm font-black text-crayonText">{count}</span>
                            <span className="block text-[10px] text-softMuted">Lv {lvl}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* THPT Exam Roadmap Card */}
                <section className="dashboard-desktop-card bg-gradient-to-r from-[#eef4ee] to-[#f7eee4] rounded-3xl p-6 crayon-border relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sage text-white text-xs font-extrabold uppercase">
                        HOT
                      </span>
                      <span className="text-xs font-bold text-softMuted">Lộ trình 2026 - 2027</span>
                    </div>
                    <h3 className="text-xl font-black text-crayonText font-quicksand">
                      Lộ trình Ôn Thi THPT Quốc Gia (3 Quyển Sách)
                    </h3>
                    <p className="text-xs text-softMuted max-w-md">
                      Chương trình toàn diện: 38 đề trường/sở, 29 chuyên đề 9+ (kèm lý thuyết trọng tâm &amp; 1.004 câu hỏi thực chiến), và Bộ 10 đề dự đoán ma trận Bộ GD&amp;ĐT.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold text-crayonText">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-sage" /> 3 quyển lộ trình
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-terracotta" /> 48 đề thi &amp; 29 chuyên đề 9+
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('exercises')}
                    className="flex-shrink-0 bg-sage hover:bg-sage-dark text-white font-black text-sm px-5 py-3 rounded-2xl crayon-border shadow-crayon active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Mở lộ trình ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </section>
              </div>

              {/* Right column */}
              <div className="dashboard-desktop-column lg:col-span-5 xl:col-span-4 space-y-6">
                {/* Daily Quests Card */}
                <DailyQuestsCard
                  quests={dailyQuests}
                  completedCount={completedQuestsCount}
                  onToggle={handleToggleQuest}
                  onAction={handleQuestAction}
                  variant="desktop"
                />

                {/* Streak Calendar Card */}
                <section className="dashboard-desktop-card dashboard-desktop-calendar bg-white rounded-3xl p-5 sm:p-6 crayon-border shadow-crayonSm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Flame className="w-6 h-6 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-crayonText font-quicksand truncate">
                          Lịch giữ lửa
                        </h3>
                        <p className="text-[11px] text-softMuted truncate">
                          Mức độ chuyên cần ôn luyện mỗi ngày
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-terracotta bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 whitespace-nowrap shrink-0">
                      {streak} ngày liên tiếp
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[#fbf8f3] rounded-2xl crayon-border text-sm font-bold text-crayonText">
                    <button
                      type="button"
                      onClick={prevMonth}
                      aria-label="Tháng trước"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-quicksand font-extrabold">{calendar.monthYear}</span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      aria-label="Tháng sau"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-softMuted cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-softMuted/80">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                    <span>CN</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-crayonText">
                    {Array.from({ length: startDayIndex }).map((_, i) => (
                      <div key={`empty-d-${i}`}></div>
                    ))}
                    {flatDays.map((day, i) => (
                      <button
                        key={day.date || i}
                        type="button"
                        onClick={() => showDayDetail(day)}
                        title={
                          (day.count || 0) > 0
                            ? `${day.date}: ${day.count} từ đã ôn`
                            : `${day.date}: Chưa có phiên học`
                        }
                        className={getCalendarDayClass(day, true)}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                  {calendar.hint && (
                    <div className="px-3 py-2 rounded-xl bg-[#fbf8f3] border border-dashed border-[#D9CDB8] text-xs font-bold text-crayonText">
                      {calendar.hint}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-softMuted">
                      <span>Mức độ:</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-white"></span>0
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#fae3d5] border border-orange-300"></span>1-9
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>10-24
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#DE5D53]"></span>25+
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">
                        Đã học: <span className="text-terracotta font-black">{activeDaysCount} ngày</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-bold text-crayonText">
                        Tổng: <span className="text-terracotta font-black">{totalWords} từ</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* IELTS Goal Card */}
                <section
                  className="dashboard-desktop-card bg-white rounded-3xl p-6 crayon-border shadow-crayonSm relative overflow-hidden cursor-pointer hover:shadow-crayon transition-all group"
                  onClick={handleOpenIELTSModal}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase text-terracotta tracking-wider">
                        Lộ trình rèn luyện
                      </span>
                      <h3 className="text-lg font-black text-crayonText font-quicksand mt-0.5">
                        Mục tiêu IELTS {ieltsGoal?.overall || '7.0'}
                      </h3>
                      <p className="text-[11px] text-softMuted mt-0.5 font-medium">
                        {vocabStandard.description}
                      </p>
                    </div>
                    <Flag className="w-6 h-6 text-terracotta shrink-0 group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-crayonText">
                      <span>Tiến độ từ vựng cốt lõi</span>
                      <span className="font-black text-terracotta">{ieltsPercent}%</span>
                    </div>
                    <div className="w-full bg-[#f1ebd9] rounded-full h-3.5 p-0.5 border border-crayonText">
                      <div
                        className="bg-terracotta h-2 rounded-full transition-all duration-500"
                        style={{ width: `${ieltsPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-softMuted pt-1">
                      <span>
                        Đã đạt <strong>{currentWordsLearned}</strong> / ~{targetWords.toLocaleString()} từ ({ieltsPercent}%)
                      </span>
                      <span className="font-bold text-terracotta">
                        {ieltsGoal?.daysLeft > 0
                          ? `Còn ${ieltsGoal.daysLeft} ngày`
                          : ieltsGoal?.examDateText
                          ? `Ngày thi: ${ieltsGoal.examDateText}`
                          : 'Chưa chọn ngày thi'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenIELTSModal();
                    }}
                    className="mt-4 w-full py-2.5 text-center text-xs font-black rounded-xl bg-cream hover:bg-[#eadecb] text-crayonText crayon-border transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tinh chỉnh band điểm mục tiêu</span>
                  </button>
                </section>

                {/* Daily Word of the Day Card (Desktop) */}
                <DailyWordCard
                  dailyWord={dailyWord}
                  onPlayAudio={handlePlayAudio}
                  onRotate={handleRotateDailyWord}
                  onSave={handleSaveDailyWord}
                  onLookup={handleLookupWord}
                  variant="desktop"
                />
              </div>
            </div>
          </main>

          <footer className="px-8 py-4 border-t-2 border-[#e6dcce] text-center text-xs text-softMuted bg-[#faf5eb] flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 HiVocab! - Ứng dụng ghi nhớ từ vựng thông minh cho học sinh Việt Nam.</p>
            <div className="flex items-center gap-4 font-bold text-crayonText">
              <button
                type="button"
                onClick={() => openModal('srsExplainer')}
                className="hover:underline cursor-pointer"
              >
                Cẩm nang SRS
              </button>
              <button
                type="button"
                onClick={() => navigateTo('exercises')}
                className="hover:underline cursor-pointer"
              >
                Lộ trình THPT
              </button>
              <button
                type="button"
                onClick={() => openModal('bugReport', { initialType: 'feedback' })}
                className="hover:underline cursor-pointer"
              >
                Góp ý &amp; Hỗ trợ
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Pop-up Lộ trình rèn luyện IELTS */}
      <IeltsGoalModal
        isOpen={isIeltsModalOpen}
        onClose={() => setIsIeltsModalOpen(false)}
        currentGoal={ieltsGoal}
        currentWords={currentWordsLearned}
        onSaveSuccess={() => {
          if (typeof refresh === 'function') {
            refresh();
          }
        }}
      />
    </div>
  );
}

export default PageDashboard;
