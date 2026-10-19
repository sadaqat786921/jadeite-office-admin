// Pop-ups and documents for the enquiry lifecycle. Every action saves to the
// enquiry record, logs to Communication and moves the pipeline card.
import React, { useState } from 'react';
import {
  IconMail, IconPhoneCall, IconCalendarEvent, IconClipboardCheck, IconFileInvoice, IconTrophy, IconX, IconUserCircle, IconPackage, IconTruckDelivery,
  IconCircleCheck, IconAlertTriangle, IconPlus, IconTrash, IconSend, IconWorld, IconInfoCircle, IconTool, IconShieldCheck, IconCalendarPlus, IconPencil,
} from '@tabler/icons-react';
import { Modal, Field, Check, Avatar, Tag, useToast, Seg } from './ui';
import { staffById, salespeople, surveyors, teams, teamById, IMG, gbp } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, EnquiryX, JobX } from '../data/store';
import { Opening, OPENING_TYPES, Quote, quoteTotals, linesFromOpenings, PRICE } from '../data/lifecycle';

type P = { e: EnquiryX; onClose: () => void; onDone?: (tab: string) => void };
const ME = 'Sarah Mitchell';
const first = (n: string) => n.split(' ').pop() || n;
const town = (a: string) => a.split(', ').pop() || a;

function PickPerson({ people, value, onChange, load }: { people: { id: string; name: string; initials: string }[]; value: string; onChange: (v: string) => void; load?: Record<string, string> }) {
  return (
    <div className="grid-2" style={{ gap: 10 }}>
      {people.map(s => (
        <button key={s.id} type="button" onClick={() => onChange(s.id)} className="card" style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderColor: value === s.id ? 'var(--primary)' : undefined, background: value === s.id ? 'var(--tint-2)' : '#fff', textAlign: 'left' }}>
          <Avatar i={s.initials} size={36} />
          <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{s.name}</b>{load && <span className="tiny muted">{load[s.id]}</span>}</div>
          {value === s.id && <IconCircleCheck color="#00c7a1" size={20} />}
        </button>
      ))}
    </div>
  );
}

const Foot = ({ onClose, label, onSave, disabled, icon }: { onClose: () => void; label: string; onSave: () => void; disabled?: boolean; icon?: React.ReactNode }) => (
  <><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={disabled} style={{ opacity: disabled ? 0.45 : 1 }} onClick={onSave}>{icon}{label}</button></>
);

/* ---------- 1. Contact the customer → Contacted ---------- */
export function ContactModal({ e, onClose, onDone, logOnly }: P & { logOnly?: 'email' | 'call' }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const s = staffById(e.assigned);
  const [how, setHow] = useState<string>(logOnly || 'email');
  const [subject, setSubject] = useState(logOnly ? '' : 'Thank you for your enquiry — Jadeite Glazing');
  const [body, setBody] = useState(logOnly ? '' : `Dear ${e.name},\n\nThank you for getting in touch about your ${e.product.toLowerCase()}. I would love to come and see you, talk through the options and measure up.\n\nWhen would suit you for a visit?\n\nKind regards,\n${s?.name || ME}\nJadeite Glazing`);
  const [notes, setNotes] = useState('');
  const moving = !logOnly && e.stage === 'New Enquiry';
  const save = () => {
    const who = s?.name || ME;
    updEnq(e.id, moving ? { stage: 'Contacted', stageDays: 0, next: 'Book appointment', nextDue: fmtDate(addDays(TODAY, 2)) } : {},
      how === 'email' ? { kind: 'email-out', title: subject || 'Email to customer', body, who } : { kind: 'call', title: `Call with ${e.name}`, body: notes || 'Call logged.', who });
    toast(moving ? `${how === 'email' ? 'Email sent' : 'Call saved'} · ${e.name} moved to Contacted` : `${how === 'email' ? 'Email sent' : 'Call saved'} · saved in Communication`);
    onDone?.('comms'); onClose();
  };
  return (
    <Modal title={logOnly ? (how === 'email' ? 'Send an email' : 'Log a call') : 'Contact the customer'} sub={`${e.name} · ${e.email} · ${e.phone}`} onClose={onClose} width={640}
      footer={<Foot onClose={onClose} onSave={save} label={how === 'email' ? 'Send email' : 'Save call'} icon={how === 'email' ? <IconSend size={16} /> : <IconPhoneCall size={16} />} disabled={how === 'call' && notes.trim().length < 3} />}>
      {!logOnly && <Seg value={how} onChange={setHow} items={[{ id: 'email', label: 'Send an email', icon: <IconMail size={15} /> }, { id: 'call', label: 'I called them', icon: <IconPhoneCall size={15} /> }]} />}
      {how === 'email' ? (
        <>
          <Field label="To"><input className="input" value={`${e.name} <${e.email}>`} readOnly style={{ background: 'var(--bg)' }} /></Field>
          <Field label="Subject"><input className="input" value={subject} onChange={x => setSubject(x.target.value)} /></Field>
          <Field label="Message"><textarea className="textarea" style={{ minHeight: 190 }} value={body} onChange={x => setBody(x.target.value)} /></Field>
        </>
      ) : (
        <Field label="What did you talk about?" hint="This is saved in the Communication tab so everyone can see it."><textarea className="textarea" style={{ minHeight: 140 }} value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Wants 6 windows in anthracite grey. Free for a visit next Tuesday morning." /></Field>
      )}
      {moving && <div className="alert info small"><IconInfoCircle size={16} />The card moves from <b>&nbsp;New enquiry&nbsp;</b> to <b>&nbsp;Contacted&nbsp;</b> in the pipeline.</div>}
    </Modal>
  );
}

