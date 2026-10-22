// Jobs: every won customer, from the office checks after Won to aftercare.
// The columns follow the same journey as the Enquiries board, so a job is never in two places.
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconSearch, IconChevronRight, IconBriefcase, IconUserCheck, IconCalendarEvent, IconCurrencyPound } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Tile, Empty } from '../components/ui';
import { roleTone, needsOffice, ActionModal, installOf, PHASES } from '../components/Journey';
import { useRows, phaseLabel, isJob, totalsOf, products, Row } from '../components/derive';
import { gbp, teamById } from '../data/mock';
import { useStore, fmtDate, TODAY, addDays } from '../data/store';

export const JOB_PHASES = ['won', 'order', 'ready', 'install', 'review', 'pay', 'after'];
export const jobPath = (r: { e: { jobId?: string; id: string } }) => `/jobs/${r.e.jobId || r.e.id}`;

export function StageBar({ phase }: { phase: string }) {
  const i = JOB_PHASES.indexOf(phase);
  return (
    <div className="hstack" style={{ gap: 3 }} title={phaseLabel(phase)}>
      {JOB_PHASES.map((p, j) => <span key={p} style={{ width: 14, height: 6, borderRadius: 3, background: j < i ? '#00c7a1' : j === i ? '#0b6e5c' : '#e3e9e7' }} />)}
    </div>
  );
}

export function Jobs() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { events } = useStore();
  const rows = useRows().filter(r => isJob(r.e));
  const [f, setF] = useState(sp.get('phase') || 'all');
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  const [act, setAct] = useState<{ k: string; r: Row } | null>(null);
  const list = rows.filter(r => (f === 'all' || r.st.phase === f) && (!mine || needsOffice(r.st)) && (r.e.name + (r.e.jobId || '') + r.e.postcode + r.e.address).toLowerCase().includes(q.toLowerCase()));
  const weekEnd = addDays(TODAY, 7);
  const fitting = rows.filter(r => { const fit = installOf(r.e, events); return fit && fit.date >= TODAY && fit.date <= weekEnd; });
  return (
    <>
      <PageHead title="Jobs" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Jobs' }]} />
      <div className="grid-4">
        {[['Jobs in progress', String(rows.filter(r => r.st.phase !== 'after').length), IconBriefcase, 'From Won to final payment'], ['Your turn', String(rows.filter(r => needsOffice(r.st)).length), IconUserCheck, 'Jobs waiting for the office'], ['Fitting in the next 7 days', String(fitting.length), IconCalendarEvent, fitting.map(r => r.e.name.split(' ').pop()).join(', ') || 'None booked'], ['Value in progress', gbp(rows.filter(r => r.st.phase !== 'after').reduce((a, r) => a + totalsOf(r.e).total, 0)), IconCurrencyPound, 'Including VAT']].map(([l, v, I, s]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}><Tile icon={<I size={22} />} color="#0b6e5c" size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b><span className="tiny muted">{s}</span></div></div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="input-icon" style={{ width: 280 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search customer, job or postcode" value={q} onChange={e => setQ(e.target.value)} /></div>
          <button className={`chip ${mine ? 'on' : ''}`} onClick={() => setMine(!mine)}><IconUserCheck size={14} />Only my turn</button>
          {['all', ...JOB_PHASES].map(p => <button key={p} className={`chip ${f === p ? 'on' : ''}`} onClick={() => setF(p)}>{p === 'all' ? 'All' : PHASES.find(x => x.id === p)?.label}<span className="n">{rows.filter(r => p === 'all' || r.st.phase === p).length}</span></button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Job</th><th>Customer</th><th>Products</th><th>Value · paid</th><th>Where it is</th><th>Next step</th><th>Installation</th><th></th></tr></thead>
          <tbody>
            {list.map(r => {
              const { e, st } = r;
              const t = totalsOf(e); const o = e.ops || {};
              const paid = o.paid ? t.total : (o.deposit ? t.deposit : 0) + ((o.work || o.stagePaid) ? (t.stage || 0) : 0);
              const fit = installOf(e, events);
              return (
                <tr key={e.id} className="click" onClick={() => nav(jobPath(r))}>
                  <td><b>{e.jobId || 'Not ordered yet'}</b><div className="tiny muted">Won {e.wonOn}</div></td>
                  <td><div className="hstack" style={{ gap: 10 }}><Avatar i={e.initials} size={30} /><div className="vstack" style={{ gap: 2 }}><b>{e.name}</b><span className="tiny muted">{e.address.split(', ').pop()} · {e.postcode}</span></div></div></td>
                  <td className="t2" style={{ maxWidth: 220 }}>{products(e)}</td>
                  <td><b>{gbp(t.total)}</b><div className="tiny muted">{gbp(paid)} paid</div></td>
                  <td><div className="vstack" style={{ gap: 5 }}><Tag tone="jade">{phaseLabel(st.phase)}</Tag><StageBar phase={st.phase} /></div></td>
                  <td onClick={ev => ev.stopPropagation()}>
                    <div className="vstack" style={{ gap: 4 }}>
                      <span className="hstack" style={{ gap: 6 }}><Tag tone={roleTone[st.role]}>{needsOffice(st) ? 'Your turn' : st.role}</Tag><span className="small">{st.label}</span></span>
                      {needsOffice(st) ? <button className="btn btn-primary btn-xs" style={{ alignSelf: 'flex-start' }} onClick={() => setAct({ k: st.key, r })}>{st.icon}{st.label}</button> : <span className="tiny muted">{st.status}</span>}
                    </div>
                  </td>
                  <td className="t2">{fit ? <><b style={{ color: 'var(--text)' }}>{fmtDate(fit.date)}</b><div className="tiny muted">{teamById(fit.team)?.name} · {fit.days} day{fit.days > 1 ? 's' : ''}</div></> : 'Not booked'}</td>
                  <td><IconChevronRight size={16} color="#6b7a78" /></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={8}><Empty icon={<IconBriefcase size={22} />} title="No jobs here" sub="Jobs appear here as soon as an enquiry is marked Won." /></td></tr>}
          </tbody>
        </table>
      </div>
      {act && <ActionModal k={act.k} e={act.r.e} onClose={() => setAct(null)} />}
    </>
  );
}
