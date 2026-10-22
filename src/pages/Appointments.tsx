import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconCalendarEvent, IconClipboardCheck, IconPhone, IconAlertTriangle, IconBrandWindows, IconRefresh, IconMapPin, IconClock, IconChecklist, IconCheck } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Tag, Avatar, Seg, Check, Tile, useToast } from '../components/ui';
import { AddApptModal, AddTaskModal, BookSurveyModal } from '../components/Forms';
import { staffById, staff } from '../data/mock';
import { useStore, TODAY, fmtDate, addDays } from '../data/store';

const kindIcon: any = { 'Sales visit': IconCalendarEvent, Survey: IconClipboardCheck, 'Follow-up call': IconPhone, 'Snag visit': IconAlertTriangle };
const kindColor: any = { 'Sales visit': '#0b6e5c', Survey: '#0b6e5c', 'Follow-up call': '#e0a100', 'Snag visit': '#d64545' };

export default function Appointments() {
  const toast = useToast();
  const { appts, tasks, set } = useStore();
  const [f, setF] = useState('all');
  const [who, setWho] = useState('all');
  const [tf, setTf] = useState('open');
  const [modal, setModal] = useState<string | null>(null);
  const list = appts.filter(a => (f === 'all' || a.kind === f) && (who === 'all' || a.who === who)).sort((a, b) => a.date.localeCompare(b.date));
  const days = Array.from(new Set(list.map(a => a.date)));
  const overdueAppts = appts.filter(a => a.status === 'Overdue');
  const tl = tasks.filter(t => (tf === 'open' ? !t.done : tf === 'mine' ? t.owner === 'sm' && !t.done : t.done)).sort((a, b) => a.due.localeCompare(b.due));
  const lateTasks = tasks.filter(t => !t.done && t.due < TODAY);
  const notSynced = appts.filter(a => !a.synced).length;
  return (
    <>
      <PageHead title="Appointments & tasks" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Appointments & tasks' }]}
        actions={<><button className="btn btn-grey" onClick={() => setModal('task')}><IconChecklist size={16} />Add task</button><button className="btn btn-outline" onClick={() => setModal('survey')}><IconClipboardCheck size={16} />Book survey</button><button className="btn btn-primary" onClick={() => setModal('appt')}><IconPlus size={16} />New appointment</button></>} />
      <div className={`alert ${notSynced ? 'warn' : 'ok'} small`}><IconBrandWindows size={16} />{notSynced ? `${notSynced} appointment is waiting to sync with Outlook.` : 'All appointments are in step with Outlook calendars.'}<button className="link ml-auto" onClick={() => { set('appts', as => as.map(a => ({ ...a, synced: true }))); toast('Synced with Outlook'); }}><IconRefresh size={14} />Sync now</button></div>
      <div className="grid-4">
        {[['Sales visits this week', appts.filter(a => a.kind === 'Sales visit').length, IconCalendarEvent, '#0b6e5c'], ['Surveys booked', appts.filter(a => a.kind === 'Survey' && a.status === 'Booked').length, IconClipboardCheck, '#0b6e5c'], ['Follow-up calls', appts.filter(a => a.kind === 'Follow-up call').length, IconPhone, '#e0a100'], ['Overdue', overdueAppts.length + lateTasks.length, IconAlertTriangle, '#d64545']].map(([l, v, I, c]: any) => (
          <div key={l} className="card" style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 }}><Tile icon={<I size={22} />} color={c} size={48} /><div className="vstack" style={{ gap: 2 }}><span className="small t2">{l}</span><b style={{ fontSize: 22 }}>{v}</b></div></div>
        ))}
      </div>
      <div className="row">
        <Card className="grow">
          <CardHead title="Appointments" sub="Sales visits, surveys and follow-up calls for the whole team" />
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Seg value={f} onChange={setF} items={[{ id: 'all', label: 'All' }, { id: 'Sales visit', label: 'Sales visits' }, { id: 'Survey', label: 'Surveys' }, { id: 'Follow-up call', label: 'Follow-ups' }]} />
            <select className="select ml-auto" style={{ width: 200, height: 34 }} value={who} onChange={e => setWho(e.target.value)}><option value="all">Everyone</option>{staff.filter(s => s.role !== 'Office Admin').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          {days.map(d => (
            <div key={d} className="vstack" style={{ gap: 8 }}>
              <b className="small" style={{ color: d === TODAY ? 'var(--primary-dark)' : d < TODAY ? 'var(--err)' : 'var(--text-2)' }}>{d === TODAY ? 'Today' : d === addDays(TODAY, 1) ? 'Tomorrow' : fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
              {list.filter(a => a.date === d).map(a => {
                const I = kindIcon[a.kind]; const s = staffById(a.who)!;
                return (
                  <div key={a.id} className="card" style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderLeft: `3px solid ${kindColor[a.kind]}` }}>
                    <Tile icon={<I size={18} />} color={kindColor[a.kind]} size={38} />
                    <div className="vstack" style={{ gap: 3, flex: 1 }}>
                      <b style={{ fontSize: 13.5 }}>{a.kind} · {a.customer}</b>
                      <span className="small t2 hstack" style={{ gap: 12, flexWrap: 'wrap' }}><span className="hstack" style={{ gap: 4 }}><IconClock size={13} />{a.time}</span>{a.address && <span className="hstack" style={{ gap: 4 }}><IconMapPin size={13} />{a.address}</span>}{a.job && <Link to={`/jobs/${a.job}`} className="link">{a.job}</Link>}</span>
                    </div>
                    <span className="hstack small t2" style={{ gap: 6 }}><Avatar i={s.initials} size={26} />{s.name}</span>
                    {!a.synced && <Tag tone="warn">Not in Outlook yet</Tag>}
                    {a.status === 'Overdue' ? <><Tag tone="err">Missed</Tag><button className="btn btn-dark btn-xs" onClick={() => toast(`Reminder sent to ${s.name}`)}>Remind</button></> : a.status === 'Done' ? <Tag tone="ok">Done</Tag> : <button className="btn btn-outline btn-xs" onClick={() => { set('appts', as => as.map(x => (x.id === a.id ? { ...x, status: 'Done' } : x))); toast('Marked as done'); }}><IconCheck size={13} />Done</button>}
                  </div>
                );
              })}
            </div>
          ))}
        </Card>
        <Card className="w-400">
          <CardHead title="Tasks" sub="Every task has an owner and a due date" right={<button className="btn btn-outline btn-xs" onClick={() => setModal('task')}><IconPlus size={13} />Add</button>} />
          <Seg value={tf} onChange={setTf} items={[{ id: 'open', label: 'Open' }, { id: 'mine', label: 'Mine' }, { id: 'done', label: 'Done' }]} />
          {lateTasks.length > 0 && tf !== 'done' && <div className="alert err small"><IconAlertTriangle size={16} />{lateTasks.length} task{lateTasks.length > 1 ? 's are' : ' is'} overdue</div>}
          <div className="list">
            {tl.map(t => {
              const late = !t.done && t.due < TODAY; const o = staffById(t.owner)!;
              return (
                <div key={t.id} className="hstack" style={{ gap: 10, padding: '11px 0', alignItems: 'flex-start' }}>
                  <Check on={t.done} onChange={v => { set('tasks', ts => ts.map(x => (x.id === t.id ? { ...x, done: v } : x))); if (v) toast('Task done'); }} />
                  <div className="vstack" style={{ gap: 5, flex: 1 }}>
                    <b style={{ fontSize: 13, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : 'var(--text)' }}>{t.title}</b>
                    <span className="hstack tiny t2" style={{ gap: 8, flexWrap: 'wrap' }}><Avatar i={o.initials} size={18} />{o.name}<span style={{ color: late ? 'var(--err)' : 'inherit', fontWeight: late ? 600 : 400 }}>{late ? 'Overdue · ' : ''}{t.due === TODAY ? 'Today' : fmtDate(t.due)}</span>{t.job && <Link to={`/jobs/${t.job}`} className="link" style={{ fontSize: 11 }}>{t.job}</Link>}</span>
                  </div>
                </div>
              );
            })}
            {tl.length === 0 && <div className="small muted" style={{ padding: 16, textAlign: 'center' }}>Nothing here.</div>}
          </div>
        </Card>
      </div>
      {modal === 'appt' && <AddApptModal onClose={() => setModal(null)} />}
      {modal === 'task' && <AddTaskModal onClose={() => setModal(null)} />}
      {modal === 'survey' && <BookSurveyModal onClose={() => setModal(null)} />}
    </>
  );
}
