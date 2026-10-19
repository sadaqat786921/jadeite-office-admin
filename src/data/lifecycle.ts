// Everything that happens to one enquiry, from first contact to aftercare.
// One record grows a new tab at every stage (see pages/EnquiryRecord.tsx).

export type Comm = {
  id: string;
  kind: 'email-out' | 'email-in' | 'call' | 'note' | 'system' | 'reminder';
  title: string;
  body?: string;
  when: string;
  who: string;
};

export type Appointment = {
  date: string; time: string; who: string; type: 'Home visit' | 'Showroom visit' | 'Video call';
  address: string; notes?: string; status: 'Booked' | 'Done'; outcome?: string;
};

export type Opening = { ref: string; room: string; type: string; w: number; h: number; qty: number; notes?: string };

export type Survey = {
  surveyor: string; date: string; time: string; status: 'Booked' | 'Completed'; requestedBy: string;
  openings?: Opening[]; access?: string; parking?: string; notes?: string; photos?: number; signed?: boolean; completedOn?: string;
};

export type QuoteLine = { item: string; spec: string; qty: number; unit: number };
export type Quote = {
  ref: string; lines: QuoteLine[]; discount: number; sentOn: string; validUntil: string; sentBy: string;
  status: 'Sent' | 'Accepted' | 'Declined'; reply?: string;
};

export type Invite = { status: 'Not invited' | 'Invited' | 'Active'; sentOn?: string };

export type Lifecycle = {
  comms?: Comm[]; appt?: Appointment; survey?: Survey; quote?: Quote; lostReason?: string;
  invite?: Invite; jobId?: string; wonOn?: string;
};

// Framepoint price list used to turn survey openings into quote lines.
export const PRICE: Record<string, { unit: number; spec: string }> = {
  'Casement window': { unit: 540, spec: 'uPVC A-rated, double glazed · Emplas' },
  'Sash window': { unit: 980, spec: 'uPVC vertical slider, A-rated · Emplas' },
  'Flush casement window': { unit: 690, spec: 'Flush sash, heritage finish · Emplas' },
  'Composite front door': { unit: 1980, spec: 'GRP composite, multi-point lock · Origin' },
  'Bi-fold door (3-pane)': { unit: 5600, spec: 'Aluminium, slim sightlines · Origin' },
  'Roof lantern': { unit: 3900, spec: 'Aluminium, solar-control glass · Origin' },
  'Conservatory': { unit: 17800, spec: 'Lean-to, insulated roof · to design' },
};
export const OPENING_TYPES = Object.keys(PRICE);

export const quoteTotals = (q: Pick<Quote, 'lines' | 'discount'>) => {
  const sub = q.lines.reduce((a, l) => a + l.qty * l.unit, 0) - (q.discount || 0);
  const vat = Math.round(sub * 0.2);
  const total = sub + vat;
  return { sub, vat, total, deposit: Math.round(total * 0.25) };
};

export const linesFromOpenings = (ops: Opening[]): QuoteLine[] => {
  const grouped: Record<string, number> = {};
  ops.forEach(o => { grouped[o.type] = (grouped[o.type] || 0) + o.qty; });
  return [
    ...Object.entries(grouped).map(([type, qty]) => ({ item: type, spec: PRICE[type]?.spec || '', qty, unit: PRICE[type]?.unit || 500 })),
    { item: 'Fitting, removal and disposal', spec: 'FENSA registered installers', qty: 1, unit: 450 },
  ];
};

const c = (id: string, kind: Comm['kind'], title: string, when: string, who: string, body?: string): Comm => ({ id, kind, title, when, who, body });

