'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, History, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';

import { VoiceOrb } from '@/components/voice/VoiceOrb';
import { InstructionCard } from '@/components/voice/InstructionCard';
import { StepProgress } from '@/components/voice/StepProgress';
import { ConfirmationModal } from '@/components/voice/ConfirmationModal';
import { ConversationPanel } from '@/components/voice/ConversationPanel';
import { LogoMark } from '@/components/layout/WorkspaceShell';
import { useVoice } from '@/hooks/useVoice';
import { useConversation } from '@/hooks/useConversation';
import { useAccessibility } from '@/hooks/useAccessibility';
import { SKILL_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getToken, getStoredUser } from '@/lib/api';
import type { Language, SpeakingSpeed, VoiceState } from '@/types';

export default function VoicePage() {
  const { settings } = useAccessibility();
  const [showPanel, setShowPanel] = useState(false);
  const [interim, setInterim] = useState('');
  const [homeHref, setHomeHref] = useState('/dashboard/teacher');
  const processingRef = useRef(false);
  const bootedRef = useRef(false);

  const { state, isLoading, error, startSession, sendText, setVoiceState } = useConversation({
    onSpeak: (text, voiceTag) => { voice.speak(text, voiceTag); setVoiceState('speaking'); },
  });

  const voice = useVoice({
    language: settings.language as Language,
    speed: settings.speakingSpeed as SpeakingSpeed,
    onTranscript: (text, isFinal) => {
      setInterim(isFinal ? '' : text);
      if (isFinal && text.trim() && !processingRef.current) {
        processingRef.current = true;
        setVoiceState('processing');
        sendText(text).finally(() => { processingRef.current = false; });
      }
    },
    onSpeechEnd: () => { if (state.voiceState === 'listening') setVoiceState('idle'); },
  });

  useEffect(() => {
    if (state.voiceState === 'speaking' && !voice.isSpeaking && !isLoading) {
      const t = setTimeout(() => { if (!state.awaitingConfirmation) setVoiceState('idle'); else setVoiceState('confirming'); }, 300);
      return () => clearTimeout(t);
    }
  }, [voice.isSpeaking, isLoading, state.voiceState, state.awaitingConfirmation, setVoiceState]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    const user = getStoredUser();
    if (user?.role) setHomeHref(`/dashboard/${user.role}`);
    const startVoiceSession = async () => {
      await startSession((user?.preferred_lang || 'en') as Language, (user?.speaking_speed || 'normal') as SpeakingSpeed);
      const prompt = localStorage.getItem('voice_prompt');
      if (prompt) { localStorage.removeItem('voice_prompt'); setTimeout(() => { sendText(prompt); }, 350); }
    };
    void startVoiceSession();
  // This boot sequence intentionally runs once per voice page, matching the existing session lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); handleOrbToggle(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.voiceState, voice.isListening]);

  const handleOrbToggle = useCallback(() => {
    if (voice.isSpeaking) { voice.stopSpeaking(); setVoiceState('idle'); return; }
    if (state.voiceState === 'idle' || state.voiceState === 'error' || state.voiceState === 'success') { setVoiceState('listening'); voice.startListening(); }
    else if (state.voiceState === 'listening') { voice.stopListening(); setVoiceState('idle'); }
    else if (state.voiceState === 'confirming') voice.startListening();
  }, [voice, state.voiceState, setVoiceState]);

  const lastResponse = state.lastResponse;
  const isConfirmation = state.awaitingConfirmation;
  const isSuccess = !!state.messages.at(-1)?.isExecution;
  const skillIcon = state.currentSkill ? SKILL_ICONS[state.currentSkill] : undefined;

  return (
    <div className="voice-shell">
      <div className="ambient ambient-purple" aria-hidden="true" /><div className="ambient ambient-cyan" aria-hidden="true" />
      <header className="voice-topbar">
        <Link href={homeHref} className="voice-topbar-back"><ArrowLeft size={17} /><span className="hidden sm:inline">Back to workspace</span></Link>
        <Link href="/" className="voice-title"><LogoMark compact /><span>CogniVoice assistant</span></Link>
        <div className="voice-topbar-actions"><button type="button" onClick={() => setShowPanel(p => !p)} className={cn('icon-button', showPanel && 'voice-action-active')} aria-label="Toggle transcript"><History size={16} /><span className="hidden md:inline text-xs font-semibold">Transcript</span></button><Link href="/settings" className="icon-button" aria-label="Open settings"><Settings size={16} /></Link></div>
      </header>

      <main className="voice-main">
        <div className={cn('voice-workspace', showPanel && 'voice-workspace-drawer-open')}>
          <div className="voice-progress-wrap"><AnimatePresence>{state.currentSkill && <StepProgress currentStep={state.currentStep} totalSteps={state.totalSteps} skillName={state.currentSkill} simplified={settings.fontSize === 'xlarge' || state.simplifiedMode} />}</AnimatePresence></div>
          <div className="voice-center">{lastResponse ? <InstructionCard text={lastResponse} isConfirmation={isConfirmation} isSuccess={isSuccess} simplifiedMode={state.simplifiedMode} skill={state.currentSkill} skillIcon={skillIcon} /> : <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="voice-placeholder ui-card"><span className="voice-placeholder-icon"><MessageSquare size={23} /></span><h2>Your voice space is ready.</h2><p>Tap the orb below or press Spacebar to begin. Try asking for attendance, homework help or a reminder.</p><div className="voice-hints"><span className="voice-hint">“Take attendance for Class 8A”</span><span className="voice-hint">“Help me with homework”</span><span className="voice-hint">“Set a reminder”</span></div></motion.div>}</div>
          <div className="voice-controls"><VoiceOrb voiceState={state.voiceState as VoiceState} onToggle={handleOrbToggle} disabled={isLoading} simplifiedMode={state.simplifiedMode} /><AnimatePresence>{interim && <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 7 }} className="transcript-pill"><span className="transcript-dot" />{interim}</motion.div>}</AnimatePresence>{error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="voice-notice voice-notice-error">{error}</motion.p>}{!voice.isSupported && <p className="voice-notice voice-notice-warning">Voice recognition is not available in this browser. Try Chrome or Edge.</p>}</div>
        </div>

        <AnimatePresence>{showPanel && <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 390, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: .3, ease: [0.16, 1, .3, 1] }} className="transcript-drawer"><div className="drawer-header"><h2><MessageSquare size={14} /> Live transcript</h2><span className="drawer-count">{state.messages.length} messages</span></div><div className="conversation-panel-wrap"><ConversationPanel messages={state.messages} simplified={state.simplifiedMode} transcript={interim} /></div></motion.aside>}</AnimatePresence>
      </main>

      <ConfirmationModal open={state.awaitingConfirmation} message={lastResponse} onConfirm={() => sendText('yes')} onDeny={() => sendText('no')} simplified={state.simplifiedMode || settings.fontSize === 'xlarge'} />
    </div>
  );
}
