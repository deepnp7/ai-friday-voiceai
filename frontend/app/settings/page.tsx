'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Languages, RotateCcw, ShieldCheck, Sparkles, Type, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { FONT_SIZES, LANGUAGES, SPEAKING_SPEEDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getStoredUser } from '@/lib/api';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import type { Role } from '@/types';

export default function SettingsPage() {
  const { settings, setFontSize, setHighContrast, setReducedMotion, setSpeakingSpeed, setLanguage, setVoiceOnly } = useAccessibility();
  const currentLanguage = useMemo(() => LANGUAGES.find(entry => entry.code === settings.language) ?? LANGUAGES[0], [settings.language]);
  const user = getStoredUser();
  const role = (user?.role as Role) || 'teacher';

  return (
    <WorkspaceShell role={role} userName={user?.name} active="settings" eyebrow="Workspace preferences" title="Accessibility & voice">
      <div className="page-intro"><div className="page-intro-copy"><div className="eyebrow"><Sparkles size={13} /> Built around your comfort</div><h1 className="page-title">Make it feel <span className="gradient-text-vivid">like yours.</span></h1><p className="page-subtitle">Tune typography, voice cadence and cognitive support. Your preferences are saved in this browser and ready for the next session.</p></div></div>

      <div className="settings-grid">
        <SettingsCard title="Text scale" description="Choose a comfortable reading size." icon={<Type size={17} />}><div className="choice-grid">{FONT_SIZES.map(option => <button key={option.value} type="button" onClick={() => setFontSize(option.value)} className={cn('choice-button', settings.fontSize === option.value && 'choice-button-active')}>{option.label}</button>)}</div></SettingsCard>
        <SettingsCard title="Speech rate" description="Set the pace for spoken guidance." icon={<Volume2 size={17} />}><div className="choice-grid">{SPEAKING_SPEEDS.map(option => <button key={option.value} type="button" onClick={() => setSpeakingSpeed(option.value)} className={cn('choice-button', settings.speakingSpeed === option.value && 'choice-button-active')}>{option.label}</button>)}</div></SettingsCard>
        <SettingsCard title="Language & voice" description="Choose the language you speak with." icon={<Languages size={17} />}><div className="language-current"><strong><span>{currentLanguage.flag}</span>{currentLanguage.name}</strong><small>Recognition locale · {settings.language}</small></div><div className="language-grid">{LANGUAGES.map(option => <button key={option.code} type="button" onClick={() => setLanguage(option.code)} className={cn('choice-button', settings.language === option.code && 'choice-button-active')}><span>{option.flag}</span> {option.code.toUpperCase()}</button>)}</div></SettingsCard>
        <SettingsCard title="Comfort & contrast" description="Keep the interface easy to follow." icon={<ShieldCheck size={17} />}><div className="toggle-list"><ToggleRow label="High contrast colors" description="Maximise text and border visibility." checked={settings.highContrast} onChange={setHighContrast} /><ToggleRow label="Reduced motion" description="Quiet decorative animations." checked={settings.reducedMotion} onChange={setReducedMotion} /><ToggleRow label="Voice-only screen" description="Focus on the active voice workflow." checked={settings.voiceOnly} onChange={setVoiceOnly} /></div></SettingsCard>
      </div>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="profile-bar ui-card"><div className="profile-copy"><span className="profile-copy-icon"><Eye size={17} /></span><span><h2>Active accessibility profile</h2><p>Text: <strong>{settings.fontSize}</strong> · Pace: <strong>{settings.speakingSpeed}</strong> · Voice: <strong>{settings.language.toUpperCase()}</strong></p></span></div><button type="button" onClick={() => { setFontSize('normal'); setHighContrast(false); setReducedMotion(false); setSpeakingSpeed('normal'); setLanguage('en'); setVoiceOnly(false); }} className="secondary-button"><RotateCcw size={14} /> Reset defaults</button></motion.section>
    </WorkspaceShell>
  );
}

function SettingsCard({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-card ui-card"><div className="settings-card-head"><span className="settings-card-icon">{icon}</span><span><h2>{title}</h2><p>{description}</p></span></div>{children}</motion.section>;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="toggle-row"><span className="toggle-copy"><strong>{label}</strong><small>{description}</small></span><button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn('toggle', checked && 'toggle-active')} /></div>;
}

