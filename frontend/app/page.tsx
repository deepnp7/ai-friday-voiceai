'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe2,
  HeartHandshake,
  Mic2,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LogoMark } from '@/components/layout/WorkspaceShell';

const FEATURES = [
  { icon: Mic2, title: 'Voice-first interaction', desc: 'Speak naturally in your own pace and accent. No dense menus or typing required.' },
  { icon: Brain, title: 'Adaptive cognitive AI', desc: 'Confusion signals trigger shorter, clearer guidance at the moment it is needed.' },
  { icon: CheckCircle2, title: 'One step at a time', desc: 'Each workflow is broken into calm, focused prompts that prevent overload.' },
  { icon: ShieldCheck, title: 'Confirmation by design', desc: 'The assistant pauses for explicit approval before saving or executing an action.' },
  { icon: Globe2, title: 'Eight Indian languages', desc: 'Move between English, Hindi, Bengali, Tamil, Telugu and more without friction.' },
  { icon: HeartHandshake, title: 'Inclusive by default', desc: 'Scalable type, high contrast and motion controls make the experience yours.' },
];

const SKILLS = [
  { icon: '✓', name: 'Take attendance', user: 'Teacher', category: 'Classroom' },
  { icon: '↗', name: 'Enter marks', user: 'Teacher', category: 'Grading' },
  { icon: '◫', name: 'Assign homework', user: 'Teacher', category: 'Assignments' },
  { icon: '◷', name: 'Set reminders', user: 'Teacher', category: 'Planning' },
  { icon: '✦', name: 'Interactive quiz', user: 'Student', category: 'Learning' },
  { icon: '?', name: 'Homework helper', user: 'Student', category: 'Tutoring' },
  { icon: '▤', name: 'Lesson planning', user: 'Teacher', category: 'Curriculum' },
  { icon: '⌕', name: 'Student lookup', user: 'Teacher', category: 'Directory' },
];

const STEPS = [
  { num: '01', title: 'Speak intent', text: '“Help me take attendance for Class 8A”' },
  { num: '02', title: 'Get a prompt', text: 'The assistant asks who is absent today.' },
  { num: '03', title: 'Respond simply', text: '“Rahul and Priya are absent.”' },
  { num: '04', title: 'Confirm & save', text: 'Review the summary, then say “Yes”.' },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="ambient ambient-purple" aria-hidden="true" />
      <div className="ambient ambient-cyan" aria-hidden="true" />

      <nav className="landing-nav" aria-label="Primary navigation">
        <Link href="/" aria-label="CogniVoice home"><LogoMark /></Link>
        <div className="landing-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Built for real life</a>
          <Link href="/login" className="landing-sign-in">Sign in</Link>
          <Link href="/login" className="primary-button">Get started <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="landing-hero-copy">
            <div className="eyebrow"><Sparkles size={13} /> Calm technology for busy minds</div>
            <h1>Voice AI that helps people <span className="gradient-text-vivid">move forward.</span></h1>
            <p>CogniVoice gives teachers and students a calm, accessible way to get things done. Speak naturally, follow one clear step at a time, and stay in control.</p>
            <div className="landing-hero-actions">
              <Link href="/login" className="primary-button primary-button-large"><Mic2 size={17} /> Start with your voice <ArrowRight size={15} /></Link>
              <a href="#how-it-works" className="secondary-button">See how it works <ChevronRight size={15} /></a>
            </div>
            <div className="landing-proof"><span className="proof-avatars"><span>R</span><span>S</span><span>A</span></span><span>Designed for educators, learners &amp; every processing style</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .93, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .16, duration: .7 }} className="hero-visual" aria-label="Voice assistant preview">
            <div className="hero-visual-glow" aria-hidden="true" />
            <div className="hero-window">
              <div className="hero-window-top"><span className="window-dots"><i /><i /><i /></span><span className="window-status"><span className="status-dot" /> Listening space</span><span className="window-menu">•••</span></div>
              <div className="hero-window-body">
                <div className="mini-label">CURRENT WORKFLOW <span>STEP 2 OF 4</span></div>
                <div className="mini-progress"><span /></div>
                <div className="mini-prompt"><span className="mini-prompt-icon"><Mic2 size={16} /></span><div><span>CogniVoice says</span><strong>Who is absent today?</strong></div></div>
                <div className="mini-orb"><div className="mini-orb-core"><Mic2 size={25} /></div><i /><i /><i /></div>
                <span className="mini-orb-label">Tap to answer</span>
                <div className="mini-chip-row"><span>English · Normal pace</span><span><ShieldCheck size={12} /> Confirmation on</span></div>
              </div>
            </div>
            <div className="floating-note note-top"><span className="note-icon"><Zap size={14} /></span><span><strong>One step at a time</strong><small>Less cognitive load</small></span></div>
            <div className="floating-note note-bottom"><Check size={15} /><span>Ready when you are</span></div>
          </motion.div>
        </section>

        <section className="landing-section trust-strip">
          <span className="trust-label">A more human interface for</span>
          <div className="trust-items"><span><Mic2 size={14} /> Voice workflows</span><span><HeartHandshake size={14} /> Accessibility</span><span><Brain size={14} /> Adaptive support</span><span><ShieldCheck size={14} /> Safe execution</span></div>
        </section>

        <section id="how-it-works" className="landing-section">
          <div className="landing-section-heading"><div><div className="eyebrow">A calm cognitive flow</div><h2>Less menu. More momentum.</h2></div><p>Every interaction is designed to keep the next step obvious.</p></div>
          <div className="step-grid">
            {STEPS.map((step, index) => <motion.div key={step.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="step-card"><span className="step-number">{step.num}</span><h3>{step.title}</h3><p>{step.text}</p>{index < STEPS.length - 1 && <ChevronRight className="step-arrow" size={17} />}</motion.div>)}
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="landing-section-heading"><div><div className="eyebrow">Made for real life</div><h2>Thoughtful all the way through.</h2></div><p>The details add up to a voice experience that feels lighter, clearer and more respectful.</p></div>
          <div className="feature-grid">
            {FEATURES.map((feature, index) => { const Icon = feature.icon; return <motion.article key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .06 }} className="feature-card"><span className="feature-icon"><Icon size={19} /></span><h3>{feature.title}</h3><p>{feature.desc}</p></motion.article>; })}
          </div>
        </section>

        <section className="landing-section skill-section">
          <div className="skill-panel">
            <div className="landing-section-heading skill-heading"><div><div className="eyebrow">Your shortcuts, understood</div><h2>Start with what you need.</h2></div><p>Common actions are ready to launch by voice, so your attention stays on the work.</p></div>
            <div className="skill-grid">{SKILLS.map(skill => <div className="skill-item" key={skill.name}><span className="skill-symbol">{skill.icon}</span><span><strong>{skill.name}</strong><small>{skill.user} · {skill.category}</small></span></div>)}</div>
          </div>
        </section>

        <section className="landing-cta"><div className="eyebrow">Start without a setup guide</div><h2>Let your voice do the navigating.</h2><p>Open CogniVoice and take the first step at your own pace.</p><Link href="/login" className="primary-button primary-button-large">Try CogniVoice <ArrowRight size={15} /></Link></section>
      </main>

      <footer className="landing-footer"><Link href="/"><LogoMark /></Link><span>Adaptive voice AI for more accessible learning.</span><span>© 2026 CogniVoice</span></footer>
    </div>
  );
}

