import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCalendarPlus, IconChevronLeft, IconChevronRight, IconCircleCheck, IconCircleX, IconAlertTriangle, IconTool, IconCalendar, IconClock, IconGripVertical, IconBeach, IconInfoCircle } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Seg, Tile, Modal, Field, useToast, Progress } from '../components/ui';
import { ActionModal, installOf } from '../components/Journey';
import { useRows, products, Row } from '../components/derive';
import { BookInstallModal } from '../components/Forms';
import { teams, IMG, teamById } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, mondayOf, dayDiff, EnquiryX } from '../data/store';

export function useBookingLists() {
  const rows = useRows();
  const { events } = useStore();
  const asJob = (r: Row) => ({ id: r.e.jobId!, customer: r.e.name, photo: r.e.photo, products: products(r.e) });
  const ready = rows.filter(r => r.st.key === 'book' || (r.e.jobId && r.e.ops?.override && !installOf(r.e, events))).map(r => ({ r, j: asJob(r), checks: [['Delivered and checked', !!r.e.ops?.received?.ok], ['Deposit paid', !!r.e.ops?.deposit]] as [string, boolean][] }));
  const notReady = rows.filter(r => r.st.phase === 'order' || ['receive', 'issue'].includes(r.st.key)).filter(r => !ready.some(x => x.r.e.id === r.e.id)).map(r => ({ r, j: asJob(r), checks: [['Delivered and checked', false], ['Deposit paid', !!r.e.ops?.deposit]] as [string, boolean][] }));
  return { ready, notReady };
}

