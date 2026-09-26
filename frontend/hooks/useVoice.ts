/**
 * useVoice — manages Web Speech API (STT + TTS) lifecycle.
 *
 * STT: browser SpeechRecognition API (Chrome/Edge)
 * TTS: browser SpeechSynthesis API (all modern browsers)
 *
 * Falls back gracefully when APIs are unavailable.
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeakingSpeed, Language } from '@/types';

const SPEED_RATES: Record<SpeakingSpeed, number> = {
  slow: 0.75,
  normal: 1.0,
  fast: 1.3,
};

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

export interface UseVoiceOptions {
  language?: Language;
  speed?: SpeakingSpeed;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, voiceTag?: string) => void;
  stopSpeaking: () => void;
  toggleListening: () => void;
}

export function useVoice({
  language = 'en',
  speed = 'normal',
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  onError,
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  // Init SpeechRecognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const langMap: Record<Language, string> = {
      en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN',
      te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
    };
    recognition.lang = langMap[language] || 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      const current = finalTranscript || interimTranscript;
      setTranscript(current);
      onTranscript?.(current, !!finalTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        onError?.(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      recognition.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    try {
      recognitionRef.current.start();
      onSpeechStart?.();
    } catch {
      // Already started
    }
  }, [isListening, onSpeechStart]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    onSpeechEnd?.();
  }, [isListening, onSpeechEnd]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const speak = useCallback(
    (text: string, voiceTag?: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<Language, string> = {
        en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN',
        te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
      };
      utterance.lang = voiceTag || langMap[language] || 'en-IN';
      utterance.rate = SPEED_RATES[speed];
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [language, speed],
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleListening,
  };
}
