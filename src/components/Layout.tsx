import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  IconLayoutDashboard, IconInbox, IconFilter, IconUsers, IconFileText, IconBriefcase, IconClipboardCheck, IconPackage, IconTruck, IconTool,
  IconCalendarEvent, IconAlertTriangle, IconShieldCheck, IconMessage, IconWorld, IconCurrencyPound, IconChartBar, IconSettings, IconSearch,
  IconBell, IconMenu2, IconCalendarCheck, IconRefresh, IconChevronRight, IconArrowRight, IconSignature, IconHelpCircle, IconLogout, IconUser, IconSelector,
} from '@tabler/icons-react';
import { me, notifications, IMG } from '../data/mock';
import { useStore } from '../data/store';
import { Avatar, Tile, toneColor } from './ui';

type NavDef = { to: string; label: string; icon: any; count?: number; chev?: boolean; end?: boolean };
const NAV: { section: string; items: NavDef[] }[] = [
  { section: 'Main', items: [{ to: '/', label: 'Dashboard', icon: IconLayoutDashboard, chev: true, end: true }, { to: '/enquiries', label: 'Enquiries', icon: IconInbox, count: 6 }] },
  { section: 'Sales', items: [{ to: '/pipeline', label: 'Sales pipeline', icon: IconFilter, chev: true }, { to: '/appointments', label: 'Appointments', icon: IconCalendarCheck }, { to: '/customers', label: 'Customers', icon: IconUsers, chev: true }, { to: '/quotes', label: 'Quotes (Framepoint)', icon: IconFileText }] },
  { section: 'Operations', items: [
    { to: '/jobs', label: 'Jobs', icon: IconBriefcase, chev: true }, { to: '/surveys', label: 'Surveys', icon: IconClipboardCheck, chev: true },
    { to: '/orders', label: 'Orders', icon: IconPackage, chev: true }, { to: '/deliveries', label: 'Deliveries', icon: IconTruck, chev: true },
    { to: '/installations', label: 'Installations', icon: IconTool, chev: true }, { to: '/diary', label: 'Installation diary', icon: IconCalendarEvent },
  ] },
  { section: 'Aftercare', items: [{ to: '/snags', label: 'Snags', icon: IconAlertTriangle }, { to: '/aftercare', label: 'Aftercare', icon: IconShieldCheck }] },
  { section: 'Communicate', items: [{ to: '/messages', label: 'Messages', icon: IconMessage, count: 3 }, { to: '/portal', label: 'Customer portal', icon: IconWorld }] },
  { section: 'Finance', items: [{ to: '/payments', label: 'Payments (Xero)', icon: IconCurrencyPound, chev: true }] },
  { section: 'Reports', items: [{ to: '/reports', label: 'Reports', icon: IconChartBar }] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const st = useStore();
  const live: Record<string, number> = { '/enquiries': st.enquiries.filter(e => e.stage === 'New Enquiry').length, '/messages': 3 + st.emails.filter(e => !e.linked).length, '/appointments': st.tasks.filter(t => !t.done && t.due <= '2026-10-16').length };
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <img src="images/mark.svg" alt="" />
        <b>Jadeite</b>
        <button className="collapse" onClick={onToggle} aria-label="Collapse menu"><IconMenu2 size={20} /></button>
      </div>
      <div className="workspace">
        <span className="ws-logo"><img src="images/mark.svg" alt="" /></span>
        <span>Jadeite Glazing · Head office</span>
        <IconSelector size={15} className="ml-auto muted" style={{ marginLeft: 'auto' }} />
      </div>
      {NAV.map(s => (
        <React.Fragment key={s.section}>
          <div className="nav-label">{s.section}</div>
          {s.items.map(it => (
            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={it.label}>
              <it.icon size={18} stroke={1.8} />
              <span>{it.label}</span>
              {(live[it.to] ?? it.count) ? <em className="count" style={{ fontStyle: 'normal' }}>{live[it.to] ?? it.count}</em> : it.chev ? <IconChevronRight size={15} className="chev" /> : null}
            </NavLink>
          ))}
        </React.Fragment>
      ))}
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginTop: 6 }} title="Settings">
        <IconSettings size={18} stroke={1.8} /><span>Settings</span>
      </NavLink>
      <div className="promo">
        <img src={IMG.orangery} alt="" style={{ objectPosition: 'center 35%' }} />
        <div>
          <b>Customer portal is live</b>
          <p>Customers can follow their job, dates and documents.</p>
          <Link to="/portal">Send invites <IconArrowRight size={13} /></Link>
        </div>
      </div>
    </aside>
  );
}