/* ---------- 2. Book appointment → Appointment ---------- */
export function BookApptModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set } = useStore();
  const [type, setType] = useState<'Home visit' | 'Showroom visit' | 'Video call'>('Home visit');
  const [who, setWho] = useState(e.assigned || 'mh');
  const [date, setDate] = useState(addDays(TODAY, 4));
  const [time, setTime] = useState('10:00 – 11:00');
  const [notes, setNotes] = useState('');
  const save = () => {
    const s = staffById(who)!;
    updEnq(e.id, { stage: 'Appointment', stageDays: 0, appt: { date, time, who, type, address: type === 'Showroom visit' ? 'Jadeite showroom, Harrogate' : e.address, notes, status: 'Booked' }, next: type, nextDue: fmtDate(date) },
      { kind: 'email-out', title: 'Your appointment is booked', body: `Dear ${e.name}, ${s.name} will see you on ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${time.split(' ')[0]} (${type.toLowerCase()}).`, who: ME });
    set('appts', as => [...as, { id: 'ap' + Date.now(), kind: 'Sales visit', customer: e.name, who, date, time, address: e.address, synced: true, status: 'Booked' }]);
    toast(`Appointment booked · ${fmtDate(date)} · moved to Appointment`);
    onDone?.('appt'); onClose();
  };
  return (
    <Modal title="Book appointment" sub={`${e.name} · ${e.address}`} onClose={onClose} width={640} footer={<Foot onClose={onClose} onSave={save} label="Book and email the customer" icon={<IconCalendarEvent size={16} />} />}>
      <Field label="What kind of appointment?"><div className="hstack" style={{ gap: 8 }}>{(['Home visit', 'Showroom visit', 'Video call'] as const).map(k => <button key={k} type="button" className={`chip ${type === k ? 'on' : ''}`} onClick={() => setType(k)}>{k}</button>)}</div></Field>
      <Field label="Who is going?"><PickPerson people={salespeople} value={who} onChange={setWho} load={{ mh: 'Free on this day', ec: '2 visits that day', jb: 'Free after 2pm' }} /></Field>
      <div className="grid-2">
        <Field label="Date"><input type="date" className="input" value={date} onChange={x => setDate(x.target.value)} /></Field>
        <Field label="Time"><select className="select" value={time} onChange={x => setTime(x.target.value)}>{['09:00 – 10:00', '10:00 – 11:00', '11:30 – 12:30', '14:00 – 15:00', '16:00 – 17:00'].map(t => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Field label="Notes for the salesperson (optional)"><input className="input" value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Park on the drive. Ring the side door." /></Field>
      <Check on label="Email the customer a confirmation and add it to the Outlook calendar" />
    </Modal>
  );
}

/* ---------- 3. Request survey → Survey ---------- */
export function RequestSurveyModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set } = useStore();
  const [outcome, setOutcome] = useState(e.appt?.outcome || '');
  const [who, setWho] = useState('ps');
  const [date, setDate] = useState(addDays(TODAY, 5));
  const [time, setTime] = useState('09:00 – 10:30');
  const busy = who === 'ps' && date === '2026-10-19';
  const save = () => {
    const s = staffById(who)!;
    updEnq(e.id, { stage: 'Survey', stageDays: 0, appt: e.appt ? { ...e.appt, status: 'Done', outcome } : e.appt, survey: { surveyor: who, date, time, status: 'Booked', requestedBy: staffById(e.assigned)?.name || ME }, next: 'Survey visit', nextDue: fmtDate(date) },
      { kind: 'email-out', title: 'Your survey is booked', body: `Dear ${e.name}, ${s.name} will visit on ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} (${time}) to take exact measurements.`, who: ME });
    set('surveys', ss => [{ id: 'SV-' + (312 + ss.length), job: e.id, customer: e.name, address: e.address, date: fmtDate(date), time, surveyor: who, status: 'Booked', tone: 'info', photo: e.photo }, ...ss]);
    set('appts', as => [...as, { id: 'ap' + Date.now(), kind: 'Survey', customer: e.name, who, date, time, address: e.address, synced: true, status: 'Booked' }]);
    toast(`Survey booked with ${s.name} · ${fmtDate(date)} · moved to Survey`);
    onDone?.('survey'); onClose();
  };
  return (
    <Modal title="Request a survey" sub={`${e.name} · ${e.address}`} onClose={onClose} width={660} footer={<Foot onClose={onClose} onSave={save} disabled={busy || outcome.trim().length < 3} label="Book survey and tell everyone" icon={<IconClipboardCheck size={16} />} />}>
      <Field label="How did the appointment go?" hint="Saved on the Appointment tab."><textarea className="textarea" value={outcome} onChange={x => setOutcome(x.target.value)} placeholder="e.g. Chose 5 white sash windows. Happy for a survey next week." /></Field>
      <Field label="Which surveyor?"><PickPerson people={surveyors} value={who} onChange={setWho} load={{ ps: 'Leeds and Harrogate · 3 surveys this week', rk: 'Ripon and Thirsk · 2 surveys this week' }} /></Field>
      <div className="grid-2">
        <Field label="Date"><input type="date" className="input" value={date} onChange={x => setDate(x.target.value)} /></Field>
        <Field label="Time"><select className="select" value={time} onChange={x => setTime(x.target.value)}>{['09:00 – 10:30', '11:00 – 12:30', '13:30 – 15:00', '15:30 – 17:00'].map(t => <option key={t}>{t}</option>)}</select></Field>
      </div>
      {busy ? <div className="alert err"><IconAlertTriangle size={18} /><div><b>Priya is busy then.</b> She has another survey on Mon 19 Oct. Pick another day or Rob King.</div></div>
        : <div className="alert ok"><IconCircleCheck size={18} /><div><b>{staffById(who)?.name} is free</b> on {fmtDate(date)}. The customer gets an email and the surveyor sees it on their phone.</div></div>}
    </Modal>
  );
}

