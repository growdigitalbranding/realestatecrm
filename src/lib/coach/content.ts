/**
 * Static content for the coaching site.
 *
 * Kept in one module (rather than a CMS or the CRM's Prisma schema) because the
 * site is five pages of editorial copy that changes a few times a year. Every
 * page imports from here so copy edits never require touching layout code.
 */

export const SITE = {
  name: "Maren Vale",
  role: "Life & Leadership Coach",
  tagline: "Coaching for people in the middle of becoming.",
  email: "hello@marenvale.co",
  phone: "+1 (415) 555-0188",
  location: "Oakland, California — and anywhere with a good connection",
  bookingWindow: "Currently taking four new one-on-one clients for the spring cohort.",
} as const;

export const NAV = [
  { href: "/coach/about", label: "About" },
  { href: "/coach/services", label: "Services" },
  { href: "/coach/blog", label: "Journal" },
  { href: "/coach/faq", label: "FAQ" },
  { href: "/coach/contact", label: "Contact" },
] as const;

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export const PRINCIPLES = [
  {
    n: "01",
    title: "Start from what's true",
    body: "Most coaching stalls because the first session is spent describing a life that already sounds good on paper. We skip that. The first hour is for the version of the story you'd only tell a friend at midnight.",
  },
  {
    n: "02",
    title: "Small moves, held steady",
    body: "Transformation is a marketing word. What actually moves is a specific behaviour, repeated past the point where it stops feeling novel. We pick two. We hold them.",
  },
  {
    n: "03",
    title: "You keep the authorship",
    body: "I don't hand out life plans. I ask better questions than the ones you've been asking yourself, and I refuse to let a good answer go unexamined.",
  },
  {
    n: "04",
    title: "Endings are part of it",
    body: "Good coaching is finite. If we're still meeting in three years for the same reason we met in the first month, one of us has stopped doing the work.",
  },
] as const;

