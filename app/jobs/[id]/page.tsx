'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';

// Full JDs inlined here (you can centralise later in /lib/jobs)
const JOBS = {
  'mercury-se': {
    id: 'mercury-se',
    employer: 'Mercury',
    title: 'Software Engineer',
    jd: `Software Engineer at Mercury
Software Engineer Internship at Mercury
Build real software. Use real AI. Learn fast.

At Mercury, we’re looking for software engineering interns who are passionate about building software and discovering new ways to improve it. If you're curious and love experimenting with emerging technologies like AI, you'll feel right at home. You’ll join a team that values smart solutions, creative thinking, and adding real value to the business.

You’ll work with tools like:
C#, .NET, ASP.NET
Azure (PaaS, IaaS, and AI services)
Visual Studio 2022, Git, Azure DevOps
SQL Server
GitHub Copilot, ChatGPT, and other AI coding assistants
Jira, Confluence, Slack

You’ll get to:
Build real features with real impact
Learn how AI enhances code, testing, and deployment
Contribute ideas and grow in a supportive team
Explore how automation and AI can change the way we work
Experiment with modern frameworks and infrastructure like Next.js and containers, as well as AI-powered coding tools like Cursor and Claude`,
  },
  'one-nz-ai-pe': {
    id: 'one-nz-ai-pe',
    employer: 'One New Zealand',
    title: 'AI Product Engineer',
    jd: `AI Product Engineer at One New Zealand
Role purpose
The AI Product Engineer is a high-agency product builder — customer focused, technical, impact-obsessed, and here to ship things that matter. You don’t wait for instructions, you see AI as a teammate, and you can turn messy ideas into live products quickly.

Accountabilities
- Ship outcomes at speed
- Jump between stacks (frontend, backend, automation)
- Prove possibilities with prototypes
- Iterate relentlessly with user feedback
- Direct and orchestrate AI agents

About you
- Doer who ships
- Multi-stack curious
- AI-native (use AI to code/design/test)
- Fast mover
- Comfortable with change
- Impact-driven

Ways of working
Agile collaboration and focus on outcomes. Behaviours: HEART, GRIT & FREEDOM.

Security & privacy
Follow One NZ policies and report possible breaches promptly.`,
  },
  'trademe-fs-intern': {
    id: 'trademe-fs-intern',
    employer: 'Trade Me',
    title: 'Full Stack Developer Intern',
    jd: `Full Stack Developer Intern at Trade Me
Trade Me is an iconic Kiwi brand with millions of users.

We’re after Summer of Tech interns for Engineering teams in Auckland, Wellington or Christchurch (Property, Motors or Jobs).

As a Full Stack Developer, you’ll work on:
- Frontend for our main website
- Backend APIs and services
- Databases and cloud environments
- Cross-functional with engineers/designers/delivery leads

You’ll:
- Work in an agile environment
- Help define/refine squad work
- Write code & unit tests
- Peer review and document
- Collaborate across Aotearoa

What you’ll bring:
- Passion for software development
- Positive, hungry to learn
- Team player
- Understanding of patterns
- Not scared of learning new tech

Perks:
- Great office perks
- Flexible working
- Big-brand experience
- Innovative, supportive culture`,
  },
} as const;

// 7 FAQs per job (as provided)
const FAQS: Record<string, Array<{ q: string; a: string }>> = {
  'trademe-fs-intern': [
    { q: 'What does your company do?', a: 'Trade Me is NZ’s biggest online marketplace, connecting over 5 million Kiwis with property, motors, jobs, and more.' },
    { q: 'What roles are you offering?', a: 'We’re hiring 3 Full Stack Developer Interns across Property, Motors, and Jobs teams.' },
    { q: 'What skills or experience are you looking for?', a: 'Passion for coding, willingness to learn, and teamwork — no prior .NET/web experience required.' },
    { q: 'What does the application process look like?', a: 'CV review → interviews → offers made before summer.' },
    { q: 'Do you hire international students / sponsor visas?', a: 'You must have NZ work rights; we don’t provide visa sponsorship.' },
    { q: 'What is the workplace culture like?', a: 'Collaborative, fun, and supportive — with flexible work and plenty of perks.' },
    { q: 'What opportunities exist after the internship?', a: 'Strong interns may be considered for graduate roles the following year.' },
  ],
  'mercury-se': [
    { q: 'What does your company do?', a: 'Mercury is an energy company using software and AI to build smarter, more sustainable solutions.' },
    { q: 'What roles are you offering?', a: 'We’re offering Software Engineer Internships focused on building features and experimenting with AI.' },
    { q: 'What skills or experience are you looking for?', a: 'Curiosity, problem-solving, and familiarity with coding (C#, .NET, SQL helpful but not mandatory).' },
    { q: 'What does the application process look like?', a: 'Apply online → technical interview → cultural fit discussion.' },
    { q: 'Do you hire international students / sponsor visas?', a: 'Applicants must have NZ work rights for the duration of the internship.' },
    { q: 'What is the workplace culture like?', a: 'Innovative, fast-moving, and supportive, with a focus on experimenting with new tech like AI.' },
    { q: 'What opportunities exist after the internship?', a: 'High-performing interns may transition into graduate positions within engineering teams.' },
  ],
  'one-nz-ai-pe': [
    { q: 'What does your company do?', a: 'One NZ is a leading telco, investing heavily in AI-driven products and customer innovation.' },
    { q: 'What roles are you offering?', a: 'We’re offering AI Product Engineer roles — full-stack builders using AI agents to ship products fast.' },
    { q: 'What skills or experience are you looking for?', a: 'Strong in one area (DevOps, UX, APIs, or data) but open to learning across stacks, plus comfort using AI tools.' },
    { q: 'What does the application process look like?', a: 'Application → technical/product interview → rapid prototyping task → offer.' },
    { q: 'Do you hire international students / sponsor visas?', a: 'Applicants must hold valid NZ work rights; sponsorship isn’t provided for internships.' },
    { q: 'What is the workplace culture like?', a: 'Agile, bold, and fast-paced — HEART, GRIT & FREEDOM guide how we work.' },
    { q: 'What opportunities exist after the internship?', a: 'Successful interns can progress into AI-focused graduate or junior product/engineering roles.' },
  ],
};

