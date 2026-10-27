// Installations (the list of jobs to book and fit) and the Installation diary:
// a full-month calendar of who is fitting what, with each installer's own month.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconCalendarPlus, IconChevronLeft, IconChevronRight, IconCircleCheck, IconAlertTriangle, IconTool, IconCalendar, IconClock, IconBeach, IconInfoCircle, IconExternalLink, IconPencil, IconMapPin, IconPhone, IconUsers, IconTrash, IconHammer, IconCheck, IconBuildingWarehouse, IconArrowLeft } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Tile, Modal, Field, useToast, Progress, Avatar, Drawer } from '../components/ui';
import { ActionModal, installOf } from '../components/Journey';
import { useRows, products, Row } from '../components/derive';
import { BookInstallModal, monthCells, shiftMonth, monthName } from '../components/Booking';
import { IMG } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, dayDiff, EnquiryX, DiaryEvent } from '../data/store';
import { crewOf, crewTeam, crewPeople, onDay as isOn, busyWith, freeOn, isSunday, lastDay, personById } from '../data/crew';

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
  const fitText = (r: Row) => { const f = installOf(r.e, events); return f ? `${fmtDate(f.date)}${f.days > 1 ? ` – ${fmtDate(addDays(f.date, f.days - 1))}` : ''}${f.time ? ` · ${f.time}` : ''} · ${crewTeam(f)?.members}` : ''; };
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


/* ======================================================================= */
/* Installation diary                                                       */
/* ======================================================================= */
const KINDS: { k: DiaryEvent['kind'] | 'un'; label: string; color: string }[] = [
  { k: 'install', label: 'Installation', color: '#0b6e5c' },
  { k: 'snag', label: 'Return visit', color: '#d64545' },
  { k: 'delivery', label: 'Workshop or training', color: '#e0a100' },
  { k: 'leave', label: 'Leave', color: '#9aa7a4' },
];
const kindLabel = (ev: DiaryEvent) => (ev.team === 'un' ? 'Needs installers' : KINDS.find(x => x.k === ev.kind)?.label || ev.kind);
const rangeText = (ev: { date: string; days: number }) => `${fmtDate(ev.date)}${ev.days > 1 ? ` – ${fmtDate(lastDay(ev))}` : ''}`;
const ORDER: Record<string, number> = { un: 0, install: 1, snag: 2, delivery: 3, leave: 4, survey: 5 };

/** Where the fitting is up to, worked out from the job itself. */
export function workOf(e?: EnquiryX) {
  const o = e?.ops || {};
  const idx = o.closed ? 4 : o.work === 'Submitted' ? 3 : o.work === 'Started' ? 2 : o.pack ? 1 : 0;
  const pct = idx >= 3 ? 100 : idx === 2 ? o.progress || 0 : 0;
  const label = ['Booked · job pack not sent yet', 'Job pack sent · not started', `On site · ${pct}% done`, 'Finished · office checking', 'Signed off'][idx];
  return { idx, pct, label, steps: ['Booked', 'Job pack sent', 'On site', 'Finished', 'Signed off'] };
}

function MiniCrew({ ev, size = 18 }: { ev: DiaryEvent; size?: number }) {
  const p = crewPeople(ev);
  return <span className="mini-crew">{p.slice(0, 3).map(x => <Avatar key={x.id} i={x.initials} size={size} bg={x.color} fg="#fff" />)}{p.length > 3 && <Avatar i={`+${p.length - 3}`} size={size} />}</span>;
}

