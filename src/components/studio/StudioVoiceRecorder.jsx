// src/components/studio/StudioVoiceRecorder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Sparkles, Loader2, Server } from 'lucide-react';
import { scorePronunciation, getStudioApiUrl } from '../../services/studioService.js';
import PronunciationResultCard from './PronunciationResultCard.jsx';

export function StudioVoiceRecorder({
  expectedText,
  voice = 'af_heart',
  compact = false,
  onScored,
  onOpenSetup,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const discardRef = useRef(false);

  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    setResult(null);
    setError('');
  }, [expectedText]);

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
    setResult(null);
    setError('');
  };

  const startRecording = async () => {
    setError('');
    setResult(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ ghi âm micro (yêu cầu HTTPS hoặc localhost).');
      return;
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
      };

      recorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 45) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError(err?.message || 'Không thể truy cập micro. Hãy cấp quyền micro cho trình duyệt.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      discardRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const handleScore = async () => {
    if (!recordedBlob || !expectedText) return;
    if (!getStudioApiUrl()) {
      if (onOpenSetup) onOpenSetup();
      setError('Chưa gắn URL Modal.com AI Server. Bấm "Cài đặt AI Server" để kết nối OpenPronounce.');
      return;
    }
    setScoring(true);
    setError('');
    try {
      const data = await scorePronunciation({
        blob: recordedBlob,
        expectedText,
        lang: 'en',
      });
      setResult(data);
      if (typeof onScored === 'function') {
        onScored(data);
      }
    } catch (err) {
      setError(err?.message || 'Chấm phát âm thất bại.');
    } finally {
      setScoring(false);
    }
  };

  const hasServer = Boolean(getStudioApiUrl());

  return (
    <div className={`space-y-3 ${compact ? '' : 'bg-[#FAF5EB] border-2 border-[#3D352E] rounded-2xl p-3.5'}`}>
      {/* Recorder Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!expectedText}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D96B43] hover:bg-[#C85A3F] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            <span>{recordedBlob ? 'Ghi âm lại' : 'Ghi âm giọng nói'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E2823] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] animate-pulse cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Dừng ghi ({seconds}s)</span>
          </button>
        )}

        {recordedBlob && !isRecording && (
          <>
            <button
              type="button"
              onClick={handleScore}
              disabled={scoring}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4D6B53] hover:bg-[#3f5844] text-white text-xs sm:text-sm font-black border-2 border-[#3D352E] shadow-[2px_2px_0px_#3D352E] active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-60"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{scoring ? 'Đang chấm IPA…' : 'Chấm phát âm AI'}</span>
            </button>

            <button
              type="button"
              onClick={clearAudio}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-[#FBECE7] text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer"
              title="Xóa bản ghi âm"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {!hasServer && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4E3B4] hover:bg-[#edd79d] text-[#3D352E] text-xs font-bold border-2 border-[#3D352E] cursor-pointer ml-auto"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Gắn AI Modal.com để chấm điểm</span>
          </button>
        )}
      </div>

      {/* Playback of User's Own Voice ($0 local feature) */}
      {recordedUrl && (
        <div className="flex items-center gap-2 bg-white border border-[#E8DEC8] rounded-xl px-3 py-1.5">
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
