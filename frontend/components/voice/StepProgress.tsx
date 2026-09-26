'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StepProgress({ currentStep, totalSteps, skillName, simplified }: { currentStep: number; totalSteps: number; skillName?: string | null; simplified?: boolean }) {
  if (!totalSteps) return null;
  const progress = Math.min((currentStep / totalSteps) * 100, 100);
  return <motion.div initial={{ opacity: 0, y: -9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -9 }} className="step-progress ui-card"><div className="step-progress-head"><span className={cn('step-progress-skill', simplified && 'text-base')}>{skillName ? skillName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Active skill task'}</span><span className="step-progress-count">Step <strong>{currentStep}</strong> of {totalSteps}</span></div><div className="step-progress-track"><motion.span initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .5, ease: [0.16, 1, .3, 1] }} /></div><div className="step-progress-dots">{Array.from({ length: totalSteps }).map((_, i) => <span key={i} className={cn(i < currentStep && 'step-dot-done', i === currentStep - 1 && 'step-dot-current', simplified && 'step-dot-large')} />)}</div></motion.div>;
}