type GridProps = {
  month: string; events: DiaryEvent[]; onEvent: (ev: DiaryEvent) => void; onDay: (d: string) => void; onHover: (h: { ev: DiaryEvent; x: number; y: number } | null) => void;
  freeLabel?: (d: string) => { text: string; cls?: string } | null; max?: number;
};
/** The big month calendar used by the diary and by each installer's page. */
function MonthGrid({ month, events, onEvent, onDay, onHover, freeLabel, max = 3 }: GridProps) {
  const cells = monthCells(month);
  return (
    <div className="mcal">
      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <div key={d} className="hd">{d}</div>)}
      {cells.map(d => {
        const list = events.filter(ev => isOn(ev, d)).sort((a, b) => (ORDER[a.team === 'un' ? 'un' : a.kind] ?? 9) - (ORDER[b.team === 'un' ? 'un' : b.kind] ?? 9) || a.title.localeCompare(b.title));
        const fl = freeLabel?.(d);
        const out = d.slice(0, 7) !== month.slice(0, 7);
        return (
          <div key={d} className={`day ${out ? 'out' : ''} ${d === TODAY ? 'today' : ''} ${isSunday(d) ? 'sun' : ''} ${fl?.cls === 'free-day' ? 'free-day' : ''}`} onClick={() => onDay(d)}>
            <div className="dn"><b>{+d.slice(8)}</b>{fl && <span className={`free ${fl.cls || ''}`}>{fl.text}</span>}</div>
            {list.slice(0, max).map(ev => {
              const n = dayDiff(ev.date, d) + 1;
              return (
                <button key={ev.id} type="button" className={`mchip ${ev.team === 'un' ? 'un' : ev.kind} ${n > 1 ? 'cont' : ''}`}
                  onClick={x => { x.stopPropagation(); onHover(null); onEvent(ev); }}
                  onMouseEnter={x => { const r = (x.currentTarget as HTMLElement).getBoundingClientRect(); onHover({ ev, x: r.left, y: r.bottom }); }}
                  onMouseLeave={() => onHover(null)}>
                  <span className="r1">{ev.kind === 'leave' && <IconBeach size={12} color="#6b7a78" />}<span className="t">{ev.kind === 'install' || ev.kind === 'snag' ? ev.title.split(' · ')[0] : ev.title}</span></span>
                  <span className="r2">
                    <span className="d">{ev.team === 'un' ? 'Needs installers' : ev.kind === 'leave' ? ev.sub : ev.days > 1 ? `Day ${n} of ${ev.days}` : ev.kind === 'snag' ? 'Return visit' : ev.time ? `From ${ev.time.split(' ')[0]}` : kindLabel(ev)}</span>
                    {ev.kind !== 'leave' && ev.team !== 'un' && <MiniCrew ev={ev} size={16} />}
                  </span>
                </button>
              );
            })}
            {list.length > max && <button type="button" className="more" onClick={x => { x.stopPropagation(); onDay(d); }}>+{list.length - max} more</button>}
          </div>
        );
      })}
    </div>
  );
}

/** Quick look when you hover a booking. */
function HoverCard({ h }: { h: { ev: DiaryEvent; x: number; y: number } }) {
  const rows = useRows();
  const { ev } = h;
  const r = rows.find(x => x.e.jobId && x.e.jobId === ev.job);
  const w = workOf(r?.e);
  const left = Math.min(h.x, window.innerWidth - 300);
  const top = h.y + 300 > window.innerHeight ? h.y - 330 : h.y + 6;
  return (
    <div className="hovercard" style={{ left, top }}>
      {ev.kind !== 'leave' && <img src={IMG[ev.photo]} alt="" />}
      <div className="between" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>{ev.title}</b><Tag tone={ev.team === 'un' ? 'err' : ev.kind === 'install' ? 'jade' : ev.kind === 'snag' ? 'err' : ev.kind === 'delivery' ? 'warn' : 'grey'}>{kindLabel(ev)}</Tag></div>
      <span className="tiny muted">{ev.sub}</span>
      <span className="hstack small" style={{ gap: 6 }}><IconCalendar size={14} color="#0b6e5c" />{rangeText(ev)}{ev.time ? ` · ${ev.time}` : ''}</span>
      {ev.team !== 'un' && <span className="hstack small" style={{ gap: 6 }}><IconUsers size={14} color="#0b6e5c" />{crewTeam(ev)?.members}</span>}
      {ev.kind === 'install' && r && <div className="vstack" style={{ gap: 4 }}><span className="tiny t2">{w.label}</span><Progress value={w.idx >= 3 ? 100 : w.idx === 2 ? Math.max(w.pct, 8) : w.idx * 10} height={5} /></div>}
      <span className="tiny muted">Click to open</span>
    </div>
  );
}

