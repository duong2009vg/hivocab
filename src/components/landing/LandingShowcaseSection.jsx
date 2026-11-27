// src/components/landing/LandingShowcaseSection.jsx
// Interactive 5-pillar Crayon Showcase letting visitors preview HiVocab's newest modules.
import { useState, useRef, useEffect } from 'react';
import CrayonPopReveal from './CrayonPopReveal.jsx';
import {
  Video,
  Mic,
  BookOpenText,
  GraduationCap,
  Library,
  ArrowRight,
  Eye,
  EyeOff,
  Volume2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Keyboard,
  Lightbulb,
} from 'lucide-react';

const SHADOWING_DEMO_WORDS = [
  {
    word: 'Wait,',
    ipa: '/weɪt/',
    level: 'good',
    score: 96,
    phones: [
      { p: 'w', level: 'good' },
      { p: 'eɪ', level: 'good' },
      { p: 't', level: 'good' },
    ],
    heard: '/weɪt/',
    tipVi: 'Phát âm chuẩn xác, âm đuôi /t/ bật gọn rõ ràng!',
    tipEn: 'Crisp and accurate pronunciation with a clean /t/ release!',
  },
  {
    word: 'did',
    ipa: '/dɪd/',
    level: 'good',
    score: 94,
    phones: [
      { p: 'd', level: 'good' },
      { p: 'ɪ', level: 'good' },
      { p: 'd', level: 'good' },
    ],
    heard: '/dɪd/',
    tipVi: 'Nhịp nối tự nhiên, nguyên âm ngắn /ɪ/ chính xác.',
    tipEn: 'Natural rhythm and accurate short vowel /ɪ/.',
  },
  {
    word: 'you',
    ipa: '/juː/',
    level: 'good',
    score: 95,
    phones: [
      { p: 'j', level: 'good' },
      { p: 'uː', level: 'good' },
    ],
    heard: '/juː/',
    tipVi: 'Nối âm "did you" mượt mà như người bản xứ!',
    tipEn: 'Smooth linking with "did you" — sounds very natural!',
  },
  {
    word: 'actually',
    ipa: '/ˈæktʃuəli/',
    level: 'near',
    score: 74,
    phones: [
      { p: 'æ', level: 'good' },
      { p: 'k', level: 'good' },
      { p: 'tʃ', level: 'near' },
      { p: 'uə', level: 'good' },
      { p: 'li', level: 'good' },
    ],
    heard: '/ˈækʃuəli/',
    tipVi: 'Gần đúng rồi! Bật rõ hơn âm /tʃ/ (tròn môi nhẹ) ở giữa thay vì lướt sang /ʃ/.',
    tipEn: 'Almost there! Add a sharper /tʃ/ burst in the middle instead of softening to /ʃ/.',
  },
  {
    word: 'think',
    ipa: '/θɪŋk/',
    level: 'bad',
    score: 52,
    phones: [
      { p: 'θ', level: 'bad' },
      { p: 'ɪ', level: 'good' },
      { p: 'ŋ', level: 'good' },
      { p: 'k', level: 'good' },
    ],
    heard: '/tɪŋk/',
    tipVi: 'Lỗi hay gặp: Bạn đọc /θ/ thành /t/. Hãy đặt nhẹ đầu lưỡi giữa 2 hàm răng và thổi hơi ra nhé!',
    tipEn: 'Common slip: /θ/ sounded like /t/. Place your tongue tip gently between teeth and blow air.',
  },
  {
    word: 'through',
    ipa: '/θruː/',
    level: 'near',
    score: 76,
    phones: [
      { p: 'θ', level: 'near' },
      { p: 'r', level: 'good' },
      { p: 'uː', level: 'good' },
    ],
    heard: '/sruː/',
    tipVi: 'Âm /θ/ hơi bị kéo thành /s/. Giữ đầu lưỡi chạm nhẹ răng cửa trên trước khi cuộn /r/.',
    tipEn: 'Your /θ/ drifted slightly toward /s/. Touch your upper teeth lightly before curling into /r/.',
  },
  {
    word: 'this',
    ipa: '/ðɪs/',
    level: 'good',
    score: 91,
    phones: [
      { p: 'ð', level: 'good' },
      { p: 'ɪ', level: 'good' },
      { p: 's', level: 'good' },
    ],
    heard: '/ðɪs/',
    tipVi: 'Âm rung /ð/ chuẩn, độ rõ rất tốt!',
    tipEn: 'Great voiced /ð/ and clear ending /s/!',
  },
  {
    word: 'carefully?',
    ipa: '/ˈkerfəli/',
    level: 'good',
    score: 93,
    phones: [
      { p: 'k', level: 'good' },
      { p: 'er', level: 'good' },
      { p: 'f', level: 'good' },
      { p: 'ə', level: 'good' },
      { p: 'li', level: 'good' },
    ],
    heard: '/ˈkerfəli/',
    tipVi: 'Lên giọng cuối câu hỏi tự nhiên, trọng âm đầu chuẩn xác!',
    tipEn: 'Nice rising question intonation and clear primary stress!',
  },
];

