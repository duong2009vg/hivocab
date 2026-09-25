// src/components/dictionary/DictAudioBtn.jsx
// Nút phát âm audio chuẩn zero-delay kèm hiệu ứng loading

import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { playWord } from '../../services/audio.js';

export function DictAudioBtn({ word, className = '', size = 'md' }) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = async (e) => {
        e.stopPropagation();
        if (!word || isPlaying) return;

        setIsPlaying(true);
        try {
            await playWord(word);
        } catch (_) {}
        finally {
            setTimeout(() => setIsPlaying(false), 500);
        }
    };

    const sizeClasses = size === 'sm' 
        ? 'w-8 h-8 rounded-lg text-xs' 
        : 'w-10 h-10 rounded-xl text-sm';

    return (
        <button
            type="button"
            onClick={handlePlay}
            disabled={isPlaying}
            title={`Phát âm từ "${word}"`}
            className={`flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer active:scale-95 ${sizeClasses} ${className}`}
        >
            {isPlaying ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
                <Volume2 className="w-4 h-4 text-primary" />
            )}
        </button>
    );
}

export default DictAudioBtn;