/** Everything about one booking: the job, who is going, and how the work is going. */
function EventModal({ ev, onClose, onChange }: { ev: DiaryEvent; onClose: () => void; onChange: (ev: DiaryEvent) => void }) {
  const nav = useNavigate();
  const toast = useToast();
  const rows = useRows();
  const { events, set, updEnq } = useStore();
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const live = events.find(x => x.id === ev.id) || ev;
  const r = rows.find(x => x.e.jobId && x.e.jobId === live.job);
  const e = r?.e;
  const w = workOf(e);
  const people = crewPeople(live);
  const isJobBooking = live.kind === 'install' && live.team !== 'un';
  const officeStep = r && r.st.phase === 'install' ? r.st : null;
  const remove = () => {
    set('events', es => es.filter(x => x.id !== live.id));
    if (e && live.kind === 'snag') updEnq(e.id, {}, { kind: 'note', title: `Visit on ${fmtDate(live.date)} removed from the diary`, who: 'Sarah Mitchell' });
    toast(`${kindLabel(live)} removed from the diary`); onClose();
  };
  const goPerson = (id: string) => { onClose(); nav(`/diary/installer/${id}`); };
  return (
    <>
      <Modal title={live.title} sub={`${kindLabel(live)} · ${rangeText(live)}${live.time ? ` · arriving ${live.time}` : ''}`} onClose={onClose} width={720}
        footer={<>
          {live.kind !== 'install' && live.team !== 'un' && <button className="btn btn-outline" style={{ marginRight: 'auto', color: 'var(--err)' }} onClick={remove}><IconTrash size={16} />Remove</button>}
          {e && <Link to={`/jobs/${e.jobId}`} className="btn btn-grey" style={live.kind === 'install' || live.team === 'un' ? { marginRight: 'auto' } : undefined} onClick={onClose}><IconExternalLink size={16} />Open job</Link>}
          {isJobBooking && officeStep && <button className="btn btn-outline" onClick={() => setAct({ k: officeStep.key === 'submit' ? 'progress' : officeStep.key, e: e! })}>{officeStep.key === 'submit' ? <IconHammer size={16} /> : officeStep.icon}{officeStep.key === 'submit' ? 'Progress update' : officeStep.label}</button>}
          {isJobBooking && w.idx < 3 && <button className="btn btn-primary" onClick={() => { onClose(); onChange(live); }}><IconPencil size={16} />Change booking</button>}
          {live.team === 'un' && <button className="btn btn-primary" onClick={() => { onClose(); onChange(live); }}><IconCalendarPlus size={16} />Choose installers</button>}
          {!isJobBooking && live.team !== 'un' && <button className="btn btn-primary" onClick={onClose}>Done</button>}
        </>}>
        {live.kind !== 'leave' && (
          <div className="hstack" style={{ gap: 14, padding: 12, borderRadius: 12, background: 'var(--bg)' }}>
            <img src={IMG[live.photo]} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover' }} />
            <div className="vstack" style={{ gap: 4, flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 15 }}>{e?.name || live.title}</b>
              <span className="small t2">{e ? products(e) : live.sub}</span>
              {e && <span className="hstack tiny muted" style={{ gap: 4 }}><IconMapPin size={13} />{e.address} {e.postcode}</span>}
              {e && <span className="hstack tiny muted" style={{ gap: 4 }}><IconPhone size={13} />{e.phone} · {e.jobId}</span>}
            </div>
            <Tag tone={live.team === 'un' ? 'err' : live.kind === 'install' ? 'jade' : live.kind === 'snag' ? 'err' : 'warn'}>{kindLabel(live)}</Tag>
          </div>
        )}
        <div className="grid-3" style={{ rowGap: 10 }}>
          {[['Starts', fmtDate(live.date, { weekday: 'long', day: 'numeric', month: 'long' })], ['Ends', fmtDate(lastDay(live), { weekday: 'long', day: 'numeric', month: 'long' })], ['How long', `${live.days} day${live.days > 1 ? 's' : ''}${live.time ? ` · from ${live.time}` : ''}`]].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 2 }}><span className="tiny muted">{l}</span><b style={{ fontSize: 13 }}>{v}</b></div>)}
        </div>
        {isJobBooking && e && (
          <div className="card" style={{ padding: 14, gap: 12 }}>
            <div className="between"><b>Work progress</b><span className="small t2">{w.label}</span></div>
            <div className="prog-steps">{w.steps.map((s, i) => <div key={s} className={`ps ${i < w.idx || w.idx === 4 ? 'done' : i === w.idx ? 'now' : ''}`}><span className="dot2">{(i < w.idx || w.idx === 4) && <IconCheck size={13} />}</span>{s}</div>)}</div>
            {w.idx === 2 && <div className="hstack" style={{ gap: 8 }}><Progress value={w.pct} /><b className="small">{w.pct}%</b></div>}
            {e.comms?.filter(c => /progress|started|completion|job pack|installation/i.test(c.title)).slice(0, 3).map(c => <div key={c.id} className="between small" style={{ padding: '6px 10px', background: 'var(--bg)', borderRadius: 8 }}><span>{c.title}</span><span className="tiny muted">{c.when}</span></div>)}
          </div>
        )}
        {live.team === 'un' && <div className="alert warn"><IconAlertTriangle size={18} /><div><b>No installers chosen yet.</b> The job is pencilled in for {fmtDate(live.date)}. Choose who goes to confirm it with the customer.</div></div>}
        {people.length > 0 && (
          <div className="vstack" style={{ gap: 8 }}>
            <b style={{ fontSize: 13 }}>{live.kind === 'leave' ? 'Who is away' : `Installers on this ${live.kind === 'install' ? 'job' : 'day'} (${people.length})`}</b>
            <div className="grid-2" style={{ gap: 8 }}>
              {people.map(p => {
                const n = events.filter(x => x.id !== live.id && x.kind !== 'leave' && crewOf(x).includes(p.id) && x.date.slice(0, 7) === live.date.slice(0, 7)).length;
                return (
                  <button key={p.id} type="button" className="person-row" onClick={() => goPerson(p.id)} title={`Open ${p.name}'s calendar`}>
                    <Avatar i={p.initials} size={38} bg={p.color} fg="#fff" />
                    <div className="vstack" style={{ gap: 2, flex: 1, minWidth: 0 }}><b style={{ fontSize: 13 }}>{p.name}</b><span className="tiny muted">{p.role} · {p.phone}</span><span className="tiny t2">{n} other booking{n === 1 ? '' : 's'} this month</span></div>
                    <IconCalendar size={16} color="#0b6e5c" />
                  </button>
                );
              })}
            </div>
            <span className="hstack tiny muted" style={{ gap: 6 }}><IconInfoCircle size={13} />Click an installer to see their whole month.</span>
          </div>
        )}
      </Modal>
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
    </>
  );
}

