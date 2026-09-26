'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Mic2, Sparkles, Volume2 } from 'lucide-react';
import type { VoiceState } from '@/types';
import { cn } from '@/lib/utils';

type VoiceOrbProps = { voiceState: VoiceState; onToggle: () => void; disabled?: boolean; simplifiedMode?: boolean };

const STATE_CONFIG: Record<VoiceState, { label: string; sublabel: string; icon: ReactNode; color: string; glow: string; animate: boolean }> = {
  idle: { label: 'Tap to speak', sublabel: 'Press Spacebar or tap to activate', icon: <Mic2 size={38} />, color: '#7466dd', glow: 'rgba(116,102,221,.5)', animate: false },
  listening: { label: 'Listening…', sublabel: 'Speak now — I am listening carefully', icon: <Mic2 size={38} />, color: '#c265a8', glow: 'rgba(194,101,168,.5)', animate: true },
  processing: { label: 'Thinking…', sublabel: 'Analysing your response…', icon: <Loader2 size={38} className="animate-spin" />, color: '#b9915a', glow: 'rgba(185,145,90,.45)', animate: true },
  speaking: { label: 'Speaking…', sublabel: 'Listen to the instruction', icon: <Volume2 size={38} />, color: '#3ea995', glow: 'rgba(62,169,149,.45)', animate: true },
  confirming: { label: 'Needs confirmation', sublabel: 'Say yes to proceed or no to change', icon: <AlertCircle size={38} />, color: '#ba8b4f', glow: 'rgba(186,139,79,.48)', animate: true },
  success: { label: 'Action completed', sublabel: 'Great job!', icon: <CheckCircle2 size={38} />, color: '#3ea995', glow: 'rgba(62,169,149,.42)', animate: false },
  error: { label: 'Please try again', sublabel: 'Tap the orb to restart', icon: <AlertCircle size={38} />, color: '#b55773', glow: 'rgba(181,87,115,.45)', animate: false },
};

export function VoiceOrb({ voiceState, onToggle, disabled, simplifiedMode }: VoiceOrbProps) {
  const config = STATE_CONFIG[voiceState];
  const isClickable = ['idle', 'listening', 'confirming', 'success', 'error'].includes(voiceState);
  return <div className="voice-orb-wrap">
    <div className="relative flex items-center justify-center p-7">
      <motion.div className="absolute h-64 w-64 rounded-full blur-3xl pointer-events-none" style={{ background: config.glow }} animate={config.animate ? { scale: [1, 1.2, 1], opacity: [.45, .78, .45] } : { scale: 1, opacity: .45 }} transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }} />
      <AnimatePresence>{config.animate && <><motion.div initial={{ width: 145, height: 145, opacity: .7 }} animate={{ width: 285, height: 285, opacity: 0 }} transition={{ duration: 2.8, repeat: Infinity }} className="absolute rounded-full border" style={{ borderColor: config.color }} /><motion.div initial={{ width: 145, height: 145, opacity: .6 }} animate={{ width: 225, height: 225, opacity: 0 }} transition={{ duration: 2.8, repeat: Infinity, delay: .7 }} className="absolute rounded-full border" style={{ borderColor: config.color }} /></>}</AnimatePresence>
      <motion.button type="button" onClick={isClickable && !disabled ? onToggle : undefined} disabled={!isClickable || disabled} className={cn('voice-orb-button', (!isClickable || disabled) && 'opacity-75 cursor-not-allowed')} style={{ background: `linear-gradient(145deg, ${config.color}, #3c3a73)`, boxShadow: `0 22px 52px -11px ${config.glow}, inset 0 2px 10px rgba(255,255,255,.32)` }} whileHover={isClickable && !disabled ? { scale: 1.05 } : {}} whileTap={isClickable && !disabled ? { scale: .95 } : {}} aria-label={config.label} id="voice-orb-button"><span className="voice-orb-reflection" /><span className="voice-orb-inner"><AnimatePresence mode="wait"><motion.span key={voiceState} initial={{ scale: .65, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .65, opacity: 0 }} transition={{ duration: .22 }}>{config.icon}</motion.span></AnimatePresence></span></motion.button>
    </div>
    <motion.div key={config.label} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <p className={cn('voice-orb-label', simplifiedMode && 'text-2xl')}>{config.label}</p><p className="voice-orb-sublabel">{config.sublabel}</p>
      {simplifiedMode && <motion.span initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="assist-badge"><Sparkles size={12} /> Adaptive assist active</motion.span>}
    </motion.div>
  </div>;
}

