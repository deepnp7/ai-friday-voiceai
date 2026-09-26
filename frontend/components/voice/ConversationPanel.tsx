'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bot, CheckCircle2, Sparkles, User } from 'lucide-react';
import type { ConversationMessage } from '@/types';
import { cn } from '@/lib/utils';

export function ConversationPanel({ messages, simplified, transcript }: { messages: ConversationMessage[]; simplified?: boolean; transcript?: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, transcript]);
  return <div className="conversation-panel ui-card">{messages.length === 0 && <div className="conversation-empty"><span><Sparkles size={18} /></span><strong>Conversation stream</strong><p>Your spoken questions and step-by-step guidance will appear here.</p></div>}<AnimatePresence initial={false}>{messages.map(message => <motion.div key={message.id} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} className={cn('conversation-message', message.role === 'user' && 'conversation-message-user')}><span className="conversation-avatar">{message.role === 'user' ? <User size={13} /> : <Bot size={13} />}</span><div className="conversation-bubble">{message.isConfirmation && <span className="conversation-badge badge-confirm"><AlertTriangle size={11} /> Confirmation request</span>}{message.isExecution && <span className="conversation-badge badge-success"><CheckCircle2 size={11} /> Action executed</span>}<p className={simplified ? 'text-base' : ''}>{message.content}</p><time>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div></motion.div>)}</AnimatePresence>{transcript && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="conversation-message conversation-message-user"><span className="conversation-avatar"><User size={13} /></span><div className="conversation-bubble conversation-live"><span className="transcript-dot" />{transcript}…</div></motion.div>}<div ref={bottomRef} /></div>;
}