/* ---------- 4. Surveyor completes the survey ---------- */
const guessOpenings = (e: EnquiryX): Opening[] => {
  const p = e.product.toLowerCase();
  if (p.includes('bi-fold')) return [{ ref: 'D1', room: 'Kitchen / garden', type: 'Bi-fold door (3-pane)', w: 2400, h: 2100, qty: 1 }];
  if (p.includes('door')) return [{ ref: 'D1', room: 'Front entrance', type: 'Composite front door', w: 920, h: 2090, qty: 1 }];
  if (p.includes('roof') || p.includes('lantern')) return [{ ref: 'R1', room: 'Extension', type: 'Roof lantern', w: 2000, h: 1000, qty: 1 }];
  if (p.includes('conserv')) return [{ ref: 'C1', room: 'Rear garden', type: 'Conservatory', w: 4000, h: 3000, qty: 1 }];
  if (p.includes('sash')) return [{ ref: 'W1', room: 'Lounge', type: 'Sash window', w: 950, h: 1600, qty: 2 }];
  return [{ ref: 'W1', room: 'Lounge', type: 'Casement window', w: 1200, h: 1200, qty: 2 }, { ref: 'W2', room: 'Bedroom 1', type: 'Casement window', w: 1100, h: 1050, qty: 2 }];
};
export function SurveyResultsModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set } = useStore();
  const [ops, setOps] = useState<Opening[]>(e.survey?.openings || guessOpenings(e));
  const [access, setAccess] = useState('Front and side, easy');
  const [parking, setParking] = useState('Driveway');
  const [notes, setNotes] = useState('');
  const [signed, setSigned] = useState(true);
  const s = staffById(e.survey?.surveyor);
  const upd = (i: number, k: keyof Opening, v: any) => setOps(o => o.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const save = () => {
    updEnq(e.id, { survey: { ...e.survey!, status: 'Completed', openings: ops, access, parking, notes, photos: 6 + ops.length * 2, signed, completedOn: fmtDate(TODAY, { day: '2-digit', month: 'short' }) }, next: 'Send quote', nextDue: 'Today' },
      { kind: 'note', title: 'Survey completed', body: `${ops.reduce((a, o) => a + o.qty, 0)} frame${ops.reduce((a, o) => a + o.qty, 0) === 1 ? '' : 's'} measured. ${notes}`.trim(), who: s?.name || 'Surveyor' });
    set('surveys', ss => ss.map(x => (x.job === e.id ? { ...x, status: 'Approved', tone: 'ok' } : x)));
    toast('Survey completed · the quote can now be sent');
    onDone?.('survey'); onClose();
  };
  return (
    <Modal title="Survey results" sub={`Filled in by ${s?.name || 'the surveyor'} on their phone · ${e.name}`} onClose={onClose} width={820} footer={<Foot onClose={onClose} onSave={save} label="Mark survey completed" icon={<IconCircleCheck size={16} />} />}>
      <div className="vstack" style={{ gap: 8 }}>
        <b style={{ fontSize: 13 }}>Measurements</b>
        <table className="tbl" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
          <thead><tr><th>Ref</th><th>Room</th><th>Product</th><th>Width (mm)</th><th>Height (mm)</th><th>Qty</th><th></th></tr></thead>
          <tbody>{ops.map((o, i) => (
            <tr key={i}>
              <td className="b">{o.ref}</td>
              <td><input className="input" style={{ height: 32 }} value={o.room} onChange={x => upd(i, 'room', x.target.value)} /></td>
              <td><select className="select" style={{ height: 32 }} value={o.type} onChange={x => upd(i, 'type', x.target.value)}>{OPENING_TYPES.map(t => <option key={t}>{t}</option>)}</select></td>
              <td><input className="input" style={{ height: 32, width: 90 }} type="number" value={o.w} onChange={x => upd(i, 'w', +x.target.value)} /></td>
              <td><input className="input" style={{ height: 32, width: 90 }} type="number" value={o.h} onChange={x => upd(i, 'h', +x.target.value)} /></td>
              <td><input className="input" style={{ height: 32, width: 60 }} type="number" min={1} value={o.qty} onChange={x => upd(i, 'qty', Math.max(1, +x.target.value))} /></td>
              <td>{ops.length > 1 && <button className="icon-btn" aria-label="Remove" onClick={() => setOps(o2 => o2.filter((_, j) => j !== i))}><IconTrash size={15} /></button>}</td>
            </tr>
          ))}</tbody>
        </table>
        <button className="btn btn-outline btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => setOps(o => [...o, { ref: `W${o.length + 1}`, room: '', type: 'Casement window', w: 1000, h: 1000, qty: 1 }])}><IconPlus size={13} />Add another opening</button>
      </div>
      <div className="grid-2">
        <Field label="Access"><input className="input" value={access} onChange={x => setAccess(x.target.value)} /></Field>
        <Field label="Parking"><input className="input" value={parking} onChange={x => setParking(x.target.value)} /></Field>
      </div>
      <Field label="Notes for the fitters (optional)"><input className="input" value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Dog in the garden — keep the side gate shut" /></Field>
      <Check on={signed} onChange={setSigned} label="Customer has signed the survey on the surveyor's phone" />
    </Modal>
  );
}

