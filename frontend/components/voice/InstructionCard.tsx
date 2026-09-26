'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type InstructionCardProps = { text: string; isConfirmation?: boolean; isSuccess?: boolean; isError?: boolean; simplifiedMode?: boolean; skill?: string | null; skillIcon?: string };

export function InstructionCard({ text, isConfirmation, isSuccess, isError, simplifiedMode, skill, skillIcon }: InstructionCardProps) {
  return <AnimatePresence mode="wait"><motion.div key={text} initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: .98 }} transition={{ duration: .3, ease: [0.16, 1, .3, 1] }} className={cn('instruction-card ui-card', isSuccess && 'instruction-success', isConfirmation && 'instruction-confirm', isError && 'instruction-error')}>
    <div className="instruction-head">{skill && skillIcon ? <span className="instruction-skill"><span>{skillIcon}</span>{skill.replace(/_/g, ' ')}</span> : <span className="instruction-source"><Volume2 size={13} /> Assistant response</span>}{simplifiedMode && <span className="instruction-simplified"><Sparkles size={11} /> Simplified</span>}</div>
    {isSuccess && <div className="instruction-status instruction-status-success"><CheckCircle2 size={16} /> Action successfully completed</div>}
    {isConfirmation && <div className="instruction-status instruction-status-confirm"><AlertTriangle size={16} /> Confirmation required before execution</div>}
    <p className={cn('instruction-text', simplifiedMode && 'instruction-text-large')}>{text}</p>
    {isConfirmation && <div className="instruction-prompt">Say <strong>“Yes”</strong> to confirm or <strong>“No”</strong> to change.</div>}
  </motion.div></AnimatePresence>;
}

