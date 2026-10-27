import React, { useState } from 'react';
import { IconDownload, IconPrinter, IconTrendingUp, IconClock, IconTool, IconCircleCheck } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Dd, Tabs, Tile } from '../components/ui';
import { BarChart, Donut, HBars } from '../components/charts';
import { salesByMonth, enquirySources, staff } from '../data/mock';
import { useStore } from '../data/store';
import { crewOf, onDay } from '../data/crew';
import { monthCells } from '../components/Booking';

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const { events, installers } = useStore();
  const wd = monthCells('2026-10-01').filter(d => d.slice(0, 7) === '2026-10' && ![0, 6].includes(new Date(d + 'T12:00:00').getDay()));
  return (
    <>
      <PageHead title="Reports" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Reports' }]} actions={<><Dd>Last 8 months</Dd><button className="btn btn-grey"><IconPrinter size={16} />Print</button><button className="btn btn-primary"><IconDownload size={16} />Download</button></>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'sales', label: 'Sales' }, { id: 'jobs', label: 'Jobs and diary' }, { id: 'team', label: 'Team performance' }]} />
      <div className="grid-4">
        {[['Enquiries', '312', IconTrendingUp, '#0b6e5c', '+9% on last year'], ['Win rate', '62%', IconCircleCheck, '#1f9d5b', 'Quotes that became jobs'], ['Days from enquiry to fitting', '33', IconClock, '#e0a100', 'Average'], ['Jobs finished', '141', IconTool, '#0b6e5c', 'This year']].map(([l, v, I, c, s]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b><span className="tiny muted">{s}</span></div></div>
        ))}
      </div>
      {tab === 'sales' && (
        <div className="row">
          <Card className="grow"><CardHead title="Quoted and won by month" /><BarChart data={salesByMonth} height={260} /></Card>
          <Card className="w-360">
            <CardHead title="Where enquiries come from" />
            <div style={{ display: 'grid', placeItems: 'center' }}><Donut parts={enquirySources.map(s => ({ v: s.n, c: s.color }))} size={170} thickness={30} center="34" sub="This week" /></div>
            {enquirySources.map(s => <div key={s.name} className="between small"><span className="hstack" style={{ gap: 6 }}><i className="dot" style={{ background: s.color }} />{s.name}</span><b>{s.n} · {s.pct}%</b></div>)}
          </Card>
        </div>
      )}
      {tab === 'jobs' && (
        <div className="row">
          <Card className="grow"><CardHead title="Average days in each stage" /><HBars rows={[['Enquiry to survey', 6], ['Survey to quote', 4], ['Quote to order', 5], ['Order to delivery', 11], ['Delivery to fitting', 5], ['Fitting to sign-off', 2]].map(([l, v]: any) => ({ label: l, value: v, max: 12, right: `${v} days`, color: v > 8 ? '#e0a100' : '#00c7a1' }))} /></Card>
          <Card className="w-360"><CardHead title="Installer diary use" sub="Weekdays booked in October" /><HBars rows={installers.map(p => { const v = Math.round((wd.filter(d => events.some(ev => ev.kind !== 'leave' && crewOf(ev).includes(p.id) && onDay(ev, d))).length / wd.length) * 100); return { label: p.name, value: v, max: 100, right: `${v}% booked`, color: v > 40 ? '#0b6e5c' : '#00c7a1' }; })} /></Card>
        </div>
      )}
      {tab === 'team' && (
        <Card>
          <CardHead title="Salespeople this month" />
          <table className="tbl"><thead><tr><th>Name</th><th>Enquiries</th><th>Quotes sent</th><th>Won</th><th>Win rate</th><th>Value won</th></tr></thead>
            <tbody>{staff.filter(s => s.role === 'Salesperson').map((s, i) => <tr key={s.id}><td className="b">{s.name}</td><td>{[14, 12, 9][i]}</td><td>{[11, 9, 7][i]}</td><td>{[11, 6, 4][i]}</td><td>{['78%', '55%', '44%'][i]}</td><td className="b">{['£84,200', '£51,600', '£33,900'][i]}</td></tr>)}</tbody>
          </table>
        </Card>
      )}
    </>
  );
}