/* ---------- Survey report (shown on the Survey tab) ---------- */
export function SurveyReport({ e }: { e: EnquiryX }) {
  const v = e.survey!;
  const s = staffById(v.surveyor);
  return (
    <div className="vstack" style={{ gap: 16 }}>
      <div className="grid-4" style={{ rowGap: 14 }}>
        {[['Surveyor', s?.name || '—'], ['Date', `${fmtDate(v.date)} · ${v.time}`], ['Requested by', v.requestedBy], ['Status', v.status === 'Completed' ? `Completed ${v.completedOn || ''}` : 'Booked'], ['Access', v.access || '—'], ['Parking', v.parking || '—'], ['Photos', v.photos ? `${v.photos} photos` : '—'], ['Customer signature', v.signed ? 'Signed' : v.status === 'Completed' ? 'Not signed' : '—']].map(([l, val]) => (
          <div key={l} className="vstack" style={{ gap: 4 }}><span className="small muted">{l}</span><b style={{ fontSize: 13 }}>{val}</b></div>
        ))}
      </div>
      {v.openings && (
        <table className="tbl" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
          <thead><tr><th>Ref</th><th>Room</th><th>Product</th><th>Size (W × H mm)</th><th>Qty</th><th>Notes</th></tr></thead>
          <tbody>{v.openings.map(o => <tr key={o.ref}><td className="b">{o.ref}</td><td>{o.room}</td><td>{o.type}</td><td>{o.w} × {o.h}</td><td>{o.qty}</td><td className="t2">{o.notes || '—'}</td></tr>)}</tbody>
        </table>
      )}
      {v.notes && <div className="alert info small"><IconInfoCircle size={16} />{v.notes}</div>}
      {v.openings && <div className="hstack" style={{ gap: 8 }}>{(['house', 'window', 'door', 'bifold'] as const).slice(0, 4).map(p => <img key={p} src={IMG[p]} alt="" style={{ width: 84, height: 64, borderRadius: 8, objectFit: 'cover' }} />)}<span className="small muted">Survey photos</span></div>}
    </div>
  );
}

/* ---------- Framepoint quote document ---------- */
export function QuoteDoc({ e, q }: { e: EnquiryX; q: Pick<Quote, 'ref' | 'lines' | 'discount' | 'sentOn' | 'validUntil' | 'sentBy'> }) {
  const t = quoteTotals(q);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div className="between" style={{ background: 'var(--deep)', color: '#fff', padding: '16px 20px' }}>
        <span className="hstack" style={{ gap: 10 }}><img src="images/mark.svg" alt="" style={{ height: 30 }} /><span className="vstack" style={{ gap: 1 }}><b style={{ fontSize: 15 }}>Jadeite Glazing</b><span className="tiny" style={{ color: '#9fc7bc' }}>Quote created in Framepoint</span></span></span>
        <span className="vstack" style={{ gap: 2, textAlign: 'right' }}><b style={{ fontSize: 16 }}>Quote {q.ref}</b><span className="tiny" style={{ color: '#9fc7bc' }}>Date {q.sentOn} · valid until {q.validUntil}</span></span>
      </div>
      <div className="grid-2" style={{ padding: '16px 20px', gap: 20 }}>
        <div className="vstack" style={{ gap: 3 }}><span className="tiny muted">FOR</span><b>{e.name}</b><span className="small t2">{e.address}, {e.postcode}</span><span className="small t2">{e.email}</span></div>
        <div className="vstack" style={{ gap: 3 }}><span className="tiny muted">PREPARED BY</span><b>{q.sentBy}</b><span className="small t2">Jadeite Glazing · 0116 496 0000</span><span className="small t2">Survey by {staffById(e.survey?.surveyor)?.name || '—'}</span></div>
      </div>
      <table className="tbl">
        <thead><tr><th>Item</th><th>Specification</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit price</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
        <tbody>{q.lines.map((l, i) => <tr key={i}><td className="b">{l.item}</td><td className="t2">{l.spec}</td><td style={{ textAlign: 'right' }}>{l.qty}</td><td style={{ textAlign: 'right' }}>{gbp(l.unit)}</td><td className="b" style={{ textAlign: 'right' }}>{gbp(l.qty * l.unit)}</td></tr>)}</tbody>
      </table>
      <div className="hstack" style={{ padding: '14px 20px', gap: 20, alignItems: 'flex-start', borderTop: '1px solid var(--border)' }}>
        <div className="vstack small t2" style={{ gap: 4, flex: 1 }}>
          <b style={{ color: 'var(--text)' }}>Included</b>
          <span>10-year guarantee · FENSA certificate · removal of old frames</span>
          <span>Deposit of 25% on acceptance. Balance on completion.</span>
        </div>
        <div className="vstack" style={{ gap: 6, minWidth: 240 }}>
          {q.discount > 0 && <span className="between small"><span className="t2">Discount</span><b>−{gbp(q.discount)}</b></span>}
          <span className="between small"><span className="t2">Subtotal</span><b>{gbp(t.sub)}</b></span>
          <span className="between small"><span className="t2">VAT 20%</span><b>{gbp(t.vat)}</b></span>
          <span className="between" style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}><b>Total</b><b style={{ fontSize: 18 }}>{gbp(t.total)}</b></span>
          <span className="between small"><span className="t2">Deposit (25%)</span><b style={{ color: 'var(--primary-dark)' }}>{gbp(t.deposit)}</b></span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. Send quote → Quote sent ---------- */
