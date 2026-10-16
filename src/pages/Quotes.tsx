import React, { useState } from 'react';
import { IconExternalLink, IconRefresh, IconSearch, IconFileText, IconCircleCheck, IconClock, IconX } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Tile, useToast } from '../components/ui';
import { quotes, staffById, gbp } from '../data/mock';

export default function Quotes() {
  const toast = useToast();
  const [f, setF] = useState('All');
  const rows = quotes.filter(q => f === 'All' || q.status === f);
  return (
    <>
      <PageHead title="Quotes (Framepoint)" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Quotes' }]}
        actions={<><span className="hstack small muted" style={{ gap: 6 }}><IconRefresh size={15} />Synced with Framepoint 4 min ago</span><button className="btn btn-grey" onClick={() => toast('Framepoint sync started')}><IconRefresh size={16} />Sync now</button><button className="btn btn-primary"><IconExternalLink size={16} />Open Framepoint</button></>} />
      <div className="alert info"><IconFileText size={18} />Quotes are designed and priced in <b>Framepoint</b>. Jadeite shows each quote against the right customer and job so everyone sees the same thing.</div>
      <div className="grid-4">
        {[['Quotes sent this month', '14', IconFileText, '#2f6fde'], ['Accepted', '8', IconCircleCheck, '#1f9d5b'], ['Waiting for a decision', '4', IconClock, '#e0a100'], ['Declined or expired', '2', IconX, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar">
          <div className="input-icon" style={{ width: 300 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search quote or customer" /></div>
          {['All', 'Sent', 'Accepted', 'Declined', 'Expired'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Quote</th><th>Customer</th><th>Product</th><th>Value</th><th>Sent</th><th>Expires</th><th>Salesperson</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(q => (
              <tr key={q.ref}>
                <td className="b">{q.ref}</td><td>{q.customer}</td><td className="t2">{q.product}</td><td className="b">{gbp(q.value)}</td><td className="t2">{q.sent}</td><td className="t2">{q.expires}</td>
                <td><span className="hstack" style={{ gap: 8 }}><Avatar i={staffById(q.sales)!.initials} size={24} />{staffById(q.sales)!.name}</span></td>
                <td><Tag tone={q.tone}>{q.status}</Tag></td>
                <td><button className="btn btn-outline btn-xs"><IconExternalLink size={13} />Open in Framepoint</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
