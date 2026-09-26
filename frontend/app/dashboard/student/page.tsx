'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, History, MessageCircleQuestion, Mic2, Settings, Sparkles } from 'lucide-react';
import { getStoredUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';

const STUDENT_SKILLS = [
  { icon: '✦', label: 'Take a quiz', prompt: 'I want to take a quiz', desc: 'Interactive voice quiz' },
  { icon: '?', label: 'Homework help', prompt: 'Help me with my homework', desc: 'Step-by-step guidance' },
  { icon: '◒', label: 'Revise a topic', prompt: 'Help me revise', desc: 'Voice memory cards' },
  { icon: '!', label: 'Ask a doubt', prompt: 'I have a doubt about', desc: 'Clear any confusion' },
  { icon: '↗', label: 'Practice test', prompt: 'Give me practice questions', desc: 'Self-paced exercises' },
  { icon: '≡', label: 'Explain simply', prompt: 'Explain this topic simply', desc: 'Simple terms & examples' },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.push('/login'); return; }
    if (u.role !== 'student') { router.push(`/dashboard/${u.role}`); return; }
    setUser(u);
  }, [router]);

  const handleSkill = (prompt: string) => {
    localStorage.setItem('voice_prompt', prompt);
    router.push('/voice');
  };

  return (
    <WorkspaceShell role="student" userName={user?.name} active="dashboard" eyebrow="Learning workspace" title="Today">
      <div className="page-intro">
        <div className="page-intro-copy"><div className="eyebrow"><BookOpen size={13} /> A little progress, every day</div><h1 className="page-title">What are you curious about<span className="gradient-text-emerald">?</span></h1><p className="page-subtitle">Ask a doubt, practise a topic, or let your voice guide the next step. There is no wrong place to begin.</p></div>
        <Link href="/voice" className="primary-button"><Mic2 size={16} /> Start learning <ArrowRight size={14} /></Link>
      </div>

      <div className="student-layout">
        <div className="stack">
          <Link href="/voice" className="hero-action ui-card student-hero"><span className="hero-action-icon student-hero-icon"><Mic2 size={26} /></span><div className="hero-action-copy"><h2>Start with your voice</h2><p>Ask questions, take quizzes, or get homework help without navigating a maze.</p></div><span className="secondary-button">Open tutor <ArrowRight size={14} /></span></Link>
          <section><div className="section-heading"><div><span className="section-kicker">Choose a starting point</span><h2>Learning activities</h2></div><span className="section-kicker">{STUDENT_SKILLS.length} ways to begin</span></div><div className="student-skill-grid">{STUDENT_SKILLS.map((skill, i) => <motion.button key={skill.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} onClick={() => handleSkill(skill.prompt)} className="student-skill-card glass-card-interactive" id={`student-skill-${i}`}><span className="student-skill-icon">{skill.icon}</span><span className="student-skill-copy"><strong>{skill.label}</strong><small>{skill.desc}</small></span><ArrowRight size={14} className="action-arrow" /></motion.button>)}</div></section>
        </div>
        <aside className="student-aside stack"><div className="student-focus-card ui-card"><span className="student-focus-icon"><Brain size={19} /></span><span className="section-kicker">A friendly reminder</span><h2>Confusion is part of learning.</h2><p>If something feels complicated, just say <strong>“I don’t understand.”</strong> CogniVoice will slow down and explain it with simpler steps.</p></div><div className="link-grid student-links"><Link href="/history" className="link-card glass-card-interactive"><History size={18} /><span><strong>My history</strong><span>Review your sessions</span></span></Link><Link href="/settings" className="link-card glass-card-interactive"><Settings size={18} /><span><strong>Preferences</strong><span>Set your pace &amp; language</span></span></Link></div><div className="quiet-note"><MessageCircleQuestion size={15} /><span>You can always ask the assistant to repeat or simplify.</span></div></aside>
      </div>
    </WorkspaceShell>
  );
}
