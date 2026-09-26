'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CalendarClock, CheckCircle2, History as HistoryIcon, MessageSquare, Search, Sparkles } from 'lucide-react';
import { getAttendanceSummary, getHistory, getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import type { Role } from '@/types';

type SessionRow = Awaited<ReturnType<typeof getHistory>>[number];

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attendance, setAttendance] = useState<unknown[]>([]);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<Role>('teacher');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push('/login'); return; }
    setUserName(user.name);
    setRole(user.role as Role);
    Promise.all([getHistory(), getAttendanceSummary()]).then(([history, attendanceData]) => { setSessions(history); setAttendance(attendanceData); }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load history')).finally(() => setLoading(false));
  }, [router]);

  const totalMessages = useMemo(() => sessions.reduce((sum, session) => sum + session.messages.length, 0), [sessions]);

  return (
    <WorkspaceShell role={role} userName={userName} active="history" eyebrow="Session history" title="Conversation archive">
      <div className="page-intro"><div className="page-intro-copy"><div className="eyebrow"><Sparkles size={13} /> Your conversation archive</div><h1 className="page-title">Everything, <span className="gradient-text-vivid">in context.</span></h1><p className="page-subtitle">Review voice sessions, executed actions and the short exchanges that helped move work forward.</p></div><Link href="/voice" className="primary-button"><Search size={15} /> New session <ArrowRight size={14} /></Link></div>

      {error && <div className="inline-alert" role="alert">{error}</div>}
      <div className="stat-grid">{[{ label: 'Total sessions', value: sessions.length, icon: <HistoryIcon size={16} />, color: '#b9b0ff', bg: 'rgba(139,124,246,.12)' }, { label: 'Messages processed', value: totalMessages, icon: <MessageSquare size={16} />, color: '#88d5e8', bg: 'rgba(105,201,232,.11)' }, { label: 'Attendance records', value: attendance.length, icon: <CalendarClock size={16} />, color: '#83dcb6', bg: 'rgba(85,201,154,.11)' }, { label: 'Archive status', value: 'Ready', icon: <CheckCircle2 size={16} />, color: '#e6c17e', bg: 'rgba(231,184,109,.11)' }].map(stat => <div className="stat-card ui-card" key={stat.label} style={{ '--stat-color': stat.color, '--stat-bg': stat.bg } as React.CSSProperties}><span className="stat-icon">{stat.icon}</span><div className="stat-value stat-value-text">{stat.value}</div><div className="stat-label">{stat.label}</div></div>)}</div>

      {loading ? <div className="history-list history-loading">{[0, 1, 2].map(i => <div className="history-card ui-card skeleton" key={i} />)}</div> : sessions.length === 0 ? <div className="empty-state ui-card"><span className="empty-state-icon"><CheckCircle2 size={22} /></span><h2>No sessions yet</h2><p>Your completed voice workflows will appear here with their messages and execution status.</p><Link href="/voice" className="primary-button">Open voice assistant <ArrowRight size={14} /></Link></div> : <div className="history-list">{sessions.map(session => <motion.article key={session.session_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="history-card ui-card"><div className="history-card-header"><div><h2>{session.skill ? session.skill.replace(/_/g, ' ') : 'General voice conversation'}</h2><p className="history-date">{new Date(session.started_at).toLocaleString()}</p></div><div className="history-meta"><span className={`status-badge ${session.completed ? 'status-badge-success' : 'status-badge-pending'}`}><span className="status-dot" />{session.completed ? 'Executed' : 'In progress'}</span><span className="exchange-count">{session.messages.length} exchanges</span></div></div><div className="message-stack">{session.messages.slice(-4).map((message, index) => <div key={`${session.session_id}-${index}`} className={`message-preview ${message.role === 'user' ? 'message-preview-user' : ''}`}><span className="message-role">{message.role === 'user' ? 'You' : 'Assistant'}</span>{message.content}</div>)}</div></motion.article>)}</div>}
    </WorkspaceShell>
  );
}

