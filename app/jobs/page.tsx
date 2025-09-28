'use client';
import { useMemo, useState } from 'react';
import { useEmbeddings, JobLite } from '@/lib/useEmbeddings';

function makeJobs(): JobLite[] {
  return [
    {
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
Experiment with modern frameworks and infrastructure like Next.js and containers, as well as AI-powered coding tools like Cursor and Claude`
    },
    {
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
Follow One NZ policies and report possible breaches promptly.`
    },
    {
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
- Innovative, supportive culture`
    }
  ];
}

export default function JobsPage() {
  const baseJobs = useMemo(() => makeJobs(), []);
  const [cvText, setCvText] = useState('');
  const [results, setResults] = useState<Array<JobLite & { score: number }>>([]);
  const { loading, scoreCvAgainstJobs } = useEmbeddings();

  const handleScore = async () => {
    if (!cvText.trim()) return;
    const out = await scoreCvAgainstJobs(cvText, baseJobs);
    setResults(out);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: CV input */}
      <div className="card lg:col-span-1">
        <h2 className="text-xl font-semibold mb-2">Your CV</h2>
        <textarea
          className="input h-64"
          placeholder="Paste your CV text here (you can wire PDF upload later)…"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
        />
        <button className="btn mt-3" onClick={handleScore} disabled={loading || !cvText.trim()}>
          {loading ? 'Scoring…' : 'Score my fit'}
        </button>
        <p className="text-xs opacity-70 mt-2">
          We compare your CV to each job description and show a 0–100 similarity score (browser-only).
        </p>
      </div>

      {/* Middle: Job descriptions */}
      <div className="card lg:col-span-2">
        <h3 className="font-semibold mb-2">Job Descriptions (used by the AI)</h3>
        <div className="space-y-4 max-h-[28rem] overflow-auto pr-2">
          {baseJobs.map((j) => (
            <div key={j.id} className="p-3 rounded-xl border border-white/10 bg-black/20">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium">{j.title}</div>
                <div className="text-xs opacity-70">{j.employer}</div>
              </div>
              <pre className="text-xs whitespace-pre-wrap opacity-90">{j.jd}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-3 card">
        <h3 className="font-semibold mb-2">Results</h3>
        {results.length === 0 ? (
          <p className="text-sm opacity-70">No results yet. Paste your CV and click “Score my fit”.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employer</th>
                <th>Role</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.employer}</td>
                  <td>{r.title}</td>
                  <td><span className="badge">{r.score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs opacity-70 mt-2">
          Use these scores to prioritise your Meet &amp; Greet itinerary and job applications.
        </p>
      </div>
    </div>
  );
}
