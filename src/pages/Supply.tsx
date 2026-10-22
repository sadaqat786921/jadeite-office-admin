// Orders and Deliveries: the supplier side of each job. Both pages open the same order panel:
// status, products with their final sizes, documents and the conversation with the supplier.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPackage, IconTruckDelivery, IconAlertTriangle, IconCircleCheck, IconExternalLink, IconSend, IconMailForward, IconMail, IconChevronRight, IconClock, IconCalendar } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Tile, Drawer, Field, useToast, Empty } from '../components/ui';
import { FileChip, orderLines } from '../components/Lifecycle';
import { ActionModal } from '../components/Journey';
import { useRows, Row } from '../components/derive';
import { useStore, Order, EnquiryX, TODAY, fmtDate } from '../data/store';
import { IMG } from '../data/mock';

const STEPS = ['Pending', 'Confirmed', 'In production', 'In transit', 'Delivered', 'Checked'];
export type OrderRow = Row & { o: Order; status: string; at: number; problem?: string; expectedIso: string };
const monthIx: Record<string, string> = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const toIso = (s: string) => { const [d, m] = s.split(' '); return monthIx[m] ? `2026-${monthIx[m]}-${d.padStart(2, '0')}` : TODAY; };
const contact = (s: string) => (s === 'Origin' ? 'orders@origin-global.com · 0808 168 5011' : 'orders@emplas.co.uk · 01933 234 100');

export function useOrderRows(): OrderRow[] {
  const rows = useRows();
  const { orders } = useStore();
  return useMemo(() => rows.flatMap(r => {
    const o = orders.find(x => r.e.jobId && x.job === r.e.jobId);
    if (!o) return [];
    const ops = r.e.ops || {};
    const status = ops.received ? (ops.received.ok ? 'Checked' : 'Problem') : ops.delivery || 'Pending';
    const at = status === 'Problem' ? 4 : STEPS.indexOf(status);
    return [{ ...r, o, status, at, problem: ops.received && !ops.received.ok ? ops.received.issue : undefined, expectedIso: toIso(o.expected) }];
  }), [rows, orders]);
}
const statusTone = (s: string) => (s === 'Problem' ? 'err' : s === 'Checked' ? 'ok' : s === 'Pending' ? 'warn' : 'jade');
const nextKey = (r: OrderRow) => (['supplier', 'delivery', 'receive', 'issue'].includes(r.st.key) ? r.st : null);

