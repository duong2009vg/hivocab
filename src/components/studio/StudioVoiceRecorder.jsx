// src/components/studio/StudioVoiceRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Sparkles, Loader2, Server, Zap, Volume2 } from 'lucide-react';
import {
  scorePronunciation,
  getStudioApiUrl,
  playStudioTts,
  stopStudioAudio,
} from '../../services/studioService.js';
import { buildLocalPronunciationResult } from '../../utils/studioCore.js';
import PronunciationResultCard from './PronunciationResultCard.jsx';

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function StudioVoiceRecorder({
  expectedText,
  voice = 'af_heart',
  compact = false,
  showSampleButton = false,
  onBeforePlaySample,
  onScored,
  onOpenSetup,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [scoring, setScoring] = useState(false);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const sampleTokenRef = useRef(0);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const finalizeTimerRef = useRef(null);
  const discardRef = useRef(false);
  const liveTranscriptRef = useRef('');
  const expectedTextRef = useRef(expectedText);

  useEffect(() => {
    expectedTextRef.current = expectedText;
  }, [expectedText]);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      discardRef.current = true;
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  useEffect(() => {
    sampleTokenRef.current += 1;
    setSamplePlaying(false);
    stopStudioAudio();
    setResult(null);
    setError('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
  }, [expectedText]);

  const handleToggleSample = async () => {
    if (!expectedText) return;
    if (samplePlaying) {
      sampleTokenRef.current += 1;
      stopStudioAudio();
      setSamplePlaying(false);
      return;
    }
    if (typeof onBeforePlaySample === 'function') {
      onBeforePlaySample();
    }
    const token = ++sampleTokenRef.current;
    setSamplePlaying(true);
    try {
      await playStudioTts({
        text: expectedText,
        voice,
        speed: 0.92,
        onEnded: () => {
          if (sampleTokenRef.current === token) {
            setSamplePlaying(false);
          }
        },
      });
    } catch (_) {
      if (sampleTokenRef.current === token) {
        setSamplePlaying(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
      if (recordedUrl) {
        try {
          URL.revokeObjectURL(recordedUrl);
        } catch (_) {}
      }
    };
  }, [recordedUrl]);

  const clearAudio = () => {
    if (recordedUrl) {
      try {
        URL.revokeObjectURL(recordedUrl);
      } catch (_) {}
    }
    setRecordedBlob(null);
    setRecordedUrl('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setResult(null);
    setError('');
  };

  const runLocalScore = (transcriptText) => {
    const target = expectedTextRef.current;
    if (!target) return null;
    const data = buildLocalPronunciationResult(target, transcriptText);
    setResult(data);
    if (typeof onScored === 'function') {
      onScored(data);
    }
    return data;
  };

  const handleScoreModal = async (blobOverride = null) => {
    const targetBlob = blobOverride || recordedBlob;
    if (!targetBlob || !expectedTextRef.current) return;
    if (!getStudioApiUrl()) {
      if (onOpenSetup) onOpenSetup();
      setError('Chưa gắn URL Modal.com AI Server. Vui lòng thiết lập tại Admin → Shadowing & Dictation.');
      return;
    }
    setScoring(true);
    setError('');
    try {
      const data = await scorePronunciation({
        blob: targetBlob,
        expectedText: expectedTextRef.current,
        lang: 'en',
      });
      setResult(data);
      if (typeof onScored === 'function') {
        onScored(data);
      }
    } catch (err) {
      setError(err?.message || 'Chấm phát âm AI thất bại.');
    } finally {
      setScoring(false);
    }
  };

  const startRecording = async () => {
    sampleTokenRef.current += 1;
    setSamplePlaying(false);
    stopStudioAudio();
    setError('');
    setResult(null);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ ghi âm micro (yêu cầu HTTPS hoặc localhost).');
      return;
    }

    const SpeechCtor = getSpeechRecognitionCtor();
    const recLang = String(voice || '').startsWith('b') ? 'en-GB' : 'en-US';
    let recognitionActive = false;

    if (SpeechCtor) {
      try {
        const rec = new SpeechCtor();
        rec.lang = recLang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event) => {
          let combined = '';
          for (let i = 0; i < event.results.length; i++) {
            const seg = event.results[i]?.[0]?.transcript || '';
            if (seg) combined += (combined ? ' ' : '') + seg.trim();
          }
          if (combined) {
            liveTranscriptRef.current = combined.trim();
            setLiveTranscript(liveTranscriptRef.current);
          }
        };
        rec.onerror = () => {};
        rec.onend = () => {
          recognitionRef.current = null;
        };
        rec.start();
        recognitionRef.current = rec;
        recognitionActive = true;
      } catch (_) {
        recognitionRef.current = null;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];
      discardRef.current = false;

      const mimeType =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stopSpeechRecognition();
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch (_) {}
        streamRef.current = null;
        setIsRecording(false);

        if (discardRef.current || !chunksRef.current.length) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordedUrl) {
          try {
            URL.revokeObjectURL(recordedUrl);
          } catch (_) {}
        }
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);

        // Give Web Speech API 220ms to flush its final result, then score instantly ($0, 0.1s)
        finalizeTimerRef.current = setTimeout(() => {
          finalizeTimerRef.current = null;
          const captured = liveTranscriptRef.current.trim();
          if (captured) {
            runLocalScore(captured);
          } else if (!recognitionActive && getStudioApiUrl()) {
            // Browser lacks Web Speech API (e.g. Firefox / iOS WebView) -> auto score via Modal
            handleScoreModal(blob);
          }
        }, 220);
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 20) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      stopSpeechRecognition();
      setError(err?.message || 'Không thể truy cập micro. Hãy cấp quyền micro cho trình duyệt.');
    }
  };

  const stopRecording = () => {
    stopSpeechRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      discardRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const hasServer = Boolean(getStudioApiUrl());
  const supportsSpeech = Boolean(getSpeechRecognitionCtor());

  return (
    <div className={`space-y-3 ${compact ? '' : 'bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-3 sm:p-3.5'}`}>
      {/* Recorder Controls (Mobile-first grid, Desktop flex) */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!expectedText}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-0"
          >
            <Mic className="w-4 h-4 shrink-0" />
            <span>{recordedBlob ? 'Ghi âm lại' : 'Ghi âm giọng nói'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-[#2E2823] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] animate-pulse cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <Square className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Dừng ghi ({seconds}s) · Tự động chấm</span>
          </button>
        )}

        {showSampleButton && expectedText && !isRecording && (
          <button
            type="button"
            onClick={handleToggleSample}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${
              samplePlaying
                ? 'bg-[#EEF5EC] text-[#355A3B]'
                : 'bg-white hover:bg-[#FAF5EB] text-[#2E2823]'
            }`}
            title="Nghe câu mẫu để nhại giọng theo"
          >
            <Volume2 className={`w-4 h-4 shrink-0 ${samplePlaying ? 'animate-pulse text-[#4D6B53]' : ''}`} />
            <span>{samplePlaying ? 'Đang đọc mẫu…' : 'Đọc mẫu'}</span>
          </button>
        )}

        {recordedBlob && !isRecording && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {supportsSpeech && liveTranscript.trim() && (
              <button
                type="button"
                onClick={() => runLocalScore(liveTranscript)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EEF5EC] hover:bg-[#dfeedc] text-[#355A3B] text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer min-h-[42px] sm:min-h-0"
                title="Chấm tức thì trên trình duyệt, không tốn credit Modal"
              >
                <Zap className="w-4 h-4 text-[#4D6B53] shrink-0" />
                <span>Chấm Nhanh (0s · Free)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleScoreModal()}
              disabled={scoring}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 min-h-[42px] sm:min-h-0"
              title="Phân tích âm vị IPA sâu bằng mô hình Wav2Vec2 trên Modal.com"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
              <span>{scoring ? 'Đang chấm IPA…' : 'Chấm Sâu IPA (AI Modal · ~3s)'}</span>
            </button>

            <button
              type="button"
              onClick={clearAudio}
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-white hover:bg-[#FBECE7] text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer min-h-[42px] sm:min-h-0"
              title="Xóa bản ghi âm"
              aria-label="Xóa bản ghi âm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {!hasServer && onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4E3B4] hover:bg-[#edd79d] text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer sm:ml-auto"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Gắn AI Modal để chấm IPA sâu</span>
          </button>
        )}
      </div>

      {/* Live Web Speech preview while recording */}
      {isRecording && liveTranscript && (
        <div className="text-xs font-bold text-[#4D6B53] bg-[#EEF5EC] border border-[#4D6B53]/40 rounded-xl px-3 py-2">
          <span className="uppercase text-[10px] tracking-wide font-black mr-1.5">Đang nghe:</span>
          <span className="italic">"{liveTranscript}"</span>
        </div>
      )}

      {/* Playback of User's Own Voice ($0 local feature) */}
      {recordedUrl && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 bg-white border border-[#E8DEC8] rounded-xl px-3 py-2">
          <span className="text-[11px] font-bold text-[#786F66] shrink-0">Bản thu của bạn:</span>
          <audio controls src={recordedUrl} className="w-full h-8" />
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-[#B53D2A] bg-[#FDECE8] border border-[#D96B43]/40 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <PronunciationResultCard data={result} targetText={expectedText} voice={voice} />
      )}
    </div>
  );
}

export default StudioVoiceRecorder;