function CommandSearch({ onClose }: { onClose: () => void }) {
  const { jobs, enquiries } = useStore();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  const s = q.toLowerCase();
  const jobRes = jobs.filter(j => !s || (j.customer + j.id + j.address).toLowerCase().includes(s)).slice(0, 5);
  const enqRes = enquiries.filter(e => !s || (e.name + e.id + e.postcode).toLowerCase().includes(s)).slice(0, 4);
  const go = (to: string) => { onClose(); nav(to); };
  return (
    <div className="overlay" onMouseDown={onClose} style={{ alignItems: 'flex-start' }}>
      <div className="cmd" onMouseDown={e => e.stopPropagation()}>
        <div className="hstack" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', gap: 10 }}>
          <IconSearch size={18} color="#6b7a78" />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Search customers, jobs, enquiries or postcodes…" style={{ border: 0, outline: 0, fontSize: 15, flex: 1 }} />
          <kbd className="tiny muted">Esc</kbd>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
          <div className="nav-label">Jobs</div>
          {jobRes.map(j => (
            <button key={j.id} onClick={() => go(`/jobs/${j.id}`)} className="nav-item" style={{ width: '100%', border: 0, background: 'none', height: 52, gap: 12 }}>
              <img src={IMG[j.photo]} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} alt="" />
              <div className="vstack" style={{ alignItems: 'flex-start', gap: 1 }}><b style={{ fontSize: 13 }}>{j.customer}</b><span className="tiny muted">{j.id} · {j.address}</span></div>
              <span className="tag jade ml-auto">{j.stage}</span>
            </button>
          ))}
          <div className="nav-label">Enquiries</div>
          {enqRes.map(e => (
            <button key={e.id} onClick={() => go(`/enquiries/${e.id}`)} className="nav-item" style={{ width: '100%', border: 0, background: 'none', height: 48, gap: 12 }}>
              <Avatar i={e.initials} size={34} />
              <div className="vstack" style={{ alignItems: 'flex-start', gap: 1 }}><b style={{ fontSize: 13 }}>{e.name}</b><span className="tiny muted">{e.id} · {e.product} · {e.postcode}</span></div>
              <span className="tag grey ml-auto">{e.stage}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const notifIcon: Record<string, any> = { truck: IconTruck, signature: IconSignature, clipboard: IconClipboardCheck, pound: IconCurrencyPound, alert: IconAlertTriangle };

export function Header() {
  const { reset } = useStore();
  const [search, setSearch] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <header className="header">
      <div className="search" onClick={() => setSearch(true)}><IconSearch size={16} />Search<kbd>⌘K</kbd></div>
      <div className="spacer" />
      <div style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => { setBell(!bell); setMenu(false); }} aria-label="Notifications"><IconBell size={18} /><span className="dot" /></button>
        {bell && (
          <div className="popover">
            <div className="between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}><b style={{ fontSize: 14 }}>Notifications</b><button className="link">Mark all as read</button></div>
            <div className="list">
              {notifications.map((n, i) => {
                const I = notifIcon[n.icon];
                return (
                  <div key={i} className="hstack" style={{ padding: '12px 16px', gap: 12, alignItems: 'flex-start' }}>
                    <Tile icon={<I size={17} />} color={toneColor[n.tone]} size={34} radius={17} />
                    <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{n.title}</b><span className="small muted">{n.sub}</span></div>
                    <span className="tiny muted" style={{ whiteSpace: 'nowrap' }}>{n.when}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <button className="me" onClick={() => { setMenu(!menu); setBell(false); }}>{me.initials}</button>
        {menu && (
          <div className="popover" style={{ width: 240 }}>
            <div className="hstack" style={{ padding: 14, gap: 10, borderBottom: '1px solid var(--border)' }}><Avatar i={me.initials} size={38} bg="#00c7a1" fg="#0b1f1b" /><div className="vstack" style={{ gap: 1 }}><b>{me.name}</b><span className="tiny muted">{me.role}</span></div></div>
            <div style={{ padding: 6 }}>
              <button className="nav-item" style={{ width: '100%', border: 0, background: 'none' }} onClick={() => { setMenu(false); nav('/settings'); }}><IconUser size={17} /><span>My profile</span></button>
              <button className="nav-item" style={{ width: '100%', border: 0, background: 'none' }} onClick={() => { setMenu(false); nav('/welcome/1'); }}><IconHelpCircle size={17} /><span>Take the tour again</span></button>
              <button className="nav-item" style={{ width: '100%', border: 0, background: 'none' }} onClick={() => { setMenu(false); reset(); nav('/'); }}><IconRefresh size={17} /><span>Reset demo data</span></button>
              <button className="nav-item" style={{ width: '100%', border: 0, background: 'none' }} onClick={() => nav('/login')}><IconLogout size={17} /><span>Sign out</span></button>
            </div>
          </div>
        )}
      </div>
      {search && <CommandSearch onClose={() => setSearch(false)} />}
    </header>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className="app">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main">
        <Header />
        <main className="content"><Outlet /></main>
        <footer className="footer"><span>© 2026 Jadeite Systems · Jadeite Glazing</span><span>Office Admin · Help · Privacy</span></footer>
      </div>
    </div>
  );
}
