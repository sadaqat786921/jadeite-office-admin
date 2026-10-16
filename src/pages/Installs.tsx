import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCalendarPlus, IconChevronLeft, IconChevronRight, IconCircleCheck, IconCircleX, IconAlertTriangle, IconTool, IconCalendar, IconClock, IconGripVertical, IconBeach, IconInfoCircle } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Seg, Tile, Modal, Field, useToast } from '../components/ui';
import { BookInstallModal } from '../components/Forms';
import { teams, IMG, teamById } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, mondayOf, dayDiff, JobX, DiaryEvent } from '../data/store';

function readiness(j: JobX, events: DiaryEvent[]) {
  const checks: [string, boolean][] = [
    ['Survey approved', j.stage !== 'Survey' && j.stage !== 'Quote'],
    ['Order delivered', j.stage === 'Delivery' && !j.blocked],
    ['Deposit paid', j.deposit > 0 && j.paid >= j.deposit],
  ];
  const booked = events.some(e => e.job === j.id && e.kind === 'install' && e.date >= TODAY);
  return { checks, ready: checks.every(c => c[1]), booked };
}

export function useBookingLists() {
  const { jobs, events } = useStore();
  const candidates = jobs.filter(j => ['Ordered', 'Delivery'].includes(j.stage));
  const rows = candidates.map(j => ({ j, ...readiness(j, events) })).filter(r => !r.booked);
  return { ready: rows.filter(r => r.ready), notReady: rows.filter(r => !r.ready) };
}