/** One day: everything booked, and who is still free. */
function DayModal({ day, only, onClose, onEvent, onBook, onLeave }: { day: string; only?: string; onClose: () => void; onEvent: (ev: DiaryEvent) => void; onBook: (d: string) => void; onLeave: (d: string) => void }) {
  const nav = useNavigate();
  const { events } = useStore();
  const list = events.filter(ev => isOn(ev, day) && (!only || crewOf(ev).includes(only))).sort((a, b) => (ORDER[a.kind] ?? 9) - (ORDER[b.kind] ?? 9));
  const free = freeOn(day, 1, events);
  const closed = day < TODAY || isSunday(day);
  return (
    <Modal title={fmtDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} sub={`${list.length} booking${list.length === 1 ? '' : 's'} · ${free.length} installer${free.length === 1 ? '' : 's'} free`} onClose={onClose} width={620}
      footer={<>{!closed && <button className="btn btn-grey" style={{ marginRight: 'auto' }} onClick={() => { onClose(); onLeave(day); }}><IconBeach size={16} />Add leave</button>}<button className="btn btn-grey" onClick={onClose}>Close</button>{!closed && <button className="btn btn-primary" onClick={() => { onClose(); onBook(day); }}><IconCalendarPlus size={16} />Book installation on this day</button>}</>}>
      {list.length === 0 && <div className="small muted">Nothing booked{only ? ` for ${personById(only)?.name}` : ''} on this day.</div>}
      <div className="vstack" style={{ gap: 8 }}>
        {list.map(ev => (
          <button key={ev.id} type="button" className="person-row" onClick={() => { onClose(); onEvent(ev); }}>
            {ev.kind === 'leave' ? <Tile icon={<IconBeach size={18} />} color="#6b7a78" size={42} /> : <img src={IMG[ev.photo]} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />}
            <div className="vstack" style={{ gap: 2, flex: 1, minWidth: 0 }}><b style={{ fontSize: 13 }}>{ev.title}</b><span className="tiny muted">{kindLabel(ev)} · {rangeText(ev)}{ev.days > 1 ? ` · day ${dayDiff(ev.date, day) + 1} of ${ev.days}` : ''}{ev.time ? ` · ${ev.time}` : ''}</span></div>
            {ev.team !== 'un' && <MiniCrew ev={ev} size={24} />}
          </button>
        ))}
      </div>
      {!closed && !only && (
        <div className="vstack" style={{ gap: 8 }}>
          <b style={{ fontSize: 13 }}>Free on this day</b>
          {free.length === 0 ? <span className="small muted">Everyone is busy or away.</span> : <div className="crew-row">{free.map(p => <button key={p.id} type="button" className="crew-pill" onClick={() => { onClose(); nav(`/diary/installer/${p.id}`); }}><Avatar i={p.initials} size={24} bg={p.color} fg="#fff" />{p.name}</button>)}</div>}
        </div>
      )}
    </Modal>
  );
}

