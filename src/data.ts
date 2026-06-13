export const PROFILE = {
  name: 'Sandy E. Quintero',
  handle: 'SANDY.SYSDEV',
  version: 'v2.0',
  title: 'From Starbucks Barista to Retro DeV',
  subtitle: 'UTEL BBA Student & AI Builder Apprentice',
  tagline:
    "Born in the '80s, tech enthusiast, combining 15 years of customer service & hospitality leadership with active Python and AI Builder learning paths.",
  location: 'Daule, Ecuador',
  email: 'sandy_elisa@yahoo.es',
  linkedin: 'https://www.linkedin.com/in/sandy-e-q-30171254',
  bio: 'I am a passionate hospitality professional who dedicated over 11 years to leading guest experiences at Starbucks, Marriott, and Hilton. Today, I fuse my absolute attention to detail and proactive problem-solving with AI Builder and retro web development. Currently pursuing a Business Administration degree at UTEL and an active AI Builder learning path, I construct interactive systems to demonstrate my growth and analytical capabilities.',
  quote: 'Hospitality teaches operational empathy, while code breeds structured logic.',
  languages: [
    { name: 'Spanish', level: 'Native / Bilingual' },
    { name: 'English', level: 'Full Professional' },
  ],
};

export interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  ready: boolean;
}

export const GAMES: GameInfo[] = [
  {
    id: 'pac-toe',
    title: 'Pac-Toe: Neon Arcade',
    description:
      'Three sectors (3×3, 5×5, 7×7), six levels each — outline Ghosty, capture ghost coins, customize your Pac. Press START!',
    icon: '🕹️',
    ready: true,
  },
  {
    id: 'stranger-pac',
    title: 'Stranger Pac-Man',
    description:
      'Guide Eleven through the Upside Down maze. Demogorgons hunt in the dark — waffles restore your power.',
    icon: '🧇',
    ready: false,
  },
  {
    id: 'space-race',
    title: 'Galactic Speedway',
    description:
      'Race starfighters through asteroid fields in a galaxy far, far away. Six sectors, rising speed.',
    icon: '🚀',
    ready: false,
  },
  {
    id: 'zelda-mario',
    title: 'Legend of the Mushroom Kingdom',
    description:
      "A hero's quest across 6 living worlds: slash goombas, loot ?-blocks, grab the key and warp-pipe onward. The Shell Dragon awaits!",
    icon: '🗡️',
    ready: true,
  },
  {
    id: 'barista',
    title: 'Starbucks Retro Barista',
    description:
      'Interactive tribute to 11+ years of coffee craft. Brew cappuccinos and lattes against the clock.',
    icon: '☕️',
    ready: false,
  },
  {
    id: 'octo-catcher',
    title: 'GitHub Octo-Catcher',
    description:
      'Manage a Git branch to catch commits and avoid merge conflicts.',
    icon: '🐙',
    ready: false,
  },
];

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  duration: string;
  location: string;
  icon: string;
  bullets: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 'starbucks',
    company: 'Starbucks',
    role: 'Senior Barista & Trainer',
    period: 'Sep 2013 — Jun 2025',
    duration: '11 yrs 10 mos',
    location: 'United States',
    icon: '☕️',
    bullets: [
      'Crafted premium specialty beverages with high consistency in fast-paced, high-volume retail environments.',
      'Cultivated genuine loyalty by memorizing personal preferences of hundreds of recurring guests.',
      'Onboarded and trained dozens of new partners, enforcing operational standards and safety best practices.',
      'Continuously recognized for an outstanding positive attitude and strong leadership potential.',
    ],
  },
  {
    id: 'marriott',
    company: 'JW Marriott Hotel & Executive Apartments',
    role: 'AM Housekeeping Supervisor',
    period: 'Sep 2010 — May 2012',
    duration: '1 yr 9 mos',
    location: 'Miami, FL, USA',
    icon: '🏨',
    bullets: [
      'Supervised the morning hospitality team to ensure adherence to JW Marriott five-star luxury expectations.',
      'Coordinated directly with front desk management and maintenance to respond instantly to guest issues.',
      'Delivered brand orientation and structured safety training schedules for all new team members.',
    ],
  },
  {
    id: 'hilton',
    company: 'Hilton Worldwide',
    role: 'Night Audit Specialist',
    period: 'Feb 2008 — Apr 2010',
    duration: '2 yrs 3 mos',
    location: 'Ocean City, MD, USA',
    icon: '🌙',
    bullets: [
      'Managed overnight front office operations, balancing daily accounts and closing system-wide financial logs.',
      'Provided high-standard guest services to late-night arrivals and handled emergency protocols calmly.',
    ],
  },
  {
    id: 'pax',
    company: 'Pax Wholesome Foods',
    role: 'Barista & Cashier',
    period: 'Aug 2007 — Dec 2007',
    duration: '5 mos',
    location: 'New York, NY, USA',
    icon: '🗽',
    bullets: [
      'Delivered fast, high-quality beverage service in a high-traffic Manhattan gourmet café environment.',
      'Audited registers, processed complex cash & card transactions, and supported team layout shifts.',
    ],
  },
];