export function Installations() {
  const { events, jobs } = useStore();
  const [modal, setModal] = useState<string | null>(null);
  const { ready, notReady } = useBookingLists();
  const upcoming = events.filter(e => e.kind === 'install' && e.date >= addDays(TODAY, -6)).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHead title="Installations" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Installations' }]} actions={<><Link to="/diary" className="btn btn-grey"><IconCalendar size={16} />Open diary</Link><button className="btn btn-primary" onClick={() => setModal('any')}><IconCalendarPlus size={16} />Book installation</button></>} />
      <div className="grid-4">
        {[['Booked this month', '18', IconTool, '#0b6e5c'], ['Done', '11', IconCircleCheck, '#1f9d5b'], ['Ready to book', ready.length, IconCalendarPlus, '#2f6fde'], ['Not ready yet', notReady.length, IconAlertTriangle, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="row">
        <div className="col grow">
          <Card>
            <CardHead title="Ready to book" sub="Every check is done — these jobs can go in the diary" />
            {ready.length === 0 && <div className="small muted">Nothing waiting. Well done.</div>}
            {ready.map(({ j, checks }) => (
              <div key={j.id} className="card" style={{ padding: 14, gap: 12 }}>
                <div className="hstack" style={{ gap: 12 }}>
                  <img src={IMG[j.photo]} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                  <div className="vstack" style={{ gap: 3, flex: 1 }}><Link to={`/jobs/${j.id}`} className="b" style={{ fontSize: 14 }}>{j.customer}</Link><span className="small muted">{j.id} · {j.products}</span></div>
                  <button className="btn btn-primary btn-sm" onClick={() => setModal(j.id)}><IconCalendarPlus size={14} />Book in diary</button>
                </div>
                <div className="hstack" style={{ gap: 14, flexWrap: 'wrap' }}>{checks.map(([c, ok]) => <span key={c} className="hstack small" style={{ gap: 5, color: ok ? 'var(--ok)' : 'var(--err)' }}>{ok ? <IconCircleCheck size={15} /> : <IconCircleX size={15} />}{c}</span>)}</div>
              </div>
            ))}
          </Card>
          <Card>
            <CardHead title="Not ready yet" sub="These can’t be booked until the red checks are done" />
            {notReady.map(({ j, checks }) => (
              <div key={j.id} className="hstack" style={{ gap: 12, padding: '4px 0', opacity: 0.95 }}>
                <img src={IMG[j.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', filter: 'grayscale(.5)' }} />
                <div className="vstack" style={{ gap: 4, flex: 1 }}>
                  <Link to={`/jobs/${j.id}`} className="b">{j.customer} <span className="tiny muted">· {j.id}</span></Link>
                  <span className="hstack tiny" style={{ gap: 12, flexWrap: 'wrap' }}>{checks.map(([c, ok]) => <span key={c} className="hstack" style={{ gap: 4, color: ok ? 'var(--ok)' : 'var(--err)', fontWeight: ok ? 400 : 600 }}>{ok ? <IconCircleCheck size={13} /> : <IconCircleX size={13} />}{c}</span>)}</span>
                </div>
                {j.blocked && <Tag tone="err">{j.blocked}</Tag>}
              </div>
            ))}
          </Card>
        </div>
        <Card className="w-400">
          <CardHead title="Booked installations" right={<Link to="/diary" className="link">Diary<IconChevronRight size={14} /></Link>} />
          <div className="list">
            {upcoming.map(e => {
              const j = jobs.find(x => x.id === e.job);
              return (
                <Link to={e.job ? `/jobs/${e.job}` : '/diary'} key={e.id} className="hstack" style={{ gap: 12, padding: '11px 0' }}>
                  <img src={IMG[e.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <div className="vstack" style={{ gap: 2, flex: 1 }}><b>{j?.customer || e.title}</b><span className="tiny muted">{fmtDate(e.date)}{e.days > 1 ? ` – ${fmtDate(addDays(e.date, e.days - 1))}` : ''} · {teamById(e.team)!.name}</span></div>
                  <Tag tone={e.date < TODAY ? 'ok' : e.date === TODAY ? 'jade' : 'info'}>{e.date + '' < TODAY && addDays(e.date, e.days - 1) < TODAY ? 'Done' : e.date <= TODAY ? 'On site' : 'Booked'}</Tag>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
      {modal && <BookInstallModal jobId={modal === 'any' ? undefined : modal} onClose={() => setModal(null)} />}
    </>
  );
}

function LeaveModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { set } = useStore();
  const [team, setTeam] = useState('t1');
  const [date, setDate] = useState(addDays(TODAY, 7));
  const [days, setDays] = useState(1);
  const [who, setWho] = useState('');
  return (
    <Modal title="Add team leave" sub="Leave blocks the diary so nothing is booked by mistake." onClose={onClose} width={520}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { set('events', es => [...es, { id: 'lv' + Date.now(), team, date, days, kind: 'leave', title: `${who || 'Team'} on leave`, sub: 'Leave', photo: 'window' }]); toast('Leave added to the diary'); onClose(); }}>Add leave</button></>}>
      <div className="grid-2">
        <Field label="Team"><select className="select" value={team} onChange={e => setTeam(e.target.value)}>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Who"><input className="input" value={who} onChange={e => setWho(e.target.value)} placeholder="e.g. Dan Hughes" /></Field>
        <Field label="First day"><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Days"><select className="select" value={days} onChange={e => setDays(+e.target.value)}>{[1, 2, 3, 4, 5].map(d => <option key={d}>{d}</option>)}</select></Field>
      </div>
    </Modal>
  );
}

export function Diary() {
  const toast = useToast();
  const { events } = useStore();
  const { ready, notReady } = useBookingLists();
  const [week, setWeek] = useState(mondayOf(TODAY));
  const [modal, setModal] = useState<any>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [leave, setLeave] = useState(false);
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));
  const end = days[5];
  return (
    <>
      <PageHead title="Installation diary" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Installation diary' }]}
        actions={<><button className="btn btn-grey" onClick={() => setLeave(true)}><IconBeach size={16} />Add team leave</button><button className="btn btn-primary" onClick={() => setModal({})}><IconCalendarPlus size={16} />Book installation</button></>} />
      <div className="row">
        <div className="col grow">
          <div className="between">
            <div className="hstack" style={{ gap: 8 }}>
              <button className="icon-btn" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week"><IconChevronLeft size={16} /></button>
              <b style={{ fontSize: 16, minWidth: 210, textAlign: 'center' }}>{fmtDate(week, { day: 'numeric', month: 'short' })} – {fmtDate(end, { day: 'numeric', month: 'long', year: 'numeric' })}</b>
              <button className="icon-btn" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week"><IconChevronRight size={16} /></button>
              <button className="btn btn-outline btn-xs" onClick={() => setWeek(mondayOf(TODAY))}>This week</button>
            </div>
            <div className="hstack small t2" style={{ gap: 14 }}>
              <span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#0b6e5c' }} />Installation</span>
              <span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#d64545' }} />Snag visit</span>
              <span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#e0a100' }} />Workshop</span>
              <span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#9aa7a4' }} />Leave</span>
            </div>
          </div>
          <div className="diary">
            <div className="hd" style={{ borderLeft: 0 }}>Team</div>
            {days.map(d => <div key={d} className={`hd ${d === TODAY ? 'today' : ''}`}>{fmtDate(d, { weekday: 'short', day: 'numeric' })}{d === TODAY && ' · Today'}</div>)}
            {teams.map(t => (
              <React.Fragment key={t.id}>
                <div className="team"><span className="tile" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--deep)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{t.initials}</span><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{t.name}</b><span className="tiny muted">{t.members}</span></div></div>
                <div className="lane"
                  onDragOver={e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setOver(t.id + days[i]); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                  onDrop={e => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setOver(null); if (drag) setModal({ jobId: drag, presetTeam: t.id, presetDate: days[i] }); setDrag(null); }}
                  onDoubleClick={e => { if (!(e.target as HTMLElement).classList.contains('cell')) return; const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setModal({ presetTeam: t.id, presetDate: days[i] }); }}>
                  {days.map(d => <div key={d} className={`cell ${d === TODAY ? 'today' : ''} ${over === t.id + d ? 'drop' : ''}`} />)}
                  {events.filter(e => e.team === t.id && e.date <= end && addDays(e.date, e.days - 1) >= week).map(e => {
                    const s = Math.max(0, dayDiff(week, e.date)); const len = Math.min(6, dayDiff(week, e.date) + e.days) - s;
                    return (
                      <div key={e.id} className={`event ${e.kind}`} title={e.kind === 'leave' ? e.title : 'Click to change or cancel'} style={{ left: `calc(${(s / 6) * 100}% + 6px)`, width: `calc(${(len / 6) * 100}% - 12px)` }}
                        onClick={() => (e.kind === 'leave' || e.kind === 'delivery' ? toast(e.kind === 'leave' ? `${e.title} — nothing can be booked for ${t.name} on these days` : 'Workshop day') : setModal({ event: e }))}>
                        {e.kind !== 'leave' && <img src={IMG[e.photo]} alt="" />}
                        {e.kind === 'leave' && <IconBeach size={18} />}
                        <div className="vstack" style={{ gap: 2, minWidth: 0 }}><b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</b><span className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.sub}</span></div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
          <span className="hstack tiny muted" style={{ gap: 6 }}><IconInfoCircle size={13} />Drag a job from “Ready to book” onto a team and day. Click a booking to move or cancel it. Double-click an empty day to book.</span>
        </div>
        <div className="col w-320">
          <Card>
            <CardHead title="Ready to book" sub="Drag onto the diary, or press Book" />
            {ready.length === 0 && <div className="small muted">Nothing waiting.</div>}
            {ready.map(({ j }) => (
              <div key={j.id} className="card" style={{ padding: 12, gap: 10, cursor: 'grab', borderColor: drag === j.id ? 'var(--primary)' : undefined }} draggable onDragStart={() => setDrag(j.id)} onDragEnd={() => setOver(null)}>
                <div className="hstack" style={{ gap: 10 }}><IconGripVertical size={16} color="#b7c2bf" /><img src={IMG[j.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{j.customer}</b><span className="tiny muted">{j.products}</span></div></div>
                <div className="between"><span className="tiny hstack" style={{ gap: 4, color: 'var(--ok)' }}><IconCircleCheck size={12} />All checks done</span><button className="btn btn-primary btn-xs" onClick={() => setModal({ jobId: j.id })}>Book</button></div>
              </div>
            ))}
          </Card>
          <Card>
            <CardHead title="Not ready yet" />
            {notReady.map(({ j, checks }) => (
              <div key={j.id} className="vstack" style={{ gap: 3 }}>
                <b style={{ fontSize: 13 }}>{j.customer}</b>
                <span className="tiny" style={{ color: 'var(--err)' }}>Missing: {checks.filter(c => !c[1]).map(c => c[0].toLowerCase()).join(', ')}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
      {modal && <BookInstallModal {...modal} onClose={() => setModal(null)} />}
      {leave && <LeaveModal onClose={() => setLeave(false)} />}
    </>
  );
}
