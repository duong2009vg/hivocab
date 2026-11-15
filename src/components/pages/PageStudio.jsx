// src/components/pages/PageStudio.jsx
// Unified HiVocab Shadowing, Dictation & Pronunciation Studio
// Powered by cloned PeakFour core algorithms & datasets + Modal.com OpenPronounce/Kokoro API

import React, { useState, useEffect } from 'react';
import { Mic, Video, Keyboard, Volume2, Server, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getStudioApiUrl,
  checkStudioBackendStatus,
  getPreferredStudioVoice,
  setPreferredStudioVoice,
  stopStudioAudio,
} from '../../services/studioService.js';
import ShadowingTab from '../studio/ShadowingTab.jsx';
import DictationTab from '../studio/DictationTab.jsx';
import IpaLabTab from '../studio/IpaLabTab.jsx';
import ModalSetupModal from '../studio/ModalSetupModal.jsx';

export function PageStudio() {
  const [activeTab, setActiveTab] = useState('shadowing'); // 'shadowing' | 'dictation' | 'ipa'
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [shadowingClips, setShadowingClips] = useState([]);
  const [dictationCatalog, setDictationCatalog] = useState(null);
  const [phonemeData, setPhonemeData] = useState(null);
  const [minimalPairsData, setMinimalPairsData] = useState(null);
  const [voicesList, setVoicesList] = useState([]);

  const [selectedVoice, setSelectedVoice] = useState(() => getPreferredStudioVoice());
  const [backendStatus, setBackendStatus] = useState(() => ({
    configured: Boolean(getStudioApiUrl()),
    online: false,
    kokoroReady: false,
  }));
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDatasets() {
      setLoading(true);
      setLoadError('');
      try {
        const [shRes, dicRes, ipaRes, mpRes, vRes] = await Promise.all([
          fetch('/data/studio/shadowing-catalog.json'),
          fetch('/data/studio/dictation-lessons.json'),
          fetch('/data/studio/phoneme-study.json'),
          fetch('/data/studio/minimal-pairs.json'),
          fetch('/data/studio/kokoro-voices.json'),
        ]);
        if (!shRes.ok || !dicRes.ok || !ipaRes.ok || !mpRes.ok) {
          throw new Error('Không thể tải dữ liệu học liệu Studio.');
        }
        const [shJson, dicJson, ipaJson, mpJson, vJson] = await Promise.all([
          shRes.json(),
          dicRes.json(),
          ipaRes.json(),
          mpRes.json(),
          vRes.ok ? vRes.json() : Promise.resolve({ voices: [] }),
        ]);

        if (!active) return;
        setShadowingClips(Array.isArray(shJson?.clips) ? shJson.clips : []);
        setDictationCatalog(dicJson);
        setPhonemeData(ipaJson);
        setMinimalPairsData(mpJson);
        setVoicesList(Array.isArray(vJson?.voices) ? vJson.voices : []);
      } catch (err) {
        if (active) setLoadError(err?.message || 'Lỗi tải dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDatasets();

    if (getStudioApiUrl()) {
      checkStudioBackendStatus().then((res) => {
        if (active) setBackendStatus(res);
      });
    }

    return () => {
      active = false;
      stopStudioAudio();
    };
  }, []);

  const handleVoiceChange = (nextVoice) => {
    setSelectedVoice(nextVoice);
    setPreferredStudioVoice(nextVoice);
  };

  const tabs = [
    { id: 'shadowing', label: 'Shadowing Video', badge: shadowingClips.length || 12, icon: Video },
    {
      id: 'dictation',
      label: 'Dictation Hội thoại',
      badge: dictationCatalog?.lessons?.length || 139,
      icon: Keyboard,
    },
    { id: 'ipa', label: 'IPA & Phát âm AI', badge: '44 âm', icon: Sparkles },
  ];

  return (
    <div
      id="page-studio"
      className="page active min-h-screen text-[#2E2823] bg-[#FFF9F0] font-['Quicksand',sans-serif]"
    >
      <div className="w-full min-w-0 lg:pl-[var(--sidebar-w,244px)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 xl:px-8 pt-4 lg:pt-6 pb-28 lg:pb-12 space-y-5 pwa-safe-top">
          {/* Header matching HiVocab Crayon Cream Paper Design */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#4D6B53] border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] flex items-center justify-center text-white shrink-0">
                <Mic className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-[#2E2823] tracking-tight">
                    Luyện Nghe & Nói Studio
                  </h1>
                  <span className="text-[11px] font-black bg-[#F4E3B4] text-[#3D352E] border border-[#3D352E] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_#3D352E]">
                    Shadowing · Dictation · IPA
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#786F66] truncate">
                  Nhại giọng YouTube, nghe chép chính tả 139 hội thoại & chấm phát âm AI
                </p>
              </div>
            </div>

            {/* Voice Selector + Modal.com AI Server Status */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {voicesList.length > 0 && (
                <label className="flex items-center gap-1.5 bg-[#fffcf7] border-2 border-[#3D352E] rounded-2xl px-3 py-1.5 shadow-[2px_2px_0px_#3D352E] text-xs font-bold">
                  <Volume2 className="w-3.5 h-3.5 text-[#4D6B53] shrink-0" />
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    aria-label="Chọn giọng đọc Kokoro"
                    className="bg-transparent font-extrabold text-[#2E2823] focus:outline-none cursor-pointer"
                  >
                    {voicesList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.accent} · {v.gender})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] text-xs font-black cursor-pointer active:translate-y-0.5 transition-all ${
                  backendStatus.online
                    ? 'bg-[#EEF5EC] text-[#355A3B]'
                    : 'bg-[#FFF3D1] text-[#8C5311]'
                }`}
              >
                {backendStatus.online ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4D6B53]" />
                ) : (
                  <Server className="w-3.5 h-3.5 text-[#D96B43]" />
                )}
                <span>
                  {backendStatus.online
                    ? 'Modal AI: Đã kết nối'
                    : backendStatus.configured
                    ? 'Modal AI: Ngoại tuyến'
                    : 'Gắn AI Server (Modal)'}
                </span>
              </button>
            </div>
          </header>

          {/* Main Mode Switcher Pills */}
          <nav className="flex flex-wrap gap-2.5" aria-label="Chế độ luyện tập Studio">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#3D352E] text-xs sm:text-sm font-black transition-all cursor-pointer active:translate-y-0.5 ${
                    isActive
                      ? 'bg-[#4D6B53] text-white shadow-[2.5px_2.5px_0px_#3D352E]'
                      : 'bg-[#fffcf7] text-[#554D42] hover:bg-white shadow-[1.5px_1.5px_0px_#3D352E]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      isActive
                        ? 'bg-[#F4E3B4] text-[#3D352E] border-[#3D352E]'
                        : 'bg-[#FAF5EB] text-[#786F66] border-[#E8DEC8]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Main Content */}
          {loading ? (
            <div className="bg-[#fffcf7] border-2 border-[#3D352E] rounded-3xl p-10 shadow-[2.5px_2.5px_0px_#3D352E] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#4D6B53]" />
              <p className="text-sm font-bold text-[#786F66]">Đang nạp học liệu Shadowing & Dictation…</p>
            </div>
          ) : loadError ? (
            <div className="bg-[#FDECE8] border-2 border-[#3D352E] rounded-3xl p-6 text-sm font-bold text-[#B53D2A]">
              {loadError}
            </div>
          ) : (
            <>
              {activeTab === 'shadowing' && (
                <ShadowingTab
                  clips={shadowingClips}
                  voice={selectedVoice}
                  onOpenSetup={() => setSetupOpen(true)}
                />
              )}
              {activeTab === 'dictation' && (
                <DictationTab
                  catalog={dictationCatalog}
                  voice={selectedVoice}
                  onOpenSetup={() => setSetupOpen(true)}
                />
              )}
              {activeTab === 'ipa' && (
                <IpaLabTab
                  phonemeData={phonemeData}
                  minimalPairsData={minimalPairsData}
                  voice={selectedVoice}
                  onOpenSetup={() => setSetupOpen(true)}
                />
              )}
            </>
          )}
        </div>
      </div>

      <ModalSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onStatusUpdated={(res) => setBackendStatus(res)}
      />
    </div>
  );
}

export default PageStudio;
