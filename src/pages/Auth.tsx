import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  IconMail, IconLock, IconArrowRight, IconPhone, IconListDetails, IconCalendarEvent, IconHome, IconCheck, IconInbox, IconAlertTriangle,
  IconBox, IconUsers, IconCurrencyPound, IconMessage, IconShieldCheck, IconTool, IconCalendar, IconArrowLeft,
} from '@tabler/icons-react';
import { Check, Tile, Tag, Avatar, hexA } from '../components/ui';
import { IMG, me } from '../data/mock';

export function Login() {
  const nav = useNavigate();
  const [code, setCode] = useState(false);
  const [keep, setKeep] = useState(true);
  const [digits, setDigits] = useState(['4', '8', '2', '1', '9', '3']);
  const [tries, setTries] = useState(0);
  const [err, setErr] = useState('');
  const locked = tries >= 3;
  const verify = () => { if (digits.join('') === '482193') return nav('/welcome/1'); const t = tries + 1; setTries(t); setErr(t >= 3 ? '' : `That code isn’t right. ${3 - t} ${3 - t === 1 ? 'try' : 'tries'} left before the account locks.`); };
  return (
    <div className="auth">
      <div className="auth-photo">
        <img className="bgp" src={IMG.house} alt="" />
        <span className="glass-pill" style={{ alignSelf: 'flex-start', background: 'rgba(11,31,27,.55)', fontSize: 16, padding: '9px 14px' }}><img src="images/mark.svg" style={{ height: 24 }} alt="" />Jadeite</span>
        <div className="vstack" style={{ gap: 14 }}>
          <span className="glass-pill" style={{ alignSelf: 'flex-start' }}>Jadeite Glazing · staff sign-in</span>
          <h1 style={{ fontSize: 34, lineHeight: 1.2, letterSpacing: -0.5 }}>Every window and door job, from first call to final fit.</h1>
          <p style={{ fontSize: 15, color: '#d3e3de', lineHeight: 1.55 }}>Enquiries, surveys, orders, the installation diary and customer updates — all in one place.</p>
          <div className="hstack" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span className="glass-pill"><IconListDetails size={15} />Sales pipeline</span>
            <span className="glass-pill"><IconCalendarEvent size={15} />Installation diary</span>
            <span className="glass-pill"><IconHome size={15} />Customer portal</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 20 }}>
        <div className="card" style={{ width: 460, padding: 36, gap: 20, boxShadow: 'var(--shadow)' }}>
          <div className="hstack" style={{ gap: 10 }}><img src="images/mark.svg" style={{ height: 34 }} alt="" /><b style={{ fontSize: 21 }}>Jadeite</b></div>
          {!code ? (
            <>
              <div className="vstack" style={{ gap: 6 }}><h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>Welcome back</h2><span className="muted" style={{ fontSize: 14 }}>Sign in to Jadeite Systems to see today’s work.</span></div>
              <div className="field"><label>Email address</label><div className="input-icon"><IconMail size={18} /><input className="input" style={{ height: 46, fontSize: 14 }} defaultValue={me.email} /></div></div>
              <div className="field"><label>Password</label><div className="input-icon"><IconLock size={18} /><input className="input" type="password" style={{ height: 46, fontSize: 14 }} defaultValue="password123" /></div></div>
              <div className="between"><Check on={keep} onChange={setKeep} label={<span className="t2">Keep me signed in</span>} /><button className="link">Forgot password?</button></div>
              <button className="btn btn-primary btn-lg btn-block" onClick={() => setCode(true)}>Sign in<IconArrowRight size={17} /></button>
              <div className="alert info small"><IconLock size={16} />For your safety we’ll text a 6-digit code to your phone after you sign in.</div>
            </>
          ) : locked ? (
            <>
              <div className="vstack" style={{ gap: 8 }}><span className="tile" style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--err-bg)', color: 'var(--err)' }}><IconLock size={26} /></span><h2 style={{ fontSize: 26, fontWeight: 700 }}>Account locked</h2><span className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>The code was wrong 3 times, so we have locked the account to keep customer information safe.</span></div>
              <div className="alert info small"><IconPhone size={16} />Ask your System Admin to unlock it, or call the office on 0116 496 0000.</div>
              <button className="btn btn-grey btn-lg btn-block" onClick={() => { setTries(0); setCode(false); setDigits(['4', '8', '2', '1', '9', '3']); }}>Back to sign in</button>
            </>
          ) : (
            <>
              <div className="vstack" style={{ gap: 6 }}><h2 style={{ fontSize: 26, fontWeight: 700 }}>Enter your code</h2><span className="muted" style={{ fontSize: 14 }}>We sent a 6-digit code to your phone ending <b>•• 482</b>.</span></div>
              <div className="hstack" style={{ gap: 10 }}>{digits.map((d, i) => <input key={i} className="input" value={d} maxLength={1} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setDigits(ds => ds.map((x, j) => (j === i ? v : x))); setErr(''); if (v && e.target.nextElementSibling) (e.target.nextElementSibling as HTMLInputElement).focus(); }} style={{ width: 54, height: 58, textAlign: 'center', fontSize: 22, fontWeight: 700, borderColor: err ? 'var(--err)' : undefined }} />)}</div>
              {err && <div className="alert err small"><IconLock size={16} />{err}</div>}
              <button className="btn btn-primary btn-lg btn-block" onClick={verify}>Verify and continue<IconArrowRight size={17} /></button>
              <div className="between small"><button className="link" onClick={() => setCode(false)}><IconArrowLeft size={14} />Back</button><span className="muted">Didn’t get it? <button className="link">Send again</button></span></div>
              <span className="tiny muted">Demo: the right code is 482193. Change a number to see what happens with a wrong code.</span>
            </>
          )}
        </div>
        <span className="hstack muted" style={{ gap: 8 }}><IconPhone size={15} />Need help? Call the office on 0116 496 0000</span>
        <span className="small muted">© 2026 Jadeite Systems · Jadeite Glazing · Privacy · Terms</span>
      </div>
    </div>
  );
}