const DEMO_WORD_STYLES = {
  good: {
    base: 'bg-[#E9F6E6] text-[#28532F] border-[#4D6B53]',
    selected: 'bg-[#DFF0DC] text-[#1F4425] border-[#3D352E] ring-2 ring-[#4D6B53]/40 shadow-[2px_2px_0px_#3D352E]',
    chip: 'bg-white text-[#28532F] border-[#4D6B53]/45',
    badge: 'bg-[#4D6B53] text-white',
    symbol: '✓',
    labelVi: 'Đọc đúng',
    labelEn: 'Accurate',
  },
  near: {
    base: 'bg-[#FFF3D6] text-[#8A4F0B] border-[#D9822B]',
    selected: 'bg-[#FFEBBF] text-[#733F04] border-[#3D352E] ring-2 ring-[#D9822B]/40 shadow-[2px_2px_0px_#3D352E]',
    chip: 'bg-[#FFE7B3] text-[#7A4407] border-[#D9822B]/70',
    badge: 'bg-[#D9822B] text-white',
    symbol: '≈',
    labelVi: 'Gần đúng',
    labelEn: 'Close',
  },
  bad: {
    base: 'bg-[#FDECE8] text-[#A8321F] border-[#D96B43]',
    selected: 'bg-[#FADAD2] text-[#8F2413] border-[#3D352E] ring-2 ring-[#D96B43]/40 shadow-[2px_2px_0px_#3D352E]',
    chip: 'bg-[#FAD4CB] text-[#8F2413] border-[#D96B43]/80 font-black',
    badge: 'bg-[#D96B43] text-white',
    symbol: '!',
    labelVi: 'Cần sửa',
    labelEn: 'Needs fix',
  },
};

