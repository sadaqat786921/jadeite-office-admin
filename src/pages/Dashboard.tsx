import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconPlus, IconX, IconPencil, IconRefresh, IconInbox, IconBox, IconTool, IconTruck, IconCalendar, IconChevronDown, IconPhone, IconChevronRight,
  IconChevronLeft, IconClock, IconPackage, IconClipboardCheck, IconMessage, IconChartBar, IconSun, IconArrowUpRight, IconCurrencyPound,
  IconAlertTriangle, IconFileText, IconHome, IconInfoCircle, IconCalendarEvent,
} from '@tabler/icons-react';
import { Card, CardHead, Dd, PageHead, Tag, Avatar, Tile, Progress, Check, hexA } from '../components/ui';
import { BarChart, Donut, AreaLine } from '../components/charts';
import { NewEnquiryModal, BookInstallModal, AddTaskModal } from '../components/Forms';
import { useStore, TODAY, fmtDate } from '../data/store';
import { me, salesByMonth, supplierIssues, upcoming, updates, activity, topProducts, teams, IMG } from '../data/mock';

const OCT = [[27, 28, 29, 30, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]];

export default function Dashboard() {
  const nav = useNavigate();
  const [alert, setAlert] = useState(true);
  const [modal, setModal] = useState<'enq' | 'book' | 'task' | null>(null);
  const [tab, setTab] = useState('Installations');
  const { tasks, set, attention } = useStore();
  const myTasks = tasks.filter(t => t.owner === 'sm').slice(0, 5);
  const todoCount = tasks.filter(t => t.owner === 'sm' && !t.done).length + attention.late.length + attention.blocked.length;
  return (
    <>
      <PageHead title="Office Admin Dashboard" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Office Admin' }]}
        actions={<><button className="btn btn-primary" onClick={() => setModal('enq')}><IconPlus size={16} />New enquiry</button><button className="btn btn-grey" onClick={() => setModal('book')}>Book installation</button></>} />

      {alert && (
        <div className="alert ok">
          <span className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: '#fff' }}>E</span>
          <span><b>Emplas</b> has confirmed the order for <b>JG-10477 · The Bakers</b></span>
          <button className="ml-auto" style={{ background: 'none', border: 0, color: 'inherit', display: 'flex' }} onClick={() => setAlert(false)}><IconX size={16} /></button>
        </div>
      )}

      <div className="attn">
        <div style={{ background: 'var(--deep)', color: '#fff' }}><IconAlertTriangle size={18} color="#2dd4bf" /><b style={{ fontSize: 13 }}>Needs your<br />attention</b></div>
        {[['Late', attention.late.length, 'Overdue next steps', '#d64545', 'Late'], ['Blocked', attention.blocked.length, 'Supplier or delivery problems', '#d64545', 'Blocked'], ['Not booked', attention.notBooked.length, 'Delivered but not in the diary', '#e0a100', 'Not booked'], ['No next step', attention.noNext.length, 'Every job has an owner and next step', '#1f9d5b', 'No next step']].map(([l, n, sub, c, f]: any) => (
          <Link key={l} to={`/jobs?filter=${encodeURIComponent(f)}`}>
            <span className="n" style={{ color: n ? c : 'var(--ok)' }}>{n}</span>
            <span className="vstack" style={{ gap: 1 }}><b style={{ fontSize: 13 }}>{l}</b><span className="tiny muted">{n ? sub : 'All clear'}</span></span>
            <IconChevronRight size={15} color="#6b7a78" style={{ marginLeft: 'auto' }} />
          </Link>
        ))}
      </div>

      <div className="banner">
        <div className="photo" style={{ backgroundImage: `url(${IMG.house})` }} />
        <span className="glow" style={{ left: 520, top: -60 }} />
        <div className="vstack" style={{ gap: 8 }}>
          <div className="hstack" style={{ gap: 10 }}><h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>Welcome back, {me.first}</h2><span className="tile" style={{ width: 26, height: 26, background: 'rgba(255,255,255,.14)', borderRadius: 6 }}><IconPencil size={14} /></span></div>
          <span style={{ color: '#cfe0db', fontSize: 14 }}>You have {todoCount} things to do today. Have a good day at work.</span>
        </div>
        <span className="ml-auto hstack" style={{ color: '#e6efec', fontSize: 13.5 }}><IconRefresh size={16} />Updated 2 minutes ago</span>
      </div>

      <div className="grid-4">
        <StatCard icon={<IconInbox size={24} />} color="#00c7a1" value="34" label="Enquiries this week" tag="12%" tone="ok" foot={[['New', '6'], ['Assigned', '28']]} onClick={() => nav('/enquiries')} />
        <StatCard icon={<IconBox size={24} />} color="#2f6fde" value="38" label="Jobs in progress" tag="4%" tone="info" foot={[['On track', '33'], ['Blocked', '5']]} onClick={() => nav('/jobs')} />
        <StatCard icon={<IconTool size={24} />} color="#e0a100" value="18" label="Installations" tag="20%" tone="warn" foot={[['Done', '11'], ['Booked', '7']]} onClick={() => nav('/installations')} />
        <StatCard icon={<IconTruck size={24} />} color="#d64545" value="5" label="Deliveries" tag="1 late" tone="err" foot={[['Arrived', '3'], ['Late', '1']]} onClick={() => nav('/deliveries')} />
      </div>

      <div className="row">
        <Card className="grow">
          <CardHead title="Quotes and sales" right={<Dd icon={<IconCalendar size={14} />}>Last 8 months</Dd>} />
          <div className="hstack small t2" style={{ gap: 16 }}><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#dfe5e3' }} />Quoted</span><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#0b6e5c' }} />Won</span></div>
          <BarChart data={salesByMonth} height={252} />
        </Card>
        <Card className="w-360">
          <CardHead title="Supplier issues" right={<Dd icon={<IconCalendar size={14} />}>This week</Dd>} />
          {supplierIssues.map((s, i) => (
            <div key={i} className="card" style={{ padding: 0, gap: 0 }}>
              <div className="hstack" style={{ padding: 12, gap: 12 }}>
                <Avatar i={s.initial} size={36} />
                <div className="vstack" style={{ gap: 3, flex: 1 }}>
                  <div className="hstack"><b style={{ fontSize: 14 }}>{s.supplier}</b><Tag tone={s.tone}>{s.status}</Tag></div>
                  <span className="small t2">{s.job}</span>
                </div>
                <button className="tile" style={{ width: 26, height: 26, borderRadius: 6, background: '#1f9d5b', color: '#fff', border: 0 }} aria-label="Call"><IconPhone size={14} /></button>
                <Link to="/orders" className="tile" style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}><IconChevronRight size={14} /></Link>
              </div>
              <div className="between small" style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}><span className="t2">{s.left}</span><b style={{ color: s.rightTone === 'err' ? 'var(--err)' : 'var(--text)' }}>{s.right}</b></div>
            </div>
          ))}
        </Card>
      </div>

      <div className="row">
        <Card className="w-360">
          <CardHead title="Schedules" right={<button className="link" onClick={() => setModal('book')}><IconPlus size={14} />Add new</button>} />
          <div className="between"><b style={{ fontSize: 14 }}>October 2026</b><span className="hstack"><button className="icon-btn" style={{ width: 24, height: 24, border: 0 }}><IconChevronLeft size={14} /></button><button className="tile" style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--deep)', color: '#fff', border: 0 }}><IconChevronRight size={14} /></button></span></div>
          <div className="cal-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="d b t2">{d}</div>)}
            {OCT.flat().map((d, i) => {
              const prev = i < 4;
              const cls = prev ? 'prev' : d === 13 ? 'today' : [8, 15, 21].includes(d) ? 'mark' : '';
              return <div key={i} className={`d ${cls}`}><span>{d}</span></div>;
            })}
          </div>
          <b style={{ fontSize: 14 }}>Upcoming</b>
          {upcoming.map((u, i) => (
            <div key={i} className="card" style={{ padding: 0, gap: 0, borderLeft: `3px solid ${u.color}` }}>
              <div className="hstack" style={{ gap: 10, padding: 12 }}>
                <img src={IMG[u.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 13.5 }}>{u.title}</b><span className="small t2 hstack" style={{ gap: 5 }}><IconCalendar size={13} />{u.date}</span></div>
              </div>
              <div className="between small t2" style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', margin: '0 0 0 0' }}>
                <span className="hstack" style={{ gap: 5 }}><IconClock size={13} />{u.time}</span>
                <span className="hstack" style={{ gap: 0 }}>{u.who.map(w => <Avatar key={w} i={w} size={22} ring />)}</span>
              </div>
            </div>
          ))}
        </Card>

        <div className="col grow">
          <Card>
            <CardHead title="Job status" right={<Dd icon={<IconCalendar size={14} />}>Today</Dd>} />
            <div className="hstack" style={{ gap: 18 }}>
              {['Installations', 'Surveys', 'Deliveries'].map(t => <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 0, padding: 0, fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--primary-dark)' : 'var(--text-2)' }}>{t}</button>)}
            </div>
            <div className="grid-3" style={{ gap: 10 }}>
              {(tab === 'Installations' ? [['15', 'On track'], ['2', 'Snag open'], ['1', 'Late']] : tab === 'Surveys' ? [['3', 'Today'], ['2', 'To review'], ['0', 'Late']] : [['3', 'Arrived'], ['1', 'On the way'], ['1', 'Late']]).map(([n, l]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}><b style={{ fontSize: 17 }}>{n}</b><div className="small t2">{l}</div></div>
              ))}
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: '4px 0' }}>
              <Donut parts={[{ v: 15, c: '#0b6e5c' }, { v: 2, c: '#e0a100' }, { v: 1, c: '#d64545' }]} size={200} thickness={40} center="18" sub="Jobs" />
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}><button className="btn btn-grey btn-sm" onClick={() => nav('/diary')}><IconCalendar size={15} />View diary</button></div>
          </Card>
          <div className="grid-2" style={{ gap: 20, flex: 1 }}>
            <HighlightCard color="#1f9d5b" photo={IMG.door} label="TOP SALESPERSON" initials="MH" name="Mike Harris" sub="11 jobs won this month" />
            <HighlightCard color="#0b6e5c" photo={IMG.bifold} label="TEAM OF THE WEEK" initials="T1" name="Team 1" sub="Dan & Lee · 0 snags" />
          </div>
        </div>

        <div className="col w-320">
          <Card>
            <CardHead title="Quick links" />
            <div className="grid-3" style={{ gap: 10 }}>
              {[['Enquiries', '#00c7a1', IconInbox, '/enquiries'], ['Diary', '#2f6fde', IconCalendar, '/diary'], ['Orders', '#e0a100', IconPackage, '/orders'], ['Surveys', '#2dd4bf', IconClipboardCheck, '/surveys'], ['Messages', '#d64545', IconMessage, '/messages'], ['Reports', '#1f9d5b', IconChartBar, '/reports']].map(([l, c, I, to]: any) => (
                <Link to={to} key={l} className="qlink" style={{ background: hexA(c, 0.12) }}><span className="ic" style={{ background: c }}><I size={18} /></span>{l}</Link>
              ))}
            </div>
          </Card>
          <Card>
            <CardHead title="Installer teams" right={<Link to="/diary" className="link"><IconCalendarEvent size={14} />View</Link>} />
            {teams.map(t => (
              <div key={t.id} className="card" style={{ padding: 10, gap: 10 }}>
                <div className="hstack" style={{ gap: 10 }}><span className="tile" style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--deep)', color: '#fff', fontSize: 9, fontWeight: 700 }}>{t.initials}</span><b style={{ fontSize: 13 }}>{t.name} · {t.lead}</b></div>
                <Progress value={t.progress} color={t.color} height={4} />
              </div>
            ))}
          </Card>
          <Card>
            <CardHead title="Job health" right={<Dd icon={<IconSun size={14} />}>This month</Dd>} />
            <div className="hstack" style={{ gap: 12 }}>
              <div className="card" style={{ padding: 10, gap: 8, flex: 1 }}>
                {[['On time', '45', '#0b6e5c'], ['Minor snags', '11', '#e0a100'], ['Late', '2', '#d64545']].map(([l, n, c]) => (
                  <div key={l} className="between small"><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: c }} />{l}</span><b>{n}</b></div>
                ))}
              </div>
              <Donut parts={[{ v: 45, c: '#0b6e5c' }, { v: 11, c: '#e0a100' }, { v: 2, c: '#d64545' }]} size={120} thickness={22} center="95%" />
            </div>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col w-360">
          <MoneyCard title="Payments received" value="£64,522" tag="+12%" tone="ok" note="From 27 customers · deposits and balances" values={[22, 30, 26, 38, 34, 44, 40, 52, 48, 61]} color="#00c7a1" />
          <MoneyCard title="Balances due" value="£86,150" tag="9 jobs" tone="err" note="Waiting to be paid after installation" values={[40, 36, 44, 39, 48, 45, 52, 50, 58, 55]} color="#d64545" />
        </div>
        <Card className="grow">
          <CardHead title="Latest updates" right={<button className="link">View all<IconChevronRight size={14} /></button>} />
          <div className="list">
            {updates.map(u => (
              <div key={u.title} className="hstack" style={{ gap: 12, padding: '11px 0' }}>
                <div className="datechip"><b>{u.d}</b><span>{u.m}</span></div>
                <div className="vstack" style={{ gap: 3, flex: 1 }}><b style={{ fontSize: 13.5 }}>{u.title}</b><span className="small t2">{u.sub}</span></div>
                <Tag tone={u.tone}>{u.tag}</Tag>
              </div>
            ))}
          </div>
        </Card>
        <div className="w-320" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[['Deposits collected', '£18,400', '+8%', 'ok', IconCurrencyPound, '#1f9d5b'], ['Late payments', '4', '−2', 'ok', IconClock, '#e0a100'], ['Snags open', '7', '+1', 'err', IconAlertTriangle, '#d64545'], ['Outstanding', '£86,150', '9 jobs', 'warn', IconFileText, '#2f6fde']].map(([l, v, t, tone, I, c]: any) => (
            <div key={l} className="card" style={{ padding: 14, gap: 10 }}>
              <div className="between"><Tile icon={<I size={17} />} color={c} size={32} radius={8} /><Tag tone={tone}>{t}</Tag></div>
              <span className="small t2">{l}</span>
              <b style={{ fontSize: 19 }}>{v}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-4" style={{ gap: 16 }}>
        {[['View diary', 'Surveys, deliveries, installs', '#0b6e5c', IconCalendar, '/diary'], ['New enquiry', 'Add a customer and job', '#2f6fde', IconPlus, 'enq'], ['Customer portal', 'What customers can see', '#1f9d5b', IconHome, '/portal'], ['Payments (Xero)', 'Invoices and receipts', '#e0a100', IconCurrencyPound, '/payments']].map(([t, s, c, I, to]: any) => (
          <button key={t} className="pill-action" style={{ background: hexA(c, 0.08), borderColor: hexA(c, 0.2), textAlign: 'left' }} onClick={() => (to === 'enq' ? setModal('enq') : nav(to))}>
            <span className="ic" style={{ background: c }}><I size={19} /></span>
            <span className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 14 }}>{t}</b><span className="small t2">{s}</span></span>
            <IconChevronRight size={17} color={c} />
          </button>
        ))}
      </div>

      <div className="row">
        <Card className="w-360">
          <CardHead title="Top products" right={<Dd>This month</Dd>} />
          {topProducts.map(p => (
            <div key={p.name} className="hstack" style={{ gap: 12 }}>
              <img src={IMG[p.photo]} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 6, flex: 1 }}>
                <div className="between"><b style={{ fontSize: 13 }}>{p.name}</b><span className="small"><span className="t2">{p.sold} sold</span> <b style={{ color: 'var(--primary-dark)' }}>{p.pct}%</b></span></div>
                <Progress value={(p.pct / 46) * 92} height={8} />
              </div>
            </div>
          ))}
          <div className="alert info small"><IconInfoCircle size={16} />Windows are almost half of all sales this month.</div>
        </Card>
        <Card className="grow">
          <CardHead title="Customer activity" right={<button className="link">View all<IconChevronRight size={14} /></button>} />
          <div className="list">
            {activity.map(a => (
              <div key={a.who} className="hstack" style={{ gap: 12, padding: '11px 0' }}>
                <Avatar i={a.i} size={36} />
                <div className="vstack" style={{ gap: 3, flex: 1 }}><b style={{ fontSize: 13.5 }}>{a.who} · {a.what}</b><span className="small t2">{a.job} · {a.when}</span></div>
                <Tag tone={a.tone}>{a.tag}</Tag>
              </div>
            ))}
          </div>
        </Card>
        <Card className="w-320">
          <CardHead title="To do" right={<button className="link" onClick={() => setModal('task')}>Add task<IconPlus size={14} /></button>} />
          <div className="list">
            {myTasks.map(t => {
              const late = !t.done && t.due < TODAY;
              const tag = t.done ? ['Completed', 'ok'] : late ? ['Overdue', 'err'] : t.due === TODAY ? ['Due today', 'warn'] : ['Coming up', 'grey'];
              return (
                <div key={t.id} className="hstack" style={{ gap: 10, padding: '10px 0', alignItems: 'flex-start' }}>
                  <Check on={t.done} onChange={v => set('tasks', ts => ts.map(x => (x.id === t.id ? { ...x, done: v } : x)))} />
                  <div className="vstack" style={{ gap: 6 }}>
                    <b style={{ fontSize: 13.5, color: t.done ? 'var(--muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</b>
                    <span className="hstack small t2" style={{ gap: 6 }}><IconClock size={13} />{t.due === TODAY ? 'Today' : fmtDate(t.due)}<Tag tone={tag[1]}>{tag[0]}</Tag></span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/appointments" className="link">All tasks and appointments<IconChevronRight size={14} /></Link>
        </Card>
      </div>

      {modal === 'enq' && <NewEnquiryModal onClose={() => setModal(null)} />}
      {modal === 'book' && <BookInstallModal onClose={() => setModal(null)} />}
      {modal === 'task' && <AddTaskModal onClose={() => setModal(null)} />}
    </>
  );
}

function StatCard({ icon, color, value, label, tag, tone, foot, onClick }: any) {
  return (
    <div className="card stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="hstack" style={{ gap: 12, alignItems: 'center' }}>
        <Tile icon={icon} color={color} size={52} radius={10} />
        <div className="vstack" style={{ gap: 2 }}><span className="kpi">{value}</span><span className="t2" style={{ fontSize: 13 }}>{label}</span></div>
        <span className="ml-auto" style={{ alignSelf: 'flex-start', marginTop: 4 }}><Tag tone={`solid-${tone}`}>{tag}</Tag></span>
      </div>
      <div className="between small t2">{foot.map(([k, v]: any) => <span key={k}>{k} :<b style={{ color: 'var(--text)' }}>{v}</b></span>)}</div>
    </div>
  );
}

function HighlightCard({ color, photo, label, initials, name, sub }: any) {
  return (
    <div style={{ borderRadius: 10, position: 'relative', overflow: 'hidden', color: '#fff', minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: hexA(color, 0.86) }} />
      <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.08)', top: -70, right: -40 }} />
      <div className="vstack" style={{ position: 'relative', alignItems: 'center', gap: 8, padding: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>{label}</span>
        <span className="avatar" style={{ width: 64, height: 64, background: '#fff', color, fontSize: 24, fontWeight: 700 }}>{initials}</span>
        <b style={{ fontSize: 18 }}>{name}</b>
        <span style={{ fontSize: 12, opacity: 0.9 }}>{sub}</span>
      </div>
    </div>
  );
}

function MoneyCard({ title, value, tag, tone, note, values, color }: any) {
  return (
    <Card style={{ flex: 1 }}>
      <CardHead title={title} right={<Dd>This month</Dd>} />
      <div className="hstack" style={{ gap: 10 }}><b style={{ fontSize: 26, letterSpacing: -0.4 }}>{value}</b><Tag tone={tone} icon={<IconArrowUpRight size={12} />}>{tag}</Tag></div>
      <span className="small t2">{note}</span>
      <AreaLine values={values} color={color} />
    </Card>
  );
}