const STEPS = [
  { photo: IMG.bifold, t: 'Your whole day at a glance', d: 'Your dashboard shows what needs you today — new enquiries, surveys, deliveries and installations.',
    pts: [[IconInbox, 'New enquiries first', 'See who is waiting and pass them to sales.', '#0b6e5c'], [IconCalendar, 'Today’s diary', 'Surveys, deliveries and fittings with times.', '#0b6e5c'], [IconAlertTriangle, 'Problems flagged', 'Late deliveries and snags shown in red.', '#d64545']] },
  { photo: IMG.door, t: 'Every job, from enquiry to fitting', d: 'Open any job to see the customer, their windows and doors, key dates, payments and the next step.',
    pts: [[IconBox, 'One page per job', 'Survey, quote, order, delivery and fitting together.', '#0b6e5c'], [IconUsers, 'Who is on the job', 'Salesperson, surveyor and installer team.', '#0b6e5c'], [IconCurrencyPound, 'Payments from Xero', 'Deposit, balance and invoices — no re-typing.', '#e0a100']] },
  { photo: IMG.orangery, t: 'Customers can follow their job', d: 'Customers see their own dates, documents and messages in their portal, so they call the office less.',
    pts: [[IconHome, 'Their own portal', 'Only their job — never internal notes.', '#0b6e5c'], [IconMessage, 'Messages kept on file', 'Every message saved against the job.', '#0b6e5c'], [IconShieldCheck, 'Guarantees and care guides', 'Ready to download after the fitting.', '#1f9d5b']] },
];