export function SendQuoteModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [lines, setLines] = useState(linesFromOpenings(e.survey?.openings || guessOpenings(e)));
  const [discount, setDiscount] = useState(0);
  const sentBy = staffById(e.assigned)?.name || ME;
  const q = { ref: 'FP-' + (55127 + Math.floor(Math.random() * 40)), lines, discount, sentOn: fmtDate(TODAY, { day: '2-digit', month: 'short' }), validUntil: fmtDate(addDays(TODAY, 30), { day: '2-digit', month: 'short' }), sentBy };
  const [ref] = useState(q.ref);
  const t = quoteTotals({ lines, discount });
  const save = () => {
    updEnq(e.id, { stage: 'Quote Sent', stageDays: 0, value: t.total, quote: { ...q, ref, status: 'Sent' }, next: 'Wait for the customer to reply', nextDue: fmtDate(addDays(TODAY, 3)) },
      { kind: 'email-out', title: `Your quote ${ref}`, body: `Dear ${e.name}, please find your quote attached (total ${gbp(t.total)} including VAT). It is valid for 30 days. You can accept it online.`, who: sentBy });
    toast(`Quote ${ref} sent · ${gbp(t.total)} · moved to Quote sent`);
    onDone?.('quote'); onClose();
  };
  return (
    <Modal title="Send quote" sub={`Built from the survey · Framepoint prices · ${e.name}`} onClose={onClose} width={860} footer={<Foot onClose={onClose} onSave={save} label={`Send quote · ${gbp(t.total)}`} icon={<IconSend size={16} />} />}>
      <div className="vstack" style={{ gap: 8 }}>
        <b style={{ fontSize: 13 }}>Check the lines</b>
        <table className="tbl" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit price (£)</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
          <tbody>{lines.map((l, i) => (
            <tr key={i}><td><b>{l.item}</b><div className="tiny muted">{l.spec}</div></td>
              <td><input className="input" type="number" min={1} style={{ height: 32, width: 70 }} value={l.qty} onChange={x => setLines(ls => ls.map((y, j) => (j === i ? { ...y, qty: Math.max(1, +x.target.value) } : y)))} /></td>
              <td><input className="input" type="number" style={{ height: 32, width: 110 }} value={l.unit} onChange={x => setLines(ls => ls.map((y, j) => (j === i ? { ...y, unit: +x.target.value } : y)))} /></td>
              <td className="b" style={{ textAlign: 'right' }}>{gbp(l.qty * l.unit)}</td></tr>
          ))}</tbody>
        </table>
        <div className="hstack" style={{ gap: 10 }}><span className="small t2">Discount (£)</span><input className="input" type="number" style={{ height: 32, width: 110 }} value={discount} onChange={x => setDiscount(Math.max(0, +x.target.value))} /></div>
      </div>
      <b style={{ fontSize: 13 }}>What the customer will see</b>
      <QuoteDoc e={e} q={{ ...q, ref }} />
      <Check on label="Email the quote as a PDF and let the customer accept it in the portal" />
    </Modal>
  );
}

/* ---------- 6. Customer replied → Follow-up ---------- */
export function ReplyModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [mood, setMood] = useState('Happy to go ahead');
  const [text, setText] = useState('Thank you for the quote — we would like to go ahead. When could you fit?');
  const save = () => {
    updEnq(e.id, { stage: 'Follow-up', stageDays: 0, quote: e.quote ? { ...e.quote, reply: text } : e.quote, next: 'Decide: won or lost', nextDue: 'Today' },
      { kind: 'email-in', title: `Re: Your quote ${e.quote?.ref || ''} · ${mood}`, body: text, who: e.name });
    toast('Reply saved · moved to Follow-up');
    onDone?.('comms'); onClose();
  };
  return (
    <Modal title="The customer replied" sub={`${e.name} · quote ${e.quote?.ref}`} onClose={onClose} width={600} footer={<Foot onClose={onClose} onSave={save} label="Save reply" icon={<IconMail size={16} />} />}>
      <div className="alert info small"><IconInfoCircle size={16} />In the live system, replies to the quote email arrive here by themselves and the card moves to Follow-up automatically.</div>
      <Field label="What did they say?"><div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>{['Happy to go ahead', 'Has questions', 'Not interested'].map(m => <button key={m} type="button" className={`chip ${mood === m ? 'on' : ''}`} onClick={() => setMood(m)}>{m}</button>)}</div></Field>
      <Field label="Their message"><textarea className="textarea" style={{ minHeight: 120 }} value={text} onChange={x => setText(x.target.value)} /></Field>
    </Modal>
  );
}

/* ---------- 7a. Mark as Won ---------- */
export function WonModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq } = useStore();
  const t = e.quote ? quoteTotals(e.quote) : null;
  const save = () => {
    updEnq(e.id, { stage: 'Won', stageDays: 0, wonOn: fmtDate(TODAY, { day: '2-digit', month: 'short' }), quote: e.quote ? { ...e.quote, status: 'Accepted' } : e.quote, invite: { status: 'Not invited' }, next: 'Review and invite customer', nextDue: 'Today' },
      { kind: 'system', title: `Marked as Won${t ? ` · ${gbp(t.total)}` : ''}`, body: 'Deposit invoice sent from Xero. The office now reviews everything and invites the customer.', who: ME });
    toast('Won · it is now with the office to invite the customer and order');
    onDone?.('overview'); onClose();
  };
  return (
    <Modal title="Mark as Won" sub={`${e.name} · ${e.product}`} onClose={onClose} width={560} footer={<Foot onClose={onClose} onSave={save} label="Mark as Won" icon={<IconTrophy size={16} />} />}>
      <div className="hstack" style={{ gap: 14, padding: 14, background: 'var(--tint)', borderRadius: 12 }}>
        <IconTrophy size={30} color="#1f9d5b" />
        <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 15 }}>Great news — the customer said yes.</b><span className="small t2">{e.quote ? `Quote ${e.quote.ref} · ${gbp(t!.total)} · deposit ${gbp(t!.deposit)}` : 'No quote on file'}</span></div>
      </div>
      <Check on label={`Send the deposit invoice from Xero${t ? ` (${gbp(t.deposit)})` : ''}`} />
      <div className="alert info small"><IconInfoCircle size={16} />Next, the office checks everything, invites the customer to the portal and places the order.</div>
    </Modal>
  );
}

/* ---------- 7b. Mark as Lost ---------- */
export function LostModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [why, setWhy] = useState('');
  const [note, setNote] = useState('');
  const save = () => {
    updEnq(e.id, { stage: 'Lost', stageDays: 0, lostReason: note ? `${why} — ${note}` : why, quote: e.quote ? { ...e.quote, status: 'Declined' } : e.quote, next: why, nextDue: '—' },
      { kind: 'system', title: `Marked as Lost · ${why}`, body: note, who: staffById(e.assigned)?.name || ME });
    toast('Marked as Lost · reason saved for the reports');
    onDone?.('comms'); onClose();
  };
  return (
    <Modal title="Mark as Lost" sub={`${e.name} · ${e.product}`} onClose={onClose} width={560} footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-danger" disabled={!why} style={{ opacity: why ? 1 : 0.45 }} onClick={save}><IconX size={16} />Mark as Lost</button></>}>
      <Field label="Why was it lost? (required)"><div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>{['Price — chose a cheaper quote', 'Went with another company', 'Not going ahead for now', 'No reply after follow-ups', 'Other'].map(m => <button key={m} type="button" className={`chip ${why === m ? 'on' : ''}`} onClick={() => setWhy(m)}>{m}</button>)}</div></Field>
      <Field label="Anything else? (optional)"><textarea className="textarea" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Might come back in the spring" /></Field>
    </Modal>
  );
}