function ShowcasePreviewStudioVideo({ isEn }) {
  const [practiceTab, setPracticeTab] = useState('shadowing'); // 'shadowing' | 'dictation'
  const [phase, setPhase] = useState('scored'); // 'scored' | 'recording' | 'analyzing'
  const [selectedWordIdx, setSelectedWordIdx] = useState(4); // default to "think" (/θɪŋk/) to highlight coaching
  const [speakingSample, setSpeakingSample] = useState(false);
  const timerRef = useRef([]);

  useEffect(() => {
    return () => {
      timerRef.current.forEach((id) => clearTimeout(id));
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
    };
  }, []);

  const sentenceEn = 'Wait, did you actually think through this carefully?';
  const sentenceVi = 'Khoan đã, cậu đã thực sự suy nghĩ thấu đáo chuyện này chưa?';

  const handlePlaySample = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(sentenceEn);
      utter.lang = 'en-US';
      utter.rate = 0.92;
      utter.onstart = () => setSpeakingSample(true);
      utter.onend = () => setSpeakingSample(false);
      utter.onerror = () => setSpeakingSample(false);
      window.speechSynthesis.speak(utter);
    } catch (_) {
      setSpeakingSample(false);
    }
  };

  const runSimulatedGrading = () => {
    timerRef.current.forEach((id) => clearTimeout(id));
    timerRef.current = [];
    setPracticeTab('shadowing');
    setPhase('recording');
    const t1 = setTimeout(() => setPhase('analyzing'), 1100);
    const t2 = setTimeout(() => {
      setPhase('scored');
      setSelectedWordIdx(4);
    }, 1850);
    timerRef.current = [t1, t2];
  };

  const activeWord = SHADOWING_DEMO_WORDS[selectedWordIdx] || SHADOWING_DEMO_WORDS[4];
  const activeStyle = DEMO_WORD_STYLES[activeWord.level];

  return (
    <div className="space-y-3">
      {/* Top Mode Toggle matching real ShadowingTab.jsx */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setPracticeTab('shadowing')}
          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
            practiceTab === 'shadowing'
              ? 'bg-[#4D6B53] text-white shadow-[2px_2px_0px_#3D352E]'
              : 'bg-white text-[#554D42] hover:bg-[#FFF9EE]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isEn ? 'Shadowing & AI Score' : 'Shadowing & Chấm bài'}</span>
        </button>
        <button
          type="button"
          onClick={() => setPracticeTab('dictation')}
          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black border-2 border-[#3D352E] cursor-pointer transition-all ${
            practiceTab === 'dictation'
              ? 'bg-[#4D6B53] text-white shadow-[2px_2px_0px_#3D352E]'
              : 'bg-white text-[#554D42] hover:bg-[#FFF9EE]'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isEn ? 'Cue Dictation Check' : 'Chép chính tả câu'}</span>
        </button>
      </div>

      {/* Active Video Cue Prompt Strip */}
      <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3 shadow-[2px_2.5px_0px_#3D352E] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-[#F4E3B4] border border-[#3D352E] text-[10px] font-black text-[#3D352E]">
              {isEn ? 'Cue 12 / 28 · TED-Ed' : 'Câu 12 / 28 · TED-Ed'}
            </span>
            <span className="text-[10px] font-bold text-[#8A796F]">00:42 – 00:46</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlaySample}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border border-[#3D352E] cursor-pointer transition-all ${
                speakingSample ? 'bg-[#EEF5EC] text-[#355A3B]' : 'bg-[#FAF5EB] hover:bg-[#F4E3B4] text-[#3D352E]'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${speakingSample ? 'animate-pulse text-[#4D6B53]' : ''}`} />
              <span>{speakingSample ? (isEn ? 'Playing…' : 'Đang đọc…') : isEn ? 'Listen' : 'Nghe mẫu'}</span>
            </button>
            <button
              type="button"
              onClick={runSimulatedGrading}
              disabled={phase !== 'scored'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-[11px] font-black border border-[#3D352E] shadow-[1.5px_1.5px_0px_#3D352E] active:translate-y-0.5 cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className={`w-3 h-3 ${phase !== 'scored' ? 'animate-spin' : ''}`} />
              <span>{isEn ? 'Simulate Score' : 'Chạy thử chấm bài'}</span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-black text-[#3D352E] leading-snug">“{sentenceEn}”</p>
          <p className="text-[11px] font-bold text-[#557A46] mt-0.5">{sentenceVi}</p>
        </div>
      </div>

      {practiceTab === 'dictation' ? (
        /* Interactive Dictation Graded Check Preview */
        <div className="crayon-tab-pop bg-white border-2 border-[#3D352E] rounded-2xl p-3.5 shadow-[2.5px_3px_0px_#3D352E] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8A796F]">
              {isEn ? 'Word-by-Word Dictation Diff' : 'So khớp từng từ bạn gõ'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3E7] text-[#355A3B] border border-[#4D6B53] text-xs font-black">
              {isEn ? '7 / 8 words (88%)' : 'Khớp 7 / 8 từ (88%)'}
            </span>
          </div>

          <div className="bg-[#FAF5EB] border border-[#E3D7C5] rounded-xl p-2.5 flex flex-wrap gap-1.5 text-xs font-black">
            {['Wait,', 'did', 'you', 'actually', 'think', 'through', 'this', 'carefully?'].map((w, idx) => {
              const missed = idx === 5;
              return (
                <span
                  key={w}
                  className={`px-2 py-0.5 rounded-lg border ${
                    missed
                      ? 'bg-[#FDECE8] text-[#A8321F] border-[#D96B43] line-through decoration-2'
                      : 'bg-[#E9F6E6] text-[#28532F] border-[#4D6B53]/50'
                  }`}
                >
                  {missed ? 'threw → through' : `${w} ✓`}
                </span>
              );
            })}
          </div>

          <p className="text-[11px] font-bold text-[#6E5D53] bg-[#FFF9EE] border border-[#DECDBB] rounded-xl px-3 py-2">
            {isEn
              ? 'Tip: "through" /θruː/ and "threw" sound identical — context ("think through") locks in the right spelling!'
              : 'Gợi ý: "through" (thấu đáo) và "threw" (ném) đọc giống hệt nhau — cụm "think through" giúp bạn bắt đúng chính tả!'}
          </p>
        </div>
      ) : phase !== 'scored' ? (
        /* Live Simulated Recording -> AI Phoneme Analyzing State */
        <div className="crayon-tab-pop bg-white border-2 border-[#3D352E] rounded-2xl p-5 shadow-[2.5px_3px_0px_#3D352E] flex flex-col items-center justify-center text-center gap-3 min-h-[218px]">
          <div
            className={`w-12 h-12 rounded-2xl border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E] flex items-center justify-center ${
              phase === 'recording' ? 'bg-[#DE5D53] text-white animate-pulse' : 'bg-[#4D6B53] text-white'
            }`}
          >
            {phase === 'recording' ? <Mic className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-spin" />}
          </div>
          <div className="space-y-1">
            <p className="crayon-heading text-sm sm:text-base font-extrabold text-[#3D352E]">
              {phase === 'recording'
                ? isEn
                  ? 'Listening to your voice… (0:03)'
                  : 'Đang thu âm giọng đọc của bạn… (0:03)'
                : isEn
                  ? 'AI analyzing 44 IPA phonemes & intonation…'
                  : 'AI đang đối chiếu từng âm vị IPA & ngữ điệu…'}
            </p>
            <p className="text-[11px] font-bold text-[#786F66]">
              {phase === 'recording'
                ? '“Wait, did you actually tink srough this carefully?”'
                : isEn
                  ? 'Checking word accuracy, phoneme match, and pitch contour'
                  : 'Đang chấm điểm phát âm, lỗi khẩu hình và đường cong ngữ điệu'}
            </p>
          </div>
          {/* Animated equalizer bars */}
          <div className="flex items-end justify-center gap-1.5 h-7" aria-hidden="true">
            {[14, 24, 18, 28, 20, 26, 15, 22, 16].map((h, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  phase === 'recording' ? 'bg-[#DE5D53] animate-bounce' : 'bg-[#4D6B53] animate-pulse'
                }`}
                style={{ height: `${h}px`, animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Real Shadowing Pronunciation Grading Card Simulation */
        <div className="crayon-tab-pop bg-white border-2 border-[#3D352E] rounded-2xl p-3.5 shadow-[2.5px_3px_0px_#3D352E] space-y-3">
          {/* 3 Sub-score Metric Cards + Dual Pitch Contour */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-[#4D6B53]/50 bg-[#EEF5EC] text-[#28532F] px-2.5 py-1.5">
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wide opacity-80">
                {isEn ? 'Overall' : 'Tổng điểm AI'}
              </span>
              <span className="block text-base sm:text-lg font-black leading-tight">86 / 100</span>
            </div>
            <div className="rounded-xl border border-[#D9822B]/50 bg-[#FFF5DC] text-[#8A4F0B] px-2.5 py-1.5">
              <span className="block text-[9.5px] font-extrabold uppercase tracking-wide opacity-80">
                {isEn ? 'Word & IPA' : 'Chuẩn âm IPA'}
              </span>
              <span className="block text-base sm:text-lg font-black leading-tight">5✓ · 2≈ · 1!</span>
            </div>
            <div className="rounded-xl border border-[#4D6B53]/50 bg-[#FAF5EB] text-[#3D352E] px-2.5 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-[#786F66]">
                  {isEn ? 'Pitch' : 'Ngữ điệu'}
                </span>
                <span className="text-[11px] font-black text-[#4D6B53]">91%</span>
              </div>
              <svg viewBox="0 0 100 22" className="w-full h-5 mt-0.5 overflow-visible" aria-hidden="true">
                <polyline
                  fill="none"
                  stroke="#4D6B53"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                  points="2,15 18,10 36,14 54,6 74,11 98,4"
                />
                <polyline
                  fill="none"
                  stroke="#D96B43"
                  strokeWidth="2.2"
                  points="2,16 18,11 36,12 54,9 74,12 98,5"
                />
              </svg>
            </div>
          </div>

          {/* Clickable 3-State Word-by-Word Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-[#8A796F]">
              <span>
                {isEn
                  ? 'Tap any word below to inspect phoneme errors:'
                  : 'Bấm vào từng từ bên dưới để xem AI chỉ lỗi phát âm:'}
              </span>
              <span className="hidden sm:inline text-[#4D6B53]">
                {isEn ? '✓ Good · ≈ Close · ! Fix' : '✓ Đúng · ≈ Gần · ! Sửa'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SHADOWING_DEMO_WORDS.map((item, idx) => {
                const st = DEMO_WORD_STYLES[item.level];
                const isSelected = idx === selectedWordIdx;
                return (
                  <button
                    key={item.word}
                    type="button"
                    onClick={() => setSelectedWordIdx(idx)}
                    className={`px-2.5 py-1 rounded-xl border-2 text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1 ${
                      isSelected ? st.selected : st.base
                    }`}
                  >
                    <span>{item.word}</span>
                    <span className="text-[10px] opacity-85">{st.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Phoneme & Coaching Inspector for Selected Word */}
          <div
            key={activeWord.word}
            className="crayon-tab-pop bg-[#FFF9EE] border-2 border-[#3D352E]/25 rounded-xl p-2.5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[#3D352E]">
                  {activeWord.word} <span className="font-mono text-[#786F66] font-bold">{activeWord.ipa}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeStyle.badge}`}>
                  {isEn ? activeStyle.labelEn : activeStyle.labelVi} · {activeWord.score}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activeWord.phones.map((ph, i) => (
                  <span
                    key={`${ph.p}-${i}`}
                    className={`px-1.5 py-0.5 rounded-md border text-[10.5px] font-mono ${DEMO_WORD_STYLES[ph.level].chip}`}
                  >
                    /{ph.p}/
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] font-bold text-[#5E5147] leading-snug flex items-start gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#D9822B] shrink-0 mt-0.5" />
              <span>{isEn ? activeWord.tipEn : activeWord.tipVi}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShowcasePreviewStudioAi({ isEn }) {
  return (
    <div className="space-y-3">
      {/* Voice & Phoneme Lab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl px-3 py-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#557A46]" />
          <span className="text-xs font-black text-[#3D352E]">Kokoro AI Voice: Bella (US)</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#F4E3B4] border border-[#3D352E] text-[10px] font-black">
          {isEn ? '44 IPA Sounds • 139 Lessons' : '44 Âm IPA • 139 Hội thoại'}
        </span>
      </div>

      {/* Pronunciation Analysis Card */}
      <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3.5 shadow-[2.5px_3px_0px_#3D352E] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8A796F]">
            {isEn ? 'AI Phoneme Feedback' : 'Chấm Phát Âm AI Từng Âm Vị'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3E7] text-[#557A46] border border-[#557A46] text-xs font-black">
            89 / 100
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm font-black">
          <span className="px-2.5 py-1 rounded-xl bg-[#EAF3E7] text-[#355A3B] border border-[#557A46]/40">
            She /ʃiː/ ✓
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#D97706]/40">
            thought /θɔːt/ ~
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-[#FEEFEA] text-[#B53D2A] border border-[#DE5D53]/40">
            thoroughly /ˈθɜːrəli/ !
          </span>
        </div>

        <p className="text-[11px] font-bold text-[#6E5D53] bg-[#FFF9EE] border border-[#DECDBB] rounded-xl px-3 py-2">
          {isEn
            ? 'Tip: Place the tip of your tongue gently between teeth for /θ/ instead of /t/.'
            : 'Gợi ý Bé Hổ: Đặt nhẹ đầu lưỡi giữa hai hàm răng khi bật âm /θ/ thay vì đọc thành /t/ nhé!'}
        </p>
      </div>

      {/* Dictation Pill */}
      <div className="bg-[#FFFDF9] border-2 border-[#3D352E] rounded-2xl p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Mic className="w-4 h-4 text-[#DE5D53] shrink-0" />
          <span className="text-xs font-bold text-[#3D352E] truncate">
            {isEn
              ? 'Dictation: "I’d like to book a table by the window."'
              : 'Nghe chép: "I’d like to book a table by the window."'}
          </span>
        </div>
        <CheckCircle2 className="w-4 h-4 text-[#557A46] shrink-0" />
      </div>
    </div>
  );
}

function ShowcasePreviewBilingual({ isEn }) {
  const [curtainOpen, setCurtainOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl px-3 py-2">
        <span className="text-xs font-black text-[#3D352E]">
          {isEn ? '10 IELTS Reading Vols + 112 News Articles' : '10 Tập IELTS Vol + 112 Báo Song Ngữ'}
        </span>
        <button
          type="button"
          onClick={() => setCurtainOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#2A7BA0] text-white text-[11px] font-black border-2 border-[#3D352E] shadow-[1.5px_2px_0px_#3D352E] active:translate-y-0.5 cursor-pointer"
        >
          {curtainOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>
            {curtainOpen
              ? isEn
                ? 'Hide Translation'
                : 'Kéo Rèm Che'
              : isEn
                ? 'Peek Translation'
                : 'Mở Rèm Xem Nghĩa'}
          </span>
        </button>
      </div>

      <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-4 shadow-[2.5px_3px_0px_#3D352E] space-y-3">
        <div className="flex items-center justify-between text-[11px] font-black text-[#8A796F]">
          <span>CAMBRIDGE IELTS • PASSAGE 2</span>
          <span className="text-[#557A46]">{isEn ? 'Click curtain button ↑' : 'Thử bấm nút Rèm che ở trên ↑'}</span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-[#3D352E] leading-relaxed">
          Urban trees significantly <span className="bg-[#FEF3C7] px-1 rounded border-b-2 border-[#F4B41A]">mitigate</span>{' '}
          ambient heat while fostering biodiversity across densely populated neighborhoods.
        </p>

        <div
          onClick={() => setCurtainOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setCurtainOpen((prev) => !prev);
            }
          }}
          className={`rounded-xl border-2 border-dashed p-3 transition-all cursor-pointer select-none ${
            curtainOpen
              ? 'bg-[#EAF3E7] border-[#557A46] text-[#2E4625]'
              : 'bg-[#FAF5EB] border-[#3D352E]/40 text-[#786F66]'
          }`}
        >
          {curtainOpen ? (
            <p className="text-xs font-bold leading-relaxed">
              Cây xanh đô thị giúp <strong>giảm thiểu</strong> đáng kể nhiệt độ môi trường đồng thời nuôi dưỡng đa dạng sinh học khắp các khu dân cư đông đúc.
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs font-black">
              <Eye className="w-4 h-4 text-[#2A7BA0]" />
              <span>
                {isEn
                  ? 'Curtain closed — read English first, click to reveal translation!'
                  : 'Rèm dịch đang che — Hãy đọc hiểu tiếng Anh trước rồi bấm để đối chiếu!'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShowcasePreviewThpt({ isEn }) {
  const [selectedBlank, setSelectedBlank] = useState(7);

  return (
    <div className="space-y-3">
      {/* 3 Books Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { tag: isEn ? 'Book 1' : 'Quyển 1', title: isEn ? '38 Mock Exams' : '38 Đề Trường/Sở', bg: 'bg-[#2D5A3D]' },
          { tag: isEn ? 'Book 2' : 'Quyển 2', title: isEn ? '29 Topics · 1k Qs' : '29 Chuyên Đề', bg: 'bg-[#B45309]' },
          { tag: isEn ? 'Book 3' : 'Quyển 3', title: isEn ? '10 Forecast 2026' : '10 Đề Dự Đoán', bg: 'bg-[#1E3A8A]' },
        ].map((book, idx) => (
          <div
            key={idx}
            className={`${book.bg} text-white rounded-xl p-2.5 border-2 border-[#3D352E] shadow-[2px_2.5px_0px_#3D352E]`}
          >
            <span className="text-[9px] font-black uppercase tracking-wider text-[#FDE047] block">{book.tag}</span>
            <span className="text-[11px] font-black leading-tight block mt-0.5">{book.title}</span>
          </div>
        ))}
      </div>

      {/* CBT Passage + Blank Jump Demo */}
      <div className="bg-white border-2 border-[#3D352E] rounded-2xl p-3.5 shadow-[2.5px_3px_0px_#3D352E] space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-black">
          <span className="text-[#3D352E]">{isEn ? 'CBT Room Interactive Blanks' : 'Phòng Thi CBT Bấm Ô Trống Nhảy Câu'}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#E6F3FB] text-[#2A7BA0] border border-[#2A7BA0]/40">
            {isEn ? `Question ${selectedBlank}` : `Đang chọn Câu ${selectedBlank}`}
          </span>
        </div>
        <p className="text-xs font-semibold text-[#3D352E] leading-relaxed">
          Smart agriculture allows young farmers to
          {[7, 8].map((qNum) => (
            <button
              key={qNum}
              type="button"
              onClick={() => setSelectedBlank(qNum)}
              className={`inline-flex items-center px-2 py-0.5 mx-1 rounded-md border font-mono font-bold text-[11px] cursor-pointer transition-all ${
                selectedBlank === qNum
                  ? 'bg-[#2A7BA0] text-white border-[#3D352E]'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'
              }`}
            >
              ({qNum}) _______
            </button>
          ))}
          sustainable yields across dry seasons.
        </p>
      </div>
    </div>
  );
}

