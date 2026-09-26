'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, Mic2, Sparkles } from 'lucide-react';
import { login, register, setToken } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/layout/WorkspaceShell';

type Role = 'teacher' | 'student' | 'admin';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (mode === 'login') res = await login(email, password);
      else res = await register(name, email, password, role);

      setToken(res.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: res.user_id, name: res.name, role: res.role,
        preferred_lang: 'en', speaking_speed: 'normal',
      }));

      if (res.role === 'teacher') router.push('/dashboard/teacher');
      else if (res.role === 'student') router.push('/dashboard/student');
      else router.push('/dashboard/admin');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="ambient ambient-purple" aria-hidden="true" />
      <div className="ambient ambient-cyan" aria-hidden="true" />
      <div className="auth-layout">
        <section className="auth-story">
          <Link href="/" className="auth-brand"><LogoMark /></Link>
          <div className="auth-story-copy">
            <div className="eyebrow"><Sparkles size={13} /> A calmer way to get things done</div>
            <h1>Make space for the work that matters.</h1>
            <p>CogniVoice turns complex education workflows into clear, conversational steps—so the interface meets you where you are.</p>
            <div className="auth-story-list"><span><Check size={14} /> Voice-first by design</span><span><Check size={14} /> Accessible from the first hello</span><span><Check size={14} /> Your approval, every time</span></div>
          </div>
          <div className="auth-quote"><span className="auth-quote-mark">“</span><p>Technology should make the next step feel smaller.</p><small>— The CogniVoice principle</small></div>
        </section>

        <section className="auth-panel-wrap">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="auth-panel">
            <div className="auth-panel-heading"><span className="auth-mobile-brand"><LogoMark /></span><div><span className="auth-panel-kicker">{mode === 'login' ? 'Welcome back' : 'Start your workspace'}</span><h2>{mode === 'login' ? 'Sign in to CogniVoice' : 'Create your account'}</h2><p>{mode === 'login' ? 'Pick up where you left off.' : 'A few details, then you’re ready to speak.'}</p></div></div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              {(['login', 'register'] as const).map(m => <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }} className={cn('auth-tab', mode === m && 'auth-tab-active')}>{m === 'login' ? 'Sign in' : 'Create account'}</button>)}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && <div className="form-field"><label htmlFor="register-name">Full name</label><input id="register-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Prof. Sarah Jenkins" /></div>}

              {mode === 'register' && <div className="form-field"><span className="form-label">I’m joining as a…</span><div className="role-grid">{(Object.entries(ROLES) as [Role, typeof ROLES[Role]][]).map(([r, cfg]) => <button key={r} type="button" onClick={() => setRole(r)} className={cn('role-option', role === r && 'role-option-active')}><span>{cfg.icon}</span><strong>{cfg.label}</strong><small>{r === 'teacher' ? 'Guide & organise' : r === 'student' ? 'Learn & practice' : 'See the big picture'}</small></button>)}</div></div>}

              <div className="form-field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@school.edu" autoComplete="email" /></div>
              <div className="form-field"><label htmlFor="login-password">Password</label><div className="password-field"><input id="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>

              {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="auth-error" role="alert"><span>!</span>{error}</motion.div>}
              <button type="submit" disabled={loading} className="primary-button auth-submit" id="auth-submit-btn">{loading ? <Loader2 size={17} className="animate-spin" /> : <>{mode === 'login' ? 'Continue to workspace' : 'Create my account'}<ArrowRight size={15} /></>}</button>
            </form>

            <div className="auth-note"><LockKeyhole size={14} /><span>Your session is private and protected.</span></div>
          </motion.div>
          <p className="auth-footer">Need a demo? Create an account with any email to explore the platform.</p>
        </section>
      </div>
    </div>
  );
}