/* ---------- 8. Review and invite the customer ---------- */
export function InviteModal({ e, onClose, onDone, resend }: P & { resend?: boolean }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const t = e.quote ? quoteTotals(e.quote) : null;
  const checks: [string, string, boolean][] = [
    ['Customer details', `${e.name} · ${e.phone} · ${e.email}`, true],
    ['Appointment', e.appt ? `${fmtDate(e.appt.date)} · ${e.appt.outcome || e.appt.type}` : 'No appointment', !!e.appt],
    ['Survey', e.survey?.status === 'Completed' ? `Completed by ${staffById(e.survey.surveyor)?.name} · ${e.survey.openings?.reduce((a, o) => a + o.qty, 0)} frames` : 'Not completed', e.survey?.status === 'Completed'],
    ['Quote accepted', e.quote ? `${e.quote.ref} · ${gbp(t!.total)}` : 'No quote', e.quote?.status === 'Accepted'],
    ['Deposit invoice', t ? `${gbp(t.deposit)} sent from Xero` : '—', !!t],
  ];
  const save = () => {
    updEnq(e.id, x => ({ invite: { status: 'Invited', sentOn: fmtDate(TODAY, { day: '2-digit', month: 'short' }) }, next: x.jobId ? x.next : 'Create order & delivery', nextDue: x.jobId ? x.nextDue : 'Today' }),
      { kind: 'email-out', title: resend ? 'Reminder: your Jadeite portal invite' : 'Welcome to Jadeite — follow your job online', body: `Dear ${e.name}, thank you for choosing Jadeite Glazing. Use the button in this email to see your dates, documents and payments. You sign in with your email and a one-time code — no password needed.`, who: ME });
    toast(resend ? 'Invite sent again' : `Portal invite sent to ${e.email}`);
    onDone?.('overview'); onClose();
  };
  return (
    <Modal title={resend ? 'Resend portal invite' : 'Review and invite the customer'} sub={resend ? `${e.name} has not joined yet` : 'Check everything before the customer is invited'} onClose={onClose} width={640} footer={<Foot onClose={onClose} onSave={save} label={resend ? 'Send invite again' : 'Everything is right — send invite'} icon={<IconWorld size={16} />} />}>
      {!resend && (
        <div className="list" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px' }}>
          {checks.map(([l, v, ok]) => <div key={l} className="hstack" style={{ gap: 12, padding: '12px 0' }}>{ok ? <IconCircleCheck size={20} color="#1f9d5b" /> : <IconAlertTriangle size={20} color="#e0a100" />}<div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{l}</b><span className="small t2">{v}</span></div></div>)}
        </div>
      )}
      <div className="card" style={{ padding: 16, gap: 8, background: 'var(--bg)' }}>
        <span className="tiny muted">EMAIL TO {e.email.toUpperCase()}</span>
        <b>Welcome to Jadeite — follow your job online</b>
        <span className="small t2">Dear {e.name}, thank you for choosing Jadeite Glazing. Click below to see your dates, documents and payments. You sign in with your email and a one-time code — no password needed.</span>
        <span className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', pointerEvents: 'none' }}>Open my Jadeite portal</span>
      </div>
    </Modal>
  );
}