function ShowcasePreviewBookshelf({ isEn }) {
  const spines = [
    { code: 'CAM 21', color: 'bg-[#DE5D53] text-white', height: 'h-24', rotate: '-rotate-2' },
    { code: 'VOL 10', color: 'bg-[#557A46] text-white', height: 'h-28', rotate: 'rotate-0' },
    { code: 'DEST C1-C2', color: 'bg-[#2A7BA0] text-white', height: 'h-24', rotate: 'rotate-1' },
    { code: 'SAT PREP', color: 'bg-[#F4B41A] text-[#3D352E]', height: 'h-26', rotate: '-rotate-1' },
    { code: 'OXFORD 3K', color: 'bg-[#8B5CF6] text-white', height: 'h-24', rotate: 'rotate-2' },
    { code: 'TOEIC 900', color: 'bg-[#D97706] text-white', height: 'h-28', rotate: '-rotate-1' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl px-3 py-2 text-xs font-black">
        <span>{isEn ? '115+ Books • 77,786+ Vocabulary Words' : '115+ Cuốn Sách • 77.786+ Từ Vựng'}</span>
        <span className="px-2 py-0.5 rounded-lg bg-white border border-[#3D352E] text-[10px]">
          {isEn ? '3D Shelf / Folder View' : 'Kệ 3D / Tủ Folder'}
        </span>
      </div>

      {/* Wooden Crayon Bookshelf Simulation */}
      <div className="bg-[#5D381E] border-2 border-[#3D352E] rounded-2xl pt-5 px-4 pb-0 shadow-[2.5px_3px_0px_#3D352E] overflow-hidden">
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          {spines.map((book) => (
            <div
              key={book.code}
              className={`${book.color} ${book.height} ${book.rotate} w-10 sm:w-12 rounded-t-lg border-2 border-b-0 border-[#3D352E] flex items-center justify-center p-1 shadow-xs hover:-translate-y-2 transition-transform cursor-default`}
            >
              <span className="text-[9px] sm:text-[10px] font-black tracking-tight [writing-mode:vertical-rl] rotate-180 select-none">
                {book.code}
              </span>
            </div>
          ))}
        </div>
        <div className="h-3 -mx-4 bg-gradient-to-b from-[#A06A3E] to-[#6E4424] border-t-2 border-[#3D352E]" />
      </div>
    </div>
  );
}

export function LandingShowcaseSection({ isEn, navigateTo }) {
  const pillars = [
    {
      id: 'studio-video',
      tabLabel: isEn ? 'Shadowing & Dictation' : 'Shadowing & Dictation',
      badge: isEn ? 'NEW' : 'MỚI',
      icon: Video,
      accentBg: 'bg-[#FEEFEA]',
      accentText: 'text-[#DE5D53]',
      title: isEn
        ? 'YouTube Shadowing & Real-Time AI Pronunciation Scoring'
        : 'Studio Shadowing & Chấm Phát Âm AI Từng Từ, Từng Âm Vị',
      desc: isEn
        ? 'Practice shadowing alongside real YouTube clips or paste any link. AI grades every word in green/amber/red, plots your intonation curve against the native speaker, and tells you exactly how to fix each IPA sound.'
        : 'Luyện nhại giọng (Shadowing) & chép chính tả ngay theo từng câu video YouTube. AI chấm điểm trực tiếp từng từ xanh/vàng/đỏ, so sánh đường cong ngữ điệu với giọng mẫu và chỉ rõ cách sửa từng âm IPA.',
      bullets: isEn
        ? [
            'Click any graded word on the right to inspect its IPA breakdown & tips',
            'Dual pitch-contour chart comparing your intonation with the native clip',
            'Switch smoothly between Shadowing AI scoring & cue-by-cue Dictation',
          ]
        : [
            'Bấm thử từng từ bên phải để xem AI chỉ rõ lỗi âm vị /θ/, /tʃ/ & mẹo sửa miệng',
            'Biểu đồ đường cong ngữ điệu so sánh trực tiếp giọng bạn với giọng mẫu',
            'Chuyển mượt giữa Shadowing chấm bài AI và Chép chính tả từng câu',
          ],
      cta: isEn ? 'Try Shadowing Studio' : 'Mở Studio Shadowing ngay',
      route: 'studio',
    },
    {
      id: 'studio-ai',
      tabLabel: isEn ? '139 Dictation & 44 IPA' : '139 Dictation & 44 IPA',
      badge: 'AI',
      icon: Mic,
      accentBg: 'bg-[#EAF3E7]',
      accentText: 'text-[#557A46]',
      title: isEn
        ? '139 Dialogue Dictation Lessons & 44 IPA Pronunciation AI Lab'
        : '139 Hội Thoại Dictation & Phòng Lab 44 Âm IPA Chấm Phát Âm AI',
      desc: isEn
        ? 'Sharpen listening accuracy across 139 structured dialogue lessons with natural Kokoro TTS voices, then record your voice to receive phoneme-level AI coaching across all 44 IPA sounds.'
        : 'Rèn phản xạ nghe từng từ qua 139 bài hội thoại thực tế với giọng đọc Kokoro AI đa sắc thái, kết hợp phòng Lab 44 âm IPA giúp ghi âm chấm điểm từng âm vị và gợi ý sửa khẩu hình.',
      bullets: isEn
        ? [
            '139 multi-turn listening & dictation dialogues with instant word check',
            'Complete 44 IPA phoneme chart & minimal-pairs trainer',
            '3-color phoneme scoring with tailored Vietnamese pronunciation tips',
          ]
        : [
            '139 bài hội thoại nghe chép chính tả kiểm tra chính xác từng từ',
            'Luyện đầy đủ bảng 44 âm IPA & cặp âm dễ nhầm (Minimal Pairs)',
            'Phân tích phát âm xanh/vàng/đỏ kèm mẹo sửa lỗi tiếng Việt',
          ],
      cta: isEn ? 'Open Pronunciation Lab' : 'Vào Lab Phát Âm & Dictation',
      route: 'studio',
    },
    {
      id: 'bilingual',
      tabLabel: isEn ? 'Bilingual & 112 News' : 'Đọc Song Ngữ & 112 Báo',
      badge: 'IELTS',
      icon: BookOpenText,
      accentBg: 'bg-[#E6F3FB]',
      accentText: 'text-[#2A7BA0]',
      title: isEn
        ? '10 IELTS Reading Volumes & 112 Bilingual News with Curtain Mode'
        : '10 Tập Đọc Hiểu IELTS & 112 Bài Báo Song Ngữ Rèm Che Chủ Động',
      desc: isEn
        ? 'Stop passively glancing at translations. Our Curtain Mode lets you read authentic IELTS passages and 112 curated bilingual news stories in English first, then tap to check meaning.'
        : 'Không còn thói quen đọc lướt nhìn nghĩa thụ động. Trọn bộ 10 tập IELTS Reading (Vol 1–10) và 112 bài Báo song ngữ đa chủ đề đi kèm rèm che thông minh và audio đọc từng đoạn.',
      bullets: isEn
        ? [
            '10 complete IELTS Vol collections + 112 categorized bilingual articles',
            'Interactive Curtain Mode + instant tap-to-lookup dictionary inside text',
            'Per-paragraph audio playback to combine Reading & Listening',
          ]
        : [
            '10 tập IELTS Reading Vol 1–10 và 112 bài báo song ngữ phân loại sẵn',
            'Rèm che từng câu/đoạn kích thích não tự suy luận trước khi mở đáp án',
            'Nghe audio từng đoạn & lưu từ vựng trực tiếp ngay khi đang đọc',
          ],
      cta: isEn ? 'Open Bilingual Reading' : 'Trải nghiệm Đọc Song Ngữ',
      route: 'bilingual-reading',
    },
    {
      id: 'thpt',
      tabLabel: isEn ? 'THPT 3 Books & CBT' : 'Lộ Trình THPT & CBT',
      badge: '2026',
      icon: GraduationCap,
      accentBg: 'bg-[#FEF3C7]',
      accentText: 'text-[#B45309]',
      title: isEn
        ? '3-Book THPT National Exam Roadmap & Authentic CBT Exam Room'
        : 'Kệ 3 Quyển Sách Ôn Thi THPT Quốc Gia & Phòng Thi CBT Chuẩn BGD',
      desc: isEn
        ? 'Master the 2026 National Exam with a structured 3-book shelf: 38 official provincial mocks, 29 grammar-reading modules (1,004 explained questions), and 10 2026 prediction tests.'
        : 'Lộ trình ôn thi bài bản qua 3 cuốn sách: 38 đề Trường/Sở, 29 chuyên đề (1.004 câu có giải thích) và Bộ 10 đề dự đoán 2026 chuẩn ma trận, làm bài trên giao diện phòng thi CBT.',
      bullets: isEn
        ? [
            'Book 1: 38 School & Provincial Exams • Book 3: 10 Prediction Tests 2026',
            'Book 2: 29 step-by-step mastery chapters with theory before drills',
            'Click numbered blanks (7) _______ to jump straight to questions & highlight clues',
          ]
        : [
            'Quyển 1: 38 đề Trường/Sở • Quyển 3: 10 đề dự đoán chuẩn ma trận 2026',
            'Quyển 2: 29 chuyên đề học lý thuyết & chiến thuật trước khi làm bài',
            'Bấm ô trống (7) _______ nhảy thẳng tới câu hỏi & highlight bằng chứng',
          ],
      cta: isEn ? 'Enter THPT Roadmap' : 'Mở Kệ Sách Ôn Thi THPT',
      route: 'exercises',
    },
    {
      id: 'bookshelf',
      tabLabel: isEn ? '3D Bookshelf (115+)' : 'Kệ Sách 3D (115+)',
      badge: '77.7K+',
      icon: Library,
      accentBg: 'bg-[#F3E8FF]',
      accentText: 'text-[#7C3AED]',
      title: isEn
        ? '3D Wooden Bookshelf with 115+ Books & 77,786+ Academic Words'
        : 'Kệ Sách Gỗ 3D Chứa 115+ Đầu Sách & 77.786+ Từ Vựng Chuẩn Hóa',
      desc: isEn
        ? 'Browse your vocabulary like pulling hardcover books from a cozy study shelf — switch smoothly between 3D Book Spines, Covers, or Folder View across Cambridge, IELTS, SAT, TOEIC, and CEFR.'
        : 'Trải nghiệm tìm sách trực quan như thư viện thật: chuyển đổi linh hoạt giữa Kệ gỗ 3D (Gáy sách / Mặt bìa) hoặc Tủ Folder gồm Cambridge 10–21, Destination C1-C2, SAT, TOEIC, THPT.',
      bullets: isEn
        ? [
            '115+ curated books covering IELTS, THPT/ĐGNL, CEFR, SAT & TOEIC',
            'Switch between 3D Wooden Bookshelf & Folder Cabinet in Settings',
            'Import custom word lists in bulk via Excel/CSV or plain text',
          ]
        : [
            'Đủ bộ Cambridge 10–21, IELTS Actual, Destination C1-C2, SAT, TOEIC',
            'Tùy chọn giao diện Gáy sách, Mặt bìa trên Kệ 3D hoặc Tủ Folder gọn nhẹ',
            'Tự tạo sách cá nhân & nhập hàng loạt từ file Excel/CSV chỉ trong vài giây',
          ],
      cta: isEn ? 'Browse 3D Bookshelf' : 'Khám phá Kệ Sách 3D',
      route: 'topics',
    },
  ];

  const [activeId, setActiveId] = useState('studio-video');
  const activePillar = pillars.find((p) => p.id === activeId) || pillars[0];

  const renderPreview = () => {
    switch (activeId) {
      case 'studio-video':
        return <ShowcasePreviewStudioVideo isEn={isEn} />;
      case 'studio-ai':
        return <ShowcasePreviewStudioAi isEn={isEn} />;
      case 'bilingual':
        return <ShowcasePreviewBilingual isEn={isEn} />;
      case 'thpt':
        return <ShowcasePreviewThpt isEn={isEn} />;
      case 'bookshelf':
        return <ShowcasePreviewBookshelf isEn={isEn} />;
      default:
        return null;
    }
  };

  return (
    <section id="landing-showcase" className="mt-16 sm:mt-24 scroll-mt-24">
      <CrayonPopReveal variant="up" className="text-center space-y-2.5 mb-8 sm:mb-10">
        <span className="crayon-note inline-flex items-center gap-1.5 text-sm font-bold text-[#DE5D53] tracking-wide bg-[#FDEAE2] px-4 py-1 rounded-full border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isEn ? 'What’s Inside HiVocab 2026' : 'Tất cả tính năng mới đã có trên HiVocab'}</span>
        </span>
        <h2 className="crayon-heading font-extrabold text-2xl sm:text-4xl text-[#3D352E] leading-[1.25]">
          {isEn ? (
            <>
              Not Just Flashcards — A{' '}
              <span className="crayon-marker-highlight text-[#DE5D53]">Complete Crayon Studio</span>
            </>
          ) : (
            <>
              Không Chỉ Là Từ Vựng —{' '}
              <span className="crayon-marker-highlight text-[#DE5D53]">Studio Học Tiếng Anh Toàn Diện</span>
            </>
          )}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-[#6E5D53] max-w-2xl mx-auto font-medium">
          {isEn
            ? 'Tap each crayon tab below to test-drive our newest modules right here before entering the app.'
            : 'Bấm chọn từng thẻ màu sáp dưới đây để xem trước và tương tác thử với các tính năng mới nhất của HiVocab.'}
        </p>
      </CrayonPopReveal>

      {/* Interactive Tab Bar — staggered crayon stickers popping in */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible md:justify-center pb-3 mb-4">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isActive = pillar.id === activeId;
          return (
            <CrayonPopReveal
              key={pillar.id}
              variant="sticker"
              delay={idx * 70}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => setActiveId(pillar.id)}
                className={`crayon-heading inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl border-2 border-[#3D352E] text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3D352E] text-white shadow-[3px_3.5px_0px_#DE5D53] -translate-y-0.5'
                    : 'bg-white text-[#3D352E] hover:bg-[#FFF9EE] shadow-[2px_2.5px_0px_#3D352E] hover:-translate-y-0.5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F4B41A]' : pillar.accentText}`} />
                <span>{pillar.tabLabel}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none border ${
                    isActive
                      ? 'bg-[#DE5D53] text-white border-white/30'
                      : `${pillar.accentBg} ${pillar.accentText} border-[#3D352E]/20`
                  }`}
                >
                  {pillar.badge}
                </span>
              </button>
            </CrayonPopReveal>
          );
        })}
      </div>

      {/* Main Interactive Frame */}
      <CrayonPopReveal variant="up" delay={100}>
        <div className="bg-white border-[3px] border-[#3D352E] rounded-[32px] p-5 sm:p-8 lg:p-10 shadow-[6px_8px_0px_#3D352E] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left: Explanation + Direct Launch */}
          <div key={`desc-${activeId}`} className="crayon-tab-pop lg:col-span-5 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5EB] border-2 border-[#3D352E] text-xs font-black text-[#3D352E]">
              <activePillar.icon className={`w-4 h-4 ${activePillar.accentText}`} />
              <span>{activePillar.tabLabel}</span>
            </div>

            <h3 className="crayon-heading font-extrabold text-xl sm:text-2xl lg:text-[26px] text-[#3D352E] leading-snug">
              {activePillar.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#6E5D53] leading-relaxed font-medium">
              {activePillar.desc}
            </p>

            <ul className="space-y-2 pt-1">
              {activePillar.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-[#3D352E]">
                  <CheckCircle2 className="w-4 h-4 text-[#557A46] shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo(activePillar.route)}
                className="crayon-heading px-5 py-3 rounded-2xl bg-[#557A46] hover:bg-[#476739] text-white font-extrabold text-xs sm:text-sm border-2 border-[#3D352E] shadow-[3px_3.5px_0px_#3D352E] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>{activePillar.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigateTo('features')}
                className="crayon-heading px-4 py-3 rounded-2xl bg-[#FAF5EB] hover:bg-[#F4E3B4] text-[#3D352E] font-extrabold text-xs sm:text-sm border-2 border-[#3D352E] transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span>{isEn ? 'All Features' : 'Xem tất cả'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Crayon App Window Preview */}
          <div className="lg:col-span-7">
            <div className="bg-[#FAF5EB] border-[2.5px] border-[#3D352E] rounded-3xl p-3.5 sm:p-5 shadow-[4px_5px_0px_#3D352E]">
              {/* Window Titlebar Dots */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-[#DECDBB]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#DE5D53] border border-[#3D352E]" />
                  <span className="w-3 h-3 rounded-full bg-[#F4B41A] border border-[#3D352E]" />
                  <span className="w-3 h-3 rounded-full bg-[#557A46] border border-[#3D352E]" />
                </div>
                <span className="crayon-note text-xs font-bold tracking-wider text-[#8A796F]">
                  {isEn ? 'HiVocab Live Preview' : 'Xem Trước Giao Diện'} • {activePillar.tabLabel}
                </span>
              </div>

              <div key={`preview-${activeId}`} className="crayon-tab-pop">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </CrayonPopReveal>
    </section>
  );
}

export default LandingShowcaseSection;
