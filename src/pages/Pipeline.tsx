// Sales pipeline: the sales part of the journey only (New enquiry → Won or Lost).
// The office uses it to watch each salesperson's deals; a salesperson sees only their own.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconLayoutKanban, IconListDetails, IconAlertTriangle, IconInfoCircle, IconEye, IconBellRinging, IconUserShare } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Seg, useToast } from '../components/ui';
import { NewEnquiryModal, AssignModal } from '../components/Forms';
import { STAGES, staffById, salespeople, gbp } from '../data/mock';
import { useStore } from '../data/store';
import { stepFor, JourneyCard, ActionModal, roleTone, remindText } from '../components/Journey';
import { stageTone } from './Enquiries';

const colColor: Record<string, string> = { 'New Enquiry': '#0b6e5c', Qualification: '#0b6e5c', Appointment: '#00c7a1', 'Quote Preparation': '#e0a100', 'Quote Sent': '#0b6e5c', 'Follow-up': '#e0a100', Won: '#1f9d5b', Lost: '#d64545' };
const colLabel: Record<string, string> = { 'New Enquiry': 'New enquiry', 'Quote Preparation': 'Quote preparation', 'Quote Sent': 'Quote sent' };

export default function Pipeline() {
  const nav = useNavigate();
  const toast = useToast();
  const { enquiries, events, snags, set, updEnq } = useStore();
  const ctx = { events, snags: snags as any };
  const [role, setRole] = useState('office');
  const [who, setWho] = useState('all');
  const [view, setView] = useState('board');
  const [modal, setModal] = useState(false);
  const [assign, setAssign] = useState<string | null>(null);
  const [act, setAct] = useState<{ id: string; k: string } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const sales = role === 'office' ? null : role;
  const list = enquiries.filter(e => e.type === 'Sales' && (sales ? e.assigned === sales : who === 'all' || e.assigned === who));
  const open = list.filter(e => !['Won', 'Lost'].includes(e.stage));
  const stale = open.filter(e => e.stageDays >= 5 || e.nextDue === 'Overdue');
  const remind = (e: any) => { const st = stepFor(e, ctx); const r = remindText(e, st, events); updEnq(e.id, {}, { kind: 'reminder', title: `Reminder sent to ${r.who}`, body: r.body, who: 'Sarah Mitchell' }); toast(`Reminder sent to ${r.who} about ${e.name}`); };
  const drop = (id: string, st: string) => {
    const e = enquiries.find(x => x.id === id)!;
    if (st === e.stage) return;
    if (st === 'Won' || st === 'Lost') { setAct({ id, k: st === 'Won' ? 'won' : 'lost' }); return; }
    set('enquiries', xs => xs.map(x => (x.id === id ? { ...x, stage: st as any, stageDays: 0 } : x))); toast(`Moved to ${colLabel[st] || st}`);
  };
  const actE = act && enquiries.find(x => x.id === act.id);
  return (
    <>
      <PageHead title="Sales pipeline" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Sales pipeline' }]}
        actions={<><Seg value={view} onChange={setView} items={[{ id: 'board', label: 'Board', icon: <IconLayoutKanban size={15} /> }, { id: 'list', label: 'List', icon: <IconListDetails size={15} /> }]} /><button className="btn btn-primary" onClick={() => setModal(true)}><IconPlus size={16} />New enquiry</button></>} />
      <div className="hstack" style={{ gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, flexWrap: 'wrap' }}>
        <IconEye size={17} color="#0b6e5c" /><span className="small t2">Viewing as</span>
        <select className="select" style={{ height: 34, width: 260 }} value={role} onChange={x => setRole(x.target.value)}>
          <option value="office">Office admin — sees every deal</option>
          {salespeople.map(s => <option key={s.id} value={s.id}>{s.name} — salesperson</option>)}
        </select>
        <span className="small muted">{role === 'office' ? 'Watch each salesperson’s deals. Remind them or move a deal when it goes quiet.' : `${staffById(role)?.name} only sees their own deals, with a button for their next step.`}</span>
      </div>
      <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
        {!sales && <><button className={`chip ${who === 'all' ? 'on' : ''}`} onClick={() => setWho('all')}>Whole team</button>
          {salespeople.map(s => <button key={s.id} className={`chip ${who === s.id ? 'on' : ''}`} onClick={() => setWho(s.id)}><Avatar i={s.initials} size={20} />{s.name}</button>)}</>}
        <div className="ml-auto hstack" style={{ gap: 18 }}>
          <span className="small t2">Open: <b style={{ color: 'var(--text)' }}>{open.length}</b></span>
          <span className="small t2">Pipeline value: <b style={{ color: 'var(--text)' }}>{gbp(open.reduce((a, e) => a + e.value, 0))}</b></span>
          <span className="small t2">Win rate: <b style={{ color: 'var(--ok)' }}>62%</b></span>
        </div>
      </div>
      {!sales && stale.length > 0 && <div className="alert warn"><IconAlertTriangle size={18} /><div><b>{stale.length} deal{stale.length > 1 ? 's need' : ' needs'} chasing</b> — 5+ days in the same stage or a missed follow-up. They are marked in red. Remind the salesperson or move the deal.</div></div>}
      {view === 'board' ? (
        <div className="kanban">
          {STAGES.map(st => {
            const cards = list.filter(e => e.stage === st);
            return (
              <div key={st} className="kcol" style={{ outline: over === st ? '2px dashed #00c7a1' : 'none' }} onDragOver={e => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)}
                onDrop={() => { if (drag) drop(drag, st); setDrag(null); setOver(null); }}>
                <div className="between" style={{ padding: '2px 4px' }}>
                  <span className="hstack" style={{ gap: 8 }}><i className="dot" style={{ background: colColor[st] }} /><b style={{ fontSize: 13 }}>{colLabel[st] || st}</b><span className="tag grey">{cards.length}</span></span>
                  <span className="tiny muted">{gbp(cards.reduce((a, e) => a + e.value, 0))}</span>
                </div>
                {cards.map(e => (
                  <JourneyCard key={e.id} e={e} st={stepFor(e, ctx)} mode={sales ? 'sales' : 'pipeline'} onOpen={() => nav(`/enquiries/${e.id}`)} onAct={k => (k === 'assign' ? setAssign(e.id) : setAct({ id: e.id, k }))}
                    onRemind={() => remind(e)} onMove={() => setAssign(e.id)} onDragStart={() => setDrag(e.id)} />
                ))}
                {cards.length === 0 && <div className="tiny muted" style={{ textAlign: 'center', padding: '18px 0', border: '1.5px dashed #d5dcd9', borderRadius: 10 }}>Drag a deal here</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card flush">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Product</th><th>Value</th><th>Salesperson</th><th>Stage</th><th>Days in stage</th><th>Next step</th><th></th></tr></thead>
            <tbody>{list.map(e => {
              const stp = stepFor(e, ctx);
              const isStale = !['Won', 'Lost'].includes(e.stage) && (e.stageDays >= 5 || e.nextDue === 'Overdue');
              return (
                <tr key={e.id} className="click" onClick={() => nav(`/enquiries/${e.id}`)}><td className="b">{e.name}</td><td>{e.product}</td><td className="b">{gbp(e.value)}</td><td>{staffById(e.assigned)?.name || <Tag tone="warn">Unassigned</Tag>}</td><td><Tag tone={stageTone[e.stage]}>{colLabel[e.stage] || e.stage}</Tag></td><td style={{ color: isStale ? 'var(--err)' : 'var(--text)', fontWeight: isStale ? 600 : 400 }}>{e.stageDays}</td>
                  <td><span className="hstack" style={{ gap: 6 }}><Tag tone={roleTone[stp.role]}>{stp.role}</Tag><span className="t2">{e.stage === 'Won' ? `With the office · ${stp.label}` : `${stp.label} · ${e.nextDue}`}</span></span></td>
                  <td onClick={ev => ev.stopPropagation()}>{sales ? (stp.role === 'Sales' && !stp.wait && e.stage !== 'Won' && <button className="btn btn-dark btn-xs" onClick={() => setAct({ id: e.id, k: stp.key === 'decide' ? 'won' : stp.key })}>{stp.label}</button>)
                    : !e.assigned ? <button className="btn btn-primary btn-xs" onClick={() => setAssign(e.id)}><IconUserShare size={13} />Assign</button> : isStale && <button className="btn btn-dark btn-xs" onClick={() => remind(e)}><IconBellRinging size={13} />Remind</button>}</td></tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      <span className="hstack tiny muted" style={{ gap: 6 }}><IconInfoCircle size={13} />Drag a card to change its stage, or open it and use the main button. Dropping on Won or Lost asks you to confirm. Won deals go to the office — follow them on the Enquiries board.</span>
      {modal && <NewEnquiryModal onClose={() => setModal(false)} />}
      {assign && <AssignModal enquiryId={assign} onClose={() => setAssign(null)} />}
      {act && actE && <ActionModal k={act.k} e={actE} onClose={() => setAct(null)} />}
    </>
  );
}