export function Welcome() {
  const { step = '1' } = useParams();
  const i = Math.min(3, Math.max(1, +step)) - 1;
  const nav = useNavigate();
  const s = STEPS[i];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="hstack" style={{ height: 72, padding: '0 40px', background: '#fff', borderBottom: '1px solid var(--border)', gap: 16 }}>
        <span className="hstack" style={{ gap: 10 }}><img src="images/mark.svg" style={{ height: 30 }} alt="" /><b style={{ fontSize: 19 }}>Jadeite</b></span>
        <div className="hstack" style={{ margin: '0 auto', gap: 10 }}>
          {['Your day', 'Jobs', 'Customers'].map((n, j) => (
            <React.Fragment key={n}>
              <span className="hstack" style={{ gap: 8 }}>
                <span className="tile" style={{ width: 26, height: 26, borderRadius: 13, background: j < i ? 'var(--ok)' : j === i ? 'var(--primary)' : 'var(--grey-btn)', color: j < i ? '#fff' : j === i ? 'var(--deep)' : 'var(--muted)', fontSize: 12, fontWeight: 700 }}>{j < i ? <IconCheck size={14} stroke={3} /> : j + 1}</span>
                <span style={{ fontWeight: j === i ? 600 : 400, color: j === i ? 'var(--text)' : 'var(--muted)' }}>{n}</span>
              </span>
              {j < 2 && <span style={{ width: 36, height: 2, borderRadius: 1, background: j < i ? 'var(--ok)' : 'var(--border-input)' }} />}
            </React.Fragment>
          ))}
        </div>
        <Link to="/" className="b muted">Skip for now</Link>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 40, padding: 40 }}>
        <div className="vstack" style={{ flex: 1, justifyContent: 'center', gap: 22, maxWidth: 640 }}>
          <span style={{ alignSelf: 'flex-start' }}><Tag tone="jade">Step {i + 1} of 3</Tag></span>
          <h1 style={{ fontSize: 38, letterSpacing: -0.6, lineHeight: 1.15 }}>{s.t}</h1>
          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.55 }}>{s.d}</p>
          <div className="vstack" style={{ gap: 12 }}>
            {s.pts.map(([I, a, b, c]: any) => (
              <div key={a} className="card hstack" style={{ flexDirection: 'row', padding: 14, gap: 14, alignItems: 'center' }}>
                <Tile icon={<I size={20} />} color={c} size={42} />
                <div className="vstack" style={{ gap: 3 }}><b style={{ fontSize: 15 }}>{a}</b><span className="muted">{b}</span></div>
              </div>
            ))}
          </div>
          <div className="hstack" style={{ gap: 12, marginTop: 6 }}>
            {i > 0 && <button className="btn btn-grey btn-lg" onClick={() => nav(`/welcome/${i}`)}>Back</button>}
            <button className="btn btn-primary btn-lg" onClick={() => nav(i < 2 ? `/welcome/${i + 2}` : '/')}>{i < 2 ? 'Next' : 'Go to my dashboard'}<IconArrowRight size={17} /></button>
          </div>
        </div>
        <div style={{ width: 600, flex: '0 0 600px', borderRadius: 10, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 28, minHeight: 700 }}>
          <img src={s.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,31,27,0) 40%, rgba(11,31,27,.45))' }} />
          <div className="card" style={{ position: 'relative', width: '100%', boxShadow: '0 8px 24px rgba(0,0,0,.14)' }}>
            {i === 0 && (
              <div className="hstack" style={{ gap: 12 }}>
                {[['34', 'Enquiries this week', '12%', 'ok', IconInbox, '#0b6e5c'], ['18', 'Installations', '20%', 'warn', IconTool, '#e0a100']].map(([v, l, t, tone, I, c]: any) => (
                  <div key={l} className="hstack" style={{ flex: 1, gap: 12, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
                    <Tile icon={<I size={18} />} color={c} />
                    <div className="vstack" style={{ gap: 1 }}><b style={{ fontSize: 22 }}>{v}</b><span className="tiny t2">{l}</span></div>
                    <span className="ml-auto"><Tag tone={`solid-${tone}`}>{t}</Tag></span>
                  </div>
                ))}
              </div>
            )}
            {i === 1 && (
              <>
                <div className="hstack" style={{ gap: 12 }}><Avatar i="SD" size={40} /><div className="vstack" style={{ gap: 2, flex: 1 }}><b style={{ fontSize: 15 }}>Sarah & David Smith</b><span className="small muted">JG-10482 · 14 Ashby Road, Leicester</span></div><Tag tone="jade">Ordered</Tag></div>
                <div className="hstack" style={{ gap: 6 }}>{['Survey', 'Quote', 'Order', 'Delivery', 'Fitting'].map((n, j) => <div key={n} className="vstack" style={{ flex: 1, gap: 6 }}><div style={{ height: 6, borderRadius: 3, background: j < 3 ? 'var(--primary)' : 'var(--border)' }} /><span className="tiny" style={{ color: j < 3 ? 'var(--primary-dark)' : 'var(--muted)', fontWeight: j === 2 ? 600 : 400 }}>{n}</span></div>)}</div>
                <div className="hstack small b" style={{ gap: 8, padding: 10, borderRadius: 8, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconCalendar size={15} />Next: delivery Tue 20 Oct · fitting Thu 22 Oct</div>
              </>
            )}
            {i === 2 && (
              <div className="list">
                {[['SS', 'Sarah & David Smith · Signed the quote online', 'JG-10482 · 10 min ago', 'Signed', 'ok'], ['TB', 'The Bakers · Read their installation guide', 'JG-10477 · 1 hour ago', 'Viewed', 'info']].map(([a, b, c, t, tone]) => (
                  <div key={a} className="hstack" style={{ gap: 12, padding: '10px 0' }}><Avatar i={a} size={38} /><div className="vstack" style={{ gap: 2, flex: 1 }}><b>{b}</b><span className="tiny muted">{c}</span></div><Tag tone={tone}>{t}</Tag></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
