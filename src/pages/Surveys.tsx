// Surveys: the surveyor's work. Final surveys for won jobs come from the customer records;
// any other visit (remeasure, aftercare inspection, survey for a new quote) can be booked here too.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconCalendar, IconClipboardCheck, IconAlertTriangle, IconCircleCheck, IconExternalLink, IconRulerMeasure, IconMapPin, IconUserPlus, IconClock } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Tile, Drawer, Modal, Field, Check, useToast, Empty } from '../components/ui';
import { BookFinalSurveyModal, FinalSurveyModal, FinalSurveyView, PickPerson, Foot } from '../components/Lifecycle';
import { ActionModal } from '../components/Journey';
import { useRows, useCustomers, Row } from '../components/derive';
import { staffById, surveyors, IMG } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate } from '../data/store';

type Visit = { id: string; kind: 'Final survey' | string; customer: string; address: string; date: string; time: string; surveyor: string; status: 'Booked' | 'Done'; changed?: number; row?: Row; extra?: any; photo: any };
const iso = (d: string) => d;

export default function Surveys() {
  const rows = useRows();
  const { surveys } = useStore();
  const [f, setF] = useState('Upcoming');
  const [open, setOpen] = useState<string | null>(null);
  const [book, setBook] = useState(false);
  const [act, setAct] = useState<{ k: string; r: Row } | null>(null);
  const visits: Visit[] = useMemo(() => [
    ...rows.filter(r => r.e.finalSurvey).map(r => { const fs = r.e.finalSurvey!; return { id: 'fs-' + r.e.id, kind: 'Final survey', customer: r.e.name, address: `${r.e.address}, ${r.e.postcode}`, date: fs.date, time: fs.time, surveyor: fs.surveyor, status: fs.status, changed: (fs.checks || []).filter(c => !c.ok).length, row: r, photo: r.e.photo }; }),
    ...surveys.filter(s => s.iso).map(s => ({ id: s.id, kind: s.kind || 'Visit', customer: s.customer, address: s.address, date: s.iso!, time: s.time, surveyor: s.surveyor, status: (s.status === 'Done' ? 'Done' : 'Booked') as Visit['status'], extra: s, photo: s.photo || 'house' })),
  ].sort((a, b) => (f === 'Upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))), [rows, surveys, f]);
  const needs = rows.filter(r => r.st.key === 'finalBook');
  const match = (v: Visit, x: string) => x === 'All' || (x === 'Upcoming' ? v.status === 'Booked' : x === 'Done' ? v.status === 'Done' : x === 'Sizes changed' ? !!v.changed : true);
  const list = visits.filter(v => match(v, f));
  const sel = visits.find(v => v.id === open);
  return (
    <>
      <PageHead title="Surveys" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Surveys' }]} actions={<button className="btn btn-primary" onClick={() => setBook(true)}><IconPlus size={16} />Book a survey</button>} />
      <div className="grid-4">
        {[['Booked', visits.filter(v => v.status === 'Booked').length, IconCalendar], ['Need a surveyor', needs.length, IconUserPlus], ['Done', visits.filter(v => v.status === 'Done').length, IconCircleCheck], ['Sizes changed', visits.filter(v => v.changed).length, IconAlertTriangle]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={l === 'Need a surveyor' && v ? '#e0a100' : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      {needs.length > 0 && (
        <div className="card" style={{ gap: 10 }}>
          <b>Won jobs waiting for a final survey</b>
          {needs.map(r => (
            <div key={r.e.id} className="hstack" style={{ gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <img src={IMG[r.e.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{r.e.name}</b><span className="tiny muted">{r.e.product} · {r.e.address} · won {r.e.wonOn}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => setAct({ k: 'finalBook', r })}><IconUserPlus size={14} />Assign surveyor</button>
            </div>
          ))}
        </div>
      )}
      <div className="hstack" style={{ gap: 6 }}>{['Upcoming', 'Done', 'Sizes changed', 'All'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}<span className="n">{visits.filter(v => match(v, s)).length}</span></button>)}</div>
      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>When</th><th>Customer and property</th><th>Type</th><th>Surveyor</th><th>Status</th><th>Result</th><th></th></tr></thead>
          <tbody>
            {list.map(v => (
              <tr key={v.id} className="click" onClick={() => setOpen(v.id)}>
                <td><b>{fmtDate(v.date)}</b><div className="tiny muted">{v.time}</div></td>
                <td><div className="hstack" style={{ gap: 10 }}><img src={IMG[v.photo as keyof typeof IMG]} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b>{v.customer}</b><span className="tiny muted">{v.address}</span></div></div></td>
                <td><Tag tone={v.kind === 'Final survey' ? 'jade' : 'grey'}>{v.kind}</Tag></td>
                <td><span className="hstack" style={{ gap: 8 }}><Avatar i={staffById(v.surveyor)?.initials || '?'} size={26} />{staffById(v.surveyor)?.name}</span></td>
                <td><Tag tone={v.status === 'Done' ? 'ok' : v.date < TODAY ? 'warn' : 'grey'}>{v.status === 'Booked' && v.date < TODAY ? 'Results due' : v.status}</Tag></td>
                <td className="t2">{v.status === 'Done' ? (v.kind === 'Final survey' ? (v.changed ? <span style={{ color: 'var(--warn)', fontWeight: 600 }}>{v.changed} size{v.changed > 1 ? 's' : ''} changed</span> : 'All sizes match') : v.extra?.notes || 'Done') : '—'}</td>
                <td>{v.status === 'Booked' && v.row && <button className="btn btn-outline btn-xs" onClick={ev => { ev.stopPropagation(); setAct({ k: 'finalDone', r: v.row! }); }}>Add results</button>}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7}><Empty icon={<IconClipboardCheck size={22} />} title="No surveys here" sub="Book a survey, or assign a surveyor to a won job." /></td></tr>}
          </tbody>
        </table>
      </div>
      {sel && <VisitDrawer v={sel} onClose={() => setOpen(null)} onAct={(k, r) => setAct({ k, r })} />}
      {book && <BookSurveyAnyModal onClose={() => setBook(false)} onFinal={r => { setBook(false); setAct({ k: 'finalBook', r }); }} />}
      {act && <ActionModal k={act.k} e={act.r.e} onClose={() => setAct(null)} />}
    </>
  );
}

function VisitDrawer({ v, onClose, onAct }: { v: Visit; onClose: () => void; onAct: (k: string, r: Row) => void }) {
  const toast = useToast();
  const { set } = useStore();
  const [notes, setNotes] = useState('');
  const done = () => { set('surveys', ss => ss.map(s => (s.id === v.id ? { ...s, status: 'Done', tone: 'ok', notes } : s))); toast('Visit marked as done'); onClose(); };
  const e = v.row?.e;
  return (
    <Drawer title={`${v.kind} · ${v.customer}`} sub={`${fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${v.time}`} onClose={onClose} width={640}
      footer={<>
        {e && <Link to={`/enquiries/${e.id}`} className="btn btn-grey" style={{ marginRight: 'auto' }}><IconExternalLink size={16} />Open record</Link>}
        {v.status === 'Booked' && v.row && <><button className="btn btn-outline" onClick={() => { onClose(); onAct('finalBook', v.row!); }}>Change booking</button><button className="btn btn-primary" onClick={() => { onClose(); onAct('finalDone', v.row!); }}><IconRulerMeasure size={16} />Add results</button></>}
        {v.status === 'Booked' && !v.row && <button className="btn btn-primary" onClick={done}><IconCircleCheck size={16} />Mark as done</button>}
      </>}>
      <div className="grid-2" style={{ rowGap: 12 }}>
        {[['Surveyor', staffById(v.surveyor)?.name], ['Address', v.address], ['Type', v.kind], ['Status', v.status]].map(([l, val]) => <div key={l} className="vstack" style={{ gap: 3 }}><span className="small muted">{l}</span><b style={{ fontSize: 13 }}>{val}</b></div>)}
      </div>
      {e && e.finalSurvey && <FinalSurveyView e={e} />}
      {!v.row && v.extra?.reason && <div className="alert info small"><IconMapPin size={16} />{v.extra.reason}</div>}
      {!v.row && v.status === 'Booked' && <Field label="Notes from the visit"><textarea className="textarea" value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Lintel above the back door needs replacing before fitting" /></Field>}
      {!v.row && v.status === 'Done' && v.extra?.notes && <div className="small t2">{v.extra.notes}</div>}
    </Drawer>
  );
}

function BookSurveyAnyModal({ onClose, onFinal }: { onClose: () => void; onFinal: (r: Row) => void }) {
  const toast = useToast();
  const rows = useRows();
  const customers = useCustomers();
  const { set, updEnq, appts } = useStore();
  const needs = rows.filter(r => r.st.key === 'finalBook');
  const [kind, setKind] = useState(needs.length ? 'final' : 'other');
  const [pick, setPick] = useState(needs[0]?.e.id || '');
  const [cust, setCust] = useState(customers[0]?.id || 'new');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('Remeasure');
  const [who, setWho] = useState('ps');
  const [date, setDate] = useState(addDays(TODAY, 3));
  const [time, setTime] = useState('09:00 – 10:30');
  const [notes, setNotes] = useState('');
  const c = customers.find(x => x.id === cust);
  const busy = appts.find(a => a.who === who && a.date === date && a.time.split(' ')[0] === time.split(' ')[0]);
  const save = () => {
    if (kind === 'final') { const r = needs.find(x => x.e.id === pick); if (r) onFinal(r); return; }
    const nm = c ? c.name : name, addr = c ? `${c.address}, ${c.postcode}` : address;
    const id = 'SV-' + (400 + Math.floor(Math.random() * 500));
    set('surveys', ss => [{ id, job: c?.projects[0]?.e.jobId || '', customer: nm, address: addr, date: fmtDate(date), iso: date, time, surveyor: who, status: 'Booked', tone: 'info', photo: (c?.photo || 'house') as string, kind: reason, reason: notes || reason }, ...ss]);
    set('appts', as => [...as, { id: 'ap' + Date.now(), kind: 'Survey', customer: nm, who, date, time, address: addr, synced: true, status: 'Booked' }]);
    if (c) updEnq(c.projects[0].e.id, {}, { kind: 'email-out', title: `${reason} visit booked`, body: `${staffById(who)?.name} will visit on ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} (${time}).${notes ? ' ' + notes : ''}`, who: 'Sarah Mitchell' });
    toast(`${reason} booked with ${staffById(who)?.name} · ${fmtDate(date)}`);
    onClose();
  };
  const ok = kind === 'final' ? !!pick : !busy && (c || (name.trim() && address.trim()));
  return (
    <Modal title="Book a survey" sub="A final survey for a won job, or a visit to any property" onClose={onClose} width={660} footer={<Foot onClose={onClose} onSave={save} disabled={!ok} label={kind === 'final' ? 'Next: choose surveyor' : 'Book and tell everyone'} icon={<IconCalendar size={16} />} />}>
      <Field label="What kind of survey?"><div className="hstack" style={{ gap: 8 }}><button type="button" className={`chip ${kind === 'final' ? 'on' : ''}`} onClick={() => setKind('final')}>Final survey for a won job</button><button type="button" className={`chip ${kind === 'other' ? 'on' : ''}`} onClick={() => setKind('other')}>Visit any property</button></div></Field>
      {kind === 'final' ? (needs.length ? (
        <Field label="Which job?"><select className="select" value={pick} onChange={x => setPick(x.target.value)}>{needs.map(r => <option key={r.e.id} value={r.e.id}>{r.e.name} · {r.e.product} · won {r.e.wonOn}</option>)}</select></Field>
      ) : <div className="alert ok small"><IconCircleCheck size={16} />Every won job already has a final survey.</div>) : (
        <>
          <Field label="Customer"><select className="select" value={cust} onChange={x => setCust(x.target.value)}>{customers.map(x => <option key={x.id} value={x.id}>{x.name} · {x.address}</option>)}<option value="new">Someone new (not a customer yet)</option></select></Field>
          {!c && <div className="grid-2"><Field label="Name"><input className="input" value={name} onChange={x => setName(x.target.value)} /></Field><Field label="Property address"><input className="input" value={address} onChange={x => setAddress(x.target.value)} /></Field></div>}
          <Field label="Why the visit?"><div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>{['Remeasure', 'Aftercare inspection', 'Survey for a new quote', 'Other'].map(k => <button key={k} type="button" className={`chip ${reason === k ? 'on' : ''}`} onClick={() => setReason(k)}>{k}</button>)}</div></Field>
          <Field label="Which surveyor?"><PickPerson people={surveyors} value={who} onChange={setWho} load={{ ps: 'Leeds and Harrogate', rk: 'Ripon and Thirsk' }} /></Field>
          <div className="grid-2">
            <Field label="Date"><input type="date" className="input" value={date} onChange={x => setDate(x.target.value)} /></Field>
            <Field label="Time"><select className="select" value={time} onChange={x => setTime(x.target.value)}>{['09:00 – 10:30', '11:00 – 12:30', '13:30 – 15:00', '15:30 – 17:00'].map(x => <option key={x}>{x}</option>)}</select></Field>
          </div>
          {busy ? <div className="alert err small"><IconAlertTriangle size={16} />{staffById(who)?.name} is already busy then ({busy.customer}). Pick another time.</div> : <div className="alert ok small"><IconClock size={16} />{staffById(who)?.name} is free on {fmtDate(date)} at {time.split(' ')[0]}.</div>}
          <Field label="Notes for the surveyor (optional)"><input className="input" value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Check the bay window, customer thinks it is leaking" /></Field>
          <Check on label="Email the customer and put it on the surveyor's phone" />
        </>
      )}
    </Modal>
  );
}
