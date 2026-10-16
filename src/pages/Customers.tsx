import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { IconSearch, IconPlus, IconPhone, IconMail, IconHome, IconChevronRight, IconWorld, IconFileText, IconDownload, IconPhoneCall, IconMessage, IconEdit, IconMapPin } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Avatar, Tabs, useToast } from '../components/ui';
import { NewEnquiryModal, LogCallModal } from '../components/Forms';
import { jobs, enquiries, gbp, IMG, staffById } from '../data/mock';

const customers = [
  ...jobs.map(j => ({ id: j.id.replace('JG', 'C'), name: j.customer, initials: j.initials, address: j.address, postcode: j.postcode, phone: j.phone, email: j.email, jobs: 1, value: j.value, status: j.stage === 'Complete' ? 'Past customer' : 'Active job', tone: j.stage === 'Complete' ? 'grey' : 'ok', portal: j.portal, photo: j.photo, jobId: j.id, sales: j.sales })),
  ...enquiries.filter(e => !['Won'].includes(e.stage)).slice(0, 5).map(e => ({ id: e.id.replace('EN', 'C'), name: e.name, initials: e.initials, address: e.address, postcode: e.postcode, phone: e.phone, email: e.email, jobs: 0, value: e.value, status: e.stage === 'Lost' ? 'Lost' : 'Enquiry', tone: e.stage === 'Lost' ? 'err' : 'info', portal: 'Not invited', photo: e.photo, jobId: '', sales: e.assigned })),
];

