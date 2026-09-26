/**
 * useConversation — manages session state, API calls, and voice output.
 * Orchestrates: startSession → sendText → speak response → repeat.
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as api from '@/lib/api';
import { ConversationMessage, VoiceSessionState, Language, SpeakingSpeed } from '@/types';

const DEFAULT_STATE: VoiceSessionState = {
  sessionId: null,
  voiceState: 'idle',
  currentSkill: null,
  currentStep: 0,
  totalSteps: 0,
  awaitingConfirmation: false,
  simplifiedMode: false,
  confusionScore: 0,
  lastResponse: '',
  messages: [],
};

interface UseConversationOptions {
  onSpeak?: (text: string, voiceTag: string) => void;
  onStateChange?: (state: VoiceSessionState) => void;
}

export function useConversation({ onSpeak, onStateChange }: UseConversationOptions = {}) {
  const [state, setState] = useState<VoiceSessionState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);

  const updateState = useCallback((updates: Partial<VoiceSessionState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      stateRef.current = next;
      onStateChange?.(next);
      return next;
    });
  }, [onStateChange]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, extra: Partial<ConversationMessage> = {}) => {
    const msg: ConversationMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      ...extra,
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, msg],
    }));
    return msg;
  }, []);

  // ── Session management ───────────────────────────────────────────────────

  const startSession = useCallback(async (language: Language = 'en', speed: SpeakingSpeed = 'normal') => {
    setError(null);
    updateState({ voiceState: 'processing' });
    try {
      const res = await api.startSession(language, speed);
      updateState({
        sessionId: res.session_id,
        voiceState: 'speaking',
        lastResponse: res.greeting,
        messages: [],
      });
      addMessage('assistant', res.greeting);
      onSpeak?.(res.greeting, res.voice_tag);
    } catch (e) {
      setError((e as Error).message);
      updateState({ voiceState: 'error' });
    }
  }, [updateState, addMessage, onSpeak]);

  const endSession = useCallback(async () => {
    const { sessionId } = stateRef.current;
    if (sessionId) {
      try { await api.endSession(sessionId); } catch { /* ignore */ }
    }
    updateState(DEFAULT_STATE);
  }, [updateState]);

  // ── Send text to backend ─────────────────────────────────────────────────

  const sendText = useCallback(async (text: string) => {
    const { sessionId } = stateRef.current;
    if (!sessionId || !text.trim()) return;

    addMessage('user', text);
    updateState({ voiceState: 'processing' });
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.sendChat(sessionId, text);

      const isConfirm = res.awaiting_confirmation;
      const isExec = !!res.execution_result;
      addMessage('assistant', res.response, { isConfirmation: isConfirm, isExecution: isExec });

      updateState({
        voiceState: 'speaking',
        currentSkill: res.skill,
        currentStep: res.step,
        totalSteps: res.total_steps,
        awaitingConfirmation: res.awaiting_confirmation,
        simplifiedMode: res.simplified_mode,
        confusionScore: res.confusion_score,
        lastResponse: res.response,
      });

      onSpeak?.(res.response, res.voice_tag);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      updateState({ voiceState: 'error' });
      addMessage('assistant', "I'm sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateState, onSpeak]);

  const setVoiceState = useCallback((vs: VoiceSessionState['voiceState']) => {
    updateState({ voiceState: vs });
  }, [updateState]);

  return {
    state,
    isLoading,
    error,
    startSession,
    endSession,
    sendText,
    setVoiceState,
  };
}
