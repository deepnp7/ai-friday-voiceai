'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, Globe2, Layers3, MessageSquare, RefreshCw } from 'lucide-react';
import { getDashboardMetrics, getStoredUser } from '@/lib/api';
import { LANGUAGES } from '@/lib/constants';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

type Metrics = {
  total_sessions: number;
  completed_sessions: number;
  total_messages: number;
  confusion_events: number;
  skills_used: Record<string, number>;
  languages_used: Record<string, number>;
  avg_steps_per_session: number;
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [userName, setUserName] = useState('Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.name) setUserName(user.name);
    getDashboardMetrics().then(setMetrics).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const topSkills = metrics ? Object.entries(metrics.skills_used).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
  const completion = metrics ? Math.round((metrics.completed_sessions / Math.max(metrics.total_sessions, 1)) * 100) : 0;

  return (
    <WorkspaceShell role="admin" userName={userName} active="dashboard" eyebrow="Platform workspace" title="System performance">
      <div className="page-intro"><div className="page-intro-copy"><div className="eyebrow"><Activity size={13} /> Live platform telemetry</div><h1 className="page-title">See how support <span className="gradient-text-vivid">scales.</span></h1><p className="page-subtitle">A focused view of voice usage, completion, language coverage and the moments where CogniVoice adapts.</p></div><span className="status-chip"><span className="status-dot" /> Data updates live</span></div>

      {loading ? <div className="stat-grid">{[0, 1, 2, 3].map(i => <div className="stat-card ui-card skeleton" key={i} style={{ minHeight: 142 }} />)}</div> : <>
        <div className="stat-grid">{[{ label: 'Total sessions', value: metrics?.total_sessions ?? 0, icon: <MessageSquare size={16} />, color: '#b9b0ff', bg: 'rgba(139,124,246,.12)' }, { label: 'Completion rate', value: `${completion}%`, icon: <BarChart3 size={16} />, color: '#83dcb6', bg: 'rgba(85,201,154,.11)' }, { label: 'Confusion triggers', value: metrics?.confusion_events ?? 0, icon: <AlertTriangle size={16} />, color: '#e6c17e', bg: 'rgba(231,184,109,.11)' }, { label: 'Avg steps / task', value: metrics?.avg_steps_per_session ?? 0, icon: <Layers3 size={16} />, color: '#88d5e8', bg: 'rgba(105,201,232,.11)' }].map(stat => <div className="stat-card ui-card" key={stat.label} style={{ '--stat-color': stat.color, '--stat-bg': stat.bg } as React.CSSProperties}><span className="stat-icon">{stat.icon}</span><div className="stat-value">{stat.value}</div><div className="stat-label">{stat.label}</div><div className="stat-meta">Across all workspaces</div></div>)}</div>

        <div className="analytics-grid"><motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="chart-card ui-card"><div className="section-heading"><div><span className="section-kicker">Workflow demand</span><h2>Most used voice workflows</h2></div><RefreshCw size={15} className="section-kicker" /></div>{topSkills.length === 0 ? <div className="analytics-empty">No usage telemetry recorded yet.</div> : <div className="chart-list">{topSkills.map(([skill, count], index) => <div className="chart-row" key={skill}><span className="chart-label">{skill.replace(/_/g, ' ')}</span><div className="chart-track"><motion.div className="chart-fill" initial={{ width: 0 }} animate={{ width: `${Math.min((count / (topSkills[0]?.[1] || 1)) * 100, 100)}%` }} transition={{ duration: .75, delay: index * .08 }} /></div><span className="chart-value">{count}</span></div>)}</div>}</motion.section><motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: .08 } }} className="chart-card ui-card"><div className="section-heading"><div><span className="section-kicker">Language reach</span><h2>Multilingual engagement</h2></div><Globe2 size={15} className="section-kicker" /></div><div className="language-list">{Object.entries(metrics?.languages_used || {}).map(([lang, count]) => { const info = LANGUAGES.find(l => l.code === lang); return <div className="language-chip" key={lang}><span>{info?.flag || '◌'}</span><span>{info?.name || lang}</span><em>{count}</em></div>; })}{Object.keys(metrics?.languages_used || {}).length === 0 && <div className="analytics-empty">No language breakdown recorded yet.</div>}</div></motion.section></div>
      </>}
    </WorkspaceShell>
  );
}
