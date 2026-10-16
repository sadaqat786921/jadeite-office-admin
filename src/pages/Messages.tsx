import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconPencil, IconWorld, IconMail, IconPhone, IconSend, IconPaperclip, IconLock, IconPhoneCall, IconExternalLink, IconChevronRight } from '@tabler/icons-react';
import { PageHead, Avatar, Tag, Seg, useToast } from '../components/ui';
import { LogCallModal, LinkEmailModal } from '../components/Forms';
import { useStore } from '../data/store';
import { IconLink, IconMailQuestion } from '@tabler/icons-react';
import { threads, jobs, IMG, gbp } from '../data/mock';

const srcIcon: any = { Portal: IconWorld, Email: IconMail, Call: IconPhone };
const srcTone: any = { Portal: 'jade', Email: 'info', Call: 'warn' };

export default function Messages() {
  const toast = useToast();
  const [f, setF] = useState('all');
  const [sel, setSel] = useState(1);
  const [call, setCall] = useState(false);
  const [mode, setMode] = useState('portal');
  const { emails } = useStore();
  const [link, setLink] = useState<string | null>(null);
  const unmatched = emails.filter(e => !e.linked);
  const list = threads.filter(t => f === 'all' || t.source.toLowerCase() === f);
  const t = threads.find(x => x.id === sel)!;
  const job = jobs.find(j => j.id === t.job);
  return (
    <>
      <PageHead title="Messages" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Messages' }]} actions={<><button className="btn btn-grey" onClick={() => setCall(true)}><IconPhoneCall size={16} />Log a call</button><button className="btn btn-primary"><IconPencil size={16} />New message</button></>} />
      <div className="card flush" style={{ flexDirection: 'row', minHeight: 640 }}>
        <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'grid', gap: 10 }}>
            <div className="input-icon"><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search messages" /></div>
            <Seg value={f} onChange={setF} items={[{ id: 'all', label: 'All' }, { id: 'portal', label: 'Portal' }, { id: 'email', label: 'Email' }, { id: 'call', label: 'Calls' }, { id: 'unmatched', label: `Unmatched${unmatched.length ? ' · ' + unmatched.length : ''}` }]} />
          </div>
          <div style={{ overflowY: 'auto' }}>
            {f === 'unmatched' && (
              <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                <div className="alert warn small"><IconMailQuestion size={16} />These emails could not be matched to a job. Link each one by hand.</div>
                {emails.map(em => (
                  <div key={em.id} className="card" style={{ padding: 12, gap: 6 }}>
                    <div className="between"><b style={{ fontSize: 13 }}>{em.subject}</b><span className="tiny muted">{em.when}</span></div>
                    <span className="tiny muted">{em.from}</span>
                    <span className="small t2">{em.preview}</span>
                    {em.linked ? <span className="small" style={{ color: 'var(--ok)' }}>Linked to {em.linked}</span> : <button className="btn btn-dark btn-xs" style={{ justifySelf: 'start' }} onClick={() => setLink(em.id)}><IconLink size={13} />Link to a job</button>}
                  </div>
                ))}
              </div>
            )}
            {f !== 'unmatched' && list.map(x => {
              const I = srcIcon[x.source];
              return (
                <button key={x.id} onClick={() => setSel(x.id)} style={{ width: '100%', textAlign: 'left', border: 0, borderBottom: '1px solid var(--border)', background: sel === x.id ? 'var(--tint-2)' : '#fff', padding: '14px 16px', display: 'flex', gap: 12, borderLeft: sel === x.id ? '3px solid var(--primary)' : '3px solid transparent' }}>
                  <Avatar i={x.i} size={38} />
                  <div className="vstack" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                    <div className="between"><b style={{ fontSize: 13 }}>{x.who}</b><span className="tiny muted">{x.when}</span></div>
                    <span className="small t2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.last}</span>
                    <span className="hstack" style={{ gap: 6 }}><Tag tone={srcTone[x.source]} icon={<I size={11} />}>{x.source}</Tag><span className="tiny muted">{x.job}</span>{x.unread && <i className="dot ml-auto" style={{ background: 'var(--primary)' }} />}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="hstack" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', gap: 12 }}>
            <Avatar i={t.i} size={40} />
            <div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 15 }}>{t.who}</b><span className="small muted">{t.job} · {t.source === 'Email' ? 'Outlook mailbox: office@jadeiteglazing.co.uk' : t.source === 'Portal' ? 'Customer portal' : 'Phone call'}</span></div>
            <button className="btn btn-outline btn-sm ml-auto"><IconPhone size={14} />Call</button>
          </div>
          <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: '#fbfcfc' }}>
            <span className="tiny muted" style={{ textAlign: 'center' }}>Yesterday</span>
            <div className="chat-bubble out"><div className="tiny b hstack" style={{ gap: 6, marginBottom: 4, color: 'var(--primary-dark)' }}><IconMail size={13} />Email · Sarah Mitchell · 14:10</div>Hello, your delivery is confirmed for Tuesday 20 October between 8 and 10am. Your fitting is booked for Thursday 22 and Friday 23 October.</div>
            <span className="tiny muted" style={{ textAlign: 'center' }}>Today</span>
            <div className="chat-bubble in"><div className="tiny b muted hstack" style={{ gap: 6, marginBottom: 4 }}>{React.createElement(srcIcon[t.source], { size: 13 })}{t.source} · {t.who} · {t.when}</div>{t.last}</div>
            <div className="chat-bubble note"><div className="tiny b hstack" style={{ gap: 6, marginBottom: 4, color: '#8a6400' }}><IconLock size={13} />Internal note · Mike Harris</div>Customer prefers calls in the morning. Driveway is fine for the van.</div>
          </div>
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'grid', gap: 10 }}>
            <Seg value={mode} onChange={setMode} items={[{ id: 'portal', label: 'Portal message', icon: <IconWorld size={14} /> }, { id: 'email', label: 'Email (Outlook)', icon: <IconMail size={14} /> }, { id: 'note', label: 'Internal note', icon: <IconLock size={14} /> }]} />
            <textarea className="textarea" placeholder={mode === 'note' ? 'Only your team will see this…' : `Write to ${t.who}…`} style={{ background: mode === 'note' ? '#fffbef' : '#fff' }} />
            <div className="hstack"><button className="btn btn-grey btn-sm"><IconPaperclip size={14} />Attach</button><span className="small muted">{mode === 'note' ? 'Never shown to the customer' : 'Saved to the job history'}</span><button className="btn btn-primary btn-sm ml-auto" onClick={() => toast(mode === 'note' ? 'Note saved' : 'Message sent')}><IconSend size={14} />{mode === 'note' ? 'Save note' : 'Send'}</button></div>
          </div>
        </div>
        {job && (
          <div style={{ width: 280, borderLeft: '1px solid var(--border)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <img src={IMG[job.photo]} alt="" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10 }} />
            <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 14 }}>{job.customer}</b><span className="small muted">{job.id} · {job.address}</span></div>
            <div className="hstack"><Tag tone="jade">{job.stage}</Tag><b className="ml-auto">{gbp(job.value)}</b></div>
            <div className="vstack small" style={{ gap: 8 }}>{job.dates.slice(-3).map(d => <div key={d.label} className="between"><span className="muted">{d.label}</span><b>{d.date}</b></div>)}</div>
            <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">Open job<IconChevronRight size={14} /></Link>
          </div>
        )}
      </div>
      {call && <LogCallModal who={t.who} onClose={() => setCall(false)} />}
      {link && <LinkEmailModal emailId={link} onClose={() => setLink(null)} />}
    </>
  );
}
