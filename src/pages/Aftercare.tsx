// Snags (things to put right after fitting) and Aftercare (problems later, while in guarantee).
// Both work on the customer's record, so fixing one here moves the job on everywhere.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconAlertTriangle, IconClock, IconCircleCheck, IconCalendarPlus, IconTool, IconExternalLink, IconShieldCheck, IconArrowsSplit, IconPackage } from '@tabler/icons-react';
import { PageHead, Tag, Tile, Drawer, Modal, Field, useToast, Empty, Card, CardHead } from '../components/ui';
import { ActionModal, installOf, openSnags } from '../components/Journey';
import { useRows, products, Row } from '../components/derive';
import { RouteModal } from './Enquiries';
import { useStore, EnquiryX, addDays, fmtDate } from '../data/store';
import { IMG } from '../data/mock';

type SnagRow = { s: any; r?: Row };
const sTone = (s: string) => (s === 'Fixed' ? 'ok' : s === 'Open' ? 'err' : s === 'Waiting part' ? 'warn' : 'jade');

function useSnagRows(kind: 'Snag' | 'Aftercare'): SnagRow[] {
  const { snags } = useStore();
  const rows = useRows();
  return snags.filter(s => (s.kind || 'Snag') === kind).map(s => ({ s, r: rows.find(r => r.e.jobId === s.job) }));
}

function SnagTable({ list, onOpen, onAct, kind }: { list: SnagRow[]; onOpen: (id: string) => void; onAct: (k: string, e: EnquiryX) => void; kind: 'Snag' | 'Aftercare' }) {
  return (
    <div className="card flush">
      <table className="tbl">
        <thead><tr><th>{kind === 'Snag' ? 'Snag' : 'Request'}</th><th>Customer and job</th><th>Reported</th><th>Assigned to</th><th>Status</th><th>Next step</th></tr></thead>
        <tbody>
          {list.map(({ s, r }) => (
            <tr key={s.id} className="click" onClick={() => onOpen(s.id)}>
              <td><div className="hstack" style={{ gap: 10 }}><img src={IMG[s.photo as keyof typeof IMG]} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b>{s.title}</b><span className="tiny muted">{s.id} · {s.severity}</span></div></div></td>
              <td><b>{s.customer}</b><div className="tiny muted">{s.job}</div></td>
              <td className="t2">{s.reported}</td>
              <td className="t2">{s.owner}</td>
              <td><Tag tone={sTone(s.status)}>{s.status}</Tag></td>
              <td onClick={ev => ev.stopPropagation()}>
                {r && s.status !== 'Fixed' && (s.status === 'Visit booked'
                  ? <button className="btn btn-outline btn-xs" onClick={() => onAct('snagFixed', r.e)}><IconCircleCheck size={13} />{kind === 'Snag' ? 'Mark fixed' : 'Mark resolved'}</button>
                  : <button className="btn btn-primary btn-xs" onClick={() => onAct('returnVisit', r.e)}><IconCalendarPlus size={13} />{kind === 'Snag' ? 'Book return visit' : 'Arrange visit'}</button>)}
                {s.status === 'Fixed' && <span className="tiny muted">Done</span>}
              </td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={6}><Empty icon={<IconShieldCheck size={22} />} title="Nothing here" sub="All clear." /></td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SnagDrawer({ sr, onClose, onAct, kind }: { sr: SnagRow; onClose: () => void; onAct: (k: string, e: EnquiryX) => void; kind: 'Snag' | 'Aftercare' }) {
  const toast = useToast();
  const { set, updEnq } = useStore();
  const { s, r } = sr;
  const history = (r?.e.comms || []).filter(c => c.title.toLowerCase().includes(s.title.toLowerCase().slice(0, 12)) || c.title.includes('snag') || c.title.includes('Snag') || c.title.includes('visit') || c.title.includes('Aftercare'));
  const waiting = () => { set('snags', ss => ss.map(x => (x.id === s.id ? { ...x, status: 'Waiting part', tone: 'warn' } : x))); if (r) updEnq(r.e.id, {}, { kind: 'note', title: `Waiting for a part: ${s.title}`, who: 'Sarah Mitchell' }); toast('Marked as waiting for a part'); onClose(); };
  return (
    <Drawer title={s.title} sub={`${s.customer} · ${s.job} · ${s.id}`} onClose={onClose} width={600}
      footer={<>
        {r && <Link to={`/jobs/${s.job}`} className="btn btn-grey" style={{ marginRight: 'auto' }}><IconExternalLink size={16} />Open job</Link>}
        {r && ['Open', 'Waiting part'].includes(s.status) && <>{s.status === 'Open' && <button className="btn btn-outline" onClick={waiting}><IconPackage size={16} />Waiting for a part</button>}<button className="btn btn-primary" onClick={() => { onClose(); onAct('returnVisit', r.e); }}><IconCalendarPlus size={16} />{kind === 'Snag' ? 'Book return visit' : 'Arrange visit'}</button></>}
        {r && s.status === 'Visit booked' && <button className="btn btn-primary" onClick={() => { onClose(); onAct('snagFixed', r.e); }}><IconCircleCheck size={16} />{kind === 'Snag' ? 'Mark fixed' : 'Mark resolved'}</button>}
      </>}>
      <div className="hstack" style={{ gap: 8 }}><Tag tone={sTone(s.status)}>{s.status}</Tag><Tag tone="grey">{s.severity}</Tag></div>
      <div className="grid-2" style={{ rowGap: 12 }}>
        {[['Reported', s.reported], ['Assigned to', s.owner], ['Customer', s.customer], ['Products', r ? products(r.e) : '—']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 3 }}><span className="small muted">{l}</span><b style={{ fontSize: 13 }}>{v}</b></div>)}
      </div>
      <div className="vstack" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>Details</b><span className="small t2">{s.detail}</span></div>
      <div className="grid-3" style={{ gap: 8 }}>{[0, 1, 2].map(i => <div key={i} className="photo-ph" />)}</div>
      {history.length > 0 && <div className="vstack" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>History</b>{history.map(c => <div key={c.id} className="between small" style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}><span>{c.title}</span><span className="tiny muted">{c.when}</span></div>)}</div>}
    </Drawer>
  );
}

function PickJobModal({ title, onClose, onPick, filter }: { title: string; onClose: () => void; onPick: (e: EnquiryX) => void; filter: (r: Row) => boolean }) {
  const rows = useRows().filter(filter);
  const [id, setId] = useState(rows[0]?.e.id || '');
  return (
    <Modal title={title} sub="Choose the job it is about" onClose={onClose} width={520} footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!id} onClick={() => { const r = rows.find(x => x.e.id === id); if (r) onPick(r.e); }}>Next</button></>}>
      <Field label="Which job?"><select className="select" value={id} onChange={x => setId(x.target.value)}>{rows.map(r => <option key={r.e.id} value={r.e.id}>{r.e.jobId} · {r.e.name} · {r.e.product}</option>)}</select></Field>
    </Modal>
  );
}

