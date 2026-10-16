import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { IconSearch, IconPlus, IconChevronRight, IconAlertTriangle, IconLayoutGrid, IconListDetails, IconUser } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Seg } from '../components/ui';
import { NewEnquiryModal } from '../components/Forms';
import { JOB_STAGES, IMG, gbp, teamById, staffById } from '../data/mock';

export const jobTone: Record<string, string> = { Survey: 'info', Quote: 'info', Ordered: 'jade', Delivery: 'warn', Installation: 'jade', Snag: 'err', Complete: 'ok', Aftercare: 'grey' };

export function StageBar({ stage }: { stage: string }) {
  const i = JOB_STAGES.indexOf(stage as any);
  return (
    <div className="hstack" style={{ gap: 3 }}>
      {JOB_STAGES.slice(0, 7).map((s, j) => <span key={s} title={s} style={{ width: 16, height: 6, borderRadius: 3, background: j < i ? '#00c7a1' : j === i ? (stage === 'Snag' ? '#d64545' : '#0b6e5c') : '#e3e9e7' }} />)}
    </div>
  );
}

export function Jobs() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { jobs, attention } = useStore();
  const [f, setF] = useState(sp.get('filter') || 'All');
  const [q, setQ] = useState('');
  const [view, setView] = useState('list');
  const [modal, setModal] = useState(false);
  const filters = ['All', 'Late', 'Blocked', 'Not booked', 'No next step', ...JOB_STAGES.slice(0, 7)];
  const special: Record<string, any[]> = { Late: attention.late, Blocked: attention.blocked, 'Not booked': attention.notBooked, 'No next step': attention.noNext };
  const matchF = (j: any, x: string) => x === 'All' || (special[x] ? special[x].some(k => k.id === j.id) : j.stage === x);
  const match = (j: any) => matchF(j, f);
  const rows = jobs.filter(j => match(j) && (j.customer + j.id + j.postcode + j.products).toLowerCase().includes(q.toLowerCase()));
  const n = (x: string) => jobs.filter(j => matchF(j, x)).length;
  return (
    <>
      <PageHead title="Jobs" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Jobs' }]}
        actions={<><Seg value={view} onChange={setView} items={[{ id: 'list', label: 'List', icon: <IconListDetails size={15} /> }, { id: 'cards', label: 'Cards', icon: <IconLayoutGrid size={15} /> }]} /><button className="btn btn-primary" onClick={() => setModal(true)}><IconPlus size={16} />New enquiry</button></>} />
      <div className="hstack" style={{ flexWrap: 'wrap', gap: 6 }}>
        <div className="input-icon" style={{ width: 280, marginRight: 6 }}><IconSearch size={16} /><input className="input" style={{ height: 34 }} placeholder="Search job, customer or postcode" value={q} onChange={e => setQ(e.target.value)} /></div>
        {filters.map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{['Late', 'Blocked'].includes(s) && n(s) > 0 && <IconAlertTriangle size={13} color={f === s ? '#fff' : '#d64545'} />}{s}<span className="n">{n(s)}</span></button>)}
      </div>
      {view === 'list' ? (
        <div className="card flush">
          <table className="tbl">
            <thead><tr><th>Job</th><th>Products</th><th>Stage</th><th>Next action</th><th>Owner</th><th>Due</th><th>Team</th><th>Value</th><th></th></tr></thead>
            <tbody>
              {rows.map(j => (
                <tr key={j.id} className="click" onClick={() => nav(`/jobs/${j.id}`)}>
                  <td><div className="hstack" style={{ gap: 10 }}><img src={IMG[j.photo]} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b>{j.customer}</b><span className="tiny muted">{j.id} · {j.postcode}</span></div></div></td>
                  <td className="t2">{j.products}</td>
                  <td><div className="vstack" style={{ gap: 6 }}><Tag tone={jobTone[j.stage]}>{j.stage}</Tag><StageBar stage={j.stage} /></div></td>
                  <td><div className="vstack" style={{ gap: 2 }}><span>{j.next}</span>{j.blocked && <span className="tiny hstack" style={{ color: 'var(--err)', gap: 4 }}><IconAlertTriangle size={12} />{j.blocked}</span>}</div></td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="hstack" style={{ gap: 6 }}><IconUser size={14} color="#6b7a78" />{j.owner}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}><b style={{ color: j.overdue ? 'var(--err)' : j.due === 'Today' ? 'var(--warn)' : 'var(--text)' }}>{j.due}</b></td>
                  <td>{j.team ? <span className="tag grey">{teamById(j.team)!.name}</span> : <span className="tiny muted">Not booked</span>}</td>
                  <td className="b">{gbp(j.value)}</td>
                  <td><IconChevronRight size={16} color="#6b7a78" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pager"><span>{rows.length} jobs · every job shows its owner, next action and due date</span></div>
        </div>
      ) : (
        <div className="grid-3">
          {rows.map(j => (
            <div key={j.id} className="card flush" style={{ cursor: 'pointer' }} onClick={() => nav(`/jobs/${j.id}`)}>
              <div style={{ position: 'relative', height: 140 }}>
                <img src={IMG[j.photo]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: 10, left: 10 }}><Tag tone={`solid-${jobTone[j.stage] === 'err' ? 'err' : jobTone[j.stage] === 'warn' ? 'warn' : 'ok'}`}>{j.stage}</Tag></span>
              </div>
              <div className="vstack" style={{ padding: 16, gap: 10 }}>
                <div className="between"><b style={{ fontSize: 15 }}>{j.customer}</b><b>{gbp(j.value)}</b></div>
                <span className="small muted">{j.id} · {j.products}</span>
                <StageBar stage={j.stage} />
                <div className="between small" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}><span>{j.next}</span><b style={{ color: j.overdue ? 'var(--err)' : 'var(--text)' }}>{j.due}</b></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <NewEnquiryModal onClose={() => setModal(false)} />}
    </>
  );
}
