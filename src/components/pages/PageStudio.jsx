// src/components/pages/PageStudio.jsx
// Unified HiVocab Shadowing, Dictation & Pronunciation Studio
// Powered by cloned PeakFour core algorithms & datasets + Modal.com OpenPronounce/Kokoro API

import React, { useState, useEffect } from 'react';
import { Video, Keyboard, Volume2, Sparkles, Loader2, Plus } from 'lucide-react';
import {
  getPreferredStudioVoice,
  setPreferredStudioVoice,
  stopStudioAudio,
} from '../../services/studioService.js';
import { supabase } from '../../lib/supabaseClient.js';
import ShadowingTab from '../studio/ShadowingTab.jsx';
import DictationTab from '../studio/DictationTab.jsx';
import IpaLabTab from '../studio/IpaLabTab.jsx';

export function PageStudio({ onWorkspaceModeChange } = {}) {
  const [activeTab, setActiveTab] = useState('shadowing'); // 'shadowing' | 'dictation' | 'ipa'
  const [shadowingVideoOpen, setShadowingVideoOpen] = useState(false);
  const [showShadowingAddForm, setShowShadowingAddForm] = useState(false);
  const [shadowingQuota, setShadowingQuota] = useState({ used: 0, limit: 5, authenticated: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [shadowingClips, setShadowingClips] = useState([]);
  const [dictationCatalog, setDictationCatalog] = useState(null);
  const [phonemeData, setPhonemeData] = useState(null);
  const [minimalPairsData, setMinimalPairsData] = useState(null);
  const [voicesList, setVoicesList] = useState([]);

  const [selectedVoice, setSelectedVoice] = useState(() => getPreferredStudioVoice());

  useEffect(() => {
    let active = true;

    async function loadDatasets() {
      setLoading(true);
      setLoadError('');
      try {
        let authHeaders = {};
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            authHeaders = { Authorization: `Bearer ${data.session.access_token}` };
          }
        } catch (_) {}

        const [shRes, dicRes, ipaRes, mpRes, vRes] = await Promise.all([
          fetch('/api/corpus?name=studio-shadowing-index', { headers: authHeaders }),
          fetch('/api/corpus?name=studio-dictation', { headers: authHeaders }),
          fetch('/api/corpus?name=studio-phoneme', { headers: authHeaders }),
          fetch('/api/corpus?name=studio-minimal-pairs', { headers: authHeaders }),
          fetch('/api/corpus?name=studio-voices', { headers: authHeaders }),
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

    return () => {
      active = false;
      stopStudioAudio();
    };
  }, []);

  const isExpandedView = activeTab === 'shadowing' && shadowingVideoOpen;

  useEffect(() => {
    if (typeof onWorkspaceModeChange === 'function') {
      onWorkspaceModeChange(isExpandedView);
    }
  }, [isExpandedView, onWorkspaceModeChange]);

  useEffect(() => {
    return () => {
      if (typeof onWorkspaceModeChange === 'function') {
        onWorkspaceModeChange(false);
      }
    };
  }, [onWorkspaceModeChange]);

  const handleVoiceChange = (nextVoice) => {
    setSelectedVoice(nextVoice);
    setPreferredStudioVoice(nextVoice);
  };

  const tabs = [
    {
      id: 'shadowing',
      label: 'Shadowing Video',
      shortLabel: 'Shadowing',
      badge: shadowingClips.length || 12,
      icon: Video,
    },
    {
      id: 'dictation',
      label: 'Dictation Hội thoại',
      shortLabel: 'Dictation',
      badge: dictationCatalog?.lessons?.length || 139,
      icon: Keyboard,
    },
    {
      id: 'ipa',
      label: 'IPA & Phát âm AI',
      shortLabel: 'IPA & AI',
      badge: '44 âm',
      icon: Sparkles,
    },
  ];

  return (
    <div
      id="page-studio"
      className="page active min-h-screen text-[#2E2823] bg-[#FFF9F0] font-['Quicksand',sans-serif]"
    >
      <div className={`w-full min-w-0 ${isExpandedView ? 'pl-0' : 'lg:pl-[var(--sidebar-w,244px)]'}`}>
        <div
          className={`mx-auto px-3 sm:px-6 xl:px-8 pwa-safe-top ${
            isExpandedView
              ? 'max-w-[1600px] pt-2.5 sm:pt-3 pb-12 lg:pb-10'
              : 'max-w-[1440px] pt-3 sm:pt-4 lg:pt-5 space-y-3 sm:space-y-4 pb-24 lg:pb-12'
          }`}
        >
          {/* Compact Top Bar: Mode Switcher Pills + Right Action (hidden inside video study detail view) */}
          {!isExpandedView && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <nav className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2.5" aria-label="Chế độ luyện tập Studio">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border-2 border-[#3D352E] text-[11px] sm:text-sm font-black transition-all cursor-pointer active:translate-y-0.5 min-w-0 ${
                      isActive
                        ? 'bg-[#4D6B53] text-white shadow-[2.5px_2.5px_0px_#3D352E]'
                        : 'bg-[#fffcf7] text-[#554D42] hover:bg-white shadow-[1.5px_1.5px_0px_#3D352E]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="sm:hidden truncate">{tab.shortLabel}</span>
                      <span className="hidden sm:inline truncate">{tab.label}</span>
                    </div>
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border leading-none ${
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

            {/* Right action: Add YouTube button on Shadowing library, or Voice Selector on TTS tabs */}
            {activeTab === 'shadowing' && !shadowingVideoOpen && (
              <div className="flex items-center sm:ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShadowingAddForm((prev) => !prev)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2.5px_2.5px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Thêm video YouTube</span>
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black leading-none">
                    {shadowingQuota.authenticated
                      ? `${shadowingQuota.used}/${shadowingQuota.limit}`
                      : `Tối đa ${shadowingQuota.limit}`}
                  </span>
                </button>
              </div>
            )}

            {activeTab !== 'shadowing' && voicesList.length > 0 && (
              <div className="flex items-center sm:ml-auto shrink-0">
                <label className="flex items-center gap-1.5 bg-[#fffcf7] border-2 border-[#3D352E] rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-[2px_2px_0px_#3D352E] text-[11px] sm:text-xs font-bold max-w-[210px] sm:max-w-none">
                  <Volume2 className="w-3.5 h-3.5 text-[#4D6B53] shrink-0" />
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    aria-label="Chọn giọng đọc Kokoro"
                    className="bg-transparent font-extrabold text-[#2E2823] focus:outline-none cursor-pointer truncate"
                  >
                    {voicesList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.accent})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            </div>
          )}

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
                  onVideoOpenChange={setShadowingVideoOpen}
                  showAddForm={showShadowingAddForm}
                  onShowAddFormChange={setShowShadowingAddForm}
                  onQuotaChange={setShadowingQuota}
                />
              )}
              {activeTab === 'dictation' && (
                <DictationTab
                  catalog={dictationCatalog}
                  voice={selectedVoice}
                />
              )}
              {activeTab === 'ipa' && (
                <IpaLabTab
                  phonemeData={phonemeData}
                  minimalPairsData={minimalPairsData}
                  voice={selectedVoice}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageStudio;
