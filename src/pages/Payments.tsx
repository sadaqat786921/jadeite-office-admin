import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconRefresh, IconExternalLink, IconCurrencyPound, IconClock, IconAlertTriangle, IconCircleCheck, IconSearch, IconMail } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Tile, useToast } from '../components/ui';
import { AreaLine } from '../components/charts';
import { invoices, gbp } from '../data/mock';

export default function Payments() {
  const toast = useToast();
  const [f, setF] = useState('All');
  const rows = invoices.filter(i => f === 'All' || i.status.startsWith(f));
  return (
    <>
      <PageHead title="Payments (Xero)" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payments' }]}
        actions={<><span className="hstack small muted" style={{ gap: 6 }}><IconRefresh size={15} />Synced with Xero 5 min ago</span><button className="btn btn-grey" onClick={() => toast('Xero sync started')}><IconRefresh size={16} />Sync now</button><button className="btn btn-primary"><IconExternalLink size={16} />Open Xero</button></>} />
      <div className="alert info"><IconCurrencyPound size={18} />Xero is where invoices are created and payments are recorded. Jadeite shows them against each job so the office can see who has paid — view only. Card payments are not taken in Jadeite.</div>
      <div className="grid-4">
        {[['Received this month', '£64,522', IconCircleCheck, '#1f9d5b'], ['Deposits collected', '£18,400', IconCurrencyPound, '#0b6e5c'], ['Still to pay', '£86,150', IconClock, '#e0a100'], ['Overdue', '£3,200', IconAlertTriangle, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="row">
        <div className="card flush grow" style={{ minWidth: 0 }}>
          <div className="toolbar">
            <div className="input-icon" style={{ width: 280 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search invoice or customer" /></div>
            {['All', 'Paid', 'Due', 'Overdue', 'On hold'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}
          </div>
          <table className="tbl">
            <thead><tr><th>Xero invoice</th><th>Customer</th><th>Type</th><th>Amount</th><th>Paid</th><th>Still to pay</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(i => (
                <tr key={i.ref}>
                  <td className="b">{i.ref}</td>
                  <td><Link to={`/jobs/${i.job}`} className="vstack" style={{ gap: 2 }}><b>{i.customer}</b><span className="tiny muted">{i.job}</span></Link></td>
                  <td className="t2">{i.type}</td><td className="b">{gbp(i.amount)}</td><td>{gbp(i.paid)}</td>
                  <td className="b" style={{ color: i.amount - i.paid > 0 ? 'var(--warn)' : 'var(--text)' }}>{gbp(i.amount - i.paid)}</td>
                  <td className="t2" style={{ whiteSpace: 'nowrap' }}>{i.due}</td><td><Tag tone={i.tone}>{i.status}</Tag></td>
                  <td>{i.status === 'Overdue' || i.status === 'Due' ? <button className="btn btn-dark btn-xs" onClick={() => toast(`Payment reminder sent to ${i.customer}`)}><IconMail size={13} />Remind</button> : <button className="btn btn-outline btn-xs"><IconExternalLink size={13} />Xero</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
