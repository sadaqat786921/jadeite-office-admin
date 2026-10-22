// Payments: every won job has three invoices — deposit, stage payment (before fitting) and completion.
// They are worked out from the job itself, so paying one here moves the job on everywhere.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconRefresh, IconCurrencyPound, IconClock, IconAlertTriangle, IconCircleCheck, IconSearch, IconMail, IconReceipt } from '@tabler/icons-react';
import { PageHead, Tag, Tile, useToast, Modal, Field, Empty } from '../components/ui';
import { ActionModal, installOf } from '../components/Journey';
import { useRows, isJob, totalsOf, Row } from '../components/derive';
import { gbp } from '../data/mock';
import { useStore, TODAY, fmtDate, addDays, EnquiryX } from '../data/store';

type Inv = { ref: string; r: Row; type: 'Deposit' | 'Stage payment' | 'Completion'; amount: number; status: 'Paid' | 'Due' | 'Overdue' | 'Not due yet'; due: string; paidOn?: string };
const tone = { Paid: 'ok', Due: 'warn', Overdue: 'err', 'Not due yet': 'grey' } as const;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoOf = (d?: string) => { const m = /(\d{1,2}) (\w{3})/.exec(d || ''); return m ? `2026-${String(MON.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };

export function useInvoices(): Inv[] {
  const { events } = useStore();
  const rows = useRows().filter(r => isJob(r.e));
  const out: Inv[] = [];
  rows.forEach(r => {
    const { e } = r; const o = e.ops || {}; const t = totalsOf(e);
    const n = parseInt(e.id.replace(/\D/g, ''), 10);
    out.push({ ref: o.deposit?.inv || `INV-${n + 1100}`, r, type: 'Deposit', amount: t.deposit, status: o.deposit ? 'Paid' : 'Due', due: e.wonOn || '—', paidOn: o.deposit?.on });
    const fit = installOf(e, events);
    const stagePaid = o.stagePaid || (o.work ? fit && fmtDate(fit.date) : undefined);
    out.push({ ref: `INV-${n + 1200}`, r, type: 'Stage payment', amount: t.stage || 0, status: stagePaid || o.paid ? 'Paid' : fit ? (fit.date < TODAY ? 'Overdue' : 'Due') : 'Not due yet', due: fit ? fmtDate(fit.date) : 'When fitting is booked', paidOn: stagePaid || o.paid });
    const closedIso = isoOf(o.closed);
    out.push({ ref: `INV-${n + 1300}`, r, type: 'Completion', amount: t.completion || 0, status: o.paid ? 'Paid' : o.closed ? (addDays(closedIso, 7) < TODAY ? 'Overdue' : 'Due') : 'Not due yet', due: o.closed ? fmtDate(addDays(closedIso, 7)) : 'When the job is signed off', paidOn: o.paid });
  });
  return out;
}

function RecordModal({ inv, onClose }: { inv: Inv; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [how, setHow] = useState('Bank transfer');
  const [on, setOn] = useState(TODAY);
  const save = () => {
    const d = fmtDate(on); const e = inv.r.e;
    const patch = (x: EnquiryX) => ({ ops: { ...(x.ops || {}), ...(inv.type === 'Deposit' ? { deposit: { inv: inv.ref, amount: inv.amount, on: d } } : { stagePaid: d }) } });
    updEnq(e.id, patch, { kind: 'system', title: `${inv.type} paid · ${gbp(inv.amount)} · ${how}`, who: 'Xero' });
    toast(`${inv.type} recorded for ${e.name} · Xero updated`); onClose();
  };
  return (
    <Modal title={`Record ${inv.type.toLowerCase()}`} sub={`${inv.r.e.name} · ${inv.ref} · ${gbp(inv.amount)}`} onClose={onClose} width={480}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><IconCircleCheck size={16} />Record payment</button></>}>
      <div className="grid-2">
        <Field label="How did they pay?"><select className="select" value={how} onChange={e => setHow(e.target.value)}><option>Bank transfer</option><option>Card over the phone</option><option>Cheque</option><option>Finance company</option></select></Field>
        <Field label="Date received"><input type="date" className="input" value={on} onChange={e => setOn(e.target.value)} /></Field>
      </div>
      <div className="alert info small"><IconReceipt size={16} />This is also marked as paid in Xero, so the accounts match.</div>
    </Modal>
  );
}

export default function Payments() {
  const toast = useToast();
  const { updEnq } = useStore();
  const all = useInvoices();
  const [f, setF] = useState('To collect');
  const [q, setQ] = useState('');
  const [rec, setRec] = useState<Inv | null>(null);
  const [act, setAct] = useState<EnquiryX | null>(null);
  const filters: [string, (i: Inv) => boolean][] = [['To collect', i => i.status === 'Due' || i.status === 'Overdue'], ['Overdue', i => i.status === 'Overdue'], ['Paid', i => i.status === 'Paid'], ['Not due yet', i => i.status === 'Not due yet'], ['All', () => true]];
  const fn = filters.find(x => x[0] === f)![1];
  const list = all.filter(i => fn(i) && (i.ref + i.r.e.name + (i.r.e.jobId || '')).toLowerCase().includes(q.toLowerCase()));
  const sum = (p: (i: Inv) => boolean) => gbp(all.filter(p).reduce((a, i) => a + i.amount, 0));
  const remind = (i: Inv) => { updEnq(i.r.e.id, {}, { kind: 'reminder', title: `Payment reminder sent · ${i.ref}`, body: `Dear ${i.r.e.name}, a friendly reminder that your ${i.type.toLowerCase()} of ${gbp(i.amount)} is ${i.status === 'Overdue' ? 'now overdue' : 'due'}. Thank you.`, who: 'Sarah Mitchell' }); toast(`Reminder sent to ${i.r.e.name}`); };
  const pay = (i: Inv) => (i.type === 'Completion' ? setAct(i.r.e) : setRec(i));
  return (
    <>
      <PageHead title="Payments" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payments' }]}
        actions={<><span className="hstack small muted" style={{ gap: 6 }}><IconRefresh size={15} />Matched with Xero</span><button className="btn btn-grey" onClick={() => toast('Up to date with Xero')}><IconRefresh size={16} />Check Xero now</button></>} />
      <div className="grid-4">
        {[['Received', sum(i => i.status === 'Paid'), IconCircleCheck, '#1f9d5b'], ['Due now', sum(i => i.status === 'Due'), IconClock, '#0b6e5c'], ['Overdue', sum(i => i.status === 'Overdue'), IconAlertTriangle, '#d64545'], ['Still to invoice', sum(i => i.status === 'Not due yet'), IconCurrencyPound, '#0b6e5c']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="input-icon" style={{ width: 280 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search invoice, customer or job" value={q} onChange={e => setQ(e.target.value)} /></div>
          {filters.map(([n, t]) => <button key={n} className={`chip ${f === n ? 'on' : ''}`} onClick={() => setF(n)}>{n}<span className="n">{all.filter(t).length}</span></button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Type</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map(i => (
              <tr key={i.ref + i.type}>
                <td className="b">{i.ref}</td>
                <td><Link to={`/jobs/${i.r.e.jobId || i.r.e.id}`} className="vstack" style={{ gap: 2 }}><b>{i.r.e.name}</b><span className="tiny muted">{i.r.e.jobId || 'Not ordered yet'}</span></Link></td>
                <td className="t2">{i.type}</td>
                <td className="b">{gbp(i.amount)}</td>
                <td className="t2" style={{ whiteSpace: 'nowrap' }}>{i.status === 'Paid' ? `Paid ${i.paidOn || ''}` : i.due}</td>
                <td><Tag tone={tone[i.status]}>{i.status}</Tag></td>
                <td>{(i.status === 'Due' || i.status === 'Overdue') && <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}><button className="btn btn-grey btn-xs" onClick={() => remind(i)}><IconMail size={13} />Send reminder</button><button className="btn btn-primary btn-xs" onClick={() => pay(i)}><IconCircleCheck size={13} />Record payment</button></div>}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7}><Empty icon={<IconReceipt size={22} />} title="Nothing here" sub={f === 'Overdue' ? 'No one is late paying.' : 'Try another filter.'} /></td></tr>}
          </tbody>
        </table>
      </div>
      {rec && <RecordModal inv={rec} onClose={() => setRec(null)} />}
      {act && <ActionModal k="payment" e={act} onClose={() => setAct(null)} />}
    </>
  );
}
