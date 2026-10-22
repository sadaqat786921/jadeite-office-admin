// One record for the whole life of a customer: enquiry → won → order → installation → aftercare.
// The top bar always shows ONE main button for the next step. Tabs appear as each stage happens.
import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  IconPhone, IconMail, IconHome, IconUserPlus, IconSend, IconCalendarEvent, IconClipboardCheck, IconFileInvoice, IconMessageReply, IconTrophy, IconX, IconWorld,
  IconPackage, IconCircleCheck, IconTruckDelivery, IconCalendarPlus, IconTool, IconBellRinging, IconDots, IconPhoneCall, IconUserShare, IconExternalLink, IconRefresh,
  IconArrowsSplit, IconInfoCircle, IconMailForward, IconNotes, IconSettings, IconAlertTriangle, IconClock, IconArrowRight, IconShieldCheck, IconUser, IconRulerMeasure, IconPlugConnected,
} from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Avatar, Tabs, Tile, useToast, Empty } from '../components/ui';
import { SurveyReport, QuoteDoc, FinalSurveyView, orderLines, FileChip } from '../components/Lifecycle';
import { stepFor, ActionModal, PHASES, journeyList, roleTone, installOf, needsOffice } from '../components/Journey';
import { staffById, teamById, IMG, gbp } from '../data/mock';
import { useStore, fmtDate, addDays } from '../data/store';
import { quoteTotals } from '../data/lifecycle';
import { stageTone } from './Enquiries';

const commIcon: Record<string, [any, string]> = {
  'email-out': [IconMailForward, '#0b6e5c'], 'email-in': [IconMail, '#0b6e5c'], call: [IconPhoneCall, '#e0a100'], note: [IconNotes, '#3a4a4a'], system: [IconSettings, '#6b7a78'], reminder: [IconBellRinging, '#d64545'],
};
const commLabel: Record<string, string> = { 'email-out': 'Email sent', 'email-in': 'Email received', call: 'Call', note: 'Note', system: 'Update', reminder: 'Reminder' };

const Info = ({ items }: { items: [string, React.ReactNode][] }) => (
  <div className="grid-4" style={{ rowGap: 16 }}>
    {items.map(([l, v]) => <div key={l} className="vstack" style={{ gap: 4 }}><span className="small muted">{l}</span><b style={{ fontSize: 13 }}>{v}</b></div>)}
  </div>
);