export function Customers() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [modal, setModal] = useState(false);
  const rows = customers.filter(c => (f === 'All' || c.status === f) && (c.name + c.postcode + c.address).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="Customers" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Customers' }]} actions={<><button className="btn btn-grey"><IconDownload size={16} />Export</button><button className="btn btn-primary" onClick={() => setModal(true)}><IconPlus size={16} />Add customer</button></>} />
      <div className="card flush">
        <div className="toolbar">
          <div className="input-icon" style={{ width: 320 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search by name, postcode or address" value={q} onChange={e => setQ(e.target.value)} /></div>
          {['All', 'Active job', 'Enquiry', 'Past customer', 'Lost'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Property</th><th>Contact</th><th>Jobs</th><th>Value</th><th>Salesperson</th><th>Portal</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} className="click" onClick={() => nav(`/customers/${c.id}`)}>
                <td><div className="hstack" style={{ gap: 10 }}><Avatar i={c.initials} size={34} /><div className="vstack" style={{ gap: 2 }}><b>{c.name}</b><span className="tiny muted">{c.id}</span></div></div></td>
                <td><div className="hstack" style={{ gap: 8 }}><img src={IMG[c.photo]} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><span>{c.address}</span><span className="tiny muted">{c.postcode}</span></div></div></td>
                <td><div className="vstack" style={{ gap: 2 }}><span>{c.phone}</span><span className="tiny muted">{c.email}</span></div></td>
                <td>{c.jobs}</td><td className="b">{gbp(c.value)}</td><td className="t2">{staffById(c.sales)?.name || '—'}</td>
                <td><Tag tone={c.portal === 'Active' ? 'ok' : c.portal === 'Invited' ? 'info' : 'grey'}>{c.portal}</Tag></td>
                <td><Tag tone={c.tone}>{c.status}</Tag></td>
                <td><IconChevronRight size={16} color="#6b7a78" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pager"><span>{rows.length} customers</span><span className="hstack"><button className="btn btn-outline btn-xs">Previous</button><button className="btn btn-outline btn-xs">Next</button></span></div>
      </div>
      {modal && <NewEnquiryModal onClose={() => setModal(false)} />}
    </>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const toast = useToast();
  const c = customers.find(x => x.id === id) || customers[0];
  const job = jobs.find(j => j.id === c.jobId);
  const [tab, setTab] = useState('overview');
  const [call, setCall] = useState(false);
  return (
    <>
      <PageHead title={c.name} crumbs={[{ label: 'Customers', to: '/customers' }, { label: c.name }]}
        actions={<><button className="btn btn-grey" onClick={() => setCall(true)}><IconPhoneCall size={16} />Log a call</button><button className="btn btn-outline"><IconMail size={16} />Email</button><button className="btn btn-primary"><IconEdit size={16} />Edit details</button></>} />
      <div className="photo-hero" style={{ minHeight: 170 }}>
        <img src={IMG[c.photo]} alt="" />
        <div className="inner hstack" style={{ gap: 18, height: '100%' }}>
          <span className="avatar" style={{ width: 72, height: 72, fontSize: 24, background: '#00c7a1', color: '#0b1f1b', borderRadius: 16 }}>{c.initials}</span>
          <div className="vstack" style={{ gap: 6 }}>
            <div className="hstack"><h2 style={{ fontSize: 24 }}>{c.name}</h2><Tag tone="solid-ok">{c.status}</Tag></div>
            <span className="hstack" style={{ gap: 16, color: '#d3e3de', flexWrap: 'wrap' }}><span className="hstack" style={{ gap: 5 }}><IconMapPin size={15} />{c.address}, {c.postcode}</span><span className="hstack" style={{ gap: 5 }}><IconPhone size={15} />{c.phone}</span><span className="hstack" style={{ gap: 5 }}><IconMail size={15} />{c.email}</span></span>
          </div>
          <div className="ml-auto hstack" style={{ gap: 12 }}>
            {[['Jobs', String(c.jobs)], ['Total value', gbp(c.value)], ['Portal', c.portal]].map(([l, v]) => <div key={l} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '10px 16px', minWidth: 110 }}><div className="tiny" style={{ color: '#cfe0db' }}>{l}</div><b style={{ fontSize: 17 }}>{v}</b></div>)}
          </div>
        </div>
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'overview', label: 'Overview' }, { id: 'jobs', label: 'Jobs', n: c.jobs }, { id: 'comms', label: 'Communication' }, { id: 'docs', label: 'Documents' }]} />
      <div className="row">
        <div className="col grow">
          <Card>
            <CardHead title="Jobs and enquiries" />
            {job ? (
              <Link to={`/jobs/${job.id}`} className="hstack card" style={{ flexDirection: 'row', padding: 12, gap: 14 }}>
                <img src={IMG[job.photo]} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }} />
                <div className="vstack" style={{ gap: 4, flex: 1 }}><b>{job.id} · {job.products}</b><span className="small muted">Next: {job.next} · {job.due}</span></div>
                <Tag tone="jade">{job.stage}</Tag><b>{gbp(job.value)}</b><IconChevronRight size={16} />
              </Link>
            ) : <div className="small muted">No job yet — this customer is at the enquiry stage.</div>}
          </Card>
          <Card>
            <CardHead title="Communication history" sub="Emails, portal messages, calls and notes in one place" right={<button className="link">View all</button>} />
            <div className="timeline">
              {[[IconMessage, 'Portal message', 'Thanks! Will the fitters need the driveway clear?', 'Today 10:42', '#00c7a1'], [IconMail, 'Email sent · Outlook', 'Your delivery date is confirmed for Tuesday 20 October', 'Yesterday 14:10', '#2f6fde'], [IconPhone, 'Call logged', 'Asked about parking for the van — driveway is fine', 'Mon 12 Oct', '#e0a100'], [IconFileText, 'Quote signed', 'Quote FP-55109 signed online in the portal', '30 Sep', '#1f9d5b']].map(([I, t, s, w, col]: any) => (
                <div key={t} className="tl-item"><span className="tile" style={{ width: 30, height: 30, borderRadius: 15, background: col + '1f', color: col }}><I size={15} /></span><div className="vstack" style={{ gap: 2, flex: 1 }}><div className="between"><b style={{ fontSize: 13 }}>{t}</b><span className="tiny muted">{w}</span></div><span className="small t2">{s}</span></div></div>
              ))}
            </div>
          </Card>
        </div>
        <div className="col w-360">
          <Card>
            <CardHead title="Contact details" />
            {[['Main contact', c.name], ['Mobile', c.phone], ['Email', c.email], ['Best way to contact', 'Phone, evenings'], ['Marketing emails', 'No']].map(([l, v]) => <div key={l} className="between small"><span className="muted">{l}</span><b>{v}</b></div>)}
          </Card>
          <Card>
            <CardHead title="Properties" right={<button className="link"><IconPlus size={13} />Add</button>} />
            <div className="hstack" style={{ gap: 12 }}><img src={IMG[c.photo]} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 3 }}><b>{c.address}</b><span className="small muted">{c.postcode} · Semi-detached · 1930s</span></div></div>
          </Card>
          <Card>
            <CardHead title="Customer portal" />
            <div className="hstack" style={{ gap: 10 }}><IconWorld size={18} color="#0b6e5c" /><span className="small">Status: <b>{c.portal}</b></span></div>
            <button className="btn btn-outline btn-sm" onClick={() => toast('Portal invite sent by email')}>{c.portal === 'Not invited' ? 'Send portal invite' : 'Resend invite'}</button>
          </Card>
        </div>
      </div>
      {call && <LogCallModal who={c.name} onClose={() => setCall(false)} />}
    </>
  );
}
