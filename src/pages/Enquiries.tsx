import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  IconPlus, IconSearch, IconDownload, IconPhone, IconMail, IconUserPlus, IconChevronRight, IconNotes, IconChecklist, IconPaperclip,
  IconCalendarEvent, IconPhoneCall, IconCircleCheck, IconUser, IconWorld, IconInbox, IconAlertTriangle, IconFileText, IconHome, IconArrowsSplit, IconTrophy, IconX,
} from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Avatar, Tabs, Tile, useToast, Modal, Field } from '../components/ui';
import { NewEnquiryModal, LogCallModal, AssignModal, AddTaskModal } from '../components/Forms';
import { staffById, STAGES, IMG, gbp } from '../data/mock';
import { useStore, TODAY, fmtDate } from '../data/store';

export const stageTone: Record<string, string> = { 'New Enquiry': 'info', Contacted: 'jade', Appointment: 'jade', Survey: 'warn', 'Quote Sent': 'info', 'Follow-up': 'warn', Won: 'ok', Lost: 'err' };
const typeTone: Record<string, string> = { Sales: 'jade', 'Existing job': 'info', Aftercare: 'warn' };

export function RouteModal({ id, onClose }: { id: string; onClose: () => void }) {
  const toast = useToast();
  const { enquiries, jobs, set, log } = useStore();
  const e = enquiries.find(x => x.id === id)!;
  const [to, setTo] = useState<'Existing job' | 'Aftercare'>(e.type === 'Sales' ? 'Aftercare' : (e.type as any));
  // The customer's own jobs (matched by name, postcode or address) come first; everything else is a fallback.
  const theirs = jobs.filter(j => j.customer === e.name || j.postcode === e.postcode || j.address === e.address);
  const others = jobs.filter(j => !theirs.includes(j));
  const [job, setJob] = useState((theirs[0] || jobs[0]).id);
  return (
    <Modal title="Send to the right person" sub={`${e.name} · this is not a new sale`} onClose={onClose} width={560}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { set('enquiries', es => es.map(x => (x.id === id ? { ...x, type: to, routedTo: job, next: `Sent to ${to === 'Aftercare' ? 'aftercare' : 'job owner'}`, nextDue: 'Done' } : x))); log(job, `${to === 'Aftercare' ? 'Aftercare request' : 'Customer question'} from ${e.name} added to this job`); toast(`Sent to ${to === 'Aftercare' ? 'aftercare' : 'the job owner'} · saved on ${job}`); onClose(); }}>Send</button></>}>
      <Field label="What is it about?"><div className="hstack" style={{ gap: 8 }}>{(['Existing job', 'Aftercare'] as const).map(k => <button key={k} className={`chip ${to === k ? 'on' : ''}`} onClick={() => setTo(k)}>{k === 'Existing job' ? 'A current job' : 'Aftercare problem'}</button>)}</div></Field>
      <Field label={`Which of ${e.name}’s jobs is this about?`} hint={theirs.length ? `We found ${theirs.length === 1 ? '1 job' : `${theirs.length} jobs`} for ${e.name} at ${e.address}.` : `No jobs found for ${e.name} — pick the right one from all jobs.`}>
        <select className="select" value={job} onChange={x => setJob(x.target.value)}>
          {theirs.length > 0 && <optgroup label={`${e.name}’s jobs`}>{theirs.map(j => <option key={j.id} value={j.id}>{j.id} · {j.products} · {j.stage === 'Complete' ? 'Fitted, in guarantee' : j.stage}</option>)}</optgroup>}
          <optgroup label={theirs.length ? 'Other customers’ jobs' : 'All jobs'}>{others.map(j => <option key={j.id} value={j.id}>{j.id} · {j.customer} · {j.address}</option>)}</optgroup>
        </select>
      </Field>
      <div className="alert info small"><IconArrowsSplit size={16} />The message stays on the customer’s record. It does not go to Sales.</div>
    </Modal>
  );
}