/* ---------- 9. Create order & delivery (makes the job) ---------- */
export function OrderModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set, jobs } = useStore();
  const lines = (e.quote?.lines || []).filter(l => !l.item.startsWith('Fitting'));
  const defSupplier = lines.some(l => (PRICE[l.item]?.spec || '').includes('Origin')) ? 'Origin' : 'Emplas';
  const [supplier, setSupplier] = useState(defSupplier);
  const [ordered, setOrdered] = useState(TODAY);
  const [expected, setExpected] = useState(addDays(TODAY, 10));
  const [deliverTo, setDeliverTo] = useState('Customer address');
  const [paid, setPaid] = useState(true);
  const t = e.quote ? quoteTotals(e.quote) : { total: e.value, deposit: Math.round(e.value * 0.25) };
  const frames = lines.reduce((a, l) => a + l.qty, 0);
  const jobId = 'JG-' + (10500 + jobs.length);
  const soRef = 'SO-' + (48240 + jobs.length);
  const items = lines.map(l => `${l.qty} × ${l.item.toLowerCase()}`).join(', ');
  let installDate = addDays(expected, 3); const wd = new Date(installDate + 'T12:00:00').getDay(); if (wd === 0) installDate = addDays(installDate, 1); if (wd === 6) installDate = addDays(installDate, 2);
  const save = () => {
    const job: JobX = {
      id: jobId, customer: e.name, initials: e.initials, address: e.address, postcode: e.postcode, phone: e.phone, email: e.email,
      products: items, productList: lines.map(l => ({ name: `${l.qty} × ${l.item}`, qty: l.qty, detail: l.spec, photo: e.photo, ready: 0 })),
      value: t.total, deposit: t.deposit, paid: paid ? t.deposit : 0, stage: 'Ordered', sales: e.assigned || 'mh', surveyor: e.survey?.surveyor || 'ps',
      next: `Wait for ${supplier} to confirm`, owner: 'Sarah M', due: fmtDate(addDays(TODAY, 2)), photo: e.photo, checklist: 45, portal: e.invite?.status || 'Not invited',
      dates: [{ label: 'Survey', date: e.survey?.completedOn || '—', done: true }, { label: 'Order placed', date: fmtDate(ordered, { day: '2-digit', month: 'short' }), done: true }, { label: 'Delivery due', date: fmtDate(expected, { day: '2-digit', month: 'short' }) }, { label: 'Installation', date: 'Not booked' }],
      history: [{ when: fmtDate(TODAY, { day: '2-digit', month: 'short' }), who: ME, what: `Job created from enquiry ${e.id}. Order ${soRef} placed with ${supplier}.` }],
    };
    set('jobs', js => [job, ...js]);
    set('orders', os => [{ ref: soRef, job: jobId, customer: e.name, supplier, ordered: fmtDate(ordered, { day: '2-digit', month: 'short' }), confirmed: false, expected: fmtDate(expected, { day: '2-digit', month: 'short' }), frames: `0 of ${frames}`, status: 'Not confirmed', tone: 'warn', checks: 5, items, enquiry: e.id }, ...os]);
    set('deliveries', ds => [...ds, { time: '08:00', ref: soRef, customer: e.name, job: jobId, where: town(e.address), status: 'Not confirmed', tone: 'warn', day: fmtDate(expected), items: `${frames} frame${frames > 1 ? 's' : ''}`, photo: e.photo, problem: '' }]);
    set('events', es => [...es, { id: 'un' + Date.now(), team: 'un', date: installDate, days: 2, kind: 'install', title: `${first(e.name)} · needs installer`, sub: `${jobId} · not assigned yet`, photo: e.photo, job: jobId }]);
    updEnq(e.id, { jobId, next: `Wait for ${supplier} to confirm`, nextDue: fmtDate(addDays(TODAY, 2)) },
      { kind: 'system', title: `Order ${soRef} placed with ${supplier}`, body: `${items}. Delivery expected ${fmtDate(expected)} to ${deliverTo.toLowerCase()}. Job ${jobId} created and added to the installation diary (waiting for an installer).`, who: ME });
    toast(`Job ${jobId} created · order sent to ${supplier} · added to the diary`);
    onDone?.('order'); onClose();
  };
  return (
    <Modal title="Create order & delivery" sub={`${e.name} · from quote ${e.quote?.ref || ''}`} onClose={onClose} width={720} footer={<Foot onClose={onClose} onSave={save} label="Place order" icon={<IconPackage size={16} />} />}>
      <div className="vstack" style={{ gap: 8 }}>
        <b style={{ fontSize: 13 }}>Products to order</b>
        <div className="list" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px' }}>
          {lines.map((l, i) => <div key={i} className="hstack" style={{ gap: 12, padding: '10px 0' }}><img src={IMG[e.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{l.qty} × {l.item}</b><span className="tiny muted">{l.spec}</span></div><span className="small b">{gbp(l.qty * l.unit)}</span></div>)}
        </div>
      </div>
      <div className="grid-2">
        <Field label="Vendor"><select className="select" value={supplier} onChange={x => setSupplier(x.target.value)}><option>Emplas</option><option>Origin</option><option>Other</option></select></Field>
        <Field label="Vendor contact"><input className="input" readOnly style={{ background: 'var(--bg)' }} value={supplier === 'Origin' ? 'orders@origin-global.com · 0808 168 5011' : 'orders@emplas.co.uk · 01933 234 100'} /></Field>
        <Field label="Order date"><input type="date" className="input" value={ordered} onChange={x => setOrdered(x.target.value)} /></Field>
        <Field label="Expected delivery"><input type="date" className="input" value={expected} onChange={x => setExpected(x.target.value)} /></Field>
        <Field label="Deliver to"><select className="select" value={deliverTo} onChange={x => setDeliverTo(x.target.value)}><option>Customer address</option><option>Head office workshop</option></select></Field>
        <Field label="Order reference"><input className="input" readOnly style={{ background: 'var(--bg)' }} value={soRef} /></Field>
      </div>
      <Check on={paid} onChange={setPaid} label={`Deposit received in Xero (${gbp(t.deposit)})`} />
      <div className="alert info small"><IconInfoCircle size={16} />This creates job <b>&nbsp;{jobId}&nbsp;</b>. It also goes into the Installation diary as “needs installer” for {fmtDate(installDate)} until someone assigns a team.</div>
    </Modal>
  );
}

/* ---------- 10. Vendor confirmed ---------- */
export function VendorConfirmModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set, orders, updateJob } = useStore();
  const o = orders.find(x => x.job === e.jobId)!;
  const [conf, setConf] = useState('EMP-' + (77100 + Math.floor(Math.random() * 90)));
  const [date, setDate] = useState(addDays(TODAY, 10));
  const save = () => {
    set('orders', os => os.map(x => (x.ref === o.ref ? { ...x, confirmed: true, status: 'Confirmed', tone: 'jade', expected: fmtDate(date, { day: '2-digit', month: 'short' }), confirmRef: conf } : x)));
    set('deliveries', ds => ds.map(x => (x.ref === o.ref ? { ...x, status: 'Confirmed', tone: 'jade', day: fmtDate(date) } : x)));
    updateJob(e.jobId!, { next: `Delivery ${fmtDate(date)}`, due: fmtDate(date) }, `${o.supplier} confirmed order ${o.ref} (${conf}) · delivery ${fmtDate(date)}`);
    updEnq(e.id, { next: 'Delivery due', nextDue: fmtDate(date) }, { kind: 'note', title: `${o.supplier} confirmed the order`, body: `Confirmation ${conf}. Delivery on ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}.`, who: ME });
    toast(`Vendor confirmed · delivery ${fmtDate(date)}`);
    onDone?.('order'); onClose();
  };
  return (
    <Modal title="Vendor confirmed the order" sub={`${o.ref} · ${o.supplier}`} onClose={onClose} width={520} footer={<Foot onClose={onClose} onSave={save} label="Save confirmation" icon={<IconCircleCheck size={16} />} />}>
      <div className="grid-2">
        <Field label="Vendor confirmation number"><input className="input" value={conf} onChange={x => setConf(x.target.value)} /></Field>
        <Field label="Confirmed delivery date"><input type="date" className="input" value={date} onChange={x => setDate(x.target.value)} /></Field>
      </div>
    </Modal>
  );
}