export const TIMELINE = [
  {
    year: "2016",
    title: "The job that looked right",
    body: "Six years into operations management at a logistics firm. Promoted twice, quietly miserable, extremely good at pretending otherwise.",
  },
  {
    year: "2019",
    title: "The conversation that cracked it",
    body: "A manager asked me what I'd do if the promotion weren't available. I didn't have an answer. It took eight months to find one.",
  },
  {
    year: "2021",
    title: "Certification, then apprenticeship",
    body: "ICF-accredited training, then two years co-facilitating under a coach with thirty years on me. Most of what I know came from the second part.",
  },
  {
    year: "2023",
    title: "First keynote",
    body: "Ninety people at a regional operations summit, talking about the cost of a career that only makes sense from the outside. It became the talk I still get asked for.",
  },
  {
    year: "Now",
    title: "A small, deliberate practice",
    body: "Twelve one-on-one clients at a time. No more. Plus a speaking calendar I keep intentionally short so the coaching stays the centre of it.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

export type Service = {
  slug: string;
  kicker: string;
  title: string;
  summary: string;
  /** Each panel is one scroll "beat" while the service is pinned. */
  panels: { heading: string; body: string }[];
  meta: { label: string; value: string }[];
  cta: string;
};

export const SERVICES: Service[] = [
  {
    slug: "one-on-one",
    kicker: "Service 01",
    title: "One-on-one coaching",
    summary:
      "A six-month engagement for people making a decision that doesn't have a spreadsheet answer. Career pivots, first-time leadership, the quiet reckonings that arrive around a birthday.",
    panels: [
      {
        heading: "How it runs",
        body: "Twenty-four sessions across six months — weekly for the first eight weeks while we build momentum, then fortnightly. Fifty minutes, video or walking-and-talking if you're local to Oakland.",
      },
      {
        heading: "What we actually do",
        body: "The first three sessions are diagnostic: what you say you want, what your calendar says you want, and the gap between them. After that it's iterative — one or two commitments per session, reviewed honestly at the start of the next.",
      },
      {
        heading: "Between sessions",
        body: "You get a shared document, not a homework packet. Voice notes to me are welcome and I answer within a working day. The point is that the work continues when I'm not in the room.",
      },
      {
        heading: "What it costs",
        body: "$4,200 for the full engagement, or $750 monthly. Two sliding-scale places are held each cohort for people between roles — ask, it isn't a favour and I don't need the story.",
      },
    ],
    meta: [
      { label: "Format", value: "6 months · 24 sessions" },
      { label: "Cadence", value: "Weekly, then fortnightly" },
      { label: "Capacity", value: "12 clients at a time" },
      { label: "Investment", value: "$4,200 / $750 monthly" },
    ],
    cta: "Book an intro call",
  },
  {
    slug: "keynote",
    kicker: "Service 02",
    title: "Keynote speaking",
    summary:
      "Forty-five minutes on the cost of a career that only makes sense from the outside — written fresh for your room, not lifted from a slide deck I've given eleven times.",
    panels: [
      {
        heading: "The talk",
        body: "\"The Competent Trap\" — why high performers are the last to notice they've outgrown a role, and what the organisations around them can do about it before the resignation letter.",
      },
      {
        heading: "How I prepare",
        body: "Two calls before the date: one with you, one with three people from the audience. The talk gets rewritten around what they say. This is the part most speakers skip and it's the part that makes the room lean in.",
      },
      {
        heading: "Formats",
        body: "Forty-five-minute keynote, ninety-minute keynote plus facilitated breakout, or a half-day leadership intensive for teams under thirty. Remote works; the breakout doesn't, so I'll tell you if I think you should wait for an in-person date.",
      },
      {
        heading: "What it costs",
        body: "$3,500 for a keynote, $6,000 with the breakout, $9,500 for the half-day. Travel at cost. Reduced rates for nonprofits and public-sector events — just say so in the enquiry.",
      },
    ],
    meta: [
      { label: "Length", value: "45 min – half day" },
      { label: "Room size", value: "40 – 400" },
      { label: "Lead time", value: "8 weeks preferred" },
      { label: "Investment", value: "From $3,500" },
    ],
    cta: "Check a date",
  },
];

export const PROCESS = [
  {
    step: "01",
    title: "Intro call",
    body: "Thirty minutes, free, genuinely no pitch. Roughly a third of these end with me recommending someone else — a therapist, a career counsellor, a different coach. That's a good outcome.",
  },
  {
    step: "02",
    title: "The diagnostic",
    body: "Three sessions to find the real question. Almost nobody arrives with it already worded correctly, including me when I was on the other chair.",
  },
  {
    step: "03",
    title: "The work",
    body: "Months two through five. Commitments, review, adjustment. This part is unglamorous and it is where everything happens.",
  },
  {
    step: "04",
    title: "The ending",
    body: "A closing session that names what changed and what you'll do without me. Then I get out of the way. Alumni check-ins are always open, but they're check-ins, not a renewal.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Journal                                                                    */
/* -------------------------------------------------------------------------- */

export type Post = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  readingMinutes: number;
  category: "Practice" | "Work" | "Speaking";
  /** Rendered as sequential prose blocks; `h` marks a subheading. */
  body: { h?: string; p: string[] }[];
};

export const POSTS: Post[] = [
  {
    slug: "the-competent-trap",
    title: "The competent trap",
    dek: "Being good at a job is the most effective way to stop noticing you've outgrown it.",
    date: "2026-07-14",
    readingMinutes: 7,
    category: "Work",
    body: [
      {
        p: [
          "There is a particular kind of stuck that only happens to people who are doing well. It doesn't announce itself. There's no bad review, no missed target, no moment you could point to later and say — that's when it started. There's just a Tuesday, sometime in your fourth or fifth year, when you realise you could do the whole day with the lights off.",
          "I call it the competent trap, and it's the single most common thing I see in a first session.",
        ],
      },
      {
        h: "Why competence hides the problem",
        p: [
          "Discomfort is useful information. It's the signal that says: something here does not fit. The trouble with getting good at a role is that you systematically remove the discomfort. You learn the shortcuts. You stop having to think. The friction that would have told you something disappears, and what's left is a job that fits perfectly and means nothing.",
          "Worse, everyone around you reads your competence as contentment. Nobody asks a high performer whether they're okay. They ask them to take on another region.",
        ],
      },
      {
        h: "The question that works",
        p: [
          "The most useful question I know for this is not \"what do you want?\" — almost nobody can answer that under pressure. It's narrower: what would you do if the next promotion were not available to you?",
          "The answer arrives faster than people expect, and it's usually specific. That specificity is the whole point. It tells you the shape of the thing you actually want, which is very hard to see while a ladder is standing directly in front of it.",
        ],
      },
      {
        h: "What to do on Wednesday",
        p: [
          "Nothing dramatic. Resigning is a decision, not a discovery, and it should come much later than it usually does.",
          "Instead: for two weeks, note the fifteen minutes of each day you'd have volunteered for. Not the parts you're best at — the parts you'd do without being asked. Most people find three or four recurring things. That list is the raw material for every useful conversation that follows.",
        ],
      },
    ],
  },
  {
    slug: "goals-are-mostly-decoration",
    title: "Goals are mostly decoration",
    dek: "On why the plan you wrote in January was never the thing that was going to work.",
    date: "2026-05-02",
    readingMinutes: 6,
    category: "Practice",
    body: [
      {
        p: [
          "I ask new clients to bring their goals to the first session. Not because we'll use them — because of what they reveal about the audience they were written for.",
          "Read your own goals honestly and you can usually identify who you were trying to impress when you wrote them. Sometimes it's a manager. Often it's a parent. Frequently it's a version of yourself from about nine years ago who would be extremely pleased and is no longer in the room.",
        ],
      },
      {
        h: "Goals versus commitments",
        p: [
          "A goal describes an outcome you don't control. A commitment describes a behaviour you do. \"Get promoted to director\" is a goal; whether it happens depends on a reorg you haven't been told about yet. \"Have one substantive conversation a week with someone outside my function\" is a commitment. You can keep it on a bad week.",
          "Almost all of the progress I've watched people make came from converting one into the other and then not being clever about it for several months.",
        ],
      },
      {
        h: "The two-commitment rule",
        p: [
          "Two. Not five, not a system, not an app. Two behaviours, reviewed out loud every session, with an honest answer about whether they happened.",
          "The honesty is the active ingredient. Reporting a missed week to another person is uncomfortable in exactly the way that produces change, which is why self-directed versions of this almost never hold.",
        ],
      },
    ],
  },
  {
    slug: "what-i-say-no-to",
    title: "What I say no to",
    dek: "A short, specific list — because a practice is defined more by its refusals than its offerings.",
    date: "2026-03-19",
    readingMinutes: 4,
    category: "Practice",
    body: [
      {
        p: [
          "Coaching has a marketing problem: everyone's page says the same warm, unfalsifiable things. So here is the negative space instead.",
        ],
      },
      {
        h: "I don't do open-ended engagements",
        p: [
          "Six months, then an ending. If you want to come back in two years for a different question, good — that's a new engagement with a new shape. An indefinite retainer makes me a dependency, and a dependency is the opposite of the product.",
        ],
      },
      {
        h: "I don't take more than twelve clients",
        p: [
          "Not scarcity marketing. Past twelve I start recognising patterns instead of people, and the questions get lazier. I've tested this and I was worse at fourteen.",
        ],
      },
      {
        h: "I don't work in place of therapy",
        p: [
          "Coaching is forward-facing and behavioural. If what's in the room is grief, trauma, or a clinical condition, the honest and useful move is a referral, and I keep a list of people I'd send my own family to.",
        ],
      },
      {
        h: "I don't give the same keynote twice",
        p: [
          "The talk gets rebuilt for the room after two prep calls, one of them with people who'll be in the audience. It's more work and it is the only reason the talk lands.",
        ],
      },
    ],
  },
  {
    slug: "preparing-a-room",
    title: "Preparing a room, not a slide deck",
    dek: "What two phone calls with the audience do that no amount of rehearsal can.",
    date: "2026-01-28",
    readingMinutes: 5,
    category: "Speaking",
    body: [
      {
        p: [
          "The first keynote I gave was well-rehearsed and largely inert. I had the timing, the pauses, the story that lands. What I didn't have was any idea what the ninety people in front of me had been arguing about for the previous six months.",
        ],
      },
      {
        h: "The two calls",
        p: [
          "Now every talk starts with a call with the organiser and a call with three people from the audience — deliberately not the leadership. I ask what everyone already knows but nobody says on stage. There's always something.",
          "At one manufacturing conference it was that a restructure had been announced and unexplained eleven days earlier. No talk about career growth was going to work in that room without naming it first. So I named it in the opening ninety seconds, and the rest of the hour was possible.",
        ],
      },
      {
        h: "What this costs",
        p: [
          "About four extra hours per booking, and the loss of a reusable deck. Both are worth it. A talk that could be given to any room is a talk that was written for no room.",
        ],
      },
    ],
  },
] as const as Post[];

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type FaqSection = {
  id: string;
  label: string;
  items: { q: string; a: string }[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "getting-started",
    label: "Getting started",
    items: [
      {
        q: "How do I know if coaching is the right thing for me?",
        a: "The clearest signal is that you keep having the same conversation with yourself and it keeps ending in the same place. Coaching is useful when you have a decision or a direction to work on and enough stability to do the work. If what's most present is grief, burnout at a clinical level, or something you'd describe as a crisis, therapy first is the honest answer — and I'll say so on the intro call rather than take the booking.",
      },
      {
        q: "What happens on the intro call?",
        a: "Thirty minutes, free, no slides. You describe what's going on; I ask questions and tell you plainly whether I think I'm useful. Roughly a third of these end with a referral elsewhere. There's no follow-up sequence and I won't email you twice.",
      },
      {
        q: "Do I need to know what my goal is before we start?",
        a: "No, and most people who think they do turn out to have the question worded wrong. The first three sessions are specifically for finding the real one.",
      },
    ],
  },
  {
    id: "the-work",
    label: "The work itself",
    items: [
      {
        q: "How long is the engagement?",
        a: "Six months — twenty-four sessions, weekly for the first eight weeks, then fortnightly. I don't offer open-ended retainers. A defined ending is part of what makes the work move.",
      },
      {
        q: "What if I need to pause?",
        a: "Life happens. You can pause for up to eight weeks without losing sessions or paying for the gap. Beyond that we'll talk about whether restarting later is the better call.",
      },
      {
        q: "Is there work between sessions?",
        a: "Two commitments at a time, agreed by you, reviewed at the start of the next session. That's it. No worksheets. Voice notes to me between sessions are welcome and I reply within a working day.",
      },
      {
        q: "What's your cancellation policy?",
        a: "Twenty-four hours' notice and we reschedule, no charge. Inside twenty-four hours the session is used, with two forgiven no-notice cancellations across the engagement because everyone has a bad month.",
      },
    ],
  },
  {
    id: "speaking",
    label: "Speaking",
    items: [
      {
        q: "What do you speak about?",
        a: "The core talk is \"The Competent Trap\" — why strong performers are the last to notice they've outgrown a role, and what the people around them can do before it becomes a resignation. It gets rewritten for each room after two prep calls.",
      },
      {
        q: "How far ahead should we book?",
        a: "Eight weeks is comfortable. I can work with four. Under four I'd be giving you a generic talk, which neither of us wants.",
      },
      {
        q: "Do you speak remotely?",
        a: "Yes for the keynote. No for the facilitated breakout — it genuinely doesn't survive the format, and I'll suggest you wait for an in-person date rather than sell you a weaker version.",
      },
    ],
  },
  {
    id: "practical",
    label: "Practical",
    items: [
      {
        q: "What does it cost?",
        a: "One-on-one coaching is $4,200 for the six-month engagement, or $750 monthly. Keynotes start at $3,500. Full detail is on the services page — no \"contact for pricing\".",
      },
      {
        q: "Do you offer sliding scale?",
        a: "Two places each cohort for people between roles, and reduced speaking rates for nonprofits and public-sector events. Ask directly; you don't need to justify it to me.",
      },
      {
        q: "Where are you based?",
        a: "Oakland, California. Sessions are video by default, and walking sessions are available if you're local. Speaking travel is quoted at cost.",
      },
      {
        q: "Is what I say confidential?",
        a: "Yes. Nothing from a session is shared, used in a talk, or written about — including anonymised — without your explicit written agreement. The examples in my keynotes come from my own career or from people who read the passage first and said yes.",
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
