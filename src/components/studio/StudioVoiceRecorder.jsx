// src/components/studio/StudioVoiceRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Sparkles, Loader2, Server, Volume2 } from 'lucide-react';
import {
  scorePronunciation,
  getStudioApiUrl,
  prewarmStudioBackend,
  playStudioTts,
  stopStudioAudio,
} from '../../services/studioService.js';
import { convertBlobTo16kMonoWav, encodeFloat32ChunksTo16kMonoWav } from '../../utils/audioWavEncoder.js';
import { buildLocalPronunciationResult } from '../../utils/studioCore.js';
import PronunciationResultCard from './PronunciationResultCard.jsx';

const RECORDER_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/aac',
  'audio/ogg;codecs=opus',
];

function isIosBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1;
}

function pickSupportedRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  return RECORDER_MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

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
  onPlaySample,
  externalSamplePlaying = false,
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
  const speechSettledRef = useRef(true);
  const speechUsedRef = useRef(false);
  const pendingAutoScoreRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const expectedTextRef = useRef(expectedText);

  // Direct Web Audio PCM WAV capture (immune to iOS Safari MediaRecorder container bugs)
  const usingPcmModeRef = useRef(false);
  const pcmCtxRef = useRef(null);
  const pcmSourceRef = useRef(null);
  const pcmProcessorRef = useRef(null);
  const pcmGainRef = useRef(null);
  const pcmChunksRef = useRef([]);
  const pcmSampleRateRef = useRef(16000);

  useEffect(() => {
    expectedTextRef.current = expectedText;
  }, [expectedText]);

  const teardownPcmNodes = () => {
    if (pcmProcessorRef.current) {
      try {
        pcmProcessorRef.current.onaudioprocess = null;
        pcmProcessorRef.current.disconnect();
      } catch (_) {}
      pcmProcessorRef.current = null;
    }
    if (pcmSourceRef.current) {
      try {
        pcmSourceRef.current.disconnect();
      } catch (_) {}
      pcmSourceRef.current = null;
    }
    if (pcmGainRef.current) {
      try {
        pcmGainRef.current.disconnect();
      } catch (_) {}
      pcmGainRef.current = null;
    }
    if (pcmCtxRef.current) {
      try {
        if (pcmCtxRef.current.state !== 'closed') {
          pcmCtxRef.current.close().catch(() => {});
        }
      } catch (_) {}
      pcmCtxRef.current = null;
    }
  };

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
    pendingAutoScoreRef.current = null;
    speechSettledRef.current = true;
    speechUsedRef.current = false;
    usingPcmModeRef.current = false;
    pcmChunksRef.current = [];
    teardownPcmNodes();
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

  const isCustomSampleMode = typeof onPlaySample === 'function';
  const effectiveSamplePlaying = isCustomSampleMode ? Boolean(externalSamplePlaying) : samplePlaying;

  useEffect(() => {
    sampleTokenRef.current += 1;
    setSamplePlaying(false);
    if (!isCustomSampleMode) {
      stopStudioAudio();
    }
    pendingAutoScoreRef.current = null;
    setRecordedBlob(null);
    setRecordedUrl('');
    setResult(null);
    setError('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
  }, [expectedText, isCustomSampleMode]);

  const handleToggleSample = async () => {
    if (!expectedText) return;
    if (isCustomSampleMode) {
      onPlaySample();
      return;
    }
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
    };
  }, []);

  useEffect(() => {
    return () => {
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

  const finalizeRecordedBlob = async (rawBlob) => {
    if (!(rawBlob instanceof Blob) || rawBlob.size <= 0) {
      setError('Không thu được âm thanh từ micro. Vui lòng kiểm tra quyền micro và thử lại.');
      return;
    }

    // Ensure every browser playback URL uses universal WAV when decodable (fixes iOS Safari <audio> errors).
    let playbackBlob = rawBlob;
    if (!String(rawBlob.type || '').toLowerCase().includes('wav')) {
      const converted = await convertBlobTo16kMonoWav(rawBlob);
      if (converted instanceof Blob && converted.size > 44 && converted.type === 'audio/wav') {
        playbackBlob = converted;
      }
    }

    if (recordedUrl) {
      try {
        URL.revokeObjectURL(recordedUrl);
      } catch (_) {}
    }
    const url = URL.createObjectURL(playbackBlob);
    setRecordedBlob(playbackBlob);
    setRecordedUrl(url);

    // Only auto-score Free ($0, 0s) when SpeechRecognition was active on supported browsers.
    // On iOS, SpeechRecognition conflicts with getUserMedia AVAudioSession so user runs "Chấm sâu AI" directly.
    if (!speechUsedRef.current) return;

    const runAutoFreeScore = () => {
      if (finalizeTimerRef.current) {
        clearTimeout(finalizeTimerRef.current);
        finalizeTimerRef.current = null;
      }
      pendingAutoScoreRef.current = null;
      runLocalScore(liveTranscriptRef.current.trim());
    };

    if (speechSettledRef.current) {
      runAutoFreeScore();
    } else {
      pendingAutoScoreRef.current = runAutoFreeScore;
      finalizeTimerRef.current = setTimeout(runAutoFreeScore, 550);
    }
  };

  const finishPcmRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopSpeechRecognition();
    teardownPcmNodes();
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      streamRef.current = null;
    }
    usingPcmModeRef.current = false;
    setIsRecording(false);

    if (discardRef.current) {
      pcmChunksRef.current = [];
      return;
    }
    const chunks = pcmChunksRef.current;
    const srcRate = pcmSampleRateRef.current;
    pcmChunksRef.current = [];
    const wavBlob = encodeFloat32ChunksTo16kMonoWav(chunks, srcRate, 16000);
    finalizeRecordedBlob(wavBlob);
  };

  const startRecording = async () => {
    prewarmStudioBackend();
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

    const ios = isIosBrowser();
    const supportedMime = pickSupportedRecorderMimeType();
    const preferPcmWav = ios || !supportedMime || !supportedMime.includes('webm');

    // Synchronously unlock AudioContext inside user gesture for reliable iOS capture
    let preUnlockedCtx = null;
    if (preferPcmWav && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          preUnlockedCtx = new AudioCtx();
          if (preUnlockedCtx.state === 'suspended' && typeof preUnlockedCtx.resume === 'function') {
            preUnlockedCtx.resume().catch(() => {});
          }
        } catch (_) {
          preUnlockedCtx = null;
        }
      }
    }

    const SpeechCtor = !ios ? getSpeechRecognitionCtor() : null;
    const recLang = String(voice || '').startsWith('b') ? 'en-GB' : 'en-US';
    speechSettledRef.current = true;
    speechUsedRef.current = false;
    pendingAutoScoreRef.current = null;

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
        rec.onerror = () => {
          speechSettledRef.current = true;
        };
        rec.onend = () => {
          recognitionRef.current = null;
          speechSettledRef.current = true;
          if (typeof pendingAutoScoreRef.current === 'function') {
            const fn = pendingAutoScoreRef.current;
            pendingAutoScoreRef.current = null;
            fn();
          }
        };
        rec.start();
        recognitionRef.current = rec;
        speechSettledRef.current = false;
        speechUsedRef.current = true;
      } catch (_) {
        recognitionRef.current = null;
        speechSettledRef.current = true;
        speechUsedRef.current = false;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      discardRef.current = false;

      if (preferPcmWav && preUnlockedCtx && typeof preUnlockedCtx.createScriptProcessor === 'function') {
        try {
          if (preUnlockedCtx.state === 'suspended' && typeof preUnlockedCtx.resume === 'function') {
            await preUnlockedCtx.resume().catch(() => {});
          }
          pcmChunksRef.current = [];
          pcmSampleRateRef.current = preUnlockedCtx.sampleRate || 44100;
          const source = preUnlockedCtx.createMediaStreamSource(stream);
          const processor = preUnlockedCtx.createScriptProcessor(4096, 1, 1);
          const silentGain = preUnlockedCtx.createGain();
          silentGain.gain.value = 0;

          processor.onaudioprocess = (ev) => {
            const input = ev.inputBuffer?.getChannelData?.(0);
            if (input && input.length > 0) {
              pcmChunksRef.current.push(new Float32Array(input));
            }
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(preUnlockedCtx.destination);

          pcmCtxRef.current = preUnlockedCtx;
          pcmSourceRef.current = source;
          pcmProcessorRef.current = processor;
          pcmGainRef.current = silentGain;
          usingPcmModeRef.current = true;

          setIsRecording(true);
          setSeconds(0);
          let elapsed = 0;
          timerRef.current = setInterval(() => {
            elapsed += 1;
            setSeconds(elapsed);
            if (elapsed >= 20) {
              stopRecording();
            }
          }, 1000);
          return;
        } catch (_) {
          teardownPcmNodes();
          usingPcmModeRef.current = false;
        }
      }

      if (preUnlockedCtx && preUnlockedCtx.state !== 'closed') {
        try {
          preUnlockedCtx.close().catch(() => {});
        } catch (_) {}
      }

      chunksRef.current = [];
      const recorder = supportedMime ? new MediaRecorder(stream, { mimeType: supportedMime }) : new MediaRecorder(stream);
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
        const firstTypedChunk = chunksRef.current.find((c) => c && c.type);
        const resolvedMime =
          recorder.mimeType || firstTypedChunk?.type || supportedMime || (ios ? 'audio/mp4' : 'audio/webm');
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        finalizeRecordedBlob(blob);
      };

      recorder.start(500);
      setIsRecording(true);
      setSeconds(0);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= 20) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      if (preUnlockedCtx && preUnlockedCtx.state !== 'closed') {
        try {
          preUnlockedCtx.close().catch(() => {});
        } catch (_) {}
      }
      teardownPcmNodes();
      stopSpeechRecognition();
      setError(err?.message || 'Không thể truy cập micro. Hãy cấp quyền micro cho trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (usingPcmModeRef.current) {
      discardRef.current = false;
      finishPcmRecording();
      return;
    }
    stopSpeechRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      discardRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const hasServer = Boolean(getStudioApiUrl());

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
            <span>
              {speechUsedRef.current
                ? `Hoàn thành ghi (${seconds}s) · Tự động chấm Free`
                : `Hoàn thành ghi (${seconds}s)`}
            </span>
          </button>
        )}

        {showSampleButton && expectedText && !isRecording && (
          <button
            type="button"
            onClick={handleToggleSample}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${
              effectiveSamplePlaying
                ? 'bg-[#EEF5EC] text-[#355A3B]'
                : 'bg-white hover:bg-[#FAF5EB] text-[#2E2823]'
            }`}
            title={isCustomSampleMode ? 'Nghe đoạn mẫu trực tiếp từ video YouTube' : 'Nghe câu mẫu để nhại giọng theo'}
          >
            <Volume2 className={`w-4 h-4 shrink-0 ${effectiveSamplePlaying ? 'animate-pulse text-[#4D6B53]' : ''}`} />
            <span>
              {isCustomSampleMode
                ? effectiveSamplePlaying
                  ? 'Dừng mẫu video'
                  : 'Nghe mẫu video'
                : effectiveSamplePlaying
                ? 'Đang đọc mẫu…'
                : 'Đọc mẫu'}
            </span>
          </button>
        )}

        {recordedBlob && !isRecording && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleScoreModal()}
              disabled={scoring}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 min-h-[42px] sm:min-h-0"
              title="AI nghe kỹ từng âm để chỉ ra lỗi sai và hướng dẫn cách sửa miệng/lưỡi"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
              <span>{scoring ? 'Đang chấm sâu AI…' : 'Chấm sâu AI'}</span>
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
          <audio key={recordedUrl} controls playsInline preload="auto" className="w-full h-8">
            <source src={recordedUrl} type={recordedBlob?.type || 'audio/wav'} />
          </audio>
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-[#B53D2A] bg-[#FDECE8] border border-[#D96B43]/40 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <PronunciationResultCard
          data={result}
          targetText={expectedText}
          voice={voice}
          recordedUrl={recordedUrl}
          onPlaySample={isCustomSampleMode ? onPlaySample : undefined}
          samplePlaying={effectiveSamplePlaying}
          onRequestDeepAi={() => handleScoreModal()}
          scoringDeepAi={scoring}
        />
      )}
    </div>
  );
}

export default StudioVoiceRecorder;