/* ---------- 11. Delivered (entered by hand) ---------- */
export function DeliveredModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { updEnq, set, orders, updateJob } = useStore();
  const o = orders.find(x => x.job === e.jobId)!;
  const n = o.frames.split(' of ')[1];
  const [checks, setChecks] = useState([true, true, true]);
  const ok = checks.every(Boolean);
  const save = () => {
    set('orders', os => os.map(x => (x.ref === o.ref ? { ...x, status: 'Arrived', tone: 'ok', frames: `${n} of ${n}` } : x)));
    set('deliveries', ds => ds.map(x => (x.ref === o.ref ? { ...x, status: 'Arrived', tone: 'ok', problem: '' } : x)));
    updateJob(e.jobId!, { stage: 'Delivery', next: 'Book installation', due: 'Today' }, `Delivered and checked (${n} frames). Ready to book.`);
    updEnq(e.id, { next: 'Book installation', nextDue: 'Today' }, { kind: 'note', title: 'Delivered and checked', body: `All ${n} frame${n === '1' ? '' : 's'} arrived with no damage. Ready to book installation.`, who: ME });
    toast('Delivered · now ready to book installation');
    onDone?.('order'); onClose();
  };
  return (
    <Modal title="Mark as delivered" sub={`${o.ref} · ${o.supplier} · ${n} frames`} onClose={onClose} width={520} footer={<Foot onClose={onClose} onSave={save} disabled={!ok} label="Delivered and checked" icon={<IconTruckDelivery size={16} />} />}>
      <div className="vstack" style={{ gap: 10 }}>
        {[`All ${n} frames arrived`, 'No damage to frames or glass', 'Colours and sizes match the order'].map((l, i) => <Check key={l} on={checks[i]} onChange={v => setChecks(c => c.map((x, j) => (j === i ? v : x)))} label={l} />)}
      </div>
      {!ok && <div className="alert warn small"><IconAlertTriangle size={16} />If something is wrong, report a problem from the Deliveries page instead.</div>}
    </Modal>
  );
}

/* ---------- 12. Snag or aftercare ---------- */
export function AddSnagModal({ e, onClose, onDone }: P) {
  const toast = useToast();
  const { set, jobs, updEnq, log, updateJob, events } = useStore();
  const j = jobs.find(x => x.id === e.jobId);
  const fit = events.find(x => x.job === e.jobId && x.kind === 'install' && x.team !== 'un');
  const after = fit ? addDays(fit.date, fit.days) : addDays(TODAY, 3);
  const [kind, setKind] = useState<'Snag' | 'Aftercare'>('Snag');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [sev, setSev] = useState('Minor');
  const [who, setWho] = useState(fit?.team || j?.team || 't1');
  const [visit, setVisit] = useState(after > addDays(TODAY, 3) ? after : addDays(TODAY, 3));
  const people = [...teams.map(t => ({ id: t.id, label: `${t.name} · ${t.members} (installers)` })), ...surveyors.map(s => ({ id: s.id, label: `${s.name} (surveyor)` }))];
  const ownerName = teamById(who)?.name || staffById(who)?.name || '';
  const save = () => {
    const id = 'SN-' + (119 + Math.floor(Math.random() * 80));
    set('snags', ss => [{ id, job: e.jobId!, customer: e.name, title, detail, reported: `Office · ${fmtDate(TODAY, { day: '2-digit', month: 'short' })}`, status: 'Open', tone: 'err', severity: sev, photo: e.photo, owner: ownerName, kind }, ...ss]);
    if (teamById(who)) set('events', es => [...es, { id: 'sv' + Date.now(), team: who, date: visit, days: 1, kind: 'snag', title: `${first(e.name)} · ${kind.toLowerCase()} visit`, sub: `${e.jobId} · ${title}`, photo: e.photo, job: e.jobId }]);
    if (kind === 'Snag') updateJob(e.jobId!, { stage: 'Snag' as any }); else log(e.jobId!, `Aftercare request: ${title}`);
    updEnq(e.id, {}, { kind: 'note', title: `${kind} logged: ${title}`, body: `${detail} Assigned to ${ownerName}. Visit ${fmtDate(visit)}.`, who: ME });
    toast(`${kind} logged · ${ownerName} · visit ${fmtDate(visit)}`);
    onDone?.('snags'); onClose();
  };
  return (
    <Modal title="Add snag or aftercare" sub={`${e.name} · ${e.jobId}`} onClose={onClose} width={620} footer={<Foot onClose={onClose} onSave={save} disabled={title.trim().length < 3} label="Save and assign" icon={<IconTool size={16} />} />}>
      <Field label="What is it?"><div className="hstack" style={{ gap: 8 }}><button type="button" className={`chip ${kind === 'Snag' ? 'on' : ''}`} onClick={() => setKind('Snag')}>Snag — something to fix from the fitting</button><button type="button" className={`chip ${kind === 'Aftercare' ? 'on' : ''}`} onClick={() => setKind('Aftercare')}>Aftercare — a problem later on</button></div></Field>
      <Field label="Short title"><input className="input" value={title} onChange={x => setTitle(x.target.value)} placeholder="e.g. Window handle is stiff" /></Field>
      <Field label="Details"><textarea className="textarea" value={detail} onChange={x => setDetail(x.target.value)} placeholder="What is wrong and where" /></Field>
      <div className="grid-2">
        <Field label="Assign to"><select className="select" value={who} onChange={x => setWho(x.target.value)}>{people.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
        <Field label="Visit date"><input type="date" className="input" value={visit} onChange={x => setVisit(x.target.value)} /></Field>
        <Field label="How serious?"><select className="select" value={sev} onChange={x => setSev(x.target.value)}><option>Minor</option><option>Major</option></select></Field>
      </div>
      <Check on label="Tell the customer the visit date (email and portal)" />
    </Modal>
  );
}