export function Enquiries() {
  const nav = useNavigate();
  const { enquiries } = useStore();
  const [stage, setStage] = useState('All');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [assign, setAssign] = useState<string | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const match = (e: any, s: string) => s === 'All' || (s === 'Unassigned' ? !e.assigned && e.type === 'Sales' && !['Won', 'Lost'].includes(e.stage) : s === 'Not sales' ? e.type !== 'Sales' : e.stage === s && e.type === 'Sales');
  const rows = useMemo(() => enquiries.filter(e => match(e, stage) && (e.name + e.postcode + e.id + e.product).toLowerCase().includes(q.toLowerCase())), [stage, q, enquiries]);
  const count = (s: string) => enquiries.filter(e => match(e, s)).length;
  const overdue = enquiries.filter(e => e.nextDue === 'Overdue').length;
  return (
    <>
      <PageHead title="Enquiries" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Enquiries' }]}
        actions={<><button className="btn btn-grey"><IconDownload size={16} />Export</button><button className="btn btn-primary" onClick={() => setModal('new')}><IconPlus size={16} />New enquiry</button></>} />
      <div className="alert info small"><IconInbox size={16} />Every customer query lands here first. New sales go to a salesperson. Questions about a current job or aftercare go to the right person.</div>
      <div className="grid-4">
        {[['New, not yet handled', String(count('New Enquiry') + count('Not sales')), IconInbox, '#2f6fde', 'Read and route each one'], ['Not yet assigned', String(count('Unassigned')), IconUserPlus, '#e0a100', 'Choose a salesperson'], ['Follow-ups overdue', String(overdue), IconAlertTriangle, '#d64545', overdue ? 'Chase them up' : 'All on time'], ['Won this month', '£22,000', IconTrophy, '#1f9d5b', '2 enquiries became jobs']].map(([l, v, I, c, s]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
            <Tile icon={<I size={22} />} color={c} size={48} />
            <div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b><span className="tiny muted">{s}</span></div>
          </div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar">
          <div className="input-icon" style={{ width: 280 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search name, postcode or reference" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="hstack" style={{ flexWrap: 'wrap', gap: 6 }}>
            {['All', 'Unassigned', 'Not sales', 'New Enquiry', 'Contacted', 'Appointment', 'Survey', 'Quote Sent', 'Follow-up', 'Won', 'Lost'].map(s => (
              <button key={s} className={`chip ${stage === s ? 'on' : ''}`} onClick={() => setStage(s)}>{s}<span className="n">{count(s)}</span></button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>About</th><th>Source</th><th>Received</th><th>Salesperson</th><th>Stage</th><th>Next step</th><th></th></tr></thead>
            <tbody>
              {rows.map(e => {
                const s = staffById(e.assigned);
                return (
                  <tr key={e.id} className="click" onClick={() => nav(`/enquiries/${e.id}`)}>
                    <td><div className="hstack" style={{ gap: 10 }}><Avatar i={e.initials} size={34} /><div className="vstack" style={{ gap: 2 }}><b>{e.name}</b><span className="tiny muted">{e.id} · {e.postcode}</span></div>{e.hot && e.stage === 'New Enquiry' && <Tag tone="err">New</Tag>}</div></td>
                    <td><div className="hstack" style={{ gap: 8 }}><img src={IMG[e.photo]} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 3 }}><span>{e.product}</span>{e.type !== 'Sales' && <Tag tone={typeTone[e.type]}>{e.type}</Tag>}</div></div></td>
                    <td className="t2">{e.source}</td>
                    <td className="t2" style={{ whiteSpace: 'nowrap' }}>{e.received}</td>
                    <td onClick={ev => ev.stopPropagation()}>
                      {e.type !== 'Sales' ? (e.routedTo ? <span className="small t2">Sent to {e.type === 'Aftercare' ? 'aftercare' : 'job owner'}</span> : <button className="btn btn-dark btn-xs" onClick={() => setRoute(e.id)}><IconArrowsSplit size={14} />Route it</button>)
                        : s ? <span className="hstack" style={{ gap: 8, whiteSpace: 'nowrap' }}><Avatar i={s.initials} size={26} />{s.name}</span> : <button className="btn btn-outline btn-xs" onClick={() => setAssign(e.id)}><IconUserPlus size={14} />Assign</button>}
                    </td>
                    <td><Tag tone={stageTone[e.stage]}>{e.stage}</Tag></td>
                    <td><div className="vstack" style={{ gap: 2 }}><span>{e.next}</span><span className="tiny" style={{ color: e.nextDue === 'Overdue' ? 'var(--err)' : 'var(--muted)', fontWeight: e.nextDue === 'Overdue' ? 600 : 400 }}>{e.nextDue}</span></div></td>
                    <td><IconChevronRight size={16} color="#6b7a78" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pager"><span>Showing {rows.length} of {enquiries.length} enquiries</span><span className="hstack"><button className="btn btn-outline btn-xs">Previous</button><button className="btn btn-outline btn-xs">Next</button></span></div>
      </div>
      {modal === 'new' && <NewEnquiryModal onClose={() => setModal(null)} />}
      {assign && <AssignModal enquiryId={assign} onClose={() => setAssign(null)} />}
      {route && <RouteModal id={route} onClose={() => setRoute(null)} />}
    </>
  );
}