export interface Skill {
  name: string;
  level: number;
  category: 'Tech' | 'Hospitality' | 'Soft Skills';
}

export const SKILLS: Skill[] = [
  { name: 'Git & GitHub Version Control', level: 90, category: 'Tech' },
  { name: 'AI Builder & Web Core', level: 65, category: 'Tech' },
  { name: 'Python Scripting Explorer', level: 70, category: 'Tech' },
  { name: 'Creative AI & Prompt Engineering', level: 95, category: 'Tech' },
  { name: 'Guest Experience Excellence', level: 100, category: 'Hospitality' },
  { name: 'Operation Logistics & Supervision', level: 90, category: 'Hospitality' },
  { name: 'Active Listening & Connection', level: 100, category: 'Soft Skills' },
  { name: 'Leadership & Partner Mentoring', level: 95, category: 'Soft Skills' },
];

export const CERTIFICATIONS = [
  { id: 'ibm', name: 'AI Builder Professional Certificate', issuer: 'IBM / Coursera', year: 'In Progress', icon: '🌐' },
  { id: 'git', name: 'Getting Started with Git and GitHub', issuer: 'Google / Coursera', year: '2025', icon: '🐙' },
  { id: 'gai', name: 'Google AI Professional Certificate', issuer: 'Google', year: '2025', icon: '✨' },
  { id: 'prompt', name: 'Google Prompting Essentials Specialization', issuer: 'Google', year: '2025', icon: '🧠' },
  { id: 'python', name: 'Programming for Everybody (Python)', issuer: 'Univ. of Michigan / Coursera', year: '2025', icon: '🐍' },
  { id: 'excel', name: 'Excel Skills for Business: Essentials', issuer: 'Macquarie University / Coursera', year: '2024', icon: '📊' },
];

export const EDUCATION = [
  { id: 'ibm-cert', institution: 'IBM Academy', degree: 'AI Builder Developer Course', period: 'Active Path' },
  { id: 'utel', institution: 'UTEL Universidad', degree: 'Bachelor of Business Administration (BBA)', period: '2025 — Expected 2029' },
  { id: 'worwic', institution: 'Wor-Wic Community College', degree: 'Hotel, Motel & Restaurant Management', period: '2008 — 2010' },
  { id: 'ucsg', institution: 'U. Católica de Santiago de Guayaquil', degree: 'Business Management (Initial Studies)', period: '2001 — 2003' },
];

export interface TVChannel {
  id: number;
  title: string;
  genre: string;
  length: string;
  icon: string;
  synopsis: string;
}

export const TV_CHANNELS: TVChannel[] = [
  {
    id: 1,
    title: 'Behind the Scenes: My First Portfolio',
    genre: 'Creative Vlog / Humour',
    length: '2:45 min',
    icon: '💻',
    synopsis:
      'A fun, honest vlog about late nights learning React, wrestling TypeScript brackets, and celebrating when the page finally compiles. Zero placeholders, pure reality!',
  },
  {
    id: 2,
    title: 'The Science of the Perfect Cappuccino',
    genre: 'Coffee Mastery',
    length: '3:15 min',
    icon: '☕️',
    synopsis:
      'Eleven years of milk foam distilled into three minutes: temperature, texture, and the art of pouring hearts that survive until the first sip.',
  },
  {
    id: 3,
    title: 'The Night Audit Chronicles',
    genre: 'Hospitality Comedy',
    length: '4:00 min',
    icon: '🏨',
    synopsis:
      'True stories from the Hilton night shift: balancing the books at 3 AM, sleepwalking guests, and the eternal mystery of the lobby printer.',
  },
  {
    id: 4,
    title: 'AI Prompting: A Creative Experiment',
    genre: 'AI Exploration',
    length: '1:50 min',
    icon: '🧠',
    synopsis:
      'Prompt-engineering experiments: turning an idea into an interactive system by conversing with AI models. Spoiler: specificity is everything.',
  },
];

export const COMMITS = [
  { date: '2025-08-10 14:32:01', hash: 'commit-8a1bf2', msg: "docs: initialize Sandy's interactive system portfolio" },
  { date: '2025-08-15 09:15:33', hash: 'commit-4e9d7c', msg: 'feat: initialize UTEL Universidad Business Administration degree track' },
  { date: '2025-11-20 18:22:11', hash: 'commit-3c5f2b', msg: 'study: initialize IBM Full Stack Developer Certificate path' },
  { date: '2026-02-22 11:05:40', hash: 'commit-7d4e3a', msg: 'feat: complete Google Prompting Essentials Specialization' },
  { date: '2026-05-24 16:40:00', hash: 'commit-9b2c1d', msg: 'feat: establish Git workspace and configure 4-slot Arcade cabinet' },
  { date: '2026-06-11 10:08:27', hash: 'commit-e5a8f0', msg: 'feat: ship Retro Dev-Station v2.0 with GSAP + Three.js engine' },
];
