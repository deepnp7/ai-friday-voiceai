'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConfirmationModal({ open, message, onConfirm, onDeny, simplified }: { open: boolean; message: string; onConfirm: () => void; onDeny: () => void; simplified?: boolean }) {
  return <AnimatePresence>{open && <motion.div className="confirmation-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="confirmation-card ui-card" initial={{ opacity: 0, scale: .92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .92, y: 16 }} transition={{ type: 'spring', damping: 24, stiffness: 280 }} role="dialog" aria-modal="true" aria-labelledby="confirmation-title"><div className="confirmation-head"><span className="confirmation-icon"><AlertTriangle size={19} /></span><span><h2 id="confirmation-title">Confirmation required</h2><p>Say “Yes” or “No”, or choose below</p></span></div><p className={cn('confirmation-message', simplified && 'text-xl')}>{message}</p><div className="confirmation-actions"><button type="button" onClick={onConfirm} className="confirm-button confirm-yes"><CheckCircle2 size={15} /> Yes, execute</button><button type="button" onClick={onDeny} className="confirm-button confirm-no"><XCircle size={15} /> No, change</button></div></motion.div></motion.div>}</AnimatePresence>;
}