const SMITH_OPS: Opening[] = [
  { ref: 'W1', room: 'Lounge (front)', type: 'Casement window', w: 1770, h: 1200, qty: 2, notes: 'Bay — 2 frames' },
  { ref: 'W2', room: 'Bedroom 1', type: 'Casement window', w: 1200, h: 1050, qty: 2 },
  { ref: 'W3', room: 'Kitchen', type: 'Casement window', w: 1000, h: 900, qty: 2, notes: 'Restrictors' },
  { ref: 'D1', room: 'Front entrance', type: 'Composite front door', w: 920, h: 2090, qty: 1, notes: 'Anthracite, chrome handle' },
];
const ASHBY_OPS: Opening[] = [
  { ref: 'W1', room: 'Farmhouse — front', type: 'Flush casement window', w: 1100, h: 1200, qty: 6 },
  { ref: 'W2', room: 'Farmhouse — rear', type: 'Flush casement window', w: 900, h: 1050, qty: 6, notes: 'Chartwell green' },
];
const DUFFY_OPS: Opening[] = [{ ref: 'D1', room: 'Kitchen / garden', type: 'Bi-fold door (3-pane)', w: 2400, h: 2100, qty: 1, notes: 'Open to the left' }];
const ROBERTS_OPS: Opening[] = [{ ref: 'R1', room: 'Kitchen extension', type: 'Roof lantern', w: 2000, h: 1000, qty: 1 }];
const HUGHES_OPS: Opening[] = [
  { ref: 'W1', room: 'Lounge', type: 'Sash window', w: 950, h: 1600, qty: 2 },
  { ref: 'W2', room: 'Bedrooms', type: 'Sash window', w: 900, h: 1450, qty: 3 },
];

const quoteFrom = (ref: string, ops: Opening[], sentOn: string, validUntil: string, sentBy: string, status: Quote['status'], discount = 0, reply?: string): Quote =>
  ({ ref, lines: linesFromOpenings(ops), discount, sentOn, validUntil, sentBy, status, reply });