export function Snags() {
  const list = useSnagRows('Snag');
  const [f, setF] = useState('Open');
  const [open, setOpen] = useState<string | null>(null);
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const [pick, setPick] = useState(false);
  const filters: [string, (s: any) => boolean][] = [['Open', s => s.status !== 'Fixed'], ['Waiting part', s => s.status === 'Waiting part'], ['Visit booked', s => s.status === 'Visit booked'], ['Fixed', s => s.status === 'Fixed'], ['All', () => true]];
  const fn = filters.find(x => x[0] === f)![1];
  const sel = list.find(x => x.s.id === open);
  return (
    <>
      <PageHead title="Snags" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Snags' }]} actions={<button className="btn btn-primary" onClick={() => setPick(true)}><IconPlus size={16} />Add snag</button>} />
      <div className="grid-4">
        {[['Open', list.filter(x => x.s.status === 'Open').length, IconAlertTriangle], ['Waiting for a part', list.filter(x => x.s.status === 'Waiting part').length, IconClock], ['Return visit booked', list.filter(x => x.s.status === 'Visit booked').length, IconCalendarPlus], ['Fixed', list.filter(x => x.s.status === 'Fixed').length, IconCircleCheck]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={l === 'Open' && v ? '#d64545' : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="hstack" style={{ gap: 6 }}>{filters.map(([n, t]) => <button key={n} className={`chip ${f === n ? 'on' : ''}`} onClick={() => setF(n)}>{n}<span className="n">{list.filter(x => t(x.s)).length}</span></button>)}</div>
      <SnagTable kind="Snag" list={list.filter(x => fn(x.s))} onOpen={setOpen} onAct={(k, e) => setAct({ k, e })} />
      {sel && <SnagDrawer kind="Snag" sr={sel} onClose={() => setOpen(null)} onAct={(k, e) => setAct({ k, e })} />}
      {pick && <PickJobModal title="Add a snag" filter={r => !!r.e.jobId && !!r.e.ops?.work} onClose={() => setPick(false)} onPick={e => { setPick(false); setAct({ k: 'snag', e }); }} />}
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
    </>
  );
}

export function Aftercare() {
  const list = useSnagRows('Aftercare');
  const rows = useRows();
  const { events, enquiries, snags } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [act, setAct] = useState<{ k: string; e: EnquiryX } | null>(null);
  const [pick, setPick] = useState(false);
  const [route, setRoute] = useState<string | null>(null);
  const inGuarantee = rows.filter(r => r.e.ops?.closed);
  const incoming = enquiries.filter(e => e.type === 'Aftercare' && !e.routedTo);
  const sel = list.find(x => x.s.id === open);
  return (
    <>
      <PageHead title="Aftercare" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Aftercare' }]} actions={<button className="btn btn-primary" onClick={() => setPick(true)}><IconPlus size={16} />Log aftercare request</button>} />
      <div className="grid-4">
        {[['New messages to sort', incoming.length, IconArrowsSplit], ['Open requests', list.filter(x => x.s.status !== 'Fixed').length, IconAlertTriangle], ['Visits booked', list.filter(x => x.s.status === 'Visit booked').length, IconCalendarPlus], ['Customers in guarantee', inGuarantee.length, IconShieldCheck]].map(([l, v, I]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={(l === 'New messages to sort' || l === 'Open requests') && v ? '#e0a100' : '#0b6e5c'} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      {incoming.length > 0 && (
        <Card>
          <CardHead title="New aftercare messages" sub="Link each one to the customer's job so it becomes a request" />
          {incoming.map(e => (
            <div key={e.id} className="hstack" style={{ gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <img src={IMG[e.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{e.name} · {e.product}</b><span className="tiny muted">{e.comms?.[0]?.body || e.received}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => setRoute(e.id)}><IconArrowsSplit size={14} />Link to their job</button>
            </div>
          ))}
        </Card>
      )}
      <b style={{ fontSize: 14 }}>Aftercare requests</b>
      <SnagTable kind="Aftercare" list={list} onOpen={setOpen} onAct={(k, e) => setAct({ k, e })} />
      <b style={{ fontSize: 14 }}>Customers in guarantee</b>
      <div className="card flush">
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Products</th><th>Fitted</th><th>Guarantee until</th><th>Open requests</th><th></th></tr></thead>
          <tbody>{inGuarantee.map(r => { const fit = installOf(r.e, events); const n = openSnags(r.e, snags as any, 'Aftercare').length; return (
            <tr key={r.e.id}>
              <td><Link to={`/jobs/${r.e.jobId}`} className="b">{r.e.name}</Link><div className="tiny muted">{r.e.jobId}</div></td>
              <td className="t2">{products(r.e)}</td>
              <td className="t2">{fit ? fmtDate(fit.date) : '—'}</td>
              <td className="t2">{fit ? fmtDate(addDays(fit.date, 3652), { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
              <td>{n ? <Tag tone="warn">{n} open</Tag> : <Tag tone="ok">None</Tag>}</td>
              <td><button className="btn btn-outline btn-xs" onClick={() => setAct({ k: 'aftercare', e: r.e })}><IconTool size={13} />Log request</button></td>
            </tr>
          ); })}</tbody>
        </table>
      </div>
      {sel && <SnagDrawer kind="Aftercare" sr={sel} onClose={() => setOpen(null)} onAct={(k, e) => setAct({ k, e })} />}
      {pick && <PickJobModal title="Log an aftercare request" filter={r => !!r.e.ops?.closed} onClose={() => setPick(false)} onPick={e => { setPick(false); setAct({ k: 'aftercare', e }); }} />}
      {route && <RouteModal id={route} onClose={() => setRoute(null)} />}
      {act && <ActionModal k={act.k} e={act.e} onClose={() => setAct(null)} />}
    </>
  );
}
