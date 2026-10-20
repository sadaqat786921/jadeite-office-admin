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
import { AssignModal, BookInstallModal } from '../components/Forms';
import {
  ContactModal, BookApptModal, RequestSurveyModal, SurveyResultsModal, SendQuoteModal, ReplyModal, WonModal, LostModal, InviteModal, OrderModal,
  VendorConfirmModal, DeliveredModal, AddSnagModal, SurveyReport, QuoteDoc, FramepointSurveyModal, BookFinalSurveyModal, FinalSurveyModal, FinalSurveyView, orderLines, FileChip,
} from '../components/Lifecycle';
import { staffById, teamById, IMG, gbp } from '../data/mock';
import { useStore, fmtDate, addDays, EnquiryX, Order, DiaryEvent } from '../data/store';
import { quoteTotals } from '../data/lifecycle';
import { RouteModal, stageTone } from './Enquiries';

type Step = { key: string; label: string; icon: React.ReactNode; hint: string };

export function nextStep(e: EnquiryX, order?: Order, install?: DiaryEvent): Step {
  const s = staffById(e.assigned);
  if (e.type !== 'Sales') return { key: 'route', label: 'Route it', icon: <IconArrowsSplit size={16} />, hint: 'This is not a new sale. Send it to the right person.' };
  if (e.stage === 'Lost') return { key: 'reopen', label: 'Reopen enquiry', icon: <IconRefresh size={16} />, hint: `Lost: ${e.lostReason || e.next}. Reopen it if the customer comes back.` };
  if (!s) return { key: 'assign', label: 'Assign to salesperson', icon: <IconUserPlus size={16} />, hint: 'Choose who handles this enquiry. It then appears in their pipeline as a new enquiry.' };
  switch (e.stage) {
    case 'New Enquiry': return { key: 'contact', label: 'Contact customer', icon: <IconSend size={16} />, hint: `Email or call ${e.name}. Everything is saved in Communication and the card moves to Contacted.` };
    case 'Contacted': return { key: 'appt', label: 'Book appointment', icon: <IconCalendarEvent size={16} />, hint: 'Book a home visit, showroom visit or video call. The card moves to Appointment.' };
    case 'Appointment': return { key: 'fpSurvey', label: 'Add Framepoint survey', icon: <IconPlugConnected size={16} />, hint: `${s.name.split(' ')[0]} measures up in Framepoint at the visit. Get it straight from Framepoint, or upload the survey report PDF and we read it for you. The card moves to Survey.` };
    case 'Survey': return e.survey?.fp || e.survey?.status === 'Completed'
      ? { key: 'quote', label: 'Send quote', icon: <IconFileInvoice size={16} />, hint: 'The Framepoint survey is in. Send the quote and the survey report to the customer to review.' }
      : { key: 'fpSurvey', label: 'Add Framepoint survey', icon: <IconPlugConnected size={16} />, hint: 'Get the survey from Framepoint, or upload the survey report PDF.' };
    case 'Quote Sent': return { key: 'reply', label: 'Customer replied', icon: <IconMessageReply size={16} />, hint: 'When the customer replies to the quote, the card moves to Follow-up.' };
    case 'Follow-up': return { key: 'decide', label: 'Mark as Won', icon: <IconTrophy size={16} />, hint: 'Read their reply in Communication, then mark it as Won or Lost.' };
  }
  // Won — a surveyor checks every size, then the office takes over
  if (!e.jobId && e.finalSurvey?.status !== 'Done') return e.finalSurvey
    ? { key: 'finalDone', label: 'Final survey done', icon: <IconRulerMeasure size={16} />, hint: `${staffById(e.finalSurvey.surveyor)?.name} visits on ${fmtDate(e.finalSurvey.date)} to check every size. Add the results here (normally sent from their phone).` }
    : { key: 'finalBook', label: 'Book final survey', icon: <IconRulerMeasure size={16} />, hint: 'The customer said yes. Book a surveyor to check the exact sizes before anything is ordered.' };
  if (!e.invite || e.invite.status === 'Not invited') return { key: 'invite', label: 'Review & invite customer', icon: <IconWorld size={16} />, hint: 'Check every detail, then send the customer their portal invite.' };
  if (!e.jobId || !order) return { key: 'order', label: 'Create order & delivery', icon: <IconPackage size={16} />, hint: 'Place the order with the vendor. This creates the job and adds it to the installation diary.' };
  if (order.status === 'Not confirmed') return { key: 'vendor', label: 'Vendor confirmed', icon: <IconCircleCheck size={16} />, hint: `Waiting for ${order.supplier} to confirm order ${order.ref}. Chase them if it takes too long.` };
  if (order.status !== 'Arrived') return { key: 'delivered', label: 'Mark as delivered', icon: <IconTruckDelivery size={16} />, hint: `Delivery due ${order.expected}. When it arrives, check it and mark it as delivered.` };
  if (!install) return { key: 'book', label: 'Book installation', icon: <IconCalendarPlus size={16} />, hint: 'Everything has arrived. Book an installer team in the diary.' };
  return { key: 'snag', label: 'Add snag or aftercare', icon: <IconTool size={16} />, hint: `Installation booked with ${teamById(install.team)?.name} on ${fmtDate(install.date)}. Log any snag or aftercare problem here.` };
}