/** Leave for one installer. Nothing can be booked for them on those days. */
function LeaveModal({ onClose, preset }: { onClose: () => void; preset?: { who?: string; date?: string } }) {
  const toast = useToast();
  const { set, events, installers } = useStore();
  const [who, setWho] = useState(preset?.who || installers[0].id);
  const [date, setDate] = useState(preset?.date || addDays(TODAY, 7));
  const [days, setDays] = useState(1);
  const [why, setWhy] = useState('Annual leave');
  const p = installers.find(x => x.id === who)!;
  const hit = busyWith(who, date, days, events);
  return (
    <Modal title="Add leave" sub="Leave blocks the diary so nobody books this person by mistake." onClose={onClose} width={540}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!hit} onClick={() => { set('events', es => [...es, { id: 'lv' + Date.now(), team: 'crew', crew: [who], date, days, kind: 'leave', title: `${p.name} ${why === 'College or training' ? 'at college' : 'on leave'}`, sub: why, photo: 'window' }]); toast(`Leave added for ${p.name} · ${fmtDate(date)}${days > 1 ? ` for ${days} days` : ''}`); onClose(); }}>Add leave</button></>}>
      <div className="grid-2">
        <Field label="Installer"><select className="select" value={who} onChange={x => setWho(x.target.value)}>{installers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></Field>
        <Field label="Reason"><select className="select" value={why} onChange={x => setWhy(x.target.value)}><option>Annual leave</option><option>Sick</option><option>College or training</option><option>Other</option></select></Field>
        <Field label="First day"><input type="date" className="input" value={date} onChange={x => x.target.value && setDate(x.target.value)} /></Field>
        <Field label="How many days?"><select className="select" value={days} onChange={x => setDays(+x.target.value)}>{[1, 2, 3, 4, 5, 10].map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
      </div>
      {hit ? <div className="alert err small"><IconAlertTriangle size={16} /><div>{p.name} is booked for <b>{hit.title}</b> ({rangeText(hit)}). Move that booking first.</div></div> : <div className="alert ok small"><IconCircleCheck size={16} />{p.name} has nothing booked on these days.</div>}
    </Modal>
  );
}

