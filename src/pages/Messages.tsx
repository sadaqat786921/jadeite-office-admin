// Messages: one conversation per customer record, built from the same history as the record's Communication tab.
// Anything sent or logged here is saved on the record, so it shows everywhere.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconPencil, IconMail, IconPhone, IconSend, IconLock, IconPhoneCall, IconExternalLink, IconLink, IconMailQuestion, IconInbox, IconArchive, IconUserPlus, IconBell, IconSettings } from '@tabler/icons-react';
import { PageHead, Avatar, Tag, Seg, useToast, Modal, Field, Empty } from '../components/ui';
import { NewEnquiryModal } from '../components/Forms';
import { useRows, phaseLabel, Row } from '../components/derive';
import { needsOffice } from '../components/Journey';
import { useStore } from '../data/store';
import type { Comm } from '../data/lifecycle';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Comm times look like "16 Oct, 08:12" — turn them into a sortable number.
export const commTime = (w: string) => { const m = /(\d{1,2}) (\w{3}),? ?(\d{1,2})?:?(\d{2})?/.exec(w || ''); if (!m) return 0; return (MON.indexOf(m[2]) + 1) * 1e6 + +m[1] * 1e4 + (+(m[3] || 0)) * 100 + +(m[4] || 0); };
const talk = (c: Comm) => ['email-in', 'email-out', 'call', 'note'].includes(c.kind);
export const needsReply = (e: { comms?: Comm[] }) => { const t = (e.comms || []).filter(c => c.kind === 'email-in' || c.kind === 'email-out' || c.kind === 'call'); return t[0]?.kind === 'email-in'; };
const kindIcon: Record<string, any> = { 'email-in': IconMail, 'email-out': IconMail, call: IconPhone, note: IconLock, reminder: IconBell, system: IconSettings };

export function useNeedsReplyCount() { const { enquiries } = useStore(); return enquiries.filter(needsReply).length; }

function LinkEmailModal({ emailId, onClose, onLinked }: { emailId: string; onClose: () => void; onLinked: (id: string) => void }) {
  const toast = useToast();
  const { emails, set, updEnq, orders } = useStore();
  const rows = useRows().filter(r => r.st.phase !== 'lost');
  const em = emails.find(e => e.id === emailId)!;
  const ord = (orders as any[]).find(o => em.preview.includes(o.ref));
  const guess = rows.find(r => (ord && r.e.jobId === ord.job) || em.preview.includes(r.e.name.split(' ').pop()!) || (r.e.jobId && em.preview.includes(r.e.jobId)));
  const [id, setId] = useState(guess?.e.id || rows[0]?.e.id);
  const save = () => {
    const r = rows.find(x => x.e.id === id)!;
    updEnq(id, {}, { kind: 'email-in', title: em.subject, body: em.preview, who: em.from });
    set('emails', es => es.map(e => (e.id === em.id ? { ...e, linked: r.e.jobId || r.e.id } : e)));
    toast(`Linked to ${r.e.name} · saved on their record`); onLinked(id); onClose();
  };
  return (
    <Modal title="Link this email to a customer" sub={`From ${em.from}`} onClose={onClose} width={560}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><IconLink size={16} />Link email</button></>}>
      <div className="card" style={{ padding: 12, background: 'var(--bg)', gap: 4 }}><b style={{ fontSize: 13 }}>{em.subject}</b><span className="small t2">{em.preview}</span></div>
      <Field label="Which customer is this about?" hint={guess ? `Best match: ${guess.e.name}` : undefined}>
        <select className="select" value={id} onChange={e => setId(e.target.value)}>{rows.map(r => <option key={r.e.id} value={r.e.id}>{r.e.name} · {r.e.jobId || r.e.id} · {r.e.postcode}</option>)}</select>
      </Field>
      <div className="alert info small"><IconLink size={16} />The email is added to the customer's history. Next time we will match this address automatically.</div>
    </Modal>
  );
}

function CallModal({ r, onClose }: { r: Row; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [dir, setDir] = useState('Customer called us');
  const [out, setOut] = useState('Spoke to customer');
  const [txt, setTxt] = useState('');
  return (
    <Modal title="Log a phone call" sub={`${r.e.name} · ${r.e.phone}`} onClose={onClose} width={520}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!txt.trim()} onClick={() => { updEnq(r.e.id, {}, { kind: 'call', title: `${dir} · ${out}`, body: txt, who: 'Sarah Mitchell' }); toast('Call saved on the record'); onClose(); }}>Save call</button></>}>
      <div className="grid-2">
        <Field label="Who called"><select className="select" value={dir} onChange={e => setDir(e.target.value)}><option>Customer called us</option><option>We called the customer</option></select></Field>
        <Field label="What happened"><select className="select" value={out} onChange={e => setOut(e.target.value)}><option>Spoke to customer</option><option>Left a voicemail</option><option>No answer</option></select></Field>
      </div>
      <Field label="What was said"><textarea className="textarea" value={txt} onChange={e => setTxt(e.target.value)} placeholder="Short summary of the call" /></Field>
    </Modal>
  );
}