export function Installations() {
  const rows = useRows();
  const { events } = useStore();
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const [any, setAny] = useState(false);
  const { ready, notReady } = useBookingLists();
  const booked = rows.filter(r => r.st.phase === 'install' && !r.e.ops?.work);
  const onSite = rows.filter(r => r.e.ops?.work === 'Started');
  const finished = rows.filter(r => r.st.phase === 'review');
  const Btn = ({ r }: { r: Row }) => <button className={`btn ${r.st.wait ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={() => setAct({ k: r.st.key, e: r.e })}>{r.st.icon}{r.st.label}</button>;
  const Line = ({ r, extra, children }: { r: Row; extra?: React.ReactNode; children?: React.ReactNode }) => (
    <div className="hstack" style={{ gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <img src={IMG[r.e.photo]} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} />
      <div className="vstack" style={{ gap: 3, flex: 1, minWidth: 200 }}><Link to={`/jobs/${r.e.jobId || r.e.id}`} className="b">{r.e.name} <span className="tiny muted">· {r.e.jobId}</span></Link><span className="tiny muted">{products(r.e)} · {r.e.address}</span>{extra}</div>
      {children}
    </div>
  );
  const fitText = (r: Row) => { const f = installOf(r.e, events); return f ? `${fmtDate(f.date)}${f.days > 1 ? ` – ${fmtDate(addDays(f.date, f.days - 1))}` : ''} · ${teamById(f.team)?.name} (${teamById(f.team)?.members})` : ''; };
  return (
    <>
      <PageHead title="Installations" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Installations' }]} actions={<><Link to="/diary" className="btn btn-grey"><IconCalendar size={16} />Open diary</Link><button className="btn btn-primary" onClick={() => setAny(true)}><IconCalendarPlus size={16} />Book installation</button></>} />
      <div className="grid-4">
        {[['Ready to book', ready.length, IconCalendarPlus], ['Booked', booked.length, IconCalendar], ['On site now', onSite.length, IconTool], ['Finished · to review', finished.length, IconCircleCheck]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={l === 'Ready to book' && v ? '#e0a100' : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="row">
        <div className="col grow">
          <Card>
            <CardHead title="Ready to book" sub="Delivered and checked, or approved by a director" />
            {ready.length === 0 && <div className="small muted">Nothing waiting to be booked.</div>}
            {ready.map(({ r }) => <Line key={r.e.id} r={r} extra={r.e.ops?.override && !r.e.ops?.received?.ok ? <span className="tiny" style={{ color: 'var(--warn)', fontWeight: 600 }}>Override approved by {r.e.ops.override.by}</span> : <span className="tiny hstack" style={{ gap: 4, color: 'var(--ok)' }}><IconCircleCheck size={12} />Delivered and checked {r.e.ops?.received?.on}</span>}><button className="btn btn-primary btn-sm" onClick={() => setAct({ k: 'book', e: r.e })}><IconCalendarPlus size={14} />Book installation</button></Line>)}
          </Card>
          <Card>
            <CardHead title="Booked" sub="Release the job pack before the team goes" />
            {booked.length === 0 && <div className="small muted">No installations booked.</div>}
            {booked.map(r => <Line key={r.e.id} r={r} extra={<span className="tiny">{fitText(r)} · {r.e.ops?.pack ? <span style={{ color: 'var(--ok)' }}>job pack sent {r.e.ops.pack}</span> : <span style={{ color: 'var(--warn)', fontWeight: 600 }}>job pack not sent</span>}</span>}><Btn r={r} /></Line>)}
          </Card>
          <Card>
            <CardHead title="On site now" sub="Updated by the installers from their phone" />
            {onSite.length === 0 && <div className="small muted">Nobody on site right now.</div>}
            {onSite.map(r => <Line key={r.e.id} r={r} extra={<div className="hstack" style={{ gap: 8 }}><Progress value={r.e.ops?.progress || 0} /><span className="tiny">{r.e.ops?.progress || 0}%</span></div>}><button className="btn btn-outline btn-sm" onClick={() => setAct({ k: 'progress', e: r.e })}>Progress update</button><Btn r={r} /></Line>)}
          </Card>
          <Card>
            <CardHead title="Finished · waiting for the office" sub="Snags to fix, then final review and close" />
            {finished.length === 0 && <div className="small muted">Nothing waiting.</div>}
            {finished.map(r => <Line key={r.e.id} r={r} extra={<span className="tiny muted">{r.st.status}</span>}><Btn r={r} /></Line>)}
          </Card>
        </div>
        <Card className="w-400">
          <CardHead title="Waiting for delivery" sub="Can be booked early only with a director's approval" />
          {notReady.length === 0 && <div className="small muted">Nothing waiting.</div>}
          {notReady.map(({ r }) => (
            <div key={r.e.id} className="vstack" style={{ gap: 6, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <Link to={`/jobs/${r.e.jobId}`} className="b">{r.e.name} <span className="tiny muted">· {r.e.jobId}</span></Link>
              <span className="tiny muted">{r.st.status}</span>
              {!installOf(r.e, events) && !r.e.ops?.override && <button className="btn btn-outline btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => setAct({ k: 'override', e: r.e })}>Book early (director approval)</button>}
              {installOf(r.e, events) && <span className="tiny" style={{ color: 'var(--ok)' }}>Booked {fitText(r)}</span>}
            </div>
          ))}
        </Card>
      </div>
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
      {any && <BookInstallModal onClose={() => setAny(false)} />}
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
            {[{ id: 'un', name: 'Needs installer', initials: '?', members: 'Not assigned yet', color: '#d64545' }, ...teams].filter(t => t.id !== 'un' || events.some(e => e.team === 'un')).map(t => (
              <React.Fragment key={t.id}>
                {t.id === 'un' ? <div className="team" style={{ background: '#fdf3f3' }}><span className="tile" style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', color: 'var(--err)', border: '1.5px dashed #e7a3a3', fontSize: 13, fontWeight: 700 }}>?</span><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13, color: 'var(--err)' }}>Needs installer</b><span className="tiny muted">{events.filter(e => e.team === 'un').length} waiting · </span>{(() => { const nx = events.filter(e => e.team === 'un').sort((a, b) => a.date.localeCompare(b.date))[0]; return nx && (nx.date < week || nx.date > end) ? <button className="link tiny" style={{ padding: 0 }} onClick={() => setWeek(mondayOf(nx.date))}>show {fmtDate(nx.date, { day: 'numeric', month: 'short' })}</button> : <span className="tiny muted">click one to assign</span>; })()}</div></div> :
                <div className="team"><span className="tile" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--deep)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{t.initials}</span><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{t.name}</b><span className="tiny muted">{t.members}</span></div></div>}
                <div className="lane"
                  onDragOver={e => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setOver(t.id + days[i]); }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
                  onDrop={e => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setOver(null); if (drag) setModal({ jobId: drag, presetTeam: t.id, presetDate: days[i] }); setDrag(null); }}
                  onDoubleClick={e => { if (!(e.target as HTMLElement).classList.contains('cell')) return; const r = e.currentTarget.getBoundingClientRect(); const i = Math.min(5, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 6))); setModal({ presetTeam: t.id, presetDate: days[i] }); }}>
                  {days.map(d => <div key={d} className={`cell ${d === TODAY ? 'today' : ''} ${over === t.id + d ? 'drop' : ''}`} />)}
                  {events.filter(e => e.team === t.id && e.date <= end && addDays(e.date, e.days - 1) >= week).map(e => {
                    const s = Math.max(0, dayDiff(week, e.date)); const len = Math.min(6, dayDiff(week, e.date) + e.days) - s;
                    return (
                      <div key={e.id} className={`event ${e.kind}`} title={e.team === 'un' ? 'Click to assign an installer team' : e.kind === 'leave' ? e.title : 'Click to change or cancel'} style={{ left: `calc(${(s / 6) * 100}% + 6px)`, width: `calc(${(len / 6) * 100}% - 12px)`, ...(e.team === 'un' ? { background: '#fff', border: '1.5px dashed #e7a3a3', borderLeft: '4px solid #d64545' } : {}) }}
                        onClick={() => (e.team === 'un' ? setModal({ jobId: e.job, presetDate: e.date }) : e.kind === 'leave' || e.kind === 'delivery' ? toast(e.kind === 'leave' ? `${e.title} — nothing can be booked for ${t.name} on these days` : 'Workshop day') : setModal({ event: e }))}>
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
