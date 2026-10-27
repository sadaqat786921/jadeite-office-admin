import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconDeviceMobile, IconLock, IconPlus, IconCalendar, IconPencil } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Field, Switch, Avatar, Tabs, useToast, Modal, Tag } from '../components/ui';
import { me, Installer } from '../data/mock';
import { useStore } from '../data/store';

const COLORS = ['#00c7a1', '#0b6e5c', '#13836d', '#3a9c86', '#2f5d55', '#5fb8a3', '#0b1f1b', '#7a8f8b'];

/** Add or edit one installer. They can then be booked in the diary. */
function InstallerModal({ p, onClose }: { p?: Installer; onClose: () => void }) {
  const toast = useToast();
  const { set, installers } = useStore();
  const [f, setF] = useState({ name: p?.name || '', role: p?.role || 'Fitter', skills: p?.skills || 'Windows, doors', phone: p?.phone || '', base: p?.base || 'Leeds' });
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    const initials = f.name.trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
    if (p) set('installers', l => l.map(x => (x.id === p.id ? { ...x, ...f, initials } : x)));
    else set('installers', l => [...l, { id: 'in' + Date.now(), ...f, name: f.name.trim(), initials, color: COLORS[l.length % COLORS.length], active: true }]);
    toast(p ? `${f.name} updated` : `${f.name} added · they can now be booked in the diary and get jobs on the installer app`); onClose();
  };
  return (
    <Modal title={p ? `Edit ${p.name}` : 'Add an installer'} sub="Installers are booked one by one in the diary, so add each person." onClose={onClose} width={560}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={f.name.trim().length < 3 || installers.some(x => x.id !== p?.id && x.name.toLowerCase() === f.name.trim().toLowerCase())} onClick={save}>{p ? 'Save' : 'Add installer'}</button></>}>
      <div className="grid-2">
        <Field label="Full name"><input className="input" value={f.name} onChange={up('name')} placeholder="e.g. Mark Taylor" /></Field>
        <Field label="Mobile" hint="Their jobs are sent to the installer app on this phone."><input className="input" value={f.phone} onChange={up('phone')} placeholder="07700 900 000" /></Field>
        <Field label="Role"><select className="select" value={f.role} onChange={up('role')}><option>Lead fitter</option><option>Fitter</option><option>Apprentice</option></select></Field>
        <Field label="Based in"><input className="input" value={f.base} onChange={up('base')} /></Field>
      </div>
      <Field label="What do they fit?"><input className="input" value={f.skills} onChange={up('skills')} placeholder="e.g. Windows, doors, orangeries" /></Field>
    </Modal>
  );
}