function NewMessageModal({ rows, onClose, onPick }: { rows: Row[]; onClose: () => void; onPick: (id: string) => void }) {
  const [id, setId] = useState(rows[0]?.e.id);
  return (
    <Modal title="New message" sub="Choose the customer" onClose={onClose} width={480} footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { onPick(id); onClose(); }}>Write message</button></>}>
      <Field label="Customer"><select className="select" value={id} onChange={e => setId(e.target.value)}>{rows.map(r => <option key={r.e.id} value={r.e.id}>{r.e.name} · {r.e.jobId || r.e.id}</option>)}</select></Field>
    </Modal>
  );
}

export default function Messages() {
  const toast = useToast();
  const { emails, set, updEnq } = useStore();
  const all = useRows();
  const [f, setF] = useState('reply');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'email' | 'note'>('email');
  const [txt, setTxt] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [call, setCall] = useState(false);
  const [nw, setNw] = useState(false);
  const [enq, setEnq] = useState<string | null>(null);
  const convos = useMemo(() => all.filter(r => (r.e.comms || []).some(talk)).sort((a, b) => commTime((b.e.comms || []).find(talk)!.when) - commTime((a.e.comms || []).find(talk)!.when)), [all]);
  const unlinked = emails.filter(e => !e.linked);
  const list = convos.filter(r => (f === 'all' || (f === 'reply' && needsReply(r.e))) && (r.e.name + (r.e.jobId || '') + r.e.postcode).toLowerCase().includes(q.toLowerCase()));
  const [selId, setSel] = useState<string | null>(null);
  const sel = all.find(r => r.e.id === selId) || list[0] || convos[0];
  const thread = sel ? [...(sel.e.comms || [])].reverse() : [];
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [sel?.e.id, thread.length]);
  const send = () => {
    if (!sel || !txt.trim()) return;
    updEnq(sel.e.id, {}, mode === 'note' ? { kind: 'note', title: 'Internal note', body: txt, who: 'Sarah Mitchell' } : { kind: 'email-out', title: `Re: ${sel.e.product}`, body: txt, who: 'Sarah Mitchell' });
    toast(mode === 'note' ? 'Note saved · staff only' : `Email sent to ${sel.e.email}`); setTxt('');
  };
  return (
    <>
      <PageHead title="Messages" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Messages' }]} actions={<><button className="btn btn-grey" disabled={!sel} onClick={() => setCall(true)}><IconPhoneCall size={16} />Log a call</button><button className="btn btn-primary" onClick={() => setNw(true)}><IconPencil size={16} />New message</button></>} />
      <div className="card flush" style={{ flexDirection: 'row', minHeight: 640 }}>
        <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'grid', gap: 10 }}>
            <div className="input-icon"><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search customer or job" value={q} onChange={e => setQ(e.target.value)} /></div>
            <Seg value={f} onChange={setF} items={[{ id: 'reply', label: `Needs reply · ${convos.filter(r => needsReply(r.e)).length}` }, { id: 'all', label: 'All' }, { id: 'inbox', label: `Not linked · ${unlinked.length}` }]} />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 640 }}>
            {f === 'inbox' && (
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div className="alert warn small"><IconMailQuestion size={16} />These emails came from addresses we do not know. Link each one to the right customer.</div>
                {unlinked.map(em => (
                  <div key={em.id} className="card" style={{ padding: 12, gap: 6 }}>
                    <div className="between"><b style={{ fontSize: 13 }}>{em.subject}</b><span className="tiny muted">{em.when}</span></div>
                    <span className="tiny muted">{em.from}</span>
                    <span className="small t2">{em.preview}</span>
                    <div className="hstack" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-xs" onClick={() => setLink(em.id)}><IconLink size={13} />Link to customer</button>
                      <button className="btn btn-outline btn-xs" onClick={() => setEnq(em.id)}><IconUserPlus size={13} />New enquiry</button>
                      <button className="btn btn-grey btn-xs" onClick={() => { set('emails', es => es.map(x => (x.id === em.id ? { ...x, linked: 'Archived' } : x))); toast('Archived · not about a customer'); }}><IconArchive size={13} />Not a customer</button>
                    </div>
                  </div>
                ))}
                {unlinked.length === 0 && <Empty icon={<IconInbox size={22} />} title="All emails linked" sub="Nothing waiting." />}
              </div>
            )}
            {f !== 'inbox' && list.map(r => {
              const last = (r.e.comms || []).find(talk)!;
              const nr = needsReply(r.e);
              const on = sel?.e.id === r.e.id;
              return (
                <button key={r.e.id} onClick={() => setSel(r.e.id)} style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid var(--border)', background: on ? 'var(--tint-2)' : '#fff', padding: '14px 16px', display: 'flex', gap: 12, borderLeft: on ? '3px solid var(--primary)' : '3px solid transparent' }}>
                  <Avatar i={r.e.initials} size={38} />
                  <div className="vstack" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                    <div className="between"><b style={{ fontSize: 13 }}>{r.e.name}</b><span className="tiny muted">{last.when}</span></div>
                    <span className="small t2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last.body || last.title}</span>
                    <span className="hstack" style={{ gap: 6 }}><span className="tiny muted">{r.e.jobId || r.e.id} · {phaseLabel(r.st.phase)}</span>{nr && <Tag tone="warn">Needs reply</Tag>}</span>
                  </div>
                </button>
              );
            })}
            {f !== 'inbox' && list.length === 0 && <Empty icon={<IconInbox size={22} />} title={f === 'reply' ? 'No one is waiting for a reply' : 'No messages'} sub="Well done." />}
          </div>
        </div>
        {sel ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="hstack" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
              <Avatar i={sel.e.initials} size={40} />
              <div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 15 }}>{sel.e.name}</b><span className="small muted">{sel.e.email} · {sel.e.phone}</span></div>
              <span className="ml-auto hstack" style={{ gap: 8 }}>
                <Tag tone={needsOffice(sel.st) ? 'warn' : 'jade'}>{phaseLabel(sel.st.phase)} · {sel.st.label}</Tag>
                <Link to={sel.e.jobId ? `/jobs/${sel.e.jobId}` : `/enquiries/${sel.e.id}`} className="btn btn-outline btn-sm"><IconExternalLink size={14} />Open record</Link>
              </span>
            </div>
            <div ref={box} style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, background: '#fbfcfc', overflowY: 'auto', maxHeight: 470 }}>
              {thread.map(c => {
                const I = kindIcon[c.kind] || IconMail;
                if (c.kind === 'system' || c.kind === 'reminder') return <span key={c.id} className="tiny muted hstack" style={{ alignSelf: 'center', gap: 6 }}><I size={12} />{c.title} · {c.when}</span>;
                const cls = c.kind === 'email-in' ? 'in' : c.kind === 'note' ? 'note' : 'out';
                return (
                  <div key={c.id} className={`chat-bubble ${cls}`}>
                    <div className="tiny b hstack" style={{ gap: 6, marginBottom: 4, color: cls === 'note' ? '#8a6400' : cls === 'out' ? 'var(--primary-dark)' : 'var(--t3)' }}><I size={13} />{c.kind === 'call' ? 'Call' : c.kind === 'note' ? 'Internal note' : 'Email'} · {c.who} · {c.when}</div>
                    <b style={{ fontSize: 13 }}>{c.title}</b>{c.body && <div style={{ marginTop: 4 }}>{c.body}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'grid', gap: 10 }}>
              <Seg value={mode} onChange={v => setMode(v as any)} items={[{ id: 'email', label: 'Email the customer', icon: <IconMail size={14} /> }, { id: 'note', label: 'Internal note', icon: <IconLock size={14} /> }]} />
              <textarea className="textarea" value={txt} onChange={e => setTxt(e.target.value)} placeholder={mode === 'note' ? 'Only your team will see this…' : `Write to ${sel.e.name}…`} style={{ background: mode === 'note' ? '#fffbef' : '#fff' }} />
              <div className="hstack"><span className="small muted">{mode === 'note' ? 'Never shown to the customer' : `Sent from office@jadeiteglazing.co.uk to ${sel.e.email}`}</span><button className="btn btn-primary btn-sm ml-auto" disabled={!txt.trim()} onClick={send}><IconSend size={14} />{mode === 'note' ? 'Save note' : 'Send email'}</button></div>
            </div>
          </div>
        ) : <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}><Empty icon={<IconInbox size={22} />} title="Choose a conversation" /></div>}
      </div>
      {link && <LinkEmailModal emailId={link} onClose={() => setLink(null)} onLinked={id => { setSel(id); setF('all'); }} />}
      {call && sel && <CallModal r={sel} onClose={() => setCall(false)} />}
      {nw && <NewMessageModal rows={all.filter(r => r.st.phase !== 'lost')} onClose={() => setNw(false)} onPick={id => { setSel(id); setF('all'); setMode('email'); }} />}
      {enq && <NewEnquiryModal onClose={() => { set('emails', es => es.map(x => (x.id === enq ? { ...x, linked: 'New enquiry' } : x))); setEnq(null); }} preset={{ name: '', phone: '', address: '', postcode: '', email: emails.find(x => x.id === enq)?.from || '' }} />}
    </>
  );
}
