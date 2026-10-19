import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  IconPhoneCall, IconMessage, IconPlus, IconCalendarPlus, IconCircleCheck, IconCalendar, IconUser, IconChevronRight, IconExternalLink, IconFileText,
  IconUpload, IconEye, IconEyeOff, IconSend, IconPhone, IconMail, IconWorld, IconNotes, IconCamera, IconSignature, IconAlertTriangle,
  IconRuler, IconPackage, IconTruck, IconTool, IconCurrencyPound, IconDownload, IconLock, IconClock, IconMapPin, IconCheck, IconHistory, IconShieldCheck, IconChecklist, IconClipboardCheck,
} from '@tabler/icons-react';
import { Card, CardHead, Tag, Avatar, Tabs, Tile, Progress, Switch, Check, useToast, PageHead } from '../components/ui';
import { BookInstallModal, LogCallModal, SignOffModal, AddTaskModal, BookSurveyModal } from '../components/Forms';
import { useStore, TODAY, fmtDate } from '../data/store';
import { JOB_STAGES, IMG, gbp, staffById, teamById, invoices } from '../data/mock';
import { jobTone } from './Jobs';

export default function JobDetail() {
  const { id } = useParams();
  const { jobs, tasks, snags, updateJob, events, enquiries } = useStore();
  const record = enquiries.find(x => x.jobId === (id || ''));
  const j = jobs.find(x => x.id === id) || jobs[0];
  const toast = useToast();
  const jobTasks = tasks.filter(t => t.job === j.id);
  const openSnags = snags.filter(sn => sn.job === j.id && sn.status !== 'Fixed');
  const booking = events.find(e => e.job === j.id && e.kind === 'install' && e.team !== 'un' && e.date >= TODAY);
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState<string | null>(null);
  const [vis, setVis] = useState<Record<string, boolean>>({});
  const si = JOB_STAGES.indexOf(j.stage);
  const team = teamById(j.team);
  const people = [
    [staffById(j.sales)?.initials, staffById(j.sales)?.name, 'Salesperson'],
    [staffById(j.surveyor)?.initials, staffById(j.surveyor)?.name, 'Surveyor'],
    [team?.initials || '—', team ? `${team.name} · ${team.members}` : 'Not booked yet', 'Installers'],
    ['SM', 'Sarah Mitchell', 'Office admin'],
    ['TR', 'Tom Reed', 'Supplier · Emplas'],
  ];
  return (
    <>
      <PageHead title={`${j.id} · ${j.customer}`} crumbs={[{ label: 'Jobs', to: '/jobs' }, { label: j.id }]}
        actions={<>{record && <Link to={`/enquiries/${record.id}`} className="btn btn-outline"><IconFileText size={16} />Full record</Link>}<button className="btn btn-grey" onClick={() => setModal('call')}><IconPhoneCall size={16} />Log a call</button><button className="btn btn-outline" onClick={() => setTab('messages')}><IconMessage size={16} />Message customer</button>{['Installation', 'Snag'].includes(j.stage) ? <button className="btn btn-primary" onClick={() => setModal('signoff')}><IconShieldCheck size={16} />Sign off job</button> : j.stage === 'Complete' ? <Tag tone="solid-ok">Completed</Tag> : <button className="btn btn-primary" onClick={() => setModal(booking ? 'change' : 'book')}><IconCalendarPlus size={16} />{booking ? 'Change installation' : 'Book installation'}</button>}</>} />

      <div className="photo-hero">
        <img src={IMG[j.photo]} alt="" style={{ objectPosition: 'center 40%' }} />
        <div className="inner vstack" style={{ gap: 18 }}>
          <div className="hstack" style={{ gap: 16 }}>
            <span className="avatar" style={{ width: 64, height: 64, fontSize: 22, background: '#00c7a1', color: '#0b1f1b', borderRadius: 14 }}>{j.initials}</span>
            <div className="vstack" style={{ gap: 6 }}>
              <div className="hstack"><Tag tone="solid-ok">{j.id}</Tag><Tag tone={`solid-${jobTone[j.stage] === 'err' ? 'err' : jobTone[j.stage] === 'warn' ? 'warn' : 'ok'}`}>{j.stage}</Tag>{j.blocked && <Tag tone="solid-err" icon={<IconAlertTriangle size={12} />}>{j.blocked}</Tag>}</div>
              <h2 style={{ fontSize: 24, letterSpacing: -0.3 }}>{j.customer}</h2>
              <span className="hstack" style={{ gap: 16, color: '#d3e3de', flexWrap: 'wrap' }}><span className="hstack" style={{ gap: 5 }}><IconMapPin size={15} />{j.address}, {j.postcode}</span><span className="hstack" style={{ gap: 5 }}><IconPhone size={15} />{j.phone}</span><span className="hstack" style={{ gap: 5 }}><IconWorld size={15} />Portal: {j.portal}</span></span>
            </div>
            <div className="ml-auto hstack" style={{ gap: 12 }}>
              {[['Job value', gbp(j.value)], ['Paid', gbp(j.paid)], ['Checklist', `${j.checklist}%`]].map(([l, v]) => <div key={l} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '10px 16px', minWidth: 110 }}><div className="tiny" style={{ color: '#cfe0db' }}>{l}</div><b style={{ fontSize: 17 }}>{v}</b></div>)}
            </div>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            {JOB_STAGES.map((s, i) => (
              <div key={s} className="vstack" style={{ flex: 1, gap: 6 }}>
                <div style={{ height: 6, borderRadius: 3, background: i < si ? '#00c7a1' : i === si ? '#ffffff' : 'rgba(255,255,255,.22)' }} />
                <span className="tiny" style={{ color: i <= si ? '#fff' : '#9fb5af', fontWeight: i === si ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { id: 'overview', label: 'Overview' }, { id: 'survey', label: 'Survey' }, { id: 'quote', label: 'Quote' }, { id: 'order', label: 'Order' }, { id: 'delivery', label: 'Delivery' },
        { id: 'installation', label: 'Installation' }, { id: 'documents', label: 'Documents', n: 7 }, { id: 'messages', label: 'Messages', n: 4 }, { id: 'payments', label: 'Payments' }, { id: 'notes', label: 'Notes', n: 3 }, { id: 'history', label: 'History', n: j.history.length },
      ]} />

      {tab === 'overview' && (
        <div className="row">
          <div className="col grow">
            <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, background: j.overdue ? '#fdeeee' : 'var(--tint)', borderColor: j.overdue ? '#f4cccc' : '#cdebe2' }}>
              <Tile icon={j.overdue ? <IconAlertTriangle size={22} /> : <IconClock size={22} />} color={j.overdue ? '#d64545' : '#0b6e5c'} size={48} solid />
              <div className="vstack" style={{ gap: 3, flex: 1 }}><span className="small t2">Next action</span><b style={{ fontSize: 16 }}>{j.next}</b><span className="small t2">Owner: <b>{j.owner}</b> · Due: <b style={{ color: j.overdue ? 'var(--err)' : 'var(--text)' }}>{j.due}</b></span></div>
              <button className="btn btn-dark" onClick={() => toast('Marked as done · next step created')}><IconCheck size={16} />Mark done</button>
            </div>
            {j.stage === 'Survey' && (
              <Card style={{ borderColor: '#cfe0fb', background: '#f6f9ff' }}>
                <CardHead title="Is a survey still needed?" sub="Some jobs were already surveyed during the sale. Check before booking a technical survey." />
                <div className="hstack" style={{ gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => { updateJob(j.id, { stage: 'Quote' as any, next: 'Order checks', due: 'Today' }, 'Existing sales survey used — no technical survey needed'); toast('Using the existing survey · go on to the order checks'); }}>No — use the existing survey</button>
                  <button className="btn btn-primary" onClick={() => setModal('survey')}><IconClipboardCheck size={16} />Yes — book a survey</button>
                </div>
              </Card>
            )}
            {j.signedOff && <div className="alert ok"><IconShieldCheck size={18} />{j.signedOff.refused ? `Completed without a signature — ${j.signedOff.refused}` : `Signed off by ${j.signedOff.by} on ${j.signedOff.when}`}.</div>}
            {openSnags.length > 0 && <div className="alert err"><IconAlertTriangle size={18} /><div><b>{openSnags.length} open snag{openSnags.length > 1 ? 's' : ''}</b> — this job stays marked “Snag” until they are fixed. <Link to="/snags" className="link">Open snags</Link></div></div>}
            <Card>
              <CardHead title="Products on this job" />
              {j.productList.map(p => (
                <div key={p.name} className="hstack" style={{ gap: 14 }}>
                  <img src={IMG[p.photo]} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                  <div className="vstack" style={{ gap: 4, flex: 1 }}><b>{p.name}</b><span className="small muted">{p.detail}</span><Progress value={p.ready} color={p.ready === 100 ? '#1f9d5b' : '#00c7a1'} /></div>
                  <Tag tone={p.ready === 100 ? 'ok' : p.ready > 0 ? 'warn' : 'grey'}>{p.ready === 100 ? 'Ready' : p.ready > 0 ? `${p.ready}% made` : 'Not ordered'}</Tag>
                </div>
              ))}
            </Card>
            <Card>
              <CardHead title="People on this job" />
              <div className="grid-3" style={{ gap: 12 }}>
                {people.map(([i, n, r]) => (
                  <div key={r} className="card" style={{ padding: 12, gap: 10 }}>
                    <div className="hstack" style={{ gap: 10 }}><Avatar i={i || '—'} size={38} bg={r === 'Installers' ? '#0b1f1b' : undefined} fg={r === 'Installers' ? '#00c7a1' : undefined} /><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{n}</b><span className="tiny muted">{r}</span></div></div>
                    <div className="hstack" style={{ gap: 6 }}><button className="btn btn-grey btn-xs" style={{ flex: 1 }}><IconPhone size={13} />Call</button><button className="btn btn-grey btn-xs" style={{ flex: 1 }}><IconMessage size={13} />Message</button></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="col w-360">
            <Card>
              <CardHead title="Tasks" sub="Owner and due date on every task" right={<button className="btn btn-outline btn-xs" onClick={() => setModal('task')}><IconPlus size={13} />Add</button>} />
              {jobTasks.length === 0 && <span className="small muted">No tasks on this job.</span>}
              {jobTasks.map(t => <div key={t.id} className="hstack small" style={{ gap: 8 }}><Check on={t.done} /><span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span><span className="tiny" style={{ color: !t.done && t.due < TODAY ? 'var(--err)' : 'var(--muted)' }}>{staffById(t.owner)?.name.split(' ')[0]} · {t.due === TODAY ? 'Today' : fmtDate(t.due)}</span></div>)}
            </Card>
            <Card>
              <CardHead title="Key dates" />
              <div className="timeline">
                {j.dates.map(d => (
                  <div key={d.label} className="tl-item">
                    <span className="tile" style={{ width: 30, height: 30, borderRadius: 15, background: d.done ? '#1f9d5b' : 'var(--tint)', color: d.done ? '#fff' : 'var(--primary-dark)' }}>{d.done ? <IconCheck size={15} stroke={3} /> : <IconCalendar size={15} />}</span>
                    <div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{d.label}</b><span className="small" style={{ color: d.date.includes('Not') || d.date.includes('To book') ? 'var(--warn)' : 'var(--text-2)' }}>{d.date}</span></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHead title="Payments" sub="From Xero · view only" right={<button className="link" onClick={() => setTab('payments')}>View</button>} />
              {[['Job total', gbp(j.value)], ['Deposit', gbp(j.deposit)], ['Paid so far', gbp(j.paid)], ['Still to pay', gbp(j.value - j.paid)]].map(([l, v], i) => <div key={l} className="between"><span className="t2">{l}</span><b style={{ color: i === 3 && j.value - j.paid > 0 ? 'var(--warn)' : 'var(--text)' }}>{v}</b></div>)}
              <Progress value={(j.paid / j.value) * 100} color="#1f9d5b" height={8} />
            </Card>
            <Card>
              <CardHead title="Checklist progress" sub="Set by System Admin · ticked by the team" />
              {[['Survey', 100], ['Order', j.checklist > 40 ? 90 : 40], ['Delivery', j.checklist > 60 ? 80 : 0], ['Installation', j.checklist > 80 ? 70 : 0], ['Sign-off', j.checklist === 100 ? 100 : 0]].map(([l, v]: any) => (
                <div key={l} className="hstack" style={{ gap: 10 }}><span className="small" style={{ width: 82 }}>{l}</span><div style={{ flex: 1 }}><Progress value={v} color={v === 100 ? '#1f9d5b' : '#00c7a1'} /></div><b className="small" style={{ width: 36, textAlign: 'right' }}>{v}%</b></div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {tab === 'survey' && (
        <div className="row">
          <div className="col grow">
            <Card>
              <CardHead title="Measurements" sub={`Survey by ${staffById(j.surveyor)?.name} · 02 Oct 2026`} right={<Tag tone="ok">Approved</Tag>} />
              <table className="tbl"><thead><tr><th>Location</th><th>Type</th><th>Width</th><th>Height</th><th>Notes</th></tr></thead>
                <tbody>{[['Front bedroom', 'Casement', '1,210 mm', '1,180 mm', 'Restrictor needed'], ['Back bedroom', 'Casement', '1,050 mm', '1,180 mm', '—'], ['Lounge bay', '3-part bay', '2,640 mm', '1,350 mm', 'Bay pole check'], ['Kitchen', 'Casement', '900 mm', '1,000 mm', 'Above sink'], ['Front door', 'Composite door', '920 mm', '2,060 mm', 'Low threshold'], ['Rear', 'Bi-fold, 3 pane', '2,400 mm', '2,100 mm', 'Opens out to the left']].map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? 'b' : 't2'}>{c}</td>)}</tr>)}</tbody>
              </table>
            </Card>
            <Card>
              <CardHead title="Site photos" sub="Taken on the surveyor’s phone" />
              <div className="grid-4" style={{ gap: 12 }}>{[IMG.house, IMG.window, IMG.door, IMG.bifold].map((p, i) => <img key={i} src={p} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10 }} />)}</div>
            </Card>
          </div>
          <div className="col w-360">
            <Card>
              <CardHead title="Site risks" />
              {[['Dog in the garden', 'warn'], ['Parking on the drive only', 'info'], ['Asbestos check: none found', 'ok']].map(([t, tone]) => <div key={t} className="hstack small" style={{ gap: 8 }}><Tag tone={tone}>{tone === 'ok' ? 'OK' : tone === 'warn' ? 'Risk' : 'Note'}</Tag>{t}</div>)}
            </Card>
            <Card>
              <CardHead title="Customer confirmation" />
              <div style={{ border: '1px dashed var(--border-input)', borderRadius: 10, height: 110, display: 'grid', placeItems: 'center', fontFamily: 'cursive', fontSize: 30, color: '#0b1f1b' }}>S. Smith</div>
              <span className="small muted hstack" style={{ gap: 6 }}><IconSignature size={15} />Signed on the surveyor’s phone · 02 Oct, 11:24</span>
            </Card>
            <div className="hstack" style={{ gap: 10 }}><button className="btn btn-grey" style={{ flex: 1 }}>Return for correction</button><button className="btn btn-primary" style={{ flex: 1 }}>Approved</button></div>
          </div>
        </div>
      )}

      {tab === 'quote' && (
        <div className="row">
          <Card className="grow">
            <CardHead title="Quote FP-55109" sub="Made in Framepoint · signed online by the customer on 30 Sep" right={<><Tag tone="ok">Accepted</Tag><button className="btn btn-outline btn-sm"><IconExternalLink size={14} />Open in Framepoint</button></>} />
            <table className="tbl"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>{j.productList.map(p => <tr key={p.name}><td><div className="hstack" style={{ gap: 10 }}><img src={IMG[p.photo]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /><div className="vstack" style={{ gap: 2 }}><b>{p.name}</b><span className="tiny muted">{p.detail}</span></div></div></td><td>{p.qty}</td><td className="b">{gbp(Math.round(j.value / j.productList.length))}</td></tr>)}
                <tr><td className="b">Total including VAT</td><td></td><td className="bb" style={{ fontSize: 15 }}>{gbp(j.value)}</td></tr></tbody>
            </table>
          </Card>
          <Card className="w-360">
            <CardHead title="Shown to the customer" />
            <div className="hstack" style={{ gap: 10 }}><IconFileText size={20} color="#0b6e5c" /><div className="vstack" style={{ gap: 2, flex: 1 }}><b>Quote FP-55109.pdf</b><span className="tiny muted">Visible in the customer portal</span></div><Switch on /></div>
            <div className="alert ok small"><IconCircleCheck size={16} />Signed online · 30 Sep 2026, 19:42</div>
          </Card>
        </div>
      )}

      {tab === 'order' && (
        <div className="row">
          <Card className="grow">
            <CardHead title="Supplier order" sub="Entered by the office · no automatic supplier link" right={<Tag tone="jade">Confirmed</Tag>} />
            <div className="grid-4" style={{ rowGap: 14 }}>{[['Supplier', 'Emplas'], ['Order ref', 'SO-48238'], ['Ordered', '13 Oct 2026'], ['Confirmed by supplier', '13 Oct 2026'], ['Expected delivery', '20 Oct 2026'], ['Frames', '0 of 8 delivered'], ['Supplier contact', 'Tom Reed'], ['Order value', '£6,420']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 4 }}><span className="small muted">{l}</span><b>{v}</b></div>)}</div>
          </Card>
          <Card className="w-360">
            <CardHead title="Order check before sending" />
            {['Sizes match the approved survey', 'Colours match the quote', 'Glass type checked', 'Handles and locks checked', 'Quote total matches the order'].map(c => <Check key={c} on label={c} />)}
            <div className="alert ok small"><IconCircleCheck size={16} />All 5 checks done by Sarah M · 13 Oct</div>
          </Card>
        </div>
      )}

      {tab === 'delivery' && (
        <Card>
          <CardHead title="Delivery" sub="Booked with Emplas" right={<><button className="btn btn-outline btn-sm"><IconAlertTriangle size={14} />Report damage</button><button className="btn btn-primary btn-sm" onClick={() => toast('Marked as arrived · installation can be booked')}><IconTruck size={14} />Mark as arrived</button></>} />
          <div className="grid-4">{[['Date', 'Tue 20 Oct 2026'], ['Time window', '08:00 – 10:00'], ['Where', 'Customer’s driveway'], ['Status', 'Confirmed']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 4 }}><span className="small muted">{l}</span><b>{v}</b></div>)}</div>
          <div className="divider" />
          <b>What is arriving</b>
          {j.productList.map(p => <div key={p.name} className="hstack" style={{ gap: 12 }}><img src={IMG[p.photo]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /><span style={{ flex: 1 }}>{p.name}</span><Check on={false} label={<span className="small t2">Checked on arrival</span>} /></div>)}
        </Card>
      )}

      {tab === 'installation' && (
        <div className="row">
          <div className="col grow">
            <Card>
              <CardHead title="Installation booking" right={team ? <Tag tone="ok">Booked</Tag> : <Tag tone="warn">Not booked</Tag>} />
              {team ? (
                <div className="grid-4">{[['Dates', j.dates.find(d => d.label.includes('Install'))?.date || '—'], ['Team', `${team.name} · ${team.members}`], ['Arrival', '08:30 – 09:30'], ['Customer told', 'Yes · email and portal']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 4 }}><span className="small muted">{l}</span><b>{v}</b></div>)}</div>
              ) : <div className="hstack" style={{ gap: 12 }}><span className="t2">This job is not in the diary yet.</span><button className="btn btn-primary btn-sm" onClick={() => setModal('book')}><IconCalendarPlus size={14} />Book installation</button></div>}
            </Card>
            <Card>
              <CardHead title="Installer checklist" sub="Ticked live on the installer’s phone" />
              {[['Arrived on site and spoke to the customer', true], ['Dust sheets down, old frames removed', true], ['New frames fitted and level', true], ['Sealed inside and out', false], ['Handles, locks and restrictors tested', false], ['Site cleaned and old frames taken away', false], ['Customer shown how everything works', false]].map(([t, on]: any) => <Check key={t} on={on} label={t} />)}
            </Card>
          </div>
          <div className="col w-360">
            <Card>
              <CardHead title="Job pack for installers" />
              {['Approved survey and sizes', 'Drawings from Framepoint', 'Site risks', 'Customer contact and parking'].map(t => <div key={t} className="hstack small" style={{ gap: 8 }}><IconFileText size={16} color="#0b6e5c" />{t}</div>)}
              <span className="tiny muted">Installers never see prices or other customers.</span>
            </Card>
            <Card>
              <CardHead title="Photos from site" />
              <div className="grid-2" style={{ gap: 8 }}>{[IMG.window, IMG.bifold].map(p => <img key={p} src={p} alt="" style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8 }} />)}</div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHead title="Documents" sub="Choose what the customer can see in their portal" right={<button className="btn btn-primary btn-sm"><IconUpload size={14} />Upload</button>} />
          <table className="tbl"><thead><tr><th>Document</th><th>Type</th><th>Added</th><th>Visible to customer</th><th></th></tr></thead>
            <tbody>{[['Quote FP-55109.pdf', 'Quote', '30 Sep', true], ['Survey drawings.pdf', 'Drawing', '02 Oct', true], ['Order SO-48238.pdf', 'Supplier order', '13 Oct', false], ['Installation guide.pdf', 'Preparation', '14 Oct', true], ['Site photos (12)', 'Photos', '02 Oct', false], ['10-year guarantee.pdf', 'Guarantee', 'After sign-off', false], ['Window care guide.pdf', 'Care guide', 'After sign-off', false]].map(([n, t, d, v]: any) => (
              <tr key={n}><td><span className="hstack" style={{ gap: 8 }}><IconFileText size={18} color="#0b6e5c" /><b>{n}</b></span></td><td className="t2">{t}</td><td className="t2">{d}</td><td><span className="hstack" style={{ gap: 8 }}><Switch on={vis[n] ?? v} onChange={x => { setVis(m => ({ ...m, [n]: x })); toast(x ? `${n} is now visible to the customer` : `${n} is now hidden from the customer`); }} />{(vis[n] ?? v) ? <span className="small hstack" style={{ gap: 4, color: 'var(--ok)' }}><IconEye size={14} />Visible</span> : <span className="small hstack muted" style={{ gap: 4 }}><IconEyeOff size={14} />Hidden</span>}</span></td><td><button className="btn btn-outline btn-xs"><IconDownload size={13} />Download</button></td></tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      {tab === 'messages' && (
        <Card>
          <CardHead title="Messages and calls" sub="Emails (Outlook), portal messages and calls for this job" />
          <div className="vstack" style={{ gap: 14 }}>
            <div className="chat-bubble in"><div className="tiny b muted hstack" style={{ gap: 6, marginBottom: 4 }}><IconWorld size={13} />Portal · {j.customer} · 10:42</div>Thanks! Will the fitters need the driveway clear?</div>
            <div className="chat-bubble out"><div className="tiny b hstack" style={{ gap: 6, marginBottom: 4, color: 'var(--primary-dark)' }}><IconWorld size={13} />Portal · Sarah Mitchell · 10:51</div>Yes please — the van needs the driveway from 8:30. We’ll text when they’re on the way.</div>
            <div className="chat-bubble note"><div className="tiny b hstack" style={{ gap: 6, marginBottom: 4, color: '#8a6400' }}><IconLock size={13} />Internal note · not shown to the customer</div>Customer prefers calls in the morning.</div>
            <div className="chat-bubble in"><div className="tiny b muted hstack" style={{ gap: 6, marginBottom: 4 }}><IconMail size={13} />Email · Outlook · yesterday</div>Re: Your delivery date — Tuesday works for us, thank you.</div>
          </div>
          <div className="card" style={{ padding: 12, gap: 10 }}>
            <textarea className="textarea" placeholder={`Write to ${j.customer}…`} style={{ border: 0, padding: 0, minHeight: 60 }} />
            <div className="hstack"><select className="select" style={{ width: 210, height: 34 }}><option>Send as portal message</option><option>Send as email (Outlook)</option><option>Save as internal note</option></select><button className="btn btn-primary btn-sm ml-auto" onClick={() => toast('Message sent')}><IconSend size={14} />Send</button></div>
          </div>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <CardHead title="Payments from Xero" sub="Xero is the source of truth — invoices are created there" right={<button className="btn btn-outline btn-sm"><IconExternalLink size={14} />Open in Xero</button>} />
          <table className="tbl"><thead><tr><th>Invoice</th><th>Type</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>{(invoices.filter(i => i.job === j.id).length ? invoices.filter(i => i.job === j.id) : invoices.slice(0, 2)).map(i => <tr key={i.ref}><td className="b">{i.ref}</td><td>{i.type}</td><td className="b">{gbp(i.amount)}</td><td>{gbp(i.paid)}</td><td className="t2">{i.due}</td><td><Tag tone={i.tone}>{i.status}</Tag></td></tr>)}</tbody>
          </table>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <CardHead title="Internal notes" sub="Only staff can see these — never shown to the customer" />
          {[['MH', 'Mike Harris', 'Customer prefers calls in the morning.', '02 Oct'], ['PS', 'Priya Shah', 'Dog in the garden — keep the side gate shut.', '02 Oct'], ['SM', 'Sarah Mitchell', 'Balance to be paid by bank transfer.', '13 Oct']].map(([i, n, t, d]) => (
            <div key={t} className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}><Avatar i={i} size={34} /><div className="vstack" style={{ gap: 3, flex: 1 }}><div className="hstack"><b>{n}</b><span className="tiny muted">{d}</span></div><span className="t2">{t}</span></div></div>
          ))}
          <div className="hstack" style={{ gap: 10 }}><input className="input" placeholder="Add a note for the team…" /><button className="btn btn-primary" onClick={() => toast('Note added')}>Add note</button></div>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHead title="History" sub="Every important change is saved here with who did it and when. It can’t be edited." />
          <div className="timeline">
            {j.history.map((h, i) => (
              <div key={i} className="tl-item"><span className="tile" style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(84,39,180,.1)', color: '#5427b4' }}><IconHistory size={15} /></span><div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 13 }}>{h.what}</b><span className="tiny muted">{h.when} · {h.who}</span></div></div>
            ))}
          </div>
        </Card>
      )}

      {modal === 'book' && <BookInstallModal jobId={j.id} onClose={() => setModal(null)} />}
      {modal === 'change' && booking && <BookInstallModal event={booking} onClose={() => setModal(null)} />}
      {modal === 'signoff' && <SignOffModal jobId={j.id} onClose={() => setModal(null)} />}
      {modal === 'task' && <AddTaskModal jobId={j.id} onClose={() => setModal(null)} />}
      {modal === 'survey' && <BookSurveyModal jobId={j.id} onClose={() => setModal(null)} />}
      {modal === 'call' && <LogCallModal who={j.customer} onClose={() => setModal(null)} />}
    </>
  );
}
