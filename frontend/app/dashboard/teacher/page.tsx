'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, ArrowRight, BarChart3, FileText, History, MessageSquare, Mic2, Settings, Sparkles } from 'lucide-react';
import { getDashboardMetrics, getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const QUICK_ACTIONS = [
  { icon: '✓', label: 'Take attendance', prompt: 'Help me take attendance', desc: 'Record student presence' },
  { icon: '↗', label: 'Enter marks', prompt: 'I want to enter marks', desc: 'Grade exams & tests' },
  { icon: '◫', label: 'Assign homework', prompt: 'Assign homework to my class', desc: 'Create daily tasks' },
  { icon: '◷', label: 'Set reminder', prompt: 'Set a reminder for me', desc: 'Schedule meetings' },
  { icon: '▤', label: 'Lesson plan', prompt: 'Create a lesson plan', desc: 'Outline class topics' },
  { icon: '⌕', label: 'Student lookup', prompt: 'Look up a student', desc: 'Find student records' },
  { icon: '▥', label: 'Class summary', prompt: 'Generate class summary', desc: 'Recap daily performance' },
  { icon: '◉', label: 'Voice note', prompt: 'Take a voice note', desc: 'Quick audio memos' },
];

const TIPS = [
  'Say “Take attendance for Class 8A Math Period 2”',
  'Say “I don’t understand” anytime for simpler, shorter instructions',
  'The assistant remembers your active class & subject preferences',
  'Say “Repeat” to hear the previous instruction again',
];

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [metrics, setMetrics] = useState<{ total_sessions: number; completed_sessions: number; total_messages: number; confusion_events: number } | null>(null);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role !== 'teacher') { router.push('/login'); return; }
    setUser(u);
    getDashboardMetrics().then(setMetrics).catch(() => {});
  }, [router]);

  const handleQuickAction = (prompt: string) => {
    localStorage.setItem('voice_prompt', prompt);
    router.push('/voice');
  };

  return (
    <WorkspaceShell role="teacher" userName={user?.name} active="dashboard" eyebrow="Educator workspace" title="Overview">
      <div className="page-intro">
        <div className="page-intro-copy">
          <div className="eyebrow"><Sparkles size={13} /> Your teaching day, simplified</div>
          <h1 className="page-title">Welcome back, <span className="gradient-text-vivid">{user?.name?.split(' ')[0] || 'Teacher'}.</span></h1>
          <p className="page-subtitle">Choose a workflow to launch, or speak naturally with the assistant. Your next step is always one tap away.</p>
        </div>
        <Link href="/voice" className="primary-button"><Mic2 size={16} /> Open assistant <ArrowRight size={14} /></Link>
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <motion.div initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} className="hero-action ui-card">
            <span className="hero-action-icon"><Mic2 size={26} /></span>
            <div className="hero-action-copy"><h2>Launch a voice workflow</h2><p>Hands-free, step-by-step guidance for the tasks that fill your day.</p></div>
            <Link href="/voice" className="secondary-button">Start speaking <ArrowRight size={14} /></Link>
          </motion.div>

          <div className="tip-bar"><Sparkles size={16} /><span><strong>Pro tip:</strong> {TIPS[tipIdx]}</span></div>

          <section>
            <div className="section-heading"><div><span className="section-kicker">Shortcuts</span><h2>Voice workflows</h2></div><span className="section-kicker">{QUICK_ACTIONS.length} available</span></div>
            <div className="action-grid">{QUICK_ACTIONS.map((action, index) => <motion.button key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} onClick={() => handleQuickAction(action.prompt)} className="action-card glass-card-interactive" id={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}><span className="action-icon">{action.icon}</span><span><span className="action-title">{action.label}</span><span className="action-desc">{action.desc}</span></span><ArrowRight size={14} className="action-arrow" /></motion.button>)}</div>
          </section>
        </div>

        <aside className="stack">
          {metrics && <section><div className="section-heading"><div><span className="section-kicker">At a glance</span><h2>Workspace pulse</h2></div></div><div className="stat-grid stat-grid-sidebar">{[{ label: 'Voice sessions', value: metrics.total_sessions, icon: <Mic2 size={16} />, color: '#b9b0ff', bg: 'rgba(139,124,246,.12)' }, { label: 'Tasks executed', value: metrics.completed_sessions, icon: <BarChart3 size={16} />, color: '#83dcb6', bg: 'rgba(85,201,154,.11)' }, { label: 'Transcripts', value: metrics.total_messages, icon: <MessageSquare size={16} />, color: '#88d5e8', bg: 'rgba(105,201,232,.11)' }, { label: 'Adaptations', value: metrics.confusion_events, icon: <Activity size={16} />, color: '#e6c17e', bg: 'rgba(231,184,109,.11)' }].map(stat => <div className="stat-card ui-card" key={stat.label} style={{ '--stat-color': stat.color, '--stat-bg': stat.bg } as React.CSSProperties}><span className="stat-icon">{stat.icon}</span><div className="stat-value">{stat.value}</div><div className="stat-label">{stat.label}</div></div>)}</div></section>}

          <section><div className="section-heading"><div><span className="section-kicker">Keep exploring</span><h2>Useful spaces</h2></div></div><div className="link-grid link-grid-sidebar"><Link href="/history" className="link-card glass-card-interactive"><History size={18} /><span><strong>Session history</strong><span>Review past conversations</span></span></Link><Link href="/settings" className="link-card glass-card-interactive"><Settings size={18} /><span><strong>Preferences</strong><span>Make the assistant yours</span></span></Link><Link href="/dashboard/admin" className="link-card glass-card-interactive"><Activity size={18} /><span><strong>Platform insights</strong><span>Usage &amp; cognitive metrics</span></span></Link></div></section>
          <div className="quiet-note"><FileText size={15} /><span>Your history and accessibility choices stay available across sessions.</span></div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
