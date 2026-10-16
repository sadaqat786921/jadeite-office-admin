import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconLayoutKanban, IconListDetails, IconClock, IconAlertTriangle, IconTrophy, IconBellRinging, IconUserShare, IconInfoCircle } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Seg, useToast } from '../components/ui';
import { NewEnquiryModal, AssignModal } from '../components/Forms';
import { STAGES, staffById, salespeople, gbp, IMG } from '../data/mock';
import { useStore } from '../data/store';
import { stageTone } from './Enquiries';

const colColor: Record<string, string> = { 'New Enquiry': '#2f6fde', Contacted: '#0b6e5c', Appointment: '#2dd4bf', Survey: '#e0a100', 'Quote Sent': '#2f6fde', 'Follow-up': '#e0a100', Won: '#1f9d5b', Lost: '#d64545' };
const STALE = 5;

export default function Pipeline() {
  const nav = useNavigate();
  const toast = useToast();
  const { enquiries, set } = useStore();
  const [who, setWho] = useState('all');
  const [view, setView] = useState('board');
  const [modal, setModal] = useState(false);
  const [assign, setAssign] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const list = enquiries.filter(e => e.type === 'Sales' && (who === 'all' || e.assigned === who));
  const open = list.filter(e => !['Won', 'Lost'].includes(e.stage));
  const stale = open.filter(e => e.stageDays >= STALE || e.nextDue === 'Overdue');
  const remind = (e: any) => { toast(`Reminder sent to ${staffById(e.assigned)?.name || 'the office'} about ${e.name}`); };
  return (
    <>
      <PageHead title="Sales pipeline" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Sales pipeline' }]}
        actions={<><Seg value={view} onChange={setView} items={[{ id: 'board', label: 'Board', icon: <IconLayoutKanban size={15} /> }, { id: 'list', label: 'List', icon: <IconListDetails size={15} /> }]} /><button className="btn btn-primary" onClick={() => setModal(true)}><IconPlus size={16} />New enquiry</button></>} />
      <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
        <button className={`chip ${who === 'all' ? 'on' : ''}`} onClick={() => setWho('all')}>Whole team</button>
        {salespeople.map(s => <button key={s.id} className={`chip ${who === s.id ? 'on' : ''}`} onClick={() => setWho(s.id)}><Avatar i={s.initials} size={20} />{s.name}</button>)}
        <div className="ml-auto hstack" style={{ gap: 18 }}>
          <span className="small t2">Open: <b style={{ color: 'var(--text)' }}>{open.length}</b></span>
          <span className="small t2">Pipeline value: <b style={{ color: 'var(--text)' }}>{gbp(open.reduce((a, e) => a + e.value, 0))}</b></span>
          <span className="small t2">Win rate: <b style={{ color: 'var(--ok)' }}>62%</b></span>
        </div>
      </div>
      {stale.length > 0 && <div className="alert warn"><IconAlertTriangle size={18} /><div><b>{stale.length} deal{stale.length > 1 ? 's need' : ' needs'} chasing</b> — no contact for {STALE}+ days or a missed follow-up. They are marked in red below. Send a reminder or move them to another salesperson.</div></div>}
      {view === 'board' ? (
        <div className="kanban">
          {STAGES.map(st => {
            const cards = list.filter(e => e.stage === st);
            return (
              <div key={st} className="kcol" style={{ outline: over === st ? '2px dashed #00c7a1' : 'none' }} onDragOver={e => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)}
                onDrop={() => { if (drag) { set('enquiries', xs => xs.map(x => (x.id === drag ? { ...x, stage: st as any, stageDays: 0 } : x))); toast(st === 'Won' ? 'Won · it comes back to the office as a new job' : `Moved to ${st}`); } setDrag(null); setOver(null); }}>
                <div className="between" style={{ padding: '2px 4px' }}>
                  <span className="hstack" style={{ gap: 8 }}><i className="dot" style={{ background: colColor[st] }} /><b style={{ fontSize: 13 }}>{st}</b><span className="tag grey">{cards.length}</span></span>
                  <span className="tiny muted">{gbp(cards.reduce((a, e) => a + e.value, 0))}</span>
                </div>
                {cards.map(e => {
                  const s = staffById(e.assigned);
                  const isStale = !['Won', 'Lost'].includes(st) && (e.stageDays >= STALE || e.nextDue === 'Overdue');
                  return (
                    <div key={e.id} className="kcard" draggable onDragStart={() => setDrag(e.id)} onClick={() => nav(`/enquiries/${e.id}`)} style={{ borderColor: isStale ? '#f1b8b8' : undefined, boxShadow: isStale ? 'inset 3px 0 0 #d64545' : undefined }}>
                      <div className="hstack" style={{ gap: 10 }}>
                        <img src={IMG[e.photo]} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                        <div className="vstack" style={{ gap: 2, minWidth: 0 }}><b style={{ fontSize: 13 }}>{e.name}</b><span className="tiny muted">{e.product} · {e.postcode}</span></div>
                      </div>
                      <div className="between"><b style={{ fontSize: 14 }}>{gbp(e.value)}</b>{s ? <span className="hstack tiny t2" style={{ gap: 6 }}>{s.name.split(' ')[0]}<Avatar i={s.initials} size={24} /></span> : <Tag tone="warn">Unassigned</Tag>}</div>
                      <div className="vstack" style={{ gap: 6, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        <span className="hstack tiny" style={{ gap: 6, color: e.nextDue === 'Overdue' ? 'var(--err)' : 'var(--text-2)' }}>{e.nextDue === 'Overdue' ? <IconAlertTriangle size={13} /> : st === 'Won' ? <IconTrophy size={13} /> : <IconClock size={13} />}{e.next} · {e.nextDue}</span>
                        <span className="tiny" style={{ color: isStale ? 'var(--err)' : 'var(--muted)', fontWeight: isStale ? 600 : 400 }}>{e.stageDays} day{e.stageDays === 1 ? '' : 's'} in {st}</span>
                      </div>
                      {isStale && (
                        <div className="hstack" style={{ gap: 6 }} onClick={ev => ev.stopPropagation()}>
                          <button className="btn btn-dark btn-xs" style={{ flex: 1 }} onClick={() => remind(e)}><IconBellRinging size={13} />Remind</button>
                          <button className="btn btn-outline btn-xs" style={{ flex: 1 }} onClick={() => setAssign(e.id)}><IconUserShare size={13} />Move</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {cards.length === 0 && <div className="tiny muted" style={{ textAlign: 'center', padding: '18px 0', border: '1.5px dashed #d5dcd9', borderRadius: 10 }}>Drag an enquiry here</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card flush">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Product</th><th>Value</th><th>Owner</th><th>Stage</th><th>Days in stage</th><th>Next step</th><th></th></tr></thead>
            <tbody>{list.map(e => { const isStale = !['Won', 'Lost'].includes(e.stage) && (e.stageDays >= STALE || e.nextDue === 'Overdue'); return (
              <tr key={e.id} className="click" onClick={() => nav(`/enquiries/${e.id}`)}><td className="b">{e.name}</td><td>{e.product}</td><td className="b">{gbp(e.value)}</td><td>{staffById(e.assigned)?.name || <Tag tone="warn">Unassigned</Tag>}</td><td><Tag tone={stageTone[e.stage]}>{e.stage}</Tag></td><td style={{ color: isStale ? 'var(--err)' : 'var(--text)', fontWeight: isStale ? 600 : 400 }}>{e.stageDays}</td><td className="t2">{e.next} · {e.nextDue}</td>
                <td onClick={ev => ev.stopPropagation()}>{isStale && <button className="btn btn-dark btn-xs" onClick={() => remind(e)}><IconBellRinging size={13} />Remind</button>}</td></tr>); })}</tbody>
          </table>
        </div>
      )}
      <span className="hstack tiny muted" style={{ gap: 6 }}><IconInfoCircle size={13} />Drag a card to another column to change its stage. Won deals come back to the office as new jobs.</span>
      {modal && <NewEnquiryModal onClose={() => setModal(false)} />}
      {assign && <AssignModal enquiryId={assign} onClose={() => setAssign(null)} />}
    </>
  );
}