// Seed lifecycle data so every stage has real details to show.
export const SEED: Record<string, Lifecycle> = {
  'EN-2292': { comms: [c('mc1', 'email-in', 'Question about my windows', '16 Oct, 08:12', 'Mrs Cooper', 'Hi, one of the new windows is letting in a draught at the top. Could someone come and have a look? Thanks, Jean Cooper')] },
  'EN-2291': { comms: [c('a1', 'system', 'Enquiry received from the website', '16 Oct, 09:15', 'Website', 'Interested in 3-pane bi-fold doors to the garden. Best time to call: after 5pm.')] },
  'EN-2290': { comms: [c('b1', 'system', 'Enquiry taken by phone', '14 Oct, 11:02', 'Sarah Mitchell', 'Wants 6 windows replaced. Asked for a call back.')] },
  'EN-2288': {
    comms: [
      c('g3', 'call', 'Call with Ms Green', '13 Oct, 10:05', 'Emma Clarke', 'Likes the anthracite composite doors. Wants a brochure before booking a visit.'),
      c('g2', 'email-out', 'Thank you for your enquiry', '12 Oct, 11:00', 'Emma Clarke', 'Dear Ms Green, thank you for visiting our showroom. I will call you tomorrow to talk about your front door.'),
      c('g1', 'system', 'Enquiry taken in the showroom', '12 Oct, 10:20', 'Showroom'),
    ],
  },
  'EN-2289': {
    comms: [
      c('l4', 'email-out', 'Your home visit is booked', '14 Oct, 09:12', 'Mike Harris', 'Dear Mr and Mrs Lee, I will visit on Tuesday 20 October at 10:00 to talk about your conservatory.'),
      c('l3', 'call', 'Call with the Lees', '13 Oct, 17:30', 'Mike Harris', 'Want a lean-to conservatory, about 4m × 3m. Happy for a home visit next week.'),
      c('l2', 'email-out', 'Thank you for your enquiry', '13 Oct, 17:00', 'Mike Harris'),
      c('l1', 'system', 'Referral from Mr Khan', '13 Oct, 16:40', 'Referral'),
    ],
    appt: { date: '2026-10-20', time: '10:00 – 11:00', who: 'mh', type: 'Home visit', address: '27 Park View, Otley', status: 'Booked', notes: 'Park on the drive. Side gate to the garden.' },
  },
  'EN-2280': {
    comms: [c('e2', 'call', 'Call with Mr Evans', '22 Sep, 14:00', 'Mike Harris', 'Wants an orangery-style conservatory. Booked a design visit.'), c('e1', 'system', 'Referral', '20 Sep, 11:30', 'Referral')],
    appt: { date: '2026-10-21', time: '13:30 – 14:30', who: 'mh', type: 'Home visit', address: '18 Station Rd, Knaresborough', status: 'Booked' },
  },
  'EN-2287': {
    comms: [
      c('w4', 'email-out', 'Your survey is booked', '12 Oct, 15:10', 'Sarah Mitchell', 'Dear Dr Whitfield, Priya Shah will measure your front door on Monday 19 October at 09:00.'),
      c('w3', 'call', 'Visit with Dr Whitfield', '12 Oct, 11:00', 'James Brook', 'Chose a red composite door. Wants a survey before the quote.'),
      c('w2', 'email-out', 'Thank you for your enquiry', '10 Oct, 15:00', 'James Brook'),
      c('w1', 'system', 'Enquiry received from the website', '10 Oct, 14:05', 'Website'),
    ],
    appt: { date: '2026-10-12', time: '11:00 – 12:00', who: 'jb', type: 'Home visit', address: '3 High Street, Harrogate', status: 'Done', outcome: 'Red composite door chosen. Survey needed.' },
    survey: { surveyor: 'ps', date: '2026-10-19', time: '09:00 – 10:00', status: 'Booked', requestedBy: 'James Brook' },
  },
  'EN-2286': {
    comms: [
      c('af5', 'email-out', 'Your quote FP-55120', '09 Oct, 16:20', 'Mike Harris', 'Please find your quote attached. It is valid for 30 days.'),
      c('af4', 'note', 'Survey completed', '06 Oct, 15:00', 'Rob King', '12 openings measured. Listed outbuilding — no change to frame style.'),
      c('af3', 'email-out', 'Your survey is booked', '01 Oct, 10:00', 'Sarah Mitchell'),
      c('af2', 'call', 'Visit at Ashby Farm', '30 Sep, 10:30', 'Mike Harris', 'Wants flush casements in Chartwell green to keep the farmhouse look.'),
      c('af1', 'system', 'Referral', '28 Sep, 09:00', 'Referral'),
    ],
    appt: { date: '2026-09-30', time: '10:00 – 11:00', who: 'mh', type: 'Home visit', address: 'Ashby Road, Thirsk', status: 'Done', outcome: 'Flush casements in Chartwell green.' },
    survey: { surveyor: 'rk', date: '2026-10-06', time: '13:00 – 15:00', status: 'Completed', requestedBy: 'Mike Harris', openings: ASHBY_OPS, access: 'Farm track, good access', parking: 'Yard', notes: 'Some lintels need checking on the rear.', photos: 18, signed: true, completedOn: '06 Oct' },
    quote: quoteFrom('FP-55120', ASHBY_OPS, '09 Oct', '08 Nov', 'Mike Harris', 'Sent', 600),
  },
  'EN-2284': {
    comms: [c('r3', 'email-out', 'Your quote FP-55118', '06 Oct, 12:00', 'James Brook'), c('r2', 'note', 'Survey completed', '05 Oct, 11:00', 'Priya Shah'), c('r1', 'system', 'Enquiry taken by phone', '04 Oct, 15:10', 'Sarah Mitchell')],
    appt: { date: '2026-10-04', time: '16:00', who: 'jb', type: 'Video call', address: '11 Bridge St, Wetherby', status: 'Done', outcome: 'Roof lantern for the kitchen extension.' },
    survey: { surveyor: 'ps', date: '2026-10-05', time: '10:00 – 11:00', status: 'Completed', requestedBy: 'James Brook', openings: ROBERTS_OPS, access: 'Flat roof via ladder', parking: 'Street', photos: 9, signed: true, completedOn: '05 Oct' },
    quote: quoteFrom('FP-55118', ROBERTS_OPS, '06 Oct', '05 Nov', 'James Brook', 'Sent'),
  },
  'EN-2285': {
    comms: [
      c('d6', 'email-in', 'Re: Your quote FP-55114', '14 Oct, 19:40', 'M. Duffy', 'Thanks — we like it. Could you do the doors in grey instead of black? Then we are happy to go ahead.'),
      c('d5', 'email-out', 'Your quote FP-55114', '07 Oct, 10:00', 'Emma Clarke'),
      c('d4', 'note', 'Survey completed', '06 Oct, 10:00', 'Rob King'),
      c('d3', 'call', 'Visit with M. Duffy', '06 Oct, 09:00', 'Emma Clarke'),
      c('d2', 'email-out', 'Thank you for your enquiry', '05 Oct, 13:00', 'Emma Clarke'),
      c('d1', 'system', 'Enquiry received from the website', '05 Oct, 12:30', 'Website'),
    ],
    appt: { date: '2026-10-06', time: '09:00 – 10:00', who: 'ec', type: 'Home visit', address: '60 Kirk Lane, Otley', status: 'Done', outcome: '3-pane bi-fold to the garden.' },
    survey: { surveyor: 'rk', date: '2026-10-06', time: '10:00 – 11:00', status: 'Completed', requestedBy: 'Emma Clarke', openings: DUFFY_OPS, access: 'Side gate', parking: 'Drive', photos: 7, signed: true, completedOn: '06 Oct' },
    quote: quoteFrom('FP-55114', DUFFY_OPS, '07 Oct', '06 Nov', 'Emma Clarke', 'Sent', 0, 'Happy to go ahead if the doors are grey.'),
  },
  'EN-2283': {
    comms: [
      c('s8', 'system', 'Customer joined the portal', '01 Oct, 08:10', 'Customer'),
      c('s7', 'email-out', 'Welcome to Jadeite — your job JG-10482', '30 Sep, 20:05', 'Sarah Mitchell', 'Portal invite and deposit invoice sent.'),
      c('s6', 'email-in', 'Re: Your quote FP-55109', '30 Sep, 19:42', 'Sarah & David Smith', 'We are happy to go ahead. Quote signed online.'),
      c('s5', 'email-out', 'Your quote FP-55109', '29 Sep, 15:00', 'Mike Harris'),
      c('s4', 'note', 'Survey completed', '29 Sep, 12:00', 'Priya Shah'),
      c('s3', 'call', 'Visit with the Smiths', '28 Sep, 16:00', 'Mike Harris'),
      c('s2', 'email-out', 'Thank you for your enquiry', '28 Sep, 10:30', 'Mike Harris'),
      c('s1', 'system', 'Enquiry received from the website', '28 Sep, 10:00', 'Website'),
    ],
    appt: { date: '2026-09-28', time: '16:00 – 17:00', who: 'mh', type: 'Home visit', address: '14 Ashby Road, Leicester', status: 'Done', outcome: 'Windows and front door, anthracite grey.' },
    survey: { surveyor: 'ps', date: '2026-09-29', time: '10:00 – 11:30', status: 'Completed', requestedBy: 'Mike Harris', openings: SMITH_OPS, access: 'Front and side, easy', parking: 'Driveway', notes: 'Dog in the garden — keep the side gate shut.', photos: 12, signed: true, completedOn: '29 Sep' },
    quote: quoteFrom('FP-55109', SMITH_OPS, '29 Sep', '29 Oct', 'Mike Harris', 'Accepted', 560, 'We are happy to go ahead.'),
    invite: { status: 'Active', sentOn: '30 Sep' }, jobId: 'JG-10482', wonOn: '30 Sep',
  },
  'EN-2282': {
    comms: [c('k3', 'email-in', 'Quote accepted', '04 Oct, 09:00', 'The Bakers'), c('k2', 'email-out', 'Your quote FP-55104', '01 Oct, 11:00', 'Emma Clarke'), c('k1', 'system', 'Enquiry taken in the showroom', '25 Sep, 13:20', 'Showroom')],
    survey: { surveyor: 'rk', date: '2026-09-29', time: '09:00 – 10:30', status: 'Completed', requestedBy: 'Emma Clarke', openings: [{ ref: 'W1', room: 'Whole house', type: 'Casement window', w: 1100, h: 1100, qty: 8 }], photos: 14, signed: true, completedOn: '29 Sep' },
    quote: quoteFrom('FP-55104', [{ ref: 'W1', room: 'Whole house', type: 'Casement window', w: 1100, h: 1100, qty: 8 }], '01 Oct', '31 Oct', 'Emma Clarke', 'Accepted'),
    invite: { status: 'Active', sentOn: '04 Oct' }, jobId: 'JG-10477', wonOn: '04 Oct',
  },
  'EN-2279': {
    comms: [
      c('h6', 'email-in', 'Re: Your quote FP-55126', '15 Oct, 18:20', 'Mrs Hughes', 'Thank you, we would like to go ahead. When can you fit?'),
      c('h5', 'email-out', 'Your quote FP-55126', '12 Oct, 14:00', 'Mike Harris'),
      c('h4', 'note', 'Survey completed', '11 Oct, 12:00', 'Priya Shah'),
      c('h3', 'call', 'Visit with Mrs Hughes', '09 Oct, 10:00', 'Mike Harris'),
      c('h2', 'email-out', 'Thank you for your enquiry', '07 Oct, 12:00', 'Mike Harris'),
      c('h1', 'system', 'Enquiry received from the website', '07 Oct, 11:20', 'Website'),
    ],
    appt: { date: '2026-10-09', time: '10:00 – 11:00', who: 'mh', type: 'Home visit', address: '9 Abbey Road, Knaresborough', status: 'Done', outcome: '5 sash windows, white.' },
    survey: { surveyor: 'ps', date: '2026-10-11', time: '10:00 – 11:30', status: 'Completed', requestedBy: 'Mike Harris', openings: HUGHES_OPS, access: 'Front, scaffold not needed', parking: 'Street', notes: 'Victorian terrace — keep sash style.', photos: 11, signed: true, completedOn: '11 Oct' },
    quote: quoteFrom('FP-55126', HUGHES_OPS, '12 Oct', '11 Nov', 'Mike Harris', 'Accepted', 0, 'We would like to go ahead.'),
    invite: { status: 'Not invited' }, wonOn: '16 Oct',
  },
  'EN-2281': {
    comms: [c('o3', 'email-in', 'Re: Your quote FP-55101', '01 Oct, 10:00', 'Mrs Okafor', 'Thank you, but we have gone with a cheaper quote.'), c('o2', 'email-out', 'Your quote FP-55101', '24 Sep, 09:00', 'James Brook'), c('o1', 'system', 'Enquiry received from the website', '22 Sep, 09:45', 'Website')],
    lostReason: 'Price — chose a cheaper quote',
  },
};

// A Won enquiry still waiting for its order, so the office can try the full after-Won flow.
export const EXTRA_ENQUIRY = {
  id: 'EN-2279', name: 'Mrs Hughes', initials: 'AH', phone: '07700 900 611', email: 'a.hughes@email.co.uk', address: '9 Abbey Road, Knaresborough', postcode: 'HG5 8HY',
  product: 'Sash windows', source: 'Website', received: '07 Oct, 11:20', daysAgo: 9, assigned: 'mh', stage: 'Won' as const, value: 6400,
  next: 'Review and invite customer', nextDue: 'Today', photo: 'window' as const,
};
