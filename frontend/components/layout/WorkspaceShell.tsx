'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Brain,
  History,
  LogOut,
  Mic2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { clearToken } from '@/lib/api';
import type { Role } from '@/types';
import { cn } from '@/lib/utils';

type WorkspaceShellProps = {
  children: ReactNode;
  role: Role;
  userName?: string;
  active?: 'dashboard' | 'voice' | 'history' | 'settings' | 'analytics';
  eyebrow?: string;
  title?: string;
};

const roleMeta: Record<Role, { label: string; shortLabel: string; icon: ReactNode }> = {
  teacher: { label: 'Educator workspace', shortLabel: 'Educator', icon: <BookOpen size={16} /> },
  student: { label: 'Learning workspace', shortLabel: 'Student', icon: <Sparkles size={16} /> },
  admin: { label: 'Platform workspace', shortLabel: 'Analytics', icon: <Activity size={16} /> },
};

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn('brand-lockup', compact && 'brand-lockup-compact')}>
      <span className="brand-mark" aria-hidden="true">
        <Brain size={compact ? 17 : 19} strokeWidth={2.2} />
      </span>
      {!compact && <span className="brand-name">CogniVoice</span>}
    </span>
  );
}

export function WorkspaceShell({
  children,
  role,
  userName,
  active = 'dashboard',
  eyebrow,
  title,
}: WorkspaceShellProps) {
  const router = useRouter();
  const meta = roleMeta[role];
  const homeHref = `/dashboard/${role}`;
  const navItems = [
    { key: 'dashboard' as const, href: homeHref, label: 'Overview', icon: <Activity size={17} /> },
    { key: 'voice' as const, href: '/voice', label: 'Voice assistant', icon: <Mic2 size={17} /> },
    { key: 'history' as const, href: '/history', label: 'Session history', icon: <History size={17} /> },
  ];

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <div className="app-frame">
      <div className="ambient ambient-purple" aria-hidden="true" />
      <div className="ambient ambient-cyan" aria-hidden="true" />

      <aside className="side-rail" aria-label="Workspace navigation">
        <Link href={homeHref} className="side-brand" aria-label="CogniVoice home">
          <LogoMark />
        </Link>

        <div className="rail-context">
          <span className="rail-context-icon">{meta.icon}</span>
          <span>
            <strong>{meta.shortLabel}</strong>
            <small>Personal workspace</small>
          </span>
        </div>

        <p className="rail-label">Workspace</p>
        <nav className="rail-nav">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.key}
              className={cn('rail-link', active === item.key && 'rail-link-active')}
              aria-current={active === item.key ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.key === 'voice' && <span className="rail-live-dot" aria-label="Ready" />}
            </Link>
          ))}
        </nav>

        <div className="rail-spacer" />
        <div className="rail-footer">
          <Link href="/settings" className={cn('rail-link', active === 'settings' && 'rail-link-active')}>
            <Settings size={17} />
            <span>Preferences</span>
          </Link>
          <div className="rail-user">
            <span className="avatar avatar-small">{(userName || meta.shortLabel).charAt(0).toUpperCase()}</span>
            <span className="rail-user-copy">
              <strong>{userName || meta.shortLabel}</strong>
              <small>{meta.shortLabel}</small>
            </span>
            <button type="button" className="icon-button icon-button-subtle" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="workspace-topbar">
          <div className="mobile-brand"><LogoMark compact /></div>
          <div className="topbar-context">
            <span className="topbar-kicker">{eyebrow || meta.label}</span>
            {title && <span className="topbar-title">{title}</span>}
          </div>
          <div className="topbar-actions">
            <span className="status-chip"><span className="status-dot" /> Assistant ready</span>
            <Link href="/settings" className="icon-button" aria-label="Open preferences"><Settings size={17} /></Link>
            <button type="button" className="avatar avatar-top" onClick={handleLogout} aria-label="Sign out">
              {(userName || meta.shortLabel).charAt(0).toUpperCase()}
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Mobile workspace navigation">
          {navItems.map((item) => <Link href={item.href} key={item.key} className={cn('mobile-nav-link', active === item.key && 'mobile-nav-link-active')} aria-current={active === item.key ? 'page' : undefined}>{item.icon}<span>{item.label}</span></Link>)}
          <Link href="/settings" className={cn('mobile-nav-link', active === 'settings' && 'mobile-nav-link-active')} aria-current={active === 'settings' ? 'page' : undefined}><Settings size={16} /><span>Settings</span></Link>
        </nav>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
