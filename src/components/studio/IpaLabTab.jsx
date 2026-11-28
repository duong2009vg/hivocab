// src/components/studio/IpaLabTab.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { playStudioTts, prewarmStudioBackend } from '../../services/studioService.js';
import { useAuth } from '../../providers/AuthProvider.jsx';
import StudioVoiceRecorder from './StudioVoiceRecorder.jsx';

export function IpaLabTab({ phonemeData, minimalPairsData, voice, onOpenSetup }) {
  const { canPrewarmStudioAi } = useAuth();
  const sounds = useMemo(() => (Array.isArray(phonemeData?.sounds) ? phonemeData.sounds : []), [phonemeData]);
  const pairGroups = useMemo(() => (Array.isArray(minimalPairsData?.groups) ? minimalPairsData.groups : []), [minimalPairsData]);
  const pairCategories = useMemo(
    () => (Array.isArray(minimalPairsData?.categories) ? minimalPairsData.categories : []),
    [minimalPairsData]
  );

  const [kindFilter, setKindFilter] = useState('all');
  const [selectedSound, setSelectedSound] = useState(null);
  const [pairCategory, setPairCategory] = useState('all');
  const [customSentence, setCustomSentence] = useState(
    'The three thoughtful scholars thoroughly reviewed the theory.'
  );
  const detailCardRef = useRef(null);

  const activeSound = selectedSound || sounds[0] || null;

  // Pro & Premium: pre-warm Modal when opening IPA Lab or switching phoneme lesson
  useEffect(() => {
    if (canPrewarmStudioAi) {
      prewarmStudioBackend({ allowed: true });
    }
  }, [canPrewarmStudioAi, activeSound?.id]);

  const handleSelectSound = (sound) => {
    setSelectedSound(sound);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        detailCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const filteredSounds = useMemo(() => {
    if (kindFilter === 'all') return sounds;
    return sounds.filter((s) => s.kind === kindFilter);
  }, [sounds, kindFilter]);

  const filteredPairs = useMemo(() => {
    if (pairCategory === 'all') return pairGroups.slice(0, 24);
    return pairGroups.filter((g) => g.category === pairCategory).slice(0, 24);
  }, [pairGroups, pairCategory]);

  return (
    <div className="space-y-5">
      {/* Custom Sentence Pronunciation Sandbox */}
      <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-5 shadow-[3px_3px_0px_#3D352E] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D96B43]" />
            <h3 className="text-base sm:text-lg font-black text-[#2E2823]">
              Phòng thử phát âm câu tự do (Kokoro + OpenPronounce)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => playStudioTts({ text: customSentence, voice, speed: 0.95 })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4D6B53] text-white text-xs font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe câu mẫu</span>
          </button>
        </div>

        <input
          type="text"
          value={customSentence}
          onChange={(e) => setCustomSentence(e.target.value)}
          placeholder="Nhập bất kỳ từ hoặc câu tiếng Anh nào để kiểm tra phát âm..."
          className="w-full px-4 py-2.5 rounded-2xl bg-white border-2 border-[#3D352E] text-sm sm:text-base font-bold text-[#2E2823] focus:outline-none"
        />

        <StudioVoiceRecorder
          expectedText={customSentence}
          voice={voice}
          compact
          onOpenSetup={onOpenSetup}
        />
      </div>

      {/* 44 IPA Sounds Chart & Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-black text-[#2E2823]">
              Bảng 44 âm IPA chuẩn ({filteredSounds.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['all', 'Tất cả'],
                ['monophthongs', 'Nguyên âm đơn'],
                ['diphthongs', 'Nguyên âm đôi'],
                ['consonants', 'Phụ âm'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKindFilter(id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 cursor-pointer ${
                    kindFilter === id
                      ? 'bg-[#4D6B53] text-white border-[#3D352E]'
                      : 'bg-white text-[#554D42] border-[#E8DEC8]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
            {filteredSounds.map((sound) => {
              const isSelected = activeSound?.id === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleSelectSound(sound)}
                  className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4E3B4] border-[#3D352E] shadow-[2px_2px_0px_#3D352E]'
                      : 'bg-white border-[#E8DEC8] hover:border-[#3D352E]'
                  }`}
                >
                  <div className="text-base sm:text-lg font-mono font-black text-[#2E2823]">/{sound.ipa}/</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#4D6B53] truncate">{sound.example}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected IPA Practice Detail */}
        <div ref={detailCardRef} className="lg:col-span-5 space-y-4 scroll-mt-4">
          {activeSound && (
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-2xl bg-[#EEF5EC] border-2 border-[#3D352E] text-2xl font-mono font-black text-[#4D6B53]">
                    /{activeSound.ipa}/
                  </span>
                  <div>
                    <div className="text-sm font-black text-[#2E2823]">
                      {activeSound.example} · {activeSound.second}
                    </div>
                    <div className="text-xs font-semibold text-[#786F66]">
                      {activeSound.spelling_patterns}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold text-[#554D42] bg-[#FAF5EB] rounded-xl p-3 border border-[#E8DEC8]">
                {activeSound.instruction}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => playStudioTts({ text: activeSound.example, voice, speed: 0.9 })}
                  className="p-2.5 rounded-xl bg-white border-2 border-[#3D352E] text-left hover:bg-[#FAF5EB] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#2E2823]">{activeSound.example}</span>
                    <Volume2 className="w-3.5 h-3.5 text-[#4D6B53]" />
                  </div>
                  <div className="text-[11px] text-[#786F66] font-semibold">
                    {activeSound.example_vi}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => playStudioTts({ text: activeSound.second, voice, speed: 0.9 })}
                  className="p-2.5 rounded-xl bg-white border-2 border-[#3D352E] text-left hover:bg-[#FAF5EB] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#2E2823]">{activeSound.second}</span>
                    <Volume2 className="w-3.5 h-3.5 text-[#4D6B53]" />
                  </div>
                  <div className="text-[11px] text-[#786F66] font-semibold">
                    {activeSound.second_vi}
                  </div>
                </button>
              </div>

              <div className="bg-[#EEF5EC] rounded-2xl p-3 border border-[#4D6B53]/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-[#4D6B53] uppercase">Câu thực hành</span>
                  <button
                    type="button"
                    onClick={() => playStudioTts({ text: activeSound.sentence, voice, speed: 0.95 })}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#4D6B53] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe</span>
                  </button>
                </div>
                <p className="text-sm font-black text-[#2E2823]">{activeSound.sentence}</p>
                <p className="text-xs font-semibold text-[#554D42]">{activeSound.sentence_vi}</p>
              </div>

              <StudioVoiceRecorder
                expectedText={activeSound.sentence}
                voice={voice}
                compact
                onOpenSetup={onOpenSetup}
              />
            </div>
          )}
        </div>
      </div>

      {/* Minimal Pairs Contrast Grid */}
      <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-4 shadow-[2.5px_2.5px_0px_#3D352E] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-black text-[#2E2823]">
            Cặp âm dễ nhầm (Minimal Pairs)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {pairCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPairCategory(cat.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 cursor-pointer ${
                  pairCategory === cat.id
                    ? 'bg-[#D96B43] text-white border-[#3D352E]'
                    : 'bg-white text-[#554D42] border-[#E8DEC8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPairs.map((grp) => (
            <div
              key={grp.id}
              className="bg-white border-2 border-[#E8DEC8] hover:border-[#3D352E] rounded-2xl p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                {(grp.words || []).map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => playStudioTts({ text: w.text, voice, speed: 0.9 })}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#FAF5EB] hover:bg-[#F4E3B4] border border-[#3D352E]/40 text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-[#2E2823]">{w.text}</span>
                      <Volume2 className="w-3.5 h-3.5 text-[#4D6B53]" />
                    </div>
                    <div className="text-[11px] font-mono text-[#786F66]">{w.ipa}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-[#554D42]">{grp.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IpaLabTab;
