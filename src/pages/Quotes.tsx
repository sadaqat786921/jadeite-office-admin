// Quotes (Framepoint): every quote in one list. A quote lives on its customer's record,
// so there is no separate quote page: the row opens a preview with the actions for that quote.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconFileText, IconSend, IconMessageReply, IconTrophy, IconX, IconPencil, IconExternalLink, IconChevronRight, IconClock, IconCircleCheck } from '@tabler/icons-react';
import { PageHead, Tag, Avatar, Drawer, Tile, useToast, Empty } from '../components/ui';
import { QuoteDoc, FileChip } from '../components/Lifecycle';
import { ActionModal } from '../components/Journey';
import { useRows, totalsOf, Row } from '../components/derive';
import { gbp, staffById } from '../data/mock';
import { useStore } from '../data/store';
import { fpTotals } from '../data/framepoint';

type QStatus = 'Ready to send' | 'Waiting for reply' | 'Customer replied' | 'Accepted' | 'Declined';
const statusOf = ({ e }: Row): QStatus => (!e.quote ? 'Ready to send' : e.quote.status === 'Accepted' ? 'Accepted' : e.quote.status === 'Declined' || e.stage === 'Lost' ? 'Declined' : e.stage === 'Follow-up' ? 'Customer replied' : 'Waiting for reply');
const tone: Record<QStatus, string> = { 'Ready to send': 'warn', 'Waiting for reply': 'grey', 'Customer replied': 'warn', Accepted: 'ok', Declined: 'err' };
const valueOf = ({ e }: Row) => (e.quote ? totalsOf(e).total : e.survey?.fp ? fpTotals(e.survey.fp.items).total : e.value);

