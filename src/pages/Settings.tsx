import React, { useState } from 'react';
import { IconDeviceMobile, IconLock } from '@tabler/icons-react';
import { PageHead, Card, CardHead, Field, Switch, Avatar, Tabs, useToast } from '../components/ui';
import { me } from '../data/mock';

export default function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState('profile');
  const [n, setN] = useState<Record<string, boolean>>({ enq: true, late: true, snag: true, portal: true, daily: false });
  return (
    <>
      <PageHead title="Settings" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Settings' }]} actions={<button className="btn btn-primary" onClick={() => toast('Settings saved')}>Save changes</button>} />
      <Tabs value={tab} onChange={setTab} items={[{ id: 'profile', label: 'My profile' }, { id: 'notifications', label: 'Notifications' }, { id: 'security', label: 'Sign-in and security' }]} />
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
    </>
  );
}