function MoreMenu({ items }: { items: { label: string; icon: React.ReactNode; on: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (ev: MouseEvent) => { if (ref.current && !ref.current.contains(ev.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-grey" onClick={() => setOpen(!open)} aria-label="More actions"><IconDots size={16} />More</button>
      {open && (
        <div className="popover" style={{ width: 250, padding: 6 }}>
          {items.map(it => <button key={it.label} className="nav-item" style={{ width: '100%', border: 0, background: 'none', color: it.danger ? 'var(--err)' : undefined }} onClick={() => { setOpen(false); it.on(); }}>{it.icon}<span>{it.label}</span></button>)}
        </div>
      )}
    </div>
  );
}

export default function EnquiryRecord({ recordId, from }: { recordId?: string; from?: 'jobs' } = {}) {
  const params = useParams();
  const id = recordId || params.id;
  const toast = useToast();
  const st = useStore();
  const { enquiries, orders, events, snags, jobs, updEnq } = st;
  const e = enquiries.find(x => x.id === id) || enquiries[0];
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState<string | null>(null);
  useEffect(() => { setTab('overview'); }, [id]);

  const s = staffById(e.assigned);
  const ctx = { events, snags: snags as any };
  const order = orders.find(o => o.job === e.jobId && e.jobId);
  const job = jobs.find(j => j.id === e.jobId);
  const install = installOf(e, events);
  const waiting = events.find(ev => ev.job === e.jobId && e.jobId && ev.team === 'un');
  const jobSnags = snags.filter(x => x.job === e.jobId && e.jobId);
  const step = stepFor(e, ctx);
  const t = e.quote ? quoteTotals(e.quote) : null;
  const open = e.type === 'Sales' && !['Won', 'Lost'].includes(e.stage);
  const phases = PHASES.filter(p => p.id !== 'lost');
  const idx = phases.findIndex(p => p.id === step.phase);
  const o = e.ops || {};

  // Who to remind depends on whose turn it is
  const remindWho = step.role === 'Sales' ? s?.name : step.role === 'Surveyor' ? staffById(e.finalSurvey?.surveyor)?.name : step.role === 'Installer' ? teamById(install?.team)?.name : undefined;
  const remind = () => {
    updEnq(e.id, {}, { kind: 'reminder', title: `Reminder sent to ${remindWho}`, body: `Please ${step.label.toLowerCase()} for ${e.name}${e.nextDue && !['Today', '—', 'Done'].includes(e.nextDue) ? ` (due ${e.nextDue})` : ''}.`, who: 'Sarah Mitchell' });
    toast(`Reminder sent to ${remindWho} · they’ll see it on their phone`);
  };
  const reopen = () => { updEnq(e.id, { stage: 'Follow-up', stageDays: 0, lostReason: undefined, next: 'Follow up again', nextDue: 'Today' }, { kind: 'system', title: 'Enquiry reopened', who: 'Sarah Mitchell' }); toast('Reopened · back in Follow-up'); };
  const go = (k: string) => (k === 'reopen' ? reopen() : setModal(k));
  const done = (tb: string) => setTab(tb);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'comms', label: 'Communication', n: e.comms?.length || 0 },
    ...(e.appt ? [{ id: 'appt', label: 'Appointment' }] : []),
    ...(e.survey ? [{ id: 'survey', label: e.survey.fp ? 'Survey (Framepoint)' : 'Survey' }] : []),
    ...(e.quote ? [{ id: 'quote', label: 'Quotation' }] : []),
    ...(e.finalSurvey ? [{ id: 'final', label: 'Final survey' }] : []),
    ...(e.stage === 'Won' ? [{ id: 'order', label: 'Order & delivery' }] : []),
    ...(e.jobId ? [{ id: 'install', label: 'Installation' }, { id: 'snags', label: 'Snags & aftercare', n: jobSnags.filter(x => x.status !== 'Fixed').length || undefined }] : []),
  ];

  const more = [
    { label: 'Send an email', icon: <IconMail size={17} />, on: () => setModal('email') },
    { label: 'Log a call', icon: <IconPhoneCall size={17} />, on: () => setModal('call') },
    ...(s && open ? [{ label: 'Move to another salesperson', icon: <IconUserShare size={17} />, on: () => setModal('assign') }] : []),
    ...(['Quote Sent', 'Follow-up'].includes(e.stage) && e.quote ? [{ label: 'New quote version (Framepoint)', icon: <IconFileInvoice size={17} />, on: () => setModal('revise') }] : []),
    ...(e.invite?.status === 'Invited' ? [{ label: 'Resend portal invite', icon: <IconWorld size={17} />, on: () => setModal('resend') }] : []),
    ...(e.jobId && !install && !o.received?.ok && !o.override ? [{ label: 'Book before delivery (director override)', icon: <IconShieldCheck size={17} />, on: () => setModal('override') }] : []),
    ...(e.jobId && !install && o.override ? [{ label: 'Book installation (override approved)', icon: <IconCalendarPlus size={17} />, on: () => setModal('book') }] : []),
    ...(o.work === 'Started' ? [{ label: 'Installer progress update', icon: <IconTool size={17} />, on: () => setModal('progress') }] : []),
    ...(e.jobId ? [{ label: o.paid ? 'Log aftercare request' : 'Add snag', icon: <IconTool size={17} />, on: () => setModal(o.paid ? 'aftercare' : 'snag') }, { label: `Open job page (${e.jobId})`, icon: <IconExternalLink size={17} />, on: () => { window.location.hash = `#/jobs/${e.jobId}`; } }] : []),
    ...(open && s ? [{ label: 'Mark as Lost', icon: <IconX size={17} />, on: () => setModal('lost'), danger: true }] : []),
  ];

  return (
    <>
      <PageHead title={e.name} crumbs={from === 'jobs' ? [{ label: 'Jobs', to: '/jobs' }, { label: `${e.jobId || 'Not ordered yet'} · ${e.name}` }] : [{ label: 'Enquiries', to: '/enquiries' }, { label: `${e.id} · ${e.name}` }]}
        actions={<>
          {remindWho && !['reopen'].includes(step.key) && <button className="btn btn-outline" onClick={remind}><IconBellRinging size={16} />Remind {remindWho.split(' ')[0] === 'Team' ? remindWho : remindWho.split(' ')[0]}</button>}
          {e.type === 'Sales' && <MoreMenu items={more} />}
          {step.key === 'decide' ? <><button className="btn btn-outline" style={{ color: 'var(--err)' }} onClick={() => setModal('lost')}><IconX size={16} />Mark as Lost</button><button className="btn btn-primary" onClick={() => setModal('won')}><IconTrophy size={16} />Mark as Won</button></>
            : <button className={`btn ${step.key === 'route' ? 'btn-dark' : step.wait ? 'btn-outline' : 'btn-primary'}`} onClick={() => go(step.key)}>{step.icon}{step.label}</button>}
        </>} />

      {/* Header */}
      <Card>
        <div className="hstack" style={{ gap: 16, alignItems: 'flex-start' }}>
          <img src={IMG[e.photo]} alt="" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover' }} />
          <div className="vstack" style={{ gap: 8, flex: 1 }}>
            <div className="hstack" style={{ flexWrap: 'wrap' }}><h2 style={{ fontSize: 20 }}>{e.name}</h2><Tag tone={stageTone[e.stage]}>{e.stage}</Tag>{e.type !== 'Sales' && <Tag tone="warn">{e.type}</Tag>}<Tag tone="grey">{e.product}</Tag>{e.jobId && <Link to={`/jobs/${e.jobId}`}><Tag tone="info">Job {e.jobId}</Tag></Link>}</div>
            <div className="hstack small t2" style={{ gap: 16, flexWrap: 'wrap' }}><span className="hstack" style={{ gap: 5 }}><IconPhone size={14} />{e.phone}</span><span className="hstack" style={{ gap: 5 }}><IconMail size={14} />{e.email}</span><span className="hstack" style={{ gap: 5 }}><IconHome size={14} />{e.address}, {e.postcode}</span></div>
            <div className="hstack" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              {([['Received', e.received], ['Salesperson', s ? s.name : 'Not assigned'], ['Surveyor', staffById(e.finalSurvey?.surveyor)?.name || '—'], ['Value', t ? gbp(t.total) : e.value ? gbp(e.value) : '—'], ['Next step', `${step.label} · ${step.role}`]] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}><div className="tiny muted">{l}</div><b style={{ fontSize: 13, color: v === 'Not assigned' || v.endsWith('Overdue') ? 'var(--err)' : 'var(--text)' }}>{v}</b></div>
              ))}
            </div>
          </div>
        </div>
        {e.type === 'Sales' && (
          <div className="stepper journey" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            {phases.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && <span className="step-line" />}
                <span className={`step ${e.stage === 'Lost' ? '' : i < idx ? 'done' : i === idx ? 'now' : ''}`}>{i < idx && e.stage !== 'Lost' && <IconCircleCheck size={14} />}{p.label}</span>
              </React.Fragment>
            ))}
            {e.stage === 'Lost' && <><span className="step-line" /><span className="step now" style={{ background: 'var(--err)', borderColor: 'var(--err)' }}><IconX size={14} />Lost</span></>}
          </div>
        )}
      </Card>

      {/* What happens next — in plain words */}
      <div className={`alert ${needsOffice(step) ? 'warn' : e.stage === 'Lost' ? 'err' : 'info'}`}>
        <IconArrowRight size={18} />
        <div><b>Next step: {step.key === 'decide' ? 'Mark as Won or Lost' : step.label}</b> <Tag tone={roleTone[step.role]}>{needsOffice(step) ? 'Your turn · Office' : step.role}</Tag> {step.hint}</div>
      </div>

      <div className="row">
        <div className="col grow">
          <Card>
            <Tabs value={tab} onChange={setTab} items={tabs} />

            {tab === 'overview' && (
              <div className="vstack" style={{ gap: 22 }}>
                <div className="vstack" style={{ gap: 12 }}><b>Basic info</b><Info items={[['Name', e.name], ['Mobile', e.phone], ['Email', e.email], ['Received', e.received], ['Enquiry source', e.source], ['Interested in', e.product], ['Salesperson', s ? s.name : <span style={{ color: 'var(--err)' }}>Not assigned yet</span>], ['Best way to contact', 'Phone, evenings']]} /></div>
                <div className="divider" />
                <div className="vstack" style={{ gap: 12 }}><b>Property</b><Info items={[['Address', e.address], ['Postcode', e.postcode], ['Property type', 'Semi-detached'], ['Built', '1930s'], ['Parking', e.survey?.parking || 'Driveway'], ['Access', e.survey?.access || 'Side gate'], ['Conservation area', 'No'], ['Notes', e.survey?.notes || e.appt?.notes || '—']]} /></div>
                <div className="divider" />
                <div className="vstack" style={{ gap: 12 }}><b>Project</b><Info items={[['Products', e.survey?.fp ? `${e.survey.fp.items.filter(i => !i.service).reduce((a, i) => a + i.qty, 0)} frames · ${e.product}` : e.product], ['Framepoint', e.survey?.fp ? `${e.survey.fp.ref} · ${e.survey.fp.source === 'Framepoint' ? 'imported' : 'read from PDF'}` : 'No survey yet'], ['Final survey', e.finalSurvey ? (e.finalSurvey.status === 'Done' ? `Done ${e.finalSurvey.doneOn || ''}` : `Booked ${fmtDate(e.finalSurvey.date)}`) : '—'], ['Quote', e.quote ? `${e.quote.ref} · ${e.quote.status}` : 'Not sent yet'], ['Quote total', t ? gbp(t.total) : '—'], [`Deposit (${t?.depositPct ?? 50}%)`, t ? gbp(t.deposit) : '—'], ['Won on', e.wonOn || '—'], ['Job', e.jobId || 'Created when ordered'], ['Vendor', order ? `${order.supplier} · ${order.ref}` : '—'], ['Customer portal', e.invite?.status || 'Not invited']]} /></div>
                <div className="divider" />
                <div className="vstack" style={{ gap: 12 }}>
                  <div className="between"><b>Complete journey</b><span className="tiny muted">Who does each step · ticked when done</span></div>
                  {(() => { const jl = journeyList(e, ctx).filter(j => !j.skip); const first = jl.findIndex(x => !x.done); return (
                  <div className="journey-list" style={{ gridTemplateRows: `repeat(${Math.ceil(jl.length / 2)}, auto)` }}>
                    {jl.map((j, n) => {
                      const now = n === first;
                      return <div key={j.label} className={`jl ${j.done ? 'done' : ''} ${now ? 'now' : ''}`}>{j.done ? <IconCircleCheck size={16} color="#1f9d5b" /> : <span className="jl-dot" />}<span className="jl-label"><span className="muted">{n + 1}.</span> {j.label}</span><Tag tone={roleTone[j.role]}>{j.role}</Tag>{j.when && <span className="tiny muted">{j.when}</span>}</div>;
                    })}
                  </div>); })()}
                </div>
              </div>
            )}

            {tab === 'comms' && (
              <div className="vstack" style={{ gap: 12 }}>
                <span className="small muted">Every email, reply, call and update about {e.name}, newest first. Use <b>More</b> at the top to send an email or log a call.</span>
                <div className="timeline">
                  {(e.comms || []).map(cm => {
                    const [I, col] = commIcon[cm.kind];
                    return (
                      <div key={cm.id} className="tl-item">
                        <Tile icon={<I size={15} />} color={col} size={32} radius={16} />
                        <div className="vstack" style={{ gap: 6, flex: 1 }}>
                          <div className="between"><span className="hstack" style={{ gap: 8 }}><b style={{ fontSize: 13.5 }}>{cm.title}</b><Tag tone={cm.kind === 'email-in' ? 'jade' : cm.kind === 'reminder' ? 'err' : 'grey'}>{commLabel[cm.kind]}</Tag></span><span className="tiny muted">{cm.when}</span></div>
                          <span className="tiny muted">{cm.who}</span>
                          {cm.body && <div className="small t2" style={{ background: cm.kind === 'email-in' ? 'var(--tint)' : 'var(--bg)', borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre-wrap' }}>{cm.body}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {!e.comms?.length && <Empty icon={<IconMail size={22} />} title="Nothing yet" sub="Emails, replies and calls will show here." />}
                </div>
              </div>
            )}

            {tab === 'appt' && e.appt && (
              <div className="vstack" style={{ gap: 16 }}>
                <div className="between"><b>{e.appt.type}</b><Tag tone={e.appt.status === 'Done' ? 'ok' : 'info'}>{e.appt.status}</Tag></div>
                <Info items={[['Date', fmtDate(e.appt.date, { weekday: 'long', day: 'numeric', month: 'long' })], ['Time', e.appt.time], ['With', staffById(e.appt.who)?.name || '—'], ['Where', e.appt.address], ['Calendar', 'In Outlook'], ['Customer told', 'Yes, by email']]} />
                {e.appt.notes && <div className="alert info small"><IconInfoCircle size={16} />{e.appt.notes}</div>}
                {e.appt.outcome ? <div className="vstack" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>How it went</b><span className="t2">{e.appt.outcome}</span></div>
                  : <span className="small muted">After the visit, use <b>Add Framepoint survey</b> at the top to bring in the measurements and prices.</span>}
              </div>
            )}

            {tab === 'survey' && e.survey && (
              e.survey.status === 'Completed' ? <SurveyReport e={e} /> : (
                <div className="vstack" style={{ gap: 16 }}>
                  <Info items={[['Surveyor', staffById(e.survey.surveyor)?.name || '—'], ['Date', fmtDate(e.survey.date, { weekday: 'long', day: 'numeric', month: 'long' })], ['Time', e.survey.time], ['Requested by', e.survey.requestedBy]]} />
                  <div className="alert warn small"><IconClock size={16} />Booked — waiting for {staffById(e.survey.surveyor)?.name} to visit and send the results from their phone.</div>
                </div>
              )
            )}

            {tab === 'quote' && e.quote && (
              <div className="vstack" style={{ gap: 14 }}>
                <div className="between"><span className="hstack" style={{ gap: 8 }}><b>Quote {e.quote.ref}</b><Tag tone={e.quote.status === 'Accepted' ? 'ok' : e.quote.status === 'Declined' ? 'err' : 'info'}>{e.quote.status}</Tag></span><span className="small muted">Sent {e.quote.sentOn} by {e.quote.sentBy} for the customer to review · from Framepoint</span></div>
                <QuoteDoc e={e} q={e.quote} />
                {!!e.quote.files?.length && <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>{e.quote.files.map(f => <FileChip key={f} name={f} sub={`Sent to ${e.email}`} onOpen={() => toast(`Opening ${f}`)} />)}</div>}
                {e.quote.reply && <div className="vstack" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>Customer’s reply</b><div className="small t2" style={{ background: 'var(--tint)', borderRadius: 10, padding: '10px 12px' }}>“{e.quote.reply}”</div></div>}
                {e.lostReason && <div className="alert err small"><IconX size={16} />Lost: {e.lostReason}</div>}
              </div>
            )}

            {tab === 'final' && e.finalSurvey && <FinalSurveyView e={e} />}

            {tab === 'order' && (
              !order ? <Empty icon={<IconPackage size={22} />} title="Not ordered yet" sub="The order is placed after the final survey, readiness and order checks." /> : (
                <div className="vstack" style={{ gap: 16 }}>
                  <div className="between">
                    <span className="hstack" style={{ gap: 10 }}><Avatar i={order.supplier[0]} size={36} /><span className="vstack" style={{ gap: 2 }}><b>{order.supplier} · {order.ref}</b><span className="tiny muted">Job {order.job}{order.confirmRef ? ` · confirmation ${order.confirmRef}` : ''}</span></span></span>
                    {o.delivery !== 'Delivered' && <button className="btn btn-outline btn-sm" onClick={() => { updEnq(e.id, {}, { kind: 'reminder', title: `Chased ${order.supplier}`, body: `Asked ${order.supplier} to ${order.confirmed ? 'confirm the delivery date' : 'confirm order ' + order.ref}.`, who: 'Sarah Mitchell' }); toast(`Chase email sent to ${order.supplier}`); }}><IconBellRinging size={14} />Chase vendor</button>}
                  </div>
                  <div className="stepper">
                    {['Pending', 'Confirmed', 'In production', 'In transit', 'Delivered', 'Checked'].map((x, i) => { const at = o.received?.ok ? 6 : ['Pending', 'Confirmed', 'In production', 'In transit', 'Delivered'].indexOf(o.delivery || 'Pending') + (o.delivery === 'Delivered' ? 1 : 0); return <React.Fragment key={x}>{i > 0 && <span className="step-line" />}<span className={`step ${i < at ? 'done' : ''} ${i === at ? 'now' : ''}`}>{i < at && <IconCircleCheck size={14} />}{x}</span></React.Fragment>; })}
                  </div>
                  <Info items={[['Order date', order.ordered], ['Expected delivery', order.expected], ['Frames', order.frames], ['Status', <Tag tone={order.tone}>{o.delivery || order.status}</Tag>], ['Deliver to', e.address], ['Vendor contact', order.supplier === 'Origin' ? 'orders@origin-global.com' : 'orders@emplas.co.uk'], ['Deposit', job ? (job.paid >= job.deposit ? `${gbp(job.deposit)} paid` : `${gbp(job.deposit)} not paid`) : '—'], ['Customer portal', e.invite?.status || '—']]} />
                  {o.received && <div className={`alert ${o.received.ok ? 'ok' : 'err'} small`}>{o.received.ok ? <IconCircleCheck size={16} /> : <IconAlertTriangle size={16} />}{o.received.ok ? `Delivery checked ${o.received.on} · ${o.received.photos} photos` : `Problem: ${o.received.issue}`}</div>}
                  <div className="vstack" style={{ gap: 8 }}>
                    <b style={{ fontSize: 13 }}>Products</b>
                    {orderLines(e).map((l, i) => <div key={i} className="hstack" style={{ gap: 12 }}><img src={IMG[e.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{l.qty} × {l.item}</b><span className="tiny muted">{l.spec}{l.size ? ` · ${l.size}` : ''}</span></div></div>)}
                  </div>
                </div>
              )
            )}

            {tab === 'install' && (
              <div className="vstack" style={{ gap: 16 }}>
                {install ? (
                  <>
                    <div className="between"><b>Installation booked</b><Tag tone="ok">In the diary</Tag></div>
                    {o.override && <div className="alert warn small"><IconShieldCheck size={16} /><div>Booked with a readiness override by <b>&nbsp;{o.override.by}&nbsp;</b> on {o.override.on}: {o.override.reason}</div></div>}
                    <Info items={[['Job pack', o.pack ? `Sent ${o.pack}` : 'Not sent yet'], ['Installer read it', o.installerReviewed ? 'Yes' : '—'], ['Progress', o.work === 'Submitted' ? 'Finished' : o.work ? `${o.progress || 0}% done` : 'Not started'], ['Completion', o.completion ? `${o.completion.on} · ${o.completion.photos} photos · ${o.completion.signed ? 'signed' : 'not signed'}` : '—']]} />
                    <Info items={[['Team', teamById(install.team)?.name || '—'], ['Installers', teamById(install.team)?.members || '—'], ['Start', fmtDate(install.date, { weekday: 'long', day: 'numeric', month: 'long' })], ['Days', `${install.days} day${install.days > 1 ? 's' : ''}`], ['Ends', fmtDate(addDays(install.date, install.days - 1))], ['Customer told', 'Yes · email and portal']]} />
                  </>
                ) : waiting ? (
                  <div className="alert warn"><IconAlertTriangle size={18} /><div><b>In the installation diary, waiting for an installer.</b> It sits on {fmtDate(waiting.date)} as “needs installer”. {order?.status === 'Arrived' ? 'Use “Book installation” at the top, or assign a team from the diary.' : 'You can book once the delivery has arrived, or assign a team from the diary.'}</div><Link to="/diary" className="btn btn-dark btn-xs ml-auto">Open diary</Link></div>
                ) : <Empty icon={<IconCalendarPlus size={22} />} title="Not booked yet" sub="Book installation once the delivery has arrived." />}
              </div>
            )}

            {tab === 'snags' && (
              <div className="vstack" style={{ gap: 16 }}>
                {jobSnags.length === 0 ? <Empty icon={<IconShieldCheck size={22} />} title="No snags or aftercare" sub="Use More → Add snag or aftercare if the customer reports a problem." />
                  : jobSnags.map(x => (
                    <div key={x.id} className="hstack" style={{ gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 12 }}>
                      <img src={IMG[x.photo]} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                      <div className="vstack" style={{ gap: 3, flex: 1 }}><span className="hstack" style={{ gap: 8 }}><b>{x.title}</b><Tag tone={x.kind === 'Aftercare' ? 'info' : 'grey'}>{x.kind}</Tag></span><span className="small muted">{x.detail}</span><span className="tiny muted">{x.id} · {x.reported} · assigned to {x.owner}</span></div>
                      <Tag tone={x.tone}>{x.status}</Tag>
                    </div>
                  ))}
                <Link to="/snags" className="link" style={{ alignSelf: 'flex-start' }}>Open all snags<IconArrowRight size={14} /></Link>
              </div>
            )}
          </Card>
        </div>

        <div className="col w-360">
          <Card>
            <CardHead title="People on this job" />
            <div className="list">
              {([['Salesperson', s?.name, s?.initials], ['Surveyor', staffById(e.finalSurvey?.surveyor)?.name, staffById(e.finalSurvey?.surveyor)?.initials], ['Installers', install ? `${teamById(install.team)?.name} · ${teamById(install.team)?.members}` : undefined, install ? teamById(install.team)?.initials : undefined], ['Office', 'Sarah Mitchell', 'SM']] as [string, string | undefined, string | undefined][]).map(([role, name, ini]) => (
                <div key={role} className="hstack" style={{ gap: 10, padding: '10px 0' }}>
                  {name ? <Avatar i={ini || '?'} size={32} /> : <span className="avatar" style={{ width: 32, height: 32, background: 'var(--bg)', color: 'var(--muted)' }}><IconUser size={15} /></span>}
                  <div className="vstack" style={{ gap: 1 }}><span className="tiny muted">{role}</span><b style={{ fontSize: 13, color: name ? 'var(--text)' : 'var(--muted)' }}>{name || 'Not yet'}</b></div>
                </div>
              ))}
            </div>
          </Card>
          {e.stage === 'Won' && (
            <Card>
              <CardHead title="Customer portal" right={<Tag tone={e.invite?.status === 'Active' ? 'ok' : e.invite?.status === 'Invited' ? 'warn' : 'grey'}>{e.invite?.status || 'Not invited'}</Tag>} />
              <span className="small t2">{e.invite?.status === 'Active' ? `${e.name} uses the portal to follow their job.` : e.invite?.status === 'Invited' ? `Invite sent ${e.invite.sentOn}. Not opened yet.` : 'Send the invite after you have checked everything.'}</span>
              {e.invite?.status === 'Invited' && <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setModal('resend')}><IconBellRinging size={14} />Resend invite</button>}
            </Card>
          )}
          <Card>
            <CardHead title="Recent activity" right={<button className="link" onClick={() => setTab('comms')}>View all</button>} />
            <div className="timeline">
              {(e.comms || []).slice(0, 4).map(cm => { const [I, col] = commIcon[cm.kind]; return <div key={cm.id} className="tl-item"><Tile icon={<I size={15} />} color={col} size={30} radius={15} /><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{cm.title}</b><span className="tiny muted">{cm.when} · {cm.who}</span></div></div>; })}
            </div>
          </Card>
        </div>
      </div>

      {modal && <ActionModal k={modal} e={e} onClose={() => setModal(null)} onDone={done} />}
    </>
  );
}
