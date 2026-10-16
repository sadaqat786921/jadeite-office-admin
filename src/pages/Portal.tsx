import React, { useState } from 'react';
import { IconSend, IconWorld, IconEye, IconCircleCheck, IconLock, IconFileText, IconCalendar, IconMessage, IconCurrencyPound, IconShieldCheck, IconHome, IconUsers } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Avatar, Switch, Tile, useToast } from '../components/ui';
import { jobs, IMG } from '../data/mock';

export default function Portal() {
  const toast = useToast();
  const [show, setShow] = useState<Record<string, boolean>>({ stage: true, dates: true, quote: true, drawings: true, prep: true, guarantee: true, payments: true, photos: false, survey: false });
  const toggle = (k: string) => setShow(s => ({ ...s, [k]: !s[k] }));
  const j = jobs[0];
  return (
    <>
      <PageHead title="Customer portal" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Customer portal' }]} actions={<button className="btn btn-primary" onClick={() => toast('Invites sent to 2 customers')}><IconSend size={16} />Invite all not yet invited</button>} />
      <div className="grid-4">
        {[['Customers using the portal', '27', IconUsers, '#0b6e5c'], ['Invited, not signed in', '2', IconSend, '#e0a100'], ['Messages this week', '14', IconMessage, '#2f6fde'], ['Quotes signed online', '9', IconCircleCheck, '#1f9d5b']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="row">
        <div className="col grow">
          <Card>
            <CardHead title="What customers can see" sub="Customers only ever see their own job. These settings apply to every customer." />
            <div className="list">
              {[['stage', 'Current stage and next step', IconHome], ['dates', 'Agreed dates and arrival windows', IconCalendar], ['quote', 'Approved quotes', IconFileText], ['drawings', 'Drawings', IconFileText], ['prep', 'Preparation instructions', IconFileText], ['guarantee', 'Guarantees and care guides', IconShieldCheck], ['payments', 'Invoices and what is still to pay (from Xero)', IconCurrencyPound], ['photos', 'Installation photos', IconEye], ['survey', 'Full survey details', IconFileText]].map(([k, l, I]: any) => (
                <div key={k} className="hstack" style={{ gap: 12, padding: '12px 0' }}><Tile icon={<I size={17} />} size={34} radius={8} /><span style={{ flex: 1 }}>{l}</span><span className="small" style={{ color: show[k] ? 'var(--ok)' : 'var(--muted)' }}>{show[k] ? 'Visible' : 'Hidden'}</span><Switch on={show[k]} onChange={() => toggle(k)} /></div>
              ))}
            </div>
            <div className="alert info small"><IconLock size={16} />Always hidden: internal notes, supplier details, costs and margins, and other customers’ records. Customers can’t change stages or teams.</div>
          </Card>
          <Card>
            <CardHead title="Invitations" />
            <table className="tbl"><thead><tr><th>Customer</th><th>Job</th><th>Status</th><th>Last signed in</th><th></th></tr></thead>
              <tbody>{jobs.map(x => <tr key={x.id}><td><span className="hstack" style={{ gap: 8 }}><Avatar i={x.initials} size={28} /><b>{x.customer}</b></span></td><td className="t2">{x.id}</td><td><Tag tone={x.portal === 'Active' ? 'ok' : x.portal === 'Invited' ? 'info' : 'grey'}>{x.portal}</Tag></td><td className="t2">{x.portal === 'Active' ? 'Today' : '—'}</td><td>{x.portal !== 'Active' && <button className="btn btn-outline btn-xs" onClick={() => toast(`Invite sent to ${x.customer}`)}><IconSend size={13} />{x.portal === 'Invited' ? 'Resend' : 'Invite'}</button>}</td></tr>)}</tbody>
            </table>
          </Card>
        </div>
        <Card className="w-400" style={{ alignItems: 'center', background: 'linear-gradient(180deg,#f3fbf8,#fff)' }}>
          <CardHead title="Preview: what Sarah & David see" />
          <div style={{ width: 300, borderRadius: 34, border: '10px solid #0b1f1b', overflow: 'hidden', background: '#f6f8f7', boxShadow: 'var(--shadow-pop)' }}>
            <div style={{ position: 'relative', height: 150 }}>
              <img src={IMG.house} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent,rgba(11,31,27,.85))' }} />
              <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff' }}><div className="tiny" style={{ opacity: .85 }}>Hello Sarah</div><b style={{ fontSize: 16 }}>Your windows and door</b></div>
            </div>
            <div style={{ padding: 14, display: 'grid', gap: 10 }}>
              <div className="card" style={{ padding: 12, gap: 8 }}><span className="tiny muted">Where your job is</span><b>Ordered — being made</b><div className="hstack" style={{ gap: 4 }}>{[1, 2, 3, 4, 5, 6].map(i => <span key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= 3 ? '#00c7a1' : '#e3e9e7' }} />)}</div></div>
              <div className="card" style={{ padding: 12, gap: 6 }}><span className="tiny muted">Next</span><b style={{ fontSize: 13 }}>Delivery · Tue 20 Oct, 8–10am</b><b style={{ fontSize: 13 }}>Fitting · Thu 22 – Fri 23 Oct</b></div>
              <div className="grid-2" style={{ gap: 8 }}>{[['Documents', IconFileText], ['Messages', IconMessage], ['Payments', IconCurrencyPound], ['Help', IconShieldCheck]].map(([l, I]: any) => <div key={l} className="card" style={{ padding: 10, gap: 6, alignItems: 'center' }}><I size={18} color="#0b6e5c" /><span className="tiny b">{l}</span></div>)}</div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