/** Shared state and modals for both diary pages. */
function useDiaryUI() {
  const [hover, setHover] = useState<{ ev: DiaryEvent; x: number; y: number } | null>(null);
  const [ev, setEv] = useState<DiaryEvent | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [book, setBook] = useState<any>(null);
  const [leave, setLeave] = useState<any>(null);
  const changeOrBook = (x: DiaryEvent) => setBook(x.team === 'un' ? { jobId: x.job, presetDate: x.date } : { event: x });
  const modals = (only?: string) => (
    <>
      {hover && <HoverCard h={hover} />}
      {ev && <EventModal ev={ev} onClose={() => setEv(null)} onChange={changeOrBook} />}
      {day && <DayModal day={day} only={only} onClose={() => setDay(null)} onEvent={setEv} onBook={d => setBook({ presetDate: d, presetCrew: only ? [only] : undefined })} onLeave={d => setLeave({ date: d, who: only })} />}
      {book && <BookInstallModal {...book} onClose={() => setBook(null)} />}
      {leave && <LeaveModal preset={leave} onClose={() => setLeave(null)} />}
    </>
  );
  return { setHover, setEv, setDay, setBook, setLeave, modals };
}

function MonthNav({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  return (
    <div className="hstack" style={{ gap: 8 }}>
      <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><IconChevronLeft size={16} /></button>
      <b style={{ fontSize: 18, minWidth: 170, textAlign: 'center' }}>{monthName(month)}</b>
      <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><IconChevronRight size={16} /></button>
      <button className="btn btn-outline btn-xs" onClick={() => setMonth(TODAY.slice(0, 7) + '-01')}>Today</button>
    </div>
  );
}

const workDays = (month: string) => monthCells(month).filter(d => d.slice(0, 7) === month.slice(0, 7) && !isSunday(d) && new Date(d + 'T12:00:00').getDay() !== 6);

export function Diary() {
  const nav = useNavigate();
  const { events, installers } = useStore();
  const { ready } = useBookingLists();
  const ui = useDiaryUI();
  const [month, setMonth] = useState(TODAY.slice(0, 7) + '-01');
  const [show, setShow] = useState<Record<string, boolean>>({ install: true, snag: true, delivery: true, leave: true });
  const [readyOpen, setReadyOpen] = useState(false);
  const mKey = month.slice(0, 7);
  const inMonth = (ev: DiaryEvent) => ev.date.slice(0, 7) <= mKey && lastDay(ev).slice(0, 7) >= mKey;
  const shown = events.filter(ev => ev.team === 'un' || show[ev.kind] !== false);
  const waiting = events.filter(ev => ev.team === 'un');
  const wd = workDays(month);
  const bookedDays = (id: string) => wd.filter(d => events.some(ev => ev.kind !== 'leave' && crewOf(ev).includes(id) && isOn(ev, d))).length;
  const totalBooked = installers.reduce((a, p) => a + bookedDays(p.id), 0);
  const fittings = events.filter(ev => ev.kind === 'install' && ev.team !== 'un' && inMonth(ev));
  return (
    <>
      <PageHead title="Installation diary" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Installation diary' }]}
        actions={<><button className="btn btn-grey" onClick={() => ui.setLeave({})}><IconBeach size={16} />Add leave</button><button className="btn btn-primary" onClick={() => ui.setBook({})}><IconCalendarPlus size={16} />Book installation</button></>} />
      <div className="grid-4">
        {([['Installations this month', String(fittings.length), IconHammer, '#0b6e5c', undefined], ['Installer days booked', `${totalBooked} of ${wd.length * installers.length}`, IconUsers, '#0b6e5c', undefined], ['Ready to book', String(ready.length), IconCalendarPlus, ready.length ? '#e0a100' : '#0b6e5c', () => setReadyOpen(true)], ['Waiting for installers', String(waiting.length), IconAlertTriangle, waiting.length ? '#d64545' : '#0b6e5c', waiting.length ? () => { setMonth(waiting[0].date.slice(0, 7) + '-01'); ui.setEv(waiting[0]); } : undefined]] as [string, string, any, string, (() => void) | undefined][]).map(([l, v, I, c, fn]) => (
          <div key={l} className="card" onClick={fn} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, cursor: fn ? 'pointer' : undefined }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div>{fn && <IconChevronRight size={16} color="#6b7a78" style={{ marginLeft: 'auto' }} />}</div>
        ))}
      </div>
      <div className="card" style={{ padding: 14, gap: 12 }}>
        <div className="between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <MonthNav month={month} setMonth={setMonth} />
          <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
            {KINDS.map(k => <button key={k.k} className={`chip ${show[k.k] ? '' : 'off'}`} style={show[k.k] ? undefined : { opacity: 0.45, textDecoration: 'line-through' }} onClick={() => setShow(s => ({ ...s, [k.k]: !s[k.k] }))}><i className="dot" style={{ background: k.color }} />{k.label}</button>)}
          </div>
        </div>
        <div className="vstack" style={{ gap: 6 }}>
          <span className="tiny muted">Installers · click one to see their month</span>
          <div className="crew-row">
            {installers.map(p => <button key={p.id} className="crew-pill" onClick={() => nav(`/diary/installer/${p.id}`)}><Avatar i={p.initials} size={26} bg={p.color} fg="#fff" /><span>{p.name}</span><span className="n">{bookedDays(p.id)}/{wd.length} days</span></button>)}
          </div>
        </div>
      </div>
      <MonthGrid month={month} events={shown} onEvent={ui.setEv} onDay={ui.setDay} onHover={ui.setHover}
        freeLabel={d => (d < TODAY || isSunday(d) || d.slice(0, 7) !== mKey ? null : (() => { const n = freeOn(d, 1, events).length; return { text: `${n} free`, cls: n === 0 ? 'none' : n < installers.length / 2 ? 'few' : '' }; })())} />
      <span className="hstack tiny muted" style={{ gap: 6 }}><IconInfoCircle size={13} />Hover a booking for a quick look, click it for the full details. Click a day to see everything on it or book that day.</span>
      {readyOpen && (
        <Drawer title="Ready to book" sub="Delivered and checked, or approved early by a director" onClose={() => setReadyOpen(false)} width={480}>
          {ready.length === 0 && <div className="small muted">Nothing waiting to be booked.</div>}
          {ready.map(({ r }) => (
            <div key={r.e.id} className="hstack" style={{ gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <img src={IMG[r.e.photo]} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{r.e.name} <span className="tiny muted">· {r.e.jobId}</span></b><span className="tiny muted">{products(r.e)}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => { setReadyOpen(false); ui.setBook({ jobId: r.e.jobId }); }}><IconCalendarPlus size={14} />Book</button>
            </div>
          ))}
        </Drawer>
      )}
      {ui.modals()}
    </>
  );
}

/** One installer's month: what they are booked on, and the days they are free. */
export function InstallerDiary() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { events, installers } = useStore();
  const ui = useDiaryUI();
  const [month, setMonth] = useState(TODAY.slice(0, 7) + '-01');
  const p = installers.find(x => x.id === id);
  const mine = useMemo(() => events.filter(ev => crewOf(ev).includes(id)), [events, id]);
  if (!p) return <Card><b>Installer not found</b><Link to="/diary" className="link">Back to the diary</Link></Card>;
  const mKey = month.slice(0, 7);
  const wd = workDays(month);
  const booked = wd.filter(d => mine.some(ev => ev.kind !== 'leave' && isOn(ev, d))).length;
  const leave = wd.filter(d => mine.some(ev => ev.kind === 'leave' && isOn(ev, d))).length;
  const free = wd.filter(d => d >= TODAY && !mine.some(ev => isOn(ev, d))).length;
  const jobs = mine.filter(ev => ev.kind === 'install' && ev.date.slice(0, 7) <= mKey && lastDay(ev).slice(0, 7) >= mKey);
  const upcoming = mine.filter(ev => lastDay(ev) >= TODAY).sort((a, b) => a.date.localeCompare(b.date));
  const dayClick = (d: string) => {
    const here = mine.filter(ev => isOn(ev, d));
    if (here.length === 1) return ui.setEv(here[0]);
    if (!here.length && d >= TODAY && !isSunday(d)) return ui.setBook({ presetDate: d, presetCrew: [id] });
    ui.setDay(d);
  };
  return (
    <>
      <PageHead title={p.name} crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Installation diary', to: '/diary' }, { label: p.name }]}
        actions={<><Link to="/diary" className="btn btn-grey"><IconArrowLeft size={16} />Everyone</Link><button className="btn btn-grey" onClick={() => ui.setLeave({ who: id })}><IconBeach size={16} />Add leave</button><button className="btn btn-primary" onClick={() => ui.setBook({ presetCrew: [id] })}><IconCalendarPlus size={16} />Book {p.name.split(' ')[0]} on a job</button></>} />
      <div className="row">
        <Card className="w-320">
          <div className="hstack" style={{ gap: 14 }}>
            <Avatar i={p.initials} size={60} bg={p.color} fg="#fff" />
            <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 17 }}>{p.name}</b><span className="small t2">{p.role}</span><Tag tone={busyWith(id, TODAY, 1, events) ? 'warn' : 'ok'}>{(() => { const h = busyWith(id, TODAY, 1, events); return h ? (h.kind === 'leave' ? 'Away today' : `Today: ${h.title.split(' · ')[0]}`) : 'Free today'; })()}</Tag></div>
          </div>
          <div className="vstack small" style={{ gap: 8 }}>
            <span className="hstack" style={{ gap: 8 }}><IconTool size={15} color="#0b6e5c" />{p.skills}</span>
            <span className="hstack" style={{ gap: 8 }}><IconPhone size={15} color="#0b6e5c" />{p.phone}</span>
            <span className="hstack" style={{ gap: 8 }}><IconBuildingWarehouse size={15} color="#0b6e5c" />Based in {p.base}</span>
          </div>
          <div className="divider" />
          <span className="tiny muted">Other installers</span>
          <div className="crew-row">{installers.filter(x => x.id !== id).map(x => <button key={x.id} className="crew-pill" onClick={() => nav(`/diary/installer/${x.id}`)} title={x.name}><Avatar i={x.initials} size={24} bg={x.color} fg="#fff" />{x.name.split(' ')[0]}</button>)}</div>
        </Card>
        <div className="col grow">
          <div className="grid-4">
            {[['Days booked', `${booked} of ${wd.length}`, IconHammer], ['Free days left', String(free), IconCircleCheck], ['Jobs this month', String(jobs.length), IconCalendar], ['Leave days', String(leave), IconBeach]].map(([l, v, I]: any) => (
              <div key={l} className="card" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14 }}><Tile icon={<I size={20} />} color="#0b6e5c" size={42} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 20 }}>{v}</b></div></div>
            ))}
          </div>
          <Card>
            <CardHead title="Coming up" sub={`${p.name.split(' ')[0]} gets these on the installer app`} />
            {upcoming.length === 0 && <div className="small muted">Nothing booked yet.</div>}
            {upcoming.slice(0, 4).map(ev => (
              <button key={ev.id} type="button" className="person-row" style={{ marginTop: 6 }} onClick={() => ui.setEv(ev)}>
                {ev.kind === 'leave' ? <Tile icon={<IconBeach size={16} />} color="#6b7a78" size={36} /> : <img src={IMG[ev.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />}
                <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{ev.title}</b><span className="tiny muted">{kindLabel(ev)} · {rangeText(ev)}{ev.time ? ` · ${ev.time}` : ''}</span></div>
                {ev.kind !== 'leave' && <MiniCrew ev={ev} size={22} />}
              </button>
            ))}
          </Card>
        </div>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div className="between" style={{ flexWrap: 'wrap', gap: 10 }}>
          <MonthNav month={month} setMonth={setMonth} />
          <div className="hstack small t2" style={{ gap: 14, flexWrap: 'wrap' }}>
            <span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: '#1f9d5b' }} />Free · click to book</span>
            {KINDS.map(k => <span key={k.k} className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: k.color }} />{k.label}</span>)}
          </div>
        </div>
      </div>
      <MonthGrid month={month} events={mine} onEvent={ui.setEv} onDay={dayClick} onHover={ui.setHover} max={4}
        freeLabel={d => (d < TODAY || isSunday(d) || d.slice(0, 7) !== mKey || mine.some(ev => isOn(ev, d)) ? null : { text: 'Free', cls: 'free-day' })} />
      {ui.modals(id)}
    </>
  );
}
