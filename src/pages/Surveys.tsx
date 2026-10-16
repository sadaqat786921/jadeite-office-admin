import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconCalendar, IconClock, IconMapPin, IconClipboardCheck, IconAlertTriangle, IconCircleCheck, IconArrowBackUp, IconSignature, IconChevronRight } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Tile, Drawer, useToast, Card, CardHead } from '../components/ui';
import { staffById, IMG } from '../data/mock';
import { useStore } from '../data/store';
import { BookSurveyModal } from '../components/Forms';

export default function Surveys() {
  const toast = useToast();
  const [f, setF] = useState('All');
  const [open, setOpen] = useState<any>(null);
  const [book, setBook] = useState(false);
  const { surveys, set, log, updateJob, jobs } = useStore();
  const decide = (sv: any, ok: boolean) => { set('surveys', ss => ss.map(x => (x.id === sv.id ? { ...x, status: ok ? 'Approved' : 'Returned', tone: ok ? 'ok' : 'err' } : x))); if (ok) { const jb = jobs.find(x => x.id === sv.job); if (jb?.stage === 'Survey') updateJob(sv.job, { stage: 'Quote' as any, next: 'Check the quote and order', due: 'Today' }, 'Survey approved by the office'); else log(sv.job, 'Survey approved by the office'); } else log(sv.job, 'Survey sent back to the surveyor: missing photo of the back door frame'); toast(ok ? 'Survey approved · the job moves on to order checks' : 'Sent back to the surveyor with your note'); setOpen(null); };
  const rows = surveys.filter(s => f === 'All' || s.status === f);
  return (
    <>
      <PageHead title="Surveys" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Surveys' }]} actions={<button className="btn btn-primary" onClick={() => setBook(true)}><IconPlus size={16} />Book a survey</button>} />
      <div className="grid-4">
        {[['Booked this week', String(surveys.filter(x => x.status === 'Booked').length), IconCalendar, '#2f6fde'], ['Waiting for your review', String(surveys.filter(x => x.status === 'Needs review').length), IconClipboardCheck, '#e0a100'], ['Approved this month', '14', IconCircleCheck, '#1f9d5b'], ['Returned for correction', String(surveys.filter(x => x.status === 'Returned').length), IconArrowBackUp, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="hstack" style={{ gap: 6 }}>{['All', 'Booked', 'Needs review', 'Approved', 'Returned'].map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}</button>)}</div>
      <div className="grid-3">
        {rows.map(s => {
          const sv = staffById(s.surveyor)!;
          return (
            <div key={s.id} className="card flush" style={{ cursor: 'pointer' }} onClick={() => setOpen(s)}>
              <div style={{ position: 'relative', height: 130 }}><img src={IMG[s.photo]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><span style={{ position: 'absolute', top: 10, left: 10 }}><Tag tone={`solid-${s.tone === 'jade' ? 'ok' : s.tone}`}>{s.status}</Tag></span></div>
              <div className="vstack" style={{ padding: 16, gap: 8 }}>
                <div className="between"><b style={{ fontSize: 15 }}>{s.customer}</b><span className="tiny muted">{s.job}</span></div>
                <span className="small t2 hstack" style={{ gap: 6 }}><IconMapPin size={14} />{s.address}</span>
                <div className="between small t2" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}><span className="hstack" style={{ gap: 6 }}><IconCalendar size={14} />{s.date} · {s.time}</span><Avatar i={sv.initials} size={26} /></div>
                {s.status === 'Needs review' && <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); setOpen(s); }}>Review survey</button>}
              </div>
            </div>
          );
        })}
      </div>
      {book && <BookSurveyModal onClose={() => setBook(false)} />}
      {open && (
        <Drawer title={`Survey · ${open.customer}`} sub={`${open.id} · ${open.job} · by ${staffById(open.surveyor)!.name}`} onClose={() => setOpen(null)} width={560}
          footer={open.status !== 'Needs review' ? <span className="small muted">This survey is {open.status.toLowerCase()}.</span> : <><button className="btn btn-grey" onClick={() => decide(open, false)}><IconArrowBackUp size={16} />Return for correction</button><button className="btn btn-primary" onClick={() => decide(open, true)}><IconCircleCheck size={16} />Approve survey</button></>}>
          <img src={IMG[open.photo]} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10 }} />
          <div className="grid-2">{[['Date', `${open.date} · ${open.time}`], ['Address', open.address], ['Openings measured', '6'], ['Photos', '12']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 3 }}><span className="small muted">{l}</span><b>{v}</b></div>)}</div>
          <Card style={{ padding: 0 }}>
            <table className="tbl"><thead><tr><th>Opening</th><th>Size (W × H)</th><th>Type</th></tr></thead><tbody>{[['Front door', '920 × 2,060', 'Composite'], ['Lounge', '1,210 × 1,180', 'Casement'], ['Bedroom 1', '1,050 × 1,180', 'Casement'], ['Bedroom 2', '1,050 × 1,180', 'Casement']].map(r => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i ? 't2' : 'b'}>{c}</td>)}</tr>)}</tbody></table>
          </Card>
          <div className="alert warn"><IconAlertTriangle size={18} /><div><b>Missing:</b> photo of the back door frame. You can still approve, or return it to the surveyor.</div></div>
          <div className="vstack" style={{ gap: 6 }}><b>Customer confirmation</b><div style={{ border: '1px dashed var(--border-input)', borderRadius: 10, height: 90, display: 'grid', placeItems: 'center', fontFamily: 'cursive', fontSize: 26 }}>{open.customer.split(' ')[0]}</div><span className="tiny muted hstack" style={{ gap: 5 }}><IconSignature size={14} />Signed on the surveyor’s phone</span></div>
        </Drawer>
      )}
    </>
  );
}
