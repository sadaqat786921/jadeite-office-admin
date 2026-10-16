import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconPhone, IconMail, IconPackage, IconAlertTriangle, IconCircleCheck, IconTruck, IconClock, IconSearch, IconChevronRight, IconCamera } from '@tabler/icons-react';
import { PageHead, Tag, Tile, Modal, Field, useToast, Card, CardHead } from '../components/ui';
import { orders as orders0, IMG, jobs } from '../data/mock';
import { useStore } from '../data/store';
import { DeliveryProblemModal } from '../components/Forms';

export function Orders() {
  const toast = useToast();
  const [f, setF] = useState('All');
  const [modal, setModal] = useState(false);
  const [orders, setOrders] = useState(orders0);
  const { log } = useStore();
  const rows = orders.filter(o => f === 'All' || o.status === f || (f === 'Problems' && ['Late', 'Not confirmed', 'Part delivery'].includes(o.status)));
  return (
    <>
      <PageHead title="Orders" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Orders' }]} actions={<button className="btn btn-primary" onClick={() => setModal(true)}><IconPlus size={16} />Add supplier order</button>} />
      <div className="alert info"><IconPackage size={18} />Supplier orders are entered here by the office. The Director sees anything due or late from these dates.</div>
      <div className="grid-4">
        {[['Open orders', '6', IconPackage, '#0b6e5c'], ['Waiting for confirmation', '1', IconClock, '#e0a100'], ['Late', '1', IconAlertTriangle, '#d64545'], ['Arrived this week', '1', IconCircleCheck, '#1f9d5b']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar">
          <div className="input-icon" style={{ width: 280 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search order, job or supplier" /></div>
          {['All', 'Problems', 'Confirmed', 'On the way', 'Arrived'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Order</th><th>Job</th><th>Supplier</th><th>Ordered</th><th>Confirmed</th><th>Expected</th><th>Frames</th><th>Checks</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.ref}>
                <td className="b">{o.ref}</td>
                <td><Link to={`/jobs/${o.job}`} className="vstack" style={{ gap: 2 }}><b>{o.customer}</b><span className="tiny muted">{o.job}</span></Link></td>
                <td><span className="hstack" style={{ gap: 8 }}><span className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>{o.supplier[0]}</span>{o.supplier}</span></td>
                <td className="t2">{o.ordered}</td>
                <td>{o.confirmed ? <Tag tone="ok">Yes</Tag> : <Tag tone="warn">Not yet</Tag>}</td>
                <td className="b" style={{ color: o.status === 'Late' ? 'var(--err)' : 'var(--text)' }}>{o.expected}</td>
                <td>{o.frames}</td>
                <td className="small">{o.checks}/5</td>
                <td><Tag tone={o.tone}>{o.status}</Tag></td>
                <td>{o.status === 'Not confirmed' ? <span className="hstack" style={{ gap: 6 }}><button className="btn btn-dark btn-xs" onClick={() => { toast(`Chase email sent to ${o.supplier}`); log(o.job, `Chased ${o.supplier} to confirm ${o.ref}`); }}><IconMail size={13} />Chase</button><button className="btn btn-outline btn-xs" onClick={() => { setOrders(os => os.map(x => (x.ref === o.ref ? { ...x, confirmed: true, status: 'Confirmed', tone: 'jade' } : x))); log(o.job, `${o.supplier} confirmed order ${o.ref} · expected ${o.expected}`); toast('Marked as confirmed · expected date saved'); }}>Confirmed</button></span> : o.status === 'Late' ? <button className="btn btn-dark btn-xs" onClick={() => { toast(`Chase email sent to ${o.supplier}`); log(o.job, `Chased ${o.supplier} about late order ${o.ref}`); }}><IconMail size={13} />Chase</button> : <Link to={`/jobs/${o.job}`} className="btn btn-outline btn-xs">Open job</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Add supplier order" sub="Typed in by the office from the supplier’s confirmation" onClose={() => setModal(false)}
          footer={<><button className="btn btn-grey" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { toast('Supplier order added'); setModal(false); }}>Save order</button></>}>
          <div className="grid-2">
            <Field label="Job"><select className="select">{jobs.map(j => <option key={j.id}>{j.id} · {j.customer}</option>)}</select></Field>
            <Field label="Supplier"><select className="select"><option>Emplas</option><option>Origin</option><option>Other</option></select></Field>
            <Field label="Supplier order reference"><input className="input" placeholder="e.g. SO-48240" /></Field>
            <Field label="Number of frames"><input className="input" placeholder="8" /></Field>
            <Field label="Date ordered"><input type="date" className="input" defaultValue="2026-10-16" /></Field>
            <Field label="Expected delivery"><input type="date" className="input" defaultValue="2026-10-23" /></Field>
          </div>
          <Field label="Notes"><textarea className="textarea" placeholder="Anything the team should know" /></Field>
        </Modal>
      )}
    </>
  );
}

export function Deliveries() {
  const toast = useToast();
  const { deliveries, set, updateJob } = useStore();
  const [problem, setProblem] = useState<string | null>(null);
  const days = Array.from(new Set(deliveries.map(d => d.day)));
  const arrived = (d: any) => { set('deliveries', ds => ds.map(x => (x.ref === d.ref ? { ...x, status: 'Arrived', tone: 'ok', problem: '' } : x))); updateJob(d.job, { stage: 'Delivery' as any, blocked: undefined, next: 'Book installation', due: 'Today' }, `Goods arrived and checked (${d.items}). Proof photos added. Job is ready to book.`); toast(`${d.customer}: arrived and checked · now in Ready to book`); };
  const solved = (d: any) => { set('deliveries', ds => ds.map(x => (x.ref === d.ref ? { ...x, status: 'Arrived', tone: 'ok', problem: '' } : x))); updateJob(d.job, { blocked: undefined, next: 'Book installation', due: 'Today' }, 'Delivery problem solved. Job unblocked.'); toast('Problem closed · job unblocked'); };
  const n = (f: (d: any) => boolean) => deliveries.filter(f).length;
  return (
    <>
      <PageHead title="Deliveries" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Deliveries' }]} actions={<Link to="/orders" className="btn btn-grey"><IconPackage size={16} />Supplier orders</Link>} />
      <div className="grid-4">
        {[['Due today', n(d => d.day === 'Today'), IconTruck, '#0b6e5c'], ['Arrived', n(d => d.status === 'Arrived'), IconCircleCheck, '#1f9d5b'], ['On the way', n(d => d.status === 'On the way'), IconClock, '#2f6fde'], ['Late or with a problem', n(d => d.tone === 'err'), IconAlertTriangle, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="alert info small"><IconCamera size={16} />When goods arrive, check them and mark them as arrived. If anything is damaged, missing or wrong, report a problem — the job stays blocked until it is solved.</div>
      {days.map(day => (
        <Card key={day}>
          <CardHead title={day === 'Today' ? 'Today · Friday 16 October' : day} sub={`${deliveries.filter(d => d.day === day).length} deliver${deliveries.filter(d => d.day === day).length === 1 ? 'y' : 'ies'}`} />
          <div className="list">
            {deliveries.filter(d => d.day === day).map(d => (
              <div key={d.ref} className="hstack" style={{ gap: 14, padding: '12px 0' }}>
                <b style={{ width: 52 }}>{d.time}</b>
                <img src={IMG[d.photo]} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                <div className="vstack" style={{ gap: 3, flex: 1 }}><Link to={`/jobs/${d.job}`} className="b" style={{ fontSize: 14 }}>{d.customer}</Link><span className="small muted">{d.ref} · {d.items} · {d.where}</span></div>
                <Tag tone={d.tone}>{d.status}</Tag>
                {d.problem ? <button className="btn btn-primary btn-sm" onClick={() => solved(d)}><IconCircleCheck size={14} />Problem solved</button>
                  : d.status === 'Arrived' ? <button className="btn btn-outline btn-sm" onClick={() => setProblem(d.ref)}><IconAlertTriangle size={14} />Report problem</button>
                  : d.status.startsWith('Late') ? <button className="btn btn-dark btn-sm" onClick={() => toast('Chase email sent to the supplier')}><IconMail size={14} />Chase supplier</button>
                  : <span className="hstack" style={{ gap: 6 }}><button className="btn btn-outline btn-sm" onClick={() => setProblem(d.ref)}><IconAlertTriangle size={14} />Problem</button><button className="btn btn-primary btn-sm" onClick={() => arrived(d)}><IconCircleCheck size={14} />Arrived and checked</button></span>}
              </div>
            ))}
          </div>
        </Card>
      ))}
      {problem && <DeliveryProblemModal deliveryRef={problem} onClose={() => setProblem(null)} />}
    </>
  );
}
