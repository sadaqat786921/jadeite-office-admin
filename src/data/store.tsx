// Shared, in-memory state so every Office Admin flow updates the whole platform.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'jadeite-office-admin-demo-v1';
import * as M from './mock';

export const TODAY = '2026-10-16';

export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts);
export const dayDiff = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
export const mondayOf = (iso: string) => { const d = new Date(iso + 'T12:00:00'); const wd = (d.getDay() + 6) % 7; return addDays(iso, -wd); };
const rangesOverlap = (s1: string, d1: number, s2: string, d2: number) => s1 <= addDays(s2, d2 - 1) && s2 <= addDays(s1, d1 - 1);

export type HistoryItem = { when: string; who: string; what: string };
export type Task = { id: string; title: string; owner: string; due: string; job?: string; done: boolean };
export type Appt = { id: string; kind: 'Sales visit' | 'Survey' | 'Follow-up call' | 'Snag visit'; customer: string; who: string; date: string; time: string; job?: string; address?: string; synced: boolean; status: string };
export type DiaryEvent = { id: string; team: string; date: string; days: number; kind: 'install' | 'survey' | 'delivery' | 'leave' | 'snag'; title: string; sub: string; photo: keyof typeof M.IMG; job?: string };
export type Email = { id: string; from: string; subject: string; preview: string; when: string; linked?: string };
export type EnquiryX = M.Enquiry & { type: 'Sales' | 'Existing job' | 'Aftercare'; followUp?: string; stageDays: number; routedTo?: string };
export type JobX = M.Job & { history: HistoryItem[]; signedOff?: { by: string; when: string; refused?: string }; installDate?: string; installDays?: number };

const initialEvents: DiaryEvent[] = [
  { id: 'ev1', team: 't1', date: '2026-10-13', days: 3, kind: 'install', title: 'Smith · windows', sub: 'JG-10482 · Leicester', photo: 'house', job: 'JG-10482' },
  { id: 'ev2', team: 't2', date: '2026-10-12', days: 3, kind: 'install', title: 'Khan · orangery roof', sub: 'JG-10455 · Harrogate', photo: 'orangery', job: 'JG-10455' },
  { id: 'ev3', team: 't2', date: '2026-10-16', days: 2, kind: 'install', title: 'Hartley Dental', sub: 'JG-10493 · 3 days', photo: 'window', job: 'JG-10493' },
  { id: 'ev4', team: 't3', date: '2026-10-12', days: 1, kind: 'delivery', title: 'Workshop prep', sub: 'Glazing beads', photo: 'window' },
  { id: 'ev5', team: 't3', date: '2026-10-14', days: 2, kind: 'snag', title: 'Patel · snag visit', sub: 'JG-10471 · handle', photo: 'bifold', job: 'JG-10471' },
  { id: 'ev6', team: 't1', date: '2026-10-22', days: 2, kind: 'install', title: 'Smith · windows & door', sub: 'JG-10482 · Leicester', photo: 'house', job: 'JG-10482' },
  { id: 'lv1', team: 't3', date: '2026-10-21', days: 3, kind: 'leave', title: 'Tom Wright on leave', sub: 'Annual leave', photo: 'window' },
];

const initialTasks: Task[] = [
  { id: 'tk1', title: 'Chase Emplas for the JG-10466 delivery', owner: 'sm', due: TODAY, job: 'JG-10466', done: false },
  { id: 'tk2', title: 'Book installation for The Bakers', owner: 'sm', due: TODAY, job: 'JG-10477', done: false },
  { id: 'tk3', title: 'Send balance reminder to Mr Khan', owner: 'sm', due: '2026-10-17', job: 'JG-10455', done: false },
  { id: 'tk4', title: 'Confirm survey time with The Lees', owner: 'ps', due: TODAY, job: 'JG-10490', done: true },
  { id: 'tk5', title: 'Call back Mr Khan about new windows', owner: 'jb', due: '2026-10-14', done: false },
  { id: 'tk6', title: 'Check new Emplas price list', owner: 'sm', due: '2026-10-16', done: false },
];

const initialAppts: Appt[] = [
  { id: 'ap1', kind: 'Sales visit', customer: 'The Lees', who: 'mh', date: '2026-10-20', time: '10:00 – 11:00', address: '27 Park View, Otley', synced: true, status: 'Booked' },
  { id: 'ap2', kind: 'Survey', customer: 'The Lees', who: 'ps', date: '2026-10-19', time: '10:00 – 12:00', job: 'JG-10490', address: '27 Park View, Otley', synced: true, status: 'Booked' },
  { id: 'ap3', kind: 'Follow-up call', customer: 'Ashby Farm', who: 'mh', date: TODAY, time: '14:00', synced: true, status: 'Booked' },
  { id: 'ap4', kind: 'Follow-up call', customer: 'Mr Khan', who: 'jb', date: '2026-10-14', time: '11:00', synced: true, status: 'Overdue' },
  { id: 'ap5', kind: 'Sales visit', customer: 'Mr Evans', who: 'mh', date: '2026-10-21', time: '13:30 – 14:30', address: '18 Station Rd, Knaresborough', synced: true, status: 'Booked' },
  { id: 'ap6', kind: 'Survey', customer: 'Dr Whitfield', who: 'ps', date: '2026-10-15', time: '14:00 – 15:00', job: 'JG-10459', address: '3 High Street, Harrogate', synced: true, status: 'Done' },
  { id: 'ap7', kind: 'Follow-up call', customer: 'M. Duffy', who: 'ec', date: '2026-10-19', time: '09:30', synced: false, status: 'Booked' },
];