function presetQuestionsFor(id: string) {
  switch (id) {
    case 'one-nz-ai-pe':
      return [
        'What problems could I ship in week one?',
        'How do AI agents fit into the current stack?',
        'What does “shipping outcomes fast” look like here?',
      ];
    case 'mercury-se':
      return [
        'Which product areas will interns touch first?',
        'How do you use AI tools (Copilot/ChatGPT) in the workflow?',
        'What does success look like for a 10-week internship?',
      ];
    case 'trademe-fs-intern':
      return [
        'Will I rotate across FE/BE/Cloud or focus on one?',
        'What engineering practices are most valued in squads?',
        'How often do interns ship to production?',
      ];
    default:
      return ['Can you tell me more about this role?', 'How is success measured?', 'What tech will I use most?'];
  }
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const job = useMemo(() => (JOBS as any)[params.id], [params.id]);
  const faqs = useMemo(() => FAQS[params.id] || [], [params.id]);
  const [qs, setQs] = useState<string[]>(presetQuestionsFor(params.id));

  if (!job) {
    return (
      <div className="card">
        <p>
          Job not found.{' '}
          <Link className="underline" href="/student">
            Back to student page
          </Link>
        </p>
      </div>
    );
  }

  const updateQ = (i: number, v: string) => setQs((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  // ✅ Keep APPLY inside the component so it can see job / qs / router.
  const apply = () => {
    // Save the user’s questions per job
    const qKey = 'student_job_questions';
    const existing = JSON.parse(localStorage.getItem(qKey) || '{}');
    existing[job.id] = qs;
    localStorage.setItem(qKey, JSON.stringify(existing));

    // Mark as applied so it appears in the Student page “Jobs I’ve applied”
    const aKey = 'student_applied_job_ids';
    const arr = JSON.parse(localStorage.getItem(aKey) || '[]');
    const next = Array.isArray(arr) ? Array.from(new Set([...arr, job.id])) : [job.id];
    localStorage.setItem(aKey, JSON.stringify(next));

    alert('Applied + questions saved (included in your per-job QR on the student page).');
    router.push('/student');
  };

  return (
    <div className="grid gap-6">
      {/* JD */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {job.employer} — {job.title}
          </h2>
          <Link href="/student" className="btn">
            Back
          </Link>
        </div>
        <pre className="text-sm whitespace-pre-wrap opacity-90 mt-3">{job.jd}</pre>
      </div>

      {/* FAQs (7 most asked) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Top 7 FAQs</h3>
        {faqs.length === 0 ? (
          <p className="text-sm opacity-70">No FAQs added yet.</p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((f, i) => (
              <li key={i} className="p-3 rounded-xl border border-white/10 bg-black/20">
                <div className="font-medium">
                  {i + 1}. {f.q}
                </div>
                <div className="text-sm opacity-90 mt-1">{f.a}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Student’s own questions to ask (saved on Apply) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Your questions to ask</h3>
        <div className="space-y-2">
          {qs.map((q, i) => (
            <input key={i} className="input w-full" value={q} onChange={(e) => updateQ(i, e.target.value)} />
          ))}
        </div>
        <button className="btn mt-3" onClick={apply}>
          Apply & Save Questions
        </button>
        <p className="text-xs opacity-70 mt-2">
          These will appear in your <b>per-job QR</b> on the Student page for this employer.
        </p>
      </div>
    </div>
  );
}
