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
import { me, salesByMonth, topProducts, IMG, gbp, staffById } from '../data/mock';
import { crewPeople, busyWith } from '../data/crew';
import { useRows, isJob } from '../components/derive';
import { needsOffice, installOf, ActionModal } from '../components/Journey';
import { useOrderRows } from './Supply';
import { useInvoices } from './Payments';
import { commTime } from './Messages';
import { addDays, EnquiryX } from '../data/store';

const OCT = [[27, 28, 29, 30, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]];

export default function Dashboard() {
  const nav = useNavigate();
  const [alert, setAlert] = useState(true);
  const [modal, setModal] = useState<'enq' | 'book' | 'task' | null>(null);
  const [tab, setTab] = useState('Installations');
  const { tasks, set, events, appts, snags, enquiries, installers } = useStore();
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const rows = useRows();
  const orderRows = useOrderRows();
  const inv = useInvoices();
  const yours = rows.filter(r => needsOffice(r.st));
  const late = rows.filter(r => r.e.nextDue === 'Overdue' && r.st.phase !== 'lost' && r.st.phase !== 'after');
  const problems = orderRows.filter(r => r.status === 'Problem');
  const toBook = rows.filter(r => r.st.key === 'book');
  const myTasks = tasks.filter(t => t.owner === 'sm').slice(0, 5);
  const todoCount = tasks.filter(t => t.owner === 'sm' && !t.done).length + yours.length;
  const salesRows = rows.filter(r => ['new', 'qual', 'appt', 'prep', 'sent'].includes(r.st.phase));
  const jobs = rows.filter(r => isJob(r.e) && r.st.phase !== 'after');
  const fits = rows.map(r => ({ r, fit: installOf(r.e, events) })).filter(x => x.fit);
  const onSite = rows.filter(r => r.st.phase === 'install' && r.e.ops?.work === 'Started');
  const openOrders = orderRows.filter(r => r.status !== 'Checked');
  const lateDel = openOrders.filter(r => r.expectedIso && r.expectedIso < TODAY && !['Delivered', 'Problem'].includes(r.status));
  const openSn = snags.filter(x => x.status !== 'Fixed');
  const money = (p: (i: any) => boolean) => inv.filter(p).reduce((a, i) => a + i.amount, 0);
  const upcomingList = [
    ...events.filter(ev => ev.date >= TODAY && ev.team !== 'un' && ev.kind !== 'leave').map(ev => ({ k: ev.id, date: ev.date, title: ev.title, time: ev.kind === 'install' ? `${ev.days} day${ev.days > 1 ? 's' : ''} · fitting` : ev.kind, photo: ev.photo, who: crewPeople(ev).map(p => p.initials).slice(0, 3), color: ev.kind === 'install' ? '#0b6e5c' : ev.kind === 'snag' ? '#d64545' : '#00c7a1' })),
    ...appts.filter(a => a.date >= TODAY && a.status !== 'Done').map(a => ({ k: a.id, date: a.date, title: `${a.kind} · ${a.customer}`, time: a.time, photo: 'house' as keyof typeof IMG, who: [staffById(a.who)?.initials || 'S'], color: '#00c7a1' })),
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
  const marked = new Set(upcomingList.filter(u => u.date.startsWith('2026-10')).map(u => +u.date.slice(8)));
  const recent = enquiries.flatMap(e => (e.comms || []).filter(c => c.kind !== 'reminder').slice(0, 2).map(c => ({ e, c }))).sort((a, b) => commTime(b.c.when) - commTime(a.c.when));
  const tagOf = (k: string) => (k === 'email-in' ? ['Customer', 'warn'] : k === 'email-out' ? ['Email sent', 'jade'] : k === 'call' ? ['Call', 'grey'] : k === 'note' ? ['Note', 'grey'] : ['Update', 'ok']);
  const recordPath = (e: EnquiryX) => (e.jobId ? `/jobs/${e.jobId}` : `/enquiries/${e.id}`);
  const alertRow = problems[0] || orderRows.find(r => r.status === 'In transit');
  return (
    <>
      <PageHead title="Office Admin Dashboard" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Office Admin' }]}
        actions={<><button className="btn btn-primary" onClick={() => setModal('enq')}><IconPlus size={16} />New enquiry</button><button className="btn btn-grey" onClick={() => setModal('book')}>Book installation</button></>} />

      {alert && alertRow && (
        <div className={`alert ${alertRow.status === 'Problem' ? 'err' : 'ok'}`}>
          <span className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: '#fff' }}>{alertRow.o.supplier[0]}</span>
          <span>{alertRow.status === 'Problem' ? <><b>Delivery problem</b> on <b>{alertRow.e.jobId} · {alertRow.e.name}</b> — {alertRow.problem || 'please check'}</> : <><b>{alertRow.o.supplier}</b>: the order for <b>{alertRow.e.jobId} · {alertRow.e.name}</b> is on the way · due {alertRow.o.expected}</>}</span>
          <Link to="/deliveries" className="link" style={{ marginLeft: 'auto', color: 'inherit' }}>Open deliveries</Link>
          <button style={{ background: 'none', border: 0, color: 'inherit', display: 'flex' }} onClick={() => setAlert(false)}><IconX size={16} /></button>
        </div>
      )}

      <div className="attn">
        <div style={{ background: 'var(--deep)', color: '#fff' }}><IconAlertTriangle size={18} color="#00c7a1" /><b style={{ fontSize: 13 }}>Needs your<br />attention</b></div>
        {[['Your turn', yours.length, 'Jobs waiting for the office', '#e0a100', '/enquiries'], ['Late', late.length, 'Next step is overdue', '#d64545', '/enquiries'], ['Delivery problems', problems.length, 'Damaged or wrong items', '#d64545', '/deliveries'], ['Ready to book', toBook.length, 'Delivered, not in the diary yet', '#e0a100', '/installations']].map(([l, n, sub, c, to]: any) => (
          <Link key={l} to={to}>
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
          <span style={{ color: '#cfe0db', fontSize: 14 }}>You have {todoCount} things to do today: {yours.length} jobs waiting for you and {todoCount - yours.length} tasks. Have a good day at work.</span>
        </div>
        <span className="ml-auto hstack" style={{ color: '#e6efec', fontSize: 13.5 }}><IconRefresh size={16} />Up to date</span>
      </div>

      <div className="grid-4">
        <StatCard icon={<IconInbox size={24} />} color="#00c7a1" value={String(salesRows.length)} label="Open enquiries" tag={`${salesRows.filter(r => r.st.phase === 'new').length} new`} tone="ok" foot={[['New', String(salesRows.filter(r => r.st.phase === 'new').length)], ['Quote sent', String(salesRows.filter(r => r.st.phase === 'sent').length)]]} onClick={() => nav('/enquiries')} />
        <StatCard icon={<IconBox size={24} />} color="#0b6e5c" value={String(jobs.length)} label="Jobs in progress" tag={`${jobs.filter(r => needsOffice(r.st)).length} your turn`} tone="ok" foot={[['Ordering', String(jobs.filter(r => ['won', 'order'].includes(r.st.phase)).length)], ['Fitting', String(jobs.filter(r => ['ready', 'install'].includes(r.st.phase)).length)]]} onClick={() => nav('/jobs')} />
        <StatCard icon={<IconTool size={24} />} color="#0b6e5c" value={String(fits.filter(x => x.fit!.date >= TODAY).length)} label="Installations booked" tag={`${onSite.length} on site`} tone="ok" foot={[['This week', String(fits.filter(x => x.fit!.date >= TODAY && x.fit!.date <= addDays(TODAY, 7)).length)], ['To book', String(toBook.length)]]} onClick={() => nav('/installations')} />
        <StatCard icon={<IconTruck size={24} />} color={problems.length || lateDel.length ? '#d64545' : '#0b6e5c'} value={String(openOrders.length)} label="Deliveries open" tag={problems.length ? `${problems.length} problem` : lateDel.length ? `${lateDel.length} late` : 'On time'} tone={problems.length || lateDel.length ? 'err' : 'ok'} foot={[['On the way', String(openOrders.filter(r => r.status === 'In transit').length)], ['To check', String(openOrders.filter(r => r.status === 'Delivered').length)]]} onClick={() => nav('/deliveries')} />
      </div>

      <div className="row">
        <Card className="grow">
          <CardHead title="Quotes and sales" right={<Dd icon={<IconCalendar size={14} />}>Last 8 months</Dd>} />
          <div className="hstack small t2" style={{ gap: 16 }}><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#dfe5e3' }} />Quoted</span><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#0b6e5c' }} />Won</span></div>
          <BarChart data={salesByMonth} height={252} />
        </Card>
        <Card className="w-360">
          <CardHead title="Supplier issues" right={<Dd icon={<IconCalendar size={14} />}>This week</Dd>} />
          {openOrders.slice(0, 3).map(r => (
            <div key={r.o.ref} className="card" style={{ padding: 0, gap: 0 }}>
              <div className="hstack" style={{ padding: 12, gap: 12 }}>
                <Avatar i={r.o.supplier[0]} size={36} />
                <div className="vstack" style={{ gap: 3, flex: 1 }}>
                  <div className="hstack" style={{ gap: 6 }}><b style={{ fontSize: 14 }}>{r.o.supplier}</b><Tag tone={r.status === 'Problem' ? 'err' : r.status === 'Pending' ? 'warn' : 'jade'}>{r.status === 'Pending' ? 'Not confirmed' : r.status}</Tag></div>
                  <span className="small t2">{r.e.jobId} · {r.e.name}</span>
                </div>
                <Link to="/orders" className="tile" style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }} aria-label="Open orders"><IconChevronRight size={14} /></Link>
              </div>
              <div className="between small" style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}><span className="t2">{r.o.ref} · {r.o.items}</span><b style={{ color: r.status === 'Problem' ? 'var(--err)' : 'var(--text)' }}>{r.status === 'Problem' ? 'Needs action' : `Due ${r.o.expected}`}</b></div>
            </div>
          ))}
          {openOrders.length === 0 && <span className="small muted">No open supplier orders.</span>}
        </Card>
      </div>

      <div className="row">
        <Card className="w-360">
          <CardHead title="Schedules" right={<button className="link" onClick={() => setModal('book')}><IconPlus size={14} />Add new</button>} />
          <div className="between"><b style={{ fontSize: 14 }}>October 2026</b><Link to="/diary" className="link">Open diary<IconChevronRight size={14} /></Link></div>
          <div className="cal-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="d b t2">{d}</div>)}
            {OCT.flat().map((d, i) => {
              const prev = i < 4;
              const cls = prev ? 'prev' : d === 16 ? 'today' : marked.has(d) ? 'mark' : '';
              return <div key={i} className={`d ${cls}`}><span>{d}</span></div>;
            })}
          </div>
          <b style={{ fontSize: 14 }}>Upcoming</b>
          {upcomingList.slice(0, 3).map(u => (
            <Link to="/diary" key={u.k} className="card" style={{ padding: 0, gap: 0, borderLeft: `3px solid ${u.color}` }}>
              <div className="hstack" style={{ gap: 10, padding: 12 }}>
                <img src={IMG[u.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 13.5 }}>{u.title}</b><span className="small t2 hstack" style={{ gap: 5 }}><IconCalendar size={13} />{fmtDate(u.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span></div>
              </div>
              <div className="between small t2" style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', margin: '0 0 0 0' }}>
                <span className="hstack" style={{ gap: 5 }}><IconClock size={13} />{u.time}</span>
                <span className="hstack" style={{ gap: 0 }}>{u.who.map(w => <Avatar key={w} i={w} size={22} ring />)}</span>
              </div>
            </Link>
          ))}
        </Card>

        <div className="col grow">
          <Card>
            <CardHead title="Job status" right={<Dd icon={<IconCalendar size={14} />}>Today</Dd>} />
            <div className="hstack" style={{ gap: 18 }}>
              {['Installations', 'Surveys', 'Deliveries'].map(t => <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 0, padding: 0, fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--primary-dark)' : 'var(--text-2)' }}>{t}</button>)}
            </div>
            <div className="grid-3" style={{ gap: 10 }}>
              {(tab === 'Installations' ? [[String(fits.filter(x => x.fit!.date >= TODAY).length), 'Booked'], [String(onSite.length), 'On site'], [String(openSn.filter(x => (x.kind || 'Snag') === 'Snag').length), 'Snags open']] : tab === 'Surveys' ? [[String(rows.filter(r => r.e.finalSurvey && r.e.finalSurvey.status !== 'Done').length), 'Booked'], [String(rows.filter(r => r.st.key === 'finalBook').length), 'To book'], [String(rows.filter(r => r.e.finalSurvey?.status === 'Done').length), 'Done']] : [[String(openOrders.filter(r => r.status === 'In transit').length), 'On the way'], [String(openOrders.filter(r => r.status === 'Delivered').length), 'To check'], [String(problems.length + lateDel.length), 'Late or problem']]).map(([n, l]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}><b style={{ fontSize: 17 }}>{n}</b><div className="small t2">{l}</div></div>
              ))}
            </div>
            <div style={{ display: 'grid', placeItems: 'center', padding: '4px 0' }}>
              <Donut parts={[{ v: jobs.filter(r => !needsOffice(r.st)).length || 0.01, c: '#0b6e5c' }, { v: yours.filter(r => isJob(r.e)).length, c: '#e0a100' }, { v: problems.length + lateDel.length, c: '#d64545' }]} size={200} thickness={40} center={String(jobs.length)} sub="Jobs" />
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
              {[['Enquiries', '#00c7a1', IconInbox, '/enquiries'], ['Diary', '#0b6e5c', IconCalendar, '/diary'], ['Orders', '#0b6e5c', IconPackage, '/orders'], ['Surveys', '#00c7a1', IconClipboardCheck, '/surveys'], ['Messages', '#0b6e5c', IconMessage, '/messages'], ['Reports', '#00c7a1', IconChartBar, '/reports']].map(([l, c, I, to]: any) => (
                <Link to={to} key={l} className="qlink" style={{ background: hexA(c, 0.12) }}><span className="ic" style={{ background: c }}><I size={18} /></span>{l}</Link>
              ))}
            </div>
          </Card>
          <Card>
            <CardHead title="Installers today" right={<Link to="/diary" className="link"><IconCalendarEvent size={14} />Diary</Link>} />
            {installers.map(p => { const h = busyWith(p.id, TODAY, 1, events); return (
              <Link key={p.id} to={`/diary/installer/${p.id}`} className="hstack" style={{ gap: 10, padding: '4px 0' }}>
                <Avatar i={p.initials} size={28} bg={p.color} fg="#fff" />
                <div className="vstack" style={{ gap: 1, flex: 1, minWidth: 0 }}><b style={{ fontSize: 12.5 }}>{p.name}</b><span className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h ? h.title : 'Nothing booked'}</span></div>
                <Tag tone={!h ? 'ok' : h.kind === 'leave' ? 'grey' : 'jade'}>{!h ? 'Free' : h.kind === 'leave' ? 'Away' : h.kind === 'install' ? 'Fitting' : h.kind === 'snag' ? 'Visit' : 'Workshop'}</Tag>
              </Link>
            ); })}
          </Card>
          <Card>
            <CardHead title="Job health" right={<Dd icon={<IconSun size={14} />}>This month</Dd>} />
            <div className="hstack" style={{ gap: 12 }}>
              <div className="card" style={{ padding: 10, gap: 8, flex: 1 }}>
                {[['On track', String(jobs.length - late.filter(r => isJob(r.e)).length), '#0b6e5c'], ['Open snags', String(openSn.length), '#e0a100'], ['Late', String(late.filter(r => isJob(r.e)).length), '#d64545']].map(([l, n, c]) => (
                  <div key={l} className="between small"><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: c }} />{l}</span><b>{n}</b></div>
                ))}
              </div>
              <Donut parts={[{ v: Math.max(jobs.length - late.filter(r => isJob(r.e)).length, 0.01), c: '#0b6e5c' }, { v: openSn.length, c: '#e0a100' }, { v: late.filter(r => isJob(r.e)).length, c: '#d64545' }]} size={120} thickness={22} center={`${jobs.length ? Math.round(((jobs.length - late.filter(r => isJob(r.e)).length) / jobs.length) * 100) : 100}%`} />
            </div>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col w-360">
          <MoneyCard title="Payments received" value={gbp(money(i => i.status === 'Paid'))} tag={`${inv.filter(i => i.status === 'Paid').length} invoices`} tone="ok" note="Deposits, stage and completion payments" values={[22, 30, 26, 38, 34, 44, 40, 52, 48, 61]} color="#00c7a1" onClick={() => nav('/payments')} />
          <MoneyCard title="Due to collect" value={gbp(money(i => i.status === 'Due' || i.status === 'Overdue'))} tag={`${inv.filter(i => i.status === 'Overdue').length} overdue`} tone={inv.some(i => i.status === 'Overdue') ? 'err' : 'ok'} note="Invoices sent and waiting to be paid" values={[40, 36, 44, 39, 48, 45, 52, 50, 58, 55]} color="#0b6e5c" onClick={() => nav('/payments')} />
        </div>
        <Card className="grow">
          <CardHead title="Latest updates" right={<Link to="/enquiries" className="link">View all<IconChevronRight size={14} /></Link>} />
          <div className="list">
            {recent.filter(x => x.c.kind === 'system' || x.c.kind === 'email-out').slice(0, 5).map(({ e, c }) => (
              <Link to={recordPath(e)} key={c.id} className="hstack" style={{ gap: 12, padding: '11px 0' }}>
                <div className="datechip"><b>{c.when.split(' ')[0]}</b><span>{(c.when.split(' ')[1] || '').replace(',', '')}</span></div>
                <div className="vstack" style={{ gap: 3, flex: 1 }}><b style={{ fontSize: 13.5 }}>{c.title}</b><span className="small t2">{e.name} · {e.jobId || e.id}</span></div>
                <Tag tone={tagOf(c.kind)[1]}>{tagOf(c.kind)[0]}</Tag>
              </Link>
            ))}
          </div>
        </Card>
        <div className="w-320" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[['Deposits collected', gbp(money(i => i.type === 'Deposit' && i.status === 'Paid')), `${inv.filter(i => i.type === 'Deposit' && i.status === 'Paid').length} jobs`, 'ok', IconCurrencyPound, '#0b6e5c', '/payments'], ['Late payments', String(inv.filter(i => i.status === 'Overdue').length), inv.some(i => i.status === 'Overdue') ? 'Chase' : 'None', inv.some(i => i.status === 'Overdue') ? 'err' : 'ok', IconClock, '#e0a100', '/payments'], ['Snags open', String(openSn.length), openSn.length ? 'To fix' : 'None', openSn.length ? 'warn' : 'ok', IconAlertTriangle, '#d64545', '/snags'], ['Still to invoice', gbp(money(i => i.status === 'Not due yet')), 'Later stages', 'grey', IconFileText, '#0b6e5c', '/payments']].map(([l, v, t, tone, I, c, to]: any) => (
            <div key={l} className="card" style={{ padding: 14, gap: 10, cursor: 'pointer' }} onClick={() => nav(to)}>
              <div className="between"><Tile icon={<I size={17} />} color={c} size={32} radius={8} /><Tag tone={tone}>{t}</Tag></div>
              <span className="small t2">{l}</span>
              <b style={{ fontSize: 19 }}>{v}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-4" style={{ gap: 16 }}>
        {[['View diary', 'Surveys, deliveries, installs', '#0b6e5c', IconCalendar, '/diary'], ['New enquiry', 'Add a customer and job', '#00c7a1', IconPlus, 'enq'], ['Messages', 'Customers waiting for a reply', '#0b6e5c', IconMessage, '/messages'], ['Payments', 'Invoices and reminders', '#0b6e5c', IconCurrencyPound, '/payments']].map(([t, s, c, I, to]: any) => (
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
          <CardHead title="Customer activity" right={<Link to="/messages" className="link">View all<IconChevronRight size={14} /></Link>} />
          <div className="list">
            {recent.filter(x => x.c.kind === 'email-in' || x.c.kind === 'call').slice(0, 5).map(({ e, c }) => (
              <Link to="/messages" key={c.id} className="hstack" style={{ gap: 12, padding: '11px 0' }}>
                <Avatar i={e.initials} size={36} />
                <div className="vstack" style={{ gap: 3, flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5 }}>{e.name} · {c.title}</b><span className="small t2">{e.jobId || e.id} · {c.when}</span></div>
                <Tag tone={tagOf(c.kind)[1]}>{tagOf(c.kind)[0]}</Tag>
              </Link>
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
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
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

function MoneyCard({ title, value, tag, tone, note, values, color, onClick }: any) {
  return (
    <Card style={{ flex: 1, cursor: 'pointer' }} onClick={onClick}>
      <CardHead title={title} right={<Dd>This month</Dd>} />
      <div className="hstack" style={{ gap: 10 }}><b style={{ fontSize: 26, letterSpacing: -0.4 }}>{value}</b><Tag tone={tone} icon={<IconArrowUpRight size={12} />}>{tag}</Tag></div>
      <span className="small t2">{note}</span>
      <AreaLine values={values} color={color} />
    </Card>
  );
}