export default function Quotes() {
  const rows = useRows().filter(r => r.e.type === 'Sales' && (r.e.quote || r.e.survey?.fp));
  const [f, setF] = useState<string>('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const filters: string[] = ['All', 'Ready to send', 'Waiting for reply', 'Customer replied', 'Accepted', 'Declined'];
  const list = rows.filter(r => (f === 'All' || statusOf(r) === f) && (r.e.name + (r.e.quote?.ref || r.e.survey?.fp?.ref || '') + r.e.postcode).toLowerCase().includes(q.toLowerCase()));
  const openRow = rows.find(r => r.e.id === open);
  const sum = (s: QStatus[]) => rows.filter(r => s.includes(statusOf(r))).reduce((a, r) => a + valueOf(r), 0);
  return (
    <>
      <PageHead title="Quotes (Framepoint)" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Quotes' }]} />
      <div className="grid-4">
        {[['Waiting for the customer', gbp(sum(['Waiting for reply', 'Customer replied'])), IconClock, `${rows.filter(r => ['Waiting for reply', 'Customer replied'].includes(statusOf(r))).length} quotes`], ['Ready to send', String(rows.filter(r => statusOf(r) === 'Ready to send').length), IconSend, 'Linked from Framepoint'], ['Accepted', gbp(sum(['Accepted'])), IconCircleCheck, `${rows.filter(r => statusOf(r) === 'Accepted').length} quotes won`], ['Win rate', `${Math.round((rows.filter(r => statusOf(r) === 'Accepted').length / Math.max(1, rows.filter(r => ['Accepted', 'Declined'].includes(statusOf(r))).length)) * 100)}%`, IconTrophy, 'Accepted ÷ decided']].map(([l, v, I, s]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}><Tile icon={<I size={22} />} color="#0b6e5c" size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b><span className="tiny muted">{s}</span></div></div>
        ))}
      </div>
      <div className="card flush">
        <div className="toolbar">
          <div className="input-icon" style={{ width: 300 }}><IconSearch size={16} /><input className="input" style={{ height: 36 }} placeholder="Search customer or Framepoint number" value={q} onChange={e => setQ(e.target.value)} /></div>
          {filters.map(s => <button key={s} className={`chip ${f === s ? 'on' : ''}`} onClick={() => setF(s)}>{s}<span className="n">{rows.filter(r => s === 'All' || statusOf(r) === s).length}</span></button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Framepoint quote</th><th>Customer</th><th>Products</th><th>Value (inc. VAT)</th><th>Sent</th><th>Salesperson</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map(r => {
              const { e } = r; const st = statusOf(r);
              return (
                <tr key={e.id} className="click" onClick={() => setOpen(e.id)}>
                  <td><b>{e.quote?.ref || e.survey?.fp?.ref}</b><div className="tiny muted">{(e.versions?.length || 1) > 1 ? `${e.versions!.length} versions` : 'First version'}</div></td>
                  <td><div className="hstack" style={{ gap: 10 }}><Avatar i={e.initials} size={30} /><div className="vstack" style={{ gap: 2 }}><b>{e.name}</b><span className="tiny muted">{e.postcode}</span></div></div></td>
                  <td className="t2">{e.product}</td>
                  <td className="b">{gbp(valueOf(r))}</td>
                  <td className="t2">{e.quote?.sentOn || '—'}</td>
                  <td className="t2">{staffById(e.assigned)?.name || '—'}</td>
                  <td><Tag tone={tone[st]}>{st}</Tag></td>
                  <td><IconChevronRight size={16} color="#6b7a78" /></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={8}><Empty icon={<IconFileText size={22} />} title="No quotes here" sub="Quotes appear once a Framepoint survey is linked to an enquiry." /></td></tr>}
          </tbody>
        </table>
      </div>
      {openRow && <QuoteDrawer r={openRow} onClose={() => setOpen(null)} />}
    </>
  );
}

function QuoteDrawer({ r, onClose }: { r: Row; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const { e } = r;
  const st = statusOf(r);
  const [act, setAct] = useState<string | null>(null);
  const resend = () => { updEnq(e.id, {}, { kind: 'email-out', title: `Reminder: your Jadeite quote ${e.quote!.ref}`, body: `Dear ${e.name}, a friendly reminder about your quote. Reply to this email or accept it online.`, who: staffById(e.assigned)?.name || 'Sarah Mitchell' }); toast(`Quote ${e.quote!.ref} sent again to ${e.email}`); };
  const q = e.quote || (e.survey?.fp ? { ref: e.survey.fp.ref, lines: [], discount: 0, sentOn: 'Not sent', validUntil: '—', sentBy: staffById(e.assigned)?.name || '' } : null);
  return (
    <Drawer title={`Quote ${q?.ref}`} sub={`${e.name} · ${e.product}`} onClose={onClose} width={860}
      footer={<>
        <Link to={`/enquiries/${e.id}`} className="btn btn-grey" style={{ marginRight: 'auto' }}><IconExternalLink size={16} />Open record</Link>
        {st === 'Ready to send' && <button className="btn btn-primary" onClick={() => setAct('quote')}><IconSend size={16} />Send quote</button>}
        {st === 'Waiting for reply' && <><button className="btn btn-outline" onClick={resend}><IconSend size={16} />Send again</button><button className="btn btn-outline" onClick={() => setAct('revise')}><IconPencil size={16} />New version</button><button className="btn btn-primary" onClick={() => setAct('reply')}><IconMessageReply size={16} />Customer replied</button></>}
        {st === 'Customer replied' && <><button className="btn btn-outline" onClick={() => setAct('revise')}><IconPencil size={16} />New version</button><button className="btn btn-outline" style={{ color: 'var(--err)' }} onClick={() => setAct('lost')}><IconX size={16} />Mark as Lost</button><button className="btn btn-primary" onClick={() => setAct('won')}><IconTrophy size={16} />Mark as Won</button></>}
      </>}>
      <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}><Tag tone={tone[st]}>{st}</Tag>{e.quote && <span className="small muted">Sent {e.quote.sentOn} by {e.quote.sentBy} · valid until {e.quote.validUntil}</span>}</div>
      {e.quote ? <QuoteDoc e={e} q={e.quote} /> : <div className="alert warn small">This quote is linked from Framepoint but has not been sent yet.</div>}
      {e.quote?.reply && <div className="vstack" style={{ gap: 6 }}><b style={{ fontSize: 13 }}>Customer's reply</b><div className="small t2" style={{ background: 'var(--tint)', borderRadius: 10, padding: '10px 12px' }}>"{e.quote.reply}"</div></div>}
      {!!e.versions?.length && (
        <div className="vstack" style={{ gap: 6 }}>
          <b style={{ fontSize: 13 }}>Versions</b>
          {[...e.versions].reverse().map(v => <div key={v.ref} className="between small" style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10 }}><span className="hstack" style={{ gap: 8 }}><b>{v.ref}</b>{v.ref === e.quote?.ref && <Tag tone="jade">Active</Tag>}<span className="t2">{v.note}</span></span><span className="t2">{v.on} · {gbp(v.total)}</span></div>)}
        </div>
      )}
      {!!e.quote?.files?.length && <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>{e.quote.files.map(f => <FileChip key={f} name={f} sub="Sent to the customer" onOpen={() => toast(`Opening ${f}`)} />)}</div>}
      {act && <ActionModal k={act} e={e} onClose={() => setAct(null)} />}
    </Drawer>
  );
}