export function Orders() {
  const rows = useOrderRows();
  const all = useRows();
  const toPlace = all.filter(r => r.st.key === 'order');
  const [f, setF] = useState('Open');
  const [open, setOpen] = useState<string | null>(null);
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const filters: [string, (r: OrderRow) => boolean][] = [['Open', r => r.status !== 'Checked'], ['Waiting for supplier', r => r.status === 'Pending'], ['In production', r => ['Confirmed', 'In production'].includes(r.status)], ['On the way', r => r.status === 'In transit'], ['Delivered', r => ['Delivered', 'Checked'].includes(r.status)], ['Problem', r => r.status === 'Problem'], ['All', () => true]];
  const fn = filters.find(x => x[0] === f)![1];
  const sel = rows.find(r => r.o.ref === open);
  return (
    <>
      <PageHead title="Orders" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Orders' }]} />
      <div className="grid-4">
        {[['Open orders', rows.filter(r => r.status !== 'Checked').length, IconPackage], ['Waiting for supplier', rows.filter(r => r.status === 'Pending').length, IconClock], ['Ready to order', toPlace.length, IconPackage], ['Problems', rows.filter(r => r.status === 'Problem').length, IconAlertTriangle]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={(l === 'Problems' || l === 'Ready to order') && v ? (l === 'Problems' ? '#d64545' : '#e0a100') : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      {toPlace.length > 0 && (
        <div className="card" style={{ gap: 10 }}>
          <b>Verified and ready to order</b>
          {toPlace.map(r => (
            <div key={r.e.id} className="hstack" style={{ gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <img src={IMG[r.e.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{r.e.name}</b><span className="tiny muted">{orderLines(r.e).map(l => `${l.qty} × ${l.item.replace(/^\d+\.\s*/, '')}`).join(', ')}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => setAct({ k: 'order', e: r.e })}><IconPackage size={14} />Place supplier order</button>
            </div>
          ))}
        </div>
      )}
      <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>{filters.map(([n, t]) => <button key={n} className={`chip ${f === n ? 'on' : ''}`} onClick={() => setF(n)}>{n}<span className="n">{rows.filter(t).length}</span></button>)}</div>
      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>Order</th><th>Customer</th><th>Supplier</th><th>Ordered</th><th>Expected</th><th>Status</th><th>Next step</th><th></th></tr></thead>
          <tbody>
            {rows.filter(fn).map(r => { const nx = nextKey(r); return (
              <tr key={r.o.ref} className="click" onClick={() => setOpen(r.o.ref)}>
                <td><b>{r.o.ref}</b><div className="tiny muted">Job {r.o.job}</div></td>
                <td><div className="hstack" style={{ gap: 10 }}><img src={IMG[r.e.photo]} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b>{r.e.name}</b><span className="tiny muted">{r.o.items}</span></div></div></td>
                <td><span className="hstack" style={{ gap: 8 }}><Avatar i={r.o.supplier[0]} size={26} />{r.o.supplier}</span><div className="tiny muted">{r.o.confirmRef || 'Not confirmed yet'}</div></td>
                <td className="t2">{r.o.ordered}</td>
                <td className="t2">{r.o.expected}</td>
                <td><Tag tone={statusTone(r.status)}>{r.status}</Tag></td>
                <td onClick={ev => ev.stopPropagation()}>{nx ? <button className={`btn ${nx.wait ? 'btn-outline' : 'btn-primary'} btn-xs`} onClick={() => setAct({ k: nx.key, e: r.e })}>{nx.icon}{nx.label}</button> : <span className="tiny muted">Done</span>}</td>
                <td><IconChevronRight size={16} color="#6b7a78" /></td>
              </tr>
            ); })}
            {rows.filter(fn).length === 0 && <tr><td colSpan={8}><Empty icon={<IconPackage size={22} />} title="No orders here" /></td></tr>}
          </tbody>
        </table>
      </div>
      {sel && <OrderDrawer r={sel} onClose={() => setOpen(null)} />}
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
    </>
  );
}

export function Deliveries() {
  const rows = useOrderRows();
  const [open, setOpen] = useState<string | null>(null);
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const weekEnd = fmtDate(TODAY) && new Date(new Date(TODAY + 'T12:00:00').getTime() + 7 * 864e5).toISOString().slice(0, 10);
  const pending = rows.filter(r => !['Checked'].includes(r.status));
  const groups: [string, OrderRow[]][] = [
    ['Needs checking or has a problem', pending.filter(r => ['Delivered', 'Problem'].includes(r.status))],
    ['Late', pending.filter(r => !['Delivered', 'Problem'].includes(r.status) && r.expectedIso < TODAY)],
    ['Due in the next 7 days', pending.filter(r => !['Delivered', 'Problem'].includes(r.status) && r.expectedIso >= TODAY && r.expectedIso <= weekEnd)],
    ['Later', pending.filter(r => !['Delivered', 'Problem'].includes(r.status) && r.expectedIso > weekEnd)],
    ['Delivered and checked', rows.filter(r => r.status === 'Checked').sort((a, b) => b.expectedIso.localeCompare(a.expectedIso))],
  ];
  const sel = rows.find(r => r.o.ref === open);
  return (
    <>
      <PageHead title="Deliveries" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Deliveries' }]} />
      <div className="grid-4">
        {[['Due in 7 days', groups[2][1].length, IconCalendar], ['On the way', rows.filter(r => r.status === 'In transit').length, IconTruckDelivery], ['To check', rows.filter(r => r.status === 'Delivered').length, IconPackage], ['Problems', rows.filter(r => r.status === 'Problem').length, IconAlertTriangle]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={l === 'Problems' && v ? '#d64545' : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      {groups.map(([title, list]) => list.length > 0 && (
        <div key={title} className="vstack" style={{ gap: 8 }}>
          <b style={{ fontSize: 14 }}>{title} <span className="tag grey">{list.length}</span></b>
          {list.map(r => { const nx = nextKey(r); return (
            <div key={r.o.ref} className="card click" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, cursor: 'pointer' }} onClick={() => setOpen(r.o.ref)}>
              <div className="vstack" style={{ gap: 2, width: 92 }}><b style={{ fontSize: 15 }}>{r.o.expected}</b><span className="tiny muted">{r.status === 'Checked' ? 'Delivered' : 'Expected'}</span></div>
              <img src={IMG[r.e.photo]} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 3, flex: 1, minWidth: 0 }}><b>{r.e.name}</b><span className="tiny muted">{r.e.address} · {r.o.supplier} {r.o.ref} · {r.o.items}</span>{r.problem && <span className="tiny" style={{ color: 'var(--err)', fontWeight: 600 }}>Problem: {r.problem}</span>}</div>
              <Tag tone={statusTone(r.status)}>{r.status === 'Checked' ? 'Delivered and checked' : r.status}</Tag>
              <div onClick={ev => ev.stopPropagation()}>{nx && <button className={`btn ${nx.wait ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={() => setAct({ k: nx.key, e: r.e })}>{nx.icon}{nx.label}</button>}</div>
            </div>
          ); })}
        </div>
      ))}
      {rows.length === 0 && <Empty icon={<IconTruckDelivery size={22} />} title="No deliveries yet" sub="Deliveries appear once a supplier order is placed." />}
      {sel && <OrderDrawer r={sel} onClose={() => setOpen(null)} />}
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
    </>
  );
}

/* ---------- The order panel used by Orders and Deliveries ---------- */
export function OrderDrawer({ r, onClose }: { r: OrderRow; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const { e, o } = r;
  const [act, setAct] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState(false);
  const lines = orderLines(e);
  const nx = nextKey(r);
  const sup = o.supplier;
  const thread = (e.comms || []).filter(c => c.who === sup || c.title.includes(sup) || c.title.startsWith('Delivery status') || c.title.startsWith('Order ') || c.title.includes(o.ref));
  const send = () => {
    updEnq(e.id, {}, reply ? { kind: 'email-in', title: `${sup} replied about ${o.ref}`, body: msg, who: sup } : { kind: 'email-out', title: `Message to ${sup} · ${o.ref}`, body: msg, who: 'Sarah Mitchell' });
    toast(reply ? `${sup}'s reply saved on the job` : `Email sent to ${sup}`); setMsg('');
  };
  return (
    <Drawer title={`${o.ref} · ${sup}`} sub={`${e.name} · job ${o.job}`} onClose={onClose} width={680}
      footer={<><Link to={`/jobs/${o.job}`} className="btn btn-grey" style={{ marginRight: 'auto' }}><IconExternalLink size={16} />Open job</Link>{nx && <button className="btn btn-primary" onClick={() => setAct(nx.key)}>{nx.icon}{nx.label}</button>}</>}>
      <div className="stepper" style={{ flexWrap: 'wrap' }}>
        {STEPS.map((x, i) => <React.Fragment key={x}>{i > 0 && <span className="step-line" />}<span className={`step ${i < r.at ? 'done' : ''} ${i === r.at ? 'now' : ''}`} style={r.status === 'Problem' && i === 5 ? { borderColor: 'var(--err)', color: 'var(--err)' } : undefined}>{i < r.at && <IconCircleCheck size={14} />}{r.status === 'Problem' && i === 5 ? 'Problem' : x}</span></React.Fragment>)}
      </div>
      {r.problem && <div className="alert err small"><IconAlertTriangle size={16} />{r.problem}</div>}
      <div className="grid-2" style={{ rowGap: 12 }}>
        {[['Supplier', sup], ['Supplier contact', contact(sup)], ['Supplier reference', o.confirmRef || 'Not confirmed yet'], ['Ordered', o.ordered], ['Expected delivery', o.expected], ['Deliver to', `${e.address}, ${e.postcode}`]].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 3 }}><span className="small muted">{l}</span><b style={{ fontSize: 13 }}>{v}</b></div>)}
      </div>
      <div className="vstack" style={{ gap: 8 }}>
        <b style={{ fontSize: 13 }}>Products (sizes from the final survey)</b>
        <div className="list" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '0 12px' }}>
          {lines.map((l, i) => <div key={i} className="hstack" style={{ gap: 10, padding: '9px 0' }}><div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{l.qty} × {l.item.replace(/^\d+\.\s*/, '')}</b><span className="tiny muted">{l.spec}</span></div><Tag tone="grey">{l.size}</Tag></div>)}
        </div>
      </div>
      {o.confirmRef && <div className="hstack" style={{ gap: 10 }}><FileChip name={`${sup} acknowledgement ${o.confirmRef}.pdf`} sub="From the supplier" onOpen={() => toast('Opening the acknowledgement')} /></div>}
      <div className="vstack" style={{ gap: 8 }}>
        <b style={{ fontSize: 13 }}>Conversation with {sup}</b>
        {thread.length === 0 && <span className="small muted">No messages yet.</span>}
        {thread.map(c => <div key={c.id} className="vstack" style={{ gap: 4, padding: '10px 12px', borderRadius: 10, background: c.kind === 'email-in' ? 'var(--tint)' : 'var(--bg)' }}><span className="between"><span className="hstack small" style={{ gap: 6 }}>{c.kind === 'email-in' ? <IconMail size={14} /> : <IconMailForward size={14} />}<b>{c.title}</b></span><span className="tiny muted">{c.when}</span></span>{c.body && <span className="small t2">{c.body}</span>}</div>)}
        <div className="hstack" style={{ gap: 8 }}><button type="button" className={`chip ${!reply ? 'on' : ''}`} onClick={() => setReply(false)}>Email {sup}</button><button type="button" className={`chip ${reply ? 'on' : ''}`} onClick={() => setReply(true)}>Log their reply</button></div>
        <Field label={reply ? `What did ${sup} say?` : `Message to ${sup}`}><textarea className="textarea" value={msg} onChange={x => setMsg(x.target.value)} placeholder={reply ? 'e.g. Glass delayed, new date Thursday' : `e.g. Please confirm the delivery date for ${o.ref}`} /></Field>
        <button className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start' }} disabled={msg.trim().length < 3} onClick={send}><IconSend size={14} />{reply ? 'Save reply' : 'Send email'}</button>
      </div>
      {act && <ActionModal k={act} e={e} onClose={() => setAct(null)} />}
    </Drawer>
  );
}