const initialEmails: Email[] = [
  { id: 'em1', from: 'j.cooper@email.co.uk', subject: 'Question about my windows', preview: 'Hi, one of the new windows is letting in a draught at the top…', when: 'Today 08:12' },
  { id: 'em2', from: 'accounts@emplas.co.uk', subject: 'Remittance advice', preview: 'Please find attached the remittance for orders SO-481…', when: 'Yesterday 16:40' },
];

const enq0: EnquiryX[] = M.enquiries.map(e => ({ ...e, type: 'Sales', stageDays: Math.min(e.daysAgo, 9), followUp: e.assigned ? e.nextDue : undefined }));
enq0.unshift({ id: 'EN-2292', name: 'Mrs Cooper', initials: 'JC', phone: '07700 900 990', email: 'j.cooper@email.co.uk', address: '5 Elm Close, Ripon', postcode: 'HG4 2BB', product: 'Window draught', source: 'Email', received: '16 Oct, 08:12', daysAgo: 0, stage: 'New Enquiry', value: 0, next: 'Route to aftercare', nextDue: 'Today', photo: 'window', type: 'Aftercare', stageDays: 0 });

const jobs0: JobX[] = M.jobs.map(j => ({
  ...j,
  ...(j.id === 'JG-10459' ? { blocked: 'Part delivery — 2 frames to come' } : {}),
  installDate: j.id === 'JG-10482' ? '2026-10-22' : j.id === 'JG-10493' ? '2026-10-16' : j.id === 'JG-10455' ? '2026-10-12' : undefined,
  installDays: j.id === 'JG-10493' ? 3 : j.id === 'JG-10455' ? 3 : 2,
  history: [
    { when: '13 Oct 09:40', who: 'Sarah Mitchell', what: 'Supplier order SO-48238 added · Emplas confirmed' },
    { when: '02 Oct 11:24', who: 'Priya Shah', what: 'Survey submitted with 12 photos and customer signature' },
    { when: '30 Sep 19:42', who: 'Customer', what: 'Quote FP-55109 signed online in the portal' },
    { when: '28 Sep 10:00', who: 'Sarah Mitchell', what: 'Enquiry received from the website and assigned to Mike Harris' },
  ],
}));

const snags0 = M.snags.map(s => ({ ...s }));
const deliveries0 = M.deliveries.map(d => ({ ...d, problem: '' as string }));
const surveys0 = M.surveys.map(s => ({ ...s }));

type State = {
  enquiries: EnquiryX[]; jobs: JobX[]; tasks: Task[]; appts: Appt[]; events: DiaryEvent[]; emails: Email[];
  snags: typeof snags0; deliveries: typeof deliveries0; surveys: typeof surveys0;
};
type Ctx = State & {
  set: <K extends keyof State>(k: K, fn: (v: State[K]) => State[K]) => void;
  log: (jobId: string, what: string, who?: string) => void;
  updateJob: (id: string, patch: Partial<JobX>, what?: string) => void;
  clash: (team: string, date: string, days: number, ignoreId?: string) => DiaryEvent | undefined;
  attention: { late: JobX[]; blocked: JobX[]; notBooked: JobX[]; noNext: JobX[] };
  reset: () => void;
};
const StoreCtx = createContext<Ctx>(null as any);
export const useStore = () => useContext(StoreCtx);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const fresh: State = { enquiries: enq0, jobs: jobs0, tasks: initialTasks, appts: initialAppts, events: initialEvents, emails: initialEmails, snags: snags0, deliveries: deliveries0, surveys: surveys0 };
  const [s, setS] = useState<State>(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) return { ...fresh, ...JSON.parse(raw) }; } catch {}
    return fresh;
  });
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);
  const reset = () => { try { sessionStorage.removeItem(KEY); } catch {} setS(fresh); };
  const set: Ctx['set'] = (k, fn) => setS(prev => ({ ...prev, [k]: fn(prev[k]) }));
  const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
  const log: Ctx['log'] = (jobId, what, who = 'Sarah Mitchell') => set('jobs', js => js.map(j => (j.id === jobId ? { ...j, history: [{ when: now(), who, what }, ...j.history] } : j)));
  const updateJob: Ctx['updateJob'] = (id, patch, what) => set('jobs', js => js.map(j => (j.id === id ? { ...j, ...patch, history: what ? [{ when: now(), who: 'Sarah Mitchell', what }, ...j.history] : j.history } : j)));
  const clash: Ctx['clash'] = (team, date, days, ignoreId) => s.events.find(e => e.team === team && e.id !== ignoreId && rangesOverlap(date, days, e.date, e.days));
  const attention = useMemo(() => ({
    late: s.jobs.filter(j => j.overdue),
    blocked: s.jobs.filter(j => j.blocked),
    notBooked: s.jobs.filter(j => ['Delivery'].includes(j.stage) && !s.events.some(e => e.job === j.id && e.kind === 'install' && e.date >= TODAY)),
    noNext: s.jobs.filter(j => !j.next || j.next === '—'),
  }), [s.jobs, s.events]);
  return <StoreCtx.Provider value={{ ...s, set, log, updateJob, clash, attention, reset }}>{children}</StoreCtx.Provider>;
}