function InstallersTab() {
  const toast = useToast();
  const { installers, set, events } = useStore();
  const [edit, setEdit] = useState<Installer | 'new' | null>(null);
  return (
    <Card>
      <CardHead title="Installers" sub="Everyone who can be booked on a job. Pick any mix of people for each installation." right={<button className="btn btn-primary btn-sm" onClick={() => setEdit('new')}><IconPlus size={15} />Add installer</button>} />
      <table className="tbl">
        <thead><tr><th>Installer</th><th>Role</th><th>Fits</th><th>Mobile</th><th>Bookings</th><th>Can be booked</th><th></th></tr></thead>
        <tbody>
          {installers.map(p => (
            <tr key={p.id}>
              <td><div className="hstack" style={{ gap: 10 }}><Avatar i={p.initials} size={32} bg={p.color} fg="#fff" /><div className="vstack" style={{ gap: 1 }}><b>{p.name}</b><span className="tiny muted">Based in {p.base}</span></div></div></td>
              <td className="t2">{p.role}</td>
              <td className="t2">{p.skills}</td>
              <td className="t2">{p.phone || '—'}</td>
              <td>{(() => { const n = events.filter(e => e.kind !== 'leave' && (e.crew || []).includes(p.id)).length; return <Tag tone={n ? 'jade' : 'grey'}>{n}</Tag>; })()}</td>
              <td><Switch on={p.active !== false} onChange={v => { set('installers', l => l.map(x => (x.id === p.id ? { ...x, active: v } : x))); toast(v ? `${p.name} can be booked again` : `${p.name} won't be offered for new bookings`); }} /></td>
              <td><div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}><Link to={`/diary/installer/${p.id}`} className="btn btn-grey btn-xs"><IconCalendar size={13} />Calendar</Link><button className="btn btn-outline btn-xs" onClick={() => setEdit(p)}><IconPencil size={13} />Edit</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <InstallerModal p={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
    </Card>
  );
}

export default function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState('profile');
  const [n, setN] = useState<Record<string, boolean>>({ enq: true, late: true, snag: true, portal: true, daily: false });
  return (
    <>
      <PageHead title="Settings" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Settings' }]} actions={<button className="btn btn-primary" onClick={() => toast('Settings saved')}>Save changes</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'profile', label: 'My profile' }, { id: 'notifications', label: 'Notifications' }, { id: 'security', label: 'Sign-in and security' }, { id: 'installers', label: 'Installers' }]} />
      {tab === 'profile' && (
        <Card style={{ maxWidth: 820 }}>
          <div className="hstack" style={{ gap: 16 }}><Avatar i={me.initials} size={72} bg="#00c7a1" fg="#0b1f1b" /><div className="vstack" style={{ gap: 4 }}><b style={{ fontSize: 18 }}>{me.name}</b><span className="muted">{me.role} · Jadeite Glazing · Head office</span><button className="link">Change photo</button></div></div>
          <div className="grid-2">
            <Field label="Full name"><input className="input" defaultValue={me.name} /></Field>
            <Field label="Email"><input className="input" defaultValue={me.email} /></Field>
            <Field label="Mobile (for sign-in codes)"><input className="input" defaultValue="07700 900 482" /></Field>
            <Field label="Role" hint="Roles are managed by the System Admin"><input className="input" defaultValue={me.role} disabled style={{ background: 'var(--bg)' }} /></Field>
          </div>
          <Field label="Email signature"><textarea className="textarea" style={{ minHeight: 120 }} defaultValue={'Kind regards,\nSarah Mitchell\nOffice Admin · Jadeite Glazing\n0116 496 0000'} /></Field>
        </Card>
      )}
      {tab === 'notifications' && (
        <Card style={{ maxWidth: 820 }}>
          <CardHead title="Tell me when…" />
          <div className="list">
            {[['enq', 'A new enquiry comes in'], ['late', 'A supplier delivery is late'], ['snag', 'A snag is reported'], ['portal', 'A customer messages in the portal'], ['daily', 'Send me a summary every morning at 8am']].map(([k, l]) => <div key={k} className="between" style={{ padding: '14px 0' }}><span>{l}</span><Switch on={n[k]} onChange={() => setN(s => ({ ...s, [k]: !s[k] }))} /></div>)}
          </div>
        </Card>
      )}
      {tab === 'security' && (
        <Card style={{ maxWidth: 820 }}>
          <div className="hstack" style={{ gap: 12 }}><IconDeviceMobile size={22} color="#0b6e5c" /><div className="vstack" style={{ gap: 2, flex: 1 }}><b>Two-step sign-in is on</b><span className="small muted">We text a code to •• 482 each time you sign in on a new device.</span></div><button className="btn btn-outline btn-sm">Change phone</button></div>
          <div className="divider" />
          <div className="hstack" style={{ gap: 12 }}><IconLock size={22} color="#0b6e5c" /><div className="vstack" style={{ gap: 2, flex: 1 }}><b>Password</b><span className="small muted">Last changed 3 months ago</span></div><button className="btn btn-outline btn-sm">Change password</button></div>
        </Card>
      )}
      {tab === 'installers' && <InstallersTab />}
    </>
  );
}
