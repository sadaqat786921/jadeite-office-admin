import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconAlertTriangle, IconClock, IconCircleCheck, IconCamera, IconCalendarPlus, IconShieldCheck, IconFileText, IconStar, IconStarFilled, IconSend, IconPhone, IconTool } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Tile, Drawer, useToast, Avatar } from '../components/ui';
import { IMG } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate } from '../data/store';

export function Snags() {
  const toast = useToast();
  const { snags, set, log, events } = useStore();
  const fix = (sn: any) => { set('snags', ss => ss.map(x => (x.id === sn.id ? { ...x, status: 'Fixed', tone: 'ok' } : x))); const left = snags.filter(x => x.job === sn.job && x.id !== sn.id && x.status !== 'Fixed').length; log(sn.job, `Snag fixed: ${sn.title}`); toast(left ? `Snag fixed · ${left} still open on ${sn.job}` : `All snags fixed on ${sn.job} · the job can now be signed off`); setOpen(null); };
  const visit = (sn: any) => { const d = addDays(TODAY, 3); set('events', es => [...es, { id: 'sv' + Date.now(), team: 't2', date: d, days: 1, kind: 'snag', title: `${sn.customer} · snag visit`, sub: `${sn.job} · ${sn.title}`, photo: sn.photo, job: sn.job }]); log(sn.job, `Snag visit booked for ${fmtDate(d)} (Team 2)`); toast(`Snag visit booked · ${fmtDate(d)} · in the diary`); setOpen(null); };
  const [f, setF] = useState('Open');
  const [open, setOpen] = useState<any>(null);
  const rows = snags.filter(s => f === 'All' || (f === 'Open' ? s.status !== 'Fixed' : s.status === f));
  return (
    <>
      <PageHead title="Snags" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Snags' }]} actions={<button className="btn btn-primary"><IconPlus size={16} />Report a snag</button>} />
      <div className="grid-4">
        {[['Open snags', String(snags.filter(x => x.status !== 'Fixed').length), IconAlertTriangle, '#d64545'], ['Waiting for a part', String(snags.filter(x => x.status === 'Waiting part').length), IconClock, '#e0a100'], ['Fixed this month', String(snags.filter(x => x.status === 'Fixed').length), IconCircleCheck, '#1f9d5b'], ['Average time to fix', '4 days', IconTool, '#2f6fde']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="alert info small"><IconAlertTriangle size={16} />A job with an open snag stays marked as <b>&nbsp;Snag&nbsp;</b> — it is never shown as fully closed until every snag is fixed.</div>
      <div className="hstack" style={{ gap: 6 }}>{['Open', 'Waiting part', 'Fixed', 'All'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}</div>
      <div className="grid-3">
        {rows.map(s => (
          <div key={s.id} className="card" style={{ cursor: 'pointer', gap: 12 }} onClick={() => setOpen(s)}>
            <div className="hstack" style={{ gap: 12 }}>
              <img src={IMG[s.photo]} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
              <div className="vstack" style={{ gap: 3, flex: 1 }}><b style={{ fontSize: 14 }}>{s.title}</b><span className="small muted">{s.customer} · {s.job} · {s.owner}</span></div>{(s as any).kind === 'Aftercare' && <Tag tone="info">Aftercare</Tag>}
            </div>
            <span className="small t2">{s.detail}</span>
            <div className="between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span className="tiny muted">{s.reported}</span>
              <span className="hstack"><Tag tone={s.severity === 'Major' ? 'err' : 'grey'}>{s.severity}</Tag><Tag tone={s.tone}>{s.status}</Tag></span>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Drawer title={open.title} sub={`${open.id} · ${open.customer} · ${open.job}`} onClose={() => setOpen(null)}
          footer={open.status === 'Fixed' ? <span className="small muted">This snag is fixed.</span> : <><button className="btn btn-grey" onClick={() => visit(open)}><IconCalendarPlus size={16} />Book snag visit</button><button className="btn btn-primary" onClick={() => fix(open)}><IconCircleCheck size={16} />Mark as fixed</button></>}>
          <img src={IMG[open.photo]} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} />
          <div className="grid-2">{[['Reported', open.reported], ['Severity', open.severity], ['Status', open.status], ['Who will fix it', open.owner]].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 3 }}><span className="small muted">{l}</span><b>{v}</b></div>)}</div>
          <div className="vstack" style={{ gap: 6 }}><b>What’s wrong</b><span className="t2">{open.detail}</span></div>
          <div className="field"><label>Update</label><textarea className="textarea" placeholder="e.g. Replacement handle ordered from Emplas, arriving Tuesday" /></div>
          <span className="hstack small muted" style={{ gap: 6 }}><IconCamera size={15} />Installers can add photos from their phone</span>
        </Drawer>
      )}
    </>
  );
}