const JOURNEY = ['New enquiry', 'Contacted', 'Appointment', 'Survey', 'Quote sent', 'Follow-up', 'Won', 'Final survey', 'Order & delivery', 'Installation', 'Aftercare'];
const SALES_IDX: Record<string, number> = { 'New Enquiry': 0, Contacted: 1, Appointment: 2, Survey: 3, 'Quote Sent': 4, 'Follow-up': 5 };

const commIcon: Record<string, [any, string]> = {
  'email-out': [IconMailForward, '#2f6fde'], 'email-in': [IconMail, '#0b6e5c'], call: [IconPhoneCall, '#e0a100'], note: [IconNotes, '#3a4a4a'], system: [IconSettings, '#6b7a78'], reminder: [IconBellRinging, '#d64545'],
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

export default function EnquiryRecord() {
  const { id } = useParams();
  const toast = useToast();
  const st = useStore();
  const { enquiries, orders, events, snags, jobs, updEnq } = st;
  const e = enquiries.find(x => x.id === id) || enquiries[0];
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState<string | null>(null);
  useEffect(() => { setTab('overview'); }, [id]);

  const s = staffById(e.assigned);
  const order = orders.find(o => o.job === e.jobId && e.jobId);
  const job = jobs.find(j => j.id === e.jobId);
  const install = events.find(ev => ev.job === e.jobId && e.jobId && ev.kind === 'install' && ev.team !== 'un');
  const waiting = events.find(ev => ev.job === e.jobId && e.jobId && ev.team === 'un');
  const jobSnags = snags.filter(x => x.job === e.jobId && e.jobId);
  const step = nextStep(e, order, install);
  const t = e.quote ? quoteTotals(e.quote) : null;
  const open = e.type === 'Sales' && !['Won', 'Lost'].includes(e.stage);

  // where are we on the journey?
  let idx = SALES_IDX[e.stage] ?? 6;
  if (e.stage === 'Won') idx = e.finalSurvey?.status === 'Done' || e.jobId ? 8 : 7;
  if (e.stage === 'Won' && order) idx = order.status === 'Arrived' && install ? 9 : 8;
  if (job && ['Installation', 'Snag', 'Complete', 'Aftercare'].includes(job.stage)) idx = job.stage === 'Installation' ? 9 : 10;

  const remind = () => {
    updEnq(e.id, {}, { kind: 'reminder', title: `Reminder sent to ${s?.name}`, body: `Please ${e.next.toLowerCase()} for ${e.name}${e.nextDue && e.nextDue !== 'Today' ? ` (due ${e.nextDue})` : ''}.`, who: 'Sarah Mitchell' });
    toast(`Reminder sent to ${s?.name} · they’ll see it on their phone`);
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
    ...(e.invite?.status === 'Invited' ? [{ label: 'Resend portal invite', icon: <IconWorld size={17} />, on: () => setModal('resend') }] : []),
    ...(e.jobId ? [{ label: 'Add snag or aftercare', icon: <IconTool size={17} />, on: () => setModal('snag') }, { label: `Open job page (${e.jobId})`, icon: <IconExternalLink size={17} />, on: () => { window.location.hash = `#/jobs/${e.jobId}`; } }] : []),
    ...(open && s ? [{ label: 'Mark as Lost', icon: <IconX size={17} />, on: () => setModal('lost'), danger: true }] : []),
  ];

  return (
    <>
      <PageHead title={e.name} crumbs={[{ label: 'Enquiries', to: '/enquiries' }, { label: `${e.id} · ${e.name}` }]}
        actions={<>
          {open && s && <button className="btn btn-outline" onClick={remind}><IconBellRinging size={16} />Remind {s.name.split(' ')[0]}</button>}
          {e.type === 'Sales' && <MoreMenu items={more} />}
          {step.key === 'decide' ? <><button className="btn btn-outline" style={{ color: 'var(--err)' }} onClick={() => setModal('lost')}><IconX size={16} />Mark as Lost</button><button className="btn btn-primary" onClick={() => setModal('won')}><IconTrophy size={16} />Mark as Won</button></>
            : <button className={`btn ${step.key === 'route' ? 'btn-dark' : 'btn-primary'}`} onClick={() => go(step.key)}>{step.icon}{step.label}</button>}
        </>} />

      {/* Header */}
      <Card>
        <div className="hstack" style={{ gap: 16, alignItems: 'flex-start' }}>
          <img src={IMG[e.photo]} alt="" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover' }} />
          <div className="vstack" style={{ gap: 8, flex: 1 }}>
            <div className="hstack" style={{ flexWrap: 'wrap' }}><h2 style={{ fontSize: 20 }}>{e.name}</h2><Tag tone={stageTone[e.stage]}>{e.stage}</Tag>{e.type !== 'Sales' && <Tag tone="warn">{e.type}</Tag>}<Tag tone="grey">{e.product}</Tag>{e.jobId && <Link to={`/jobs/${e.jobId}`}><Tag tone="info">Job {e.jobId}</Tag></Link>}</div>
            <div className="hstack small t2" style={{ gap: 16, flexWrap: 'wrap' }}><span className="hstack" style={{ gap: 5 }}><IconPhone size={14} />{e.phone}</span><span className="hstack" style={{ gap: 5 }}><IconMail size={14} />{e.email}</span><span className="hstack" style={{ gap: 5 }}><IconHome size={14} />{e.address}, {e.postcode}</span></div>
            <div className="hstack" style={{ gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              {([['Received', e.received], ['Salesperson', s ? s.name : 'Not assigned'], ['Surveyor', staffById(e.finalSurvey?.surveyor)?.name || '—'], ['Value', t ? gbp(t.total) : e.value ? gbp(e.value) : '—'], ['Next step', `${e.next} · ${e.nextDue}`]] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}><div className="tiny muted">{l}</div><b style={{ fontSize: 13, color: v === 'Not assigned' || v.endsWith('Overdue') ? 'var(--err)' : 'var(--text)' }}>{v}</b></div>
              ))}
            </div>
          </div>
        </div>
        {e.type === 'Sales' && (
          <div className="stepper journey" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            {JOURNEY.map((j, i) => (
              <React.Fragment key={j}>
                {i > 0 && <span className="step-line" />}
                <span className={`step ${e.stage === 'Lost' ? '' : i < idx ? 'done' : i === idx ? 'now' : ''}`}>{i < idx && e.stage !== 'Lost' && <IconCircleCheck size={14} />}{j}</span>
              </React.Fragment>
            ))}
            {e.stage === 'Lost' && <><span className="step-line" /><span className="step now" style={{ background: 'var(--err)', borderColor: 'var(--err)' }}><IconX size={14} />Lost</span></>}
          </div>
        )}
      </Card>

      {/* What happens next — in plain words */}
      <div className={`alert ${step.key === 'assign' || step.key === 'route' ? 'warn' : e.stage === 'Lost' ? 'err' : 'info'}`}>
        <IconArrowRight size={18} />
        <div><b>Next step: {step.key === 'decide' ? 'Mark as Won or Lost' : step.label}.</b> {step.hint}</div>
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
              !order ? <Empty icon={<IconPackage size={22} />} title="Not ordered yet" sub="Use “Create order & delivery” at the top once the customer has been invited." /> : (
                <div className="vstack" style={{ gap: 16 }}>
                  <div className="between">
                    <span className="hstack" style={{ gap: 10 }}><Avatar i={order.supplier[0]} size={36} /><span className="vstack" style={{ gap: 2 }}><b>{order.supplier} · {order.ref}</b><span className="tiny muted">Job {order.job}{order.confirmRef ? ` · confirmation ${order.confirmRef}` : ''}</span></span></span>
                    {order.status !== 'Arrived' && <button className="btn btn-outline btn-sm" onClick={() => { updEnq(e.id, {}, { kind: 'reminder', title: `Chased ${order.supplier}`, body: `Asked ${order.supplier} to ${order.confirmed ? 'confirm the delivery date' : 'confirm order ' + order.ref}.`, who: 'Sarah Mitchell' }); toast(`Chase email sent to ${order.supplier}`); }}><IconBellRinging size={14} />Chase vendor</button>}
                  </div>
                  <div className="stepper">
                    {['Ordered', 'Vendor confirmed', 'Delivered'].map((x, i) => { const at = order.status === 'Arrived' ? 3 : order.confirmed ? 2 : 1; return <React.Fragment key={x}>{i > 0 && <span className="step-line" />}<span className={`step ${i < at ? 'done' : ''} ${i === at ? 'now' : ''}`}>{i < at && <IconCircleCheck size={14} />}{x}</span></React.Fragment>; })}
                  </div>
                  <Info items={[['Order date', order.ordered], ['Expected delivery', order.expected], ['Frames', order.frames], ['Status', <Tag tone={order.tone}>{order.status}</Tag>], ['Deliver to', e.address], ['Vendor contact', order.supplier === 'Origin' ? 'orders@origin-global.com' : 'orders@emplas.co.uk'], ['Deposit', job ? (job.paid >= job.deposit ? `${gbp(job.deposit)} paid` : `${gbp(job.deposit)} not paid`) : '—'], ['Customer portal', e.invite?.status || '—']]} />
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

      {modal === 'assign' && <AssignModal enquiryId={e.id} onClose={() => setModal(null)} />}
      {modal === 'route' && <RouteModal id={e.id} onClose={() => setModal(null)} />}
      {modal === 'contact' && <ContactModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'email' && <ContactModal e={e} logOnly="email" onClose={() => setModal(null)} onDone={done} />}
      {modal === 'call' && <ContactModal e={e} logOnly="call" onClose={() => setModal(null)} onDone={done} />}
      {modal === 'appt' && <BookApptModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'survey' && <RequestSurveyModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'surveyDone' && <SurveyResultsModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'fpSurvey' && <FramepointSurveyModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'finalBook' && <BookFinalSurveyModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'finalDone' && e.finalSurvey && <FinalSurveyModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'quote' && <SendQuoteModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'reply' && <ReplyModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'won' && <WonModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'lost' && <LostModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'invite' && <InviteModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'resend' && <InviteModal e={e} resend onClose={() => setModal(null)} onDone={done} />}
      {modal === 'order' && <OrderModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'vendor' && <VendorConfirmModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'delivered' && <DeliveredModal e={e} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'book' && e.jobId && <BookInstallModal jobId={e.jobId} presetDate={waiting?.date} onClose={() => { setModal(null); setTab('install'); }} />}
      {modal === 'snag' && <AddSnagModal e={e} onClose={() => setModal(null)} onDone={done} />}
    </>
  );
}