export function Aftercare() {
  const toast = useToast();
  const { jobs, log } = useStore();
  const done = jobs.filter(j => j.stage === 'Complete' || j.stage === 'Snag');
  return (
    <>
      <PageHead title="Aftercare" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Aftercare' }]} actions={<button className="btn btn-primary"><IconPlus size={16} />Log aftercare request</button>} />
      <div className="photo-hero" style={{ minHeight: 160 }}>
        <img src={IMG.orangery} alt="" />
        <div className="inner vstack" style={{ gap: 8, maxWidth: 620 }}>
          <span style={{ alignSelf: 'flex-start' }}><Tag tone="solid-ok">Aftercare</Tag></span>
          <h2 style={{ fontSize: 24 }}>Look after customers once the job is done</h2>
          <span style={{ color: '#d3e3de' }}>Send guarantees and care guides, handle aftercare calls and ask happy customers for a review.</span>
        </div>
      </div>
      <div className="row">
        <Card className="grow">
          <CardHead title="Recently finished jobs" sub="Send the guarantee pack after sign-off" />
          <div className="list">
            {done.map(j => (
              <div key={j.id} className="hstack" style={{ gap: 12, padding: '12px 0' }}>
                <img src={IMG[j.photo]} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                <div className="vstack" style={{ gap: 3, flex: 1 }}><Link to={`/jobs/${j.id}`} className="b">{j.customer}</Link><span className="small muted">{j.id} · {j.products}</span></div>
                {j.stage === 'Snag' ? <Tag tone="err">Snag open — wait</Tag> : <><Tag tone="ok">Signed off</Tag><button className="btn btn-primary btn-sm" onClick={() => { log(j.id, 'Guarantee pack and care guide sent to the customer portal'); toast('Guarantee and care guide sent to the portal'); }}><IconSend size={14} />Send guarantee pack</button></>}
              </div>
            ))}
          </div>
        </Card>
        <div className="col w-360">
          <Card>
            <CardHead title="Aftercare requests" />
            {[['The Greens', 'Door draught · fixed', 'ok'], ['Mr Khan', 'Asked about cleaning the roof', 'info']].map(([n, t, tone]) => <div key={n} className="hstack" style={{ gap: 10 }}><IconPhone size={16} color="#0b6e5c" /><div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 13 }}>{n}</b><span className="tiny muted">{t}</span></div><Tag tone={tone}>{tone === 'ok' ? 'Closed' : 'Open'}</Tag></div>)}
          </Card>
          <Card>
            <CardHead title="Reviews" sub="Average 4.8 from 37 reviews" />
            <div className="hstack" style={{ gap: 4, color: '#e0a100' }}>{[1, 2, 3, 4, 5].map(i => <IconStarFilled key={i} size={18} />)}<b style={{ color: 'var(--text)', marginLeft: 6 }}>4.8</b></div>
            <div className="card" style={{ padding: 12, gap: 6, background: 'var(--bg)' }}><b style={{ fontSize: 13 }}>Mr Khan</b><span className="small t2">“The team were tidy, polite and the roof looks amazing.”</span></div>
          </Card>
          <Card>
            <CardHead title="Documents sent after sign-off" />
            {['10-year guarantee', 'Window and door care guide', 'FENSA certificate'].map(d => <div key={d} className="hstack small" style={{ gap: 8 }}><IconFileText size={16} color="#0b6e5c" />{d}</div>)}
          </Card>
        </div>
      </div>
    </>
  );
}
