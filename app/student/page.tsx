'use client';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { students } from '@/lib/mock';
import { useEffect, useMemo, useState } from 'react';
import { useSimpleScorer as useEmbeddings, JobLite } from '@/lib/useSimpleScorer';
import { QRCodeCanvas } from 'qrcode.react';

/* ---------------- Jobs seed (no filler text) ---------------- */
function makeJobs(): JobLite[] {
  return [
    {
      id: 'mercury-se',
      employer: 'Mercury',
      title: 'Software Engineer',
      jd: `Build features in C#/.NET and Azure, collaborate cross-functionally, and experiment with AI tools (Copilot/ChatGPT) to speed up delivery.`,
    },
    {
      id: 'one-nz-ai-pe',
      employer: 'One New Zealand',
      title: 'AI Product Engineer',
      jd: `High-agency product builder. Prototype fast across FE/BE/automation, orchestrate AI agents, and ship outcomes with user feedback loops.`,
    },
    {
      id: 'trademe-fs-intern',
      employer: 'Trade Me',
      title: 'Full Stack Developer Intern',
      jd: `Work on website frontend, backend APIs, and cloud. Agile squads, code reviews, and regular shipping to production.`,
    },
  ];
}

/* ---------------- tiny helpers ---------------- */
async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'txt') throw new Error('Only .txt files are supported in this demo');
  return file.text();
}

const APPLIED_KEY = 'student_applied_job_ids';
const QUESTIONS_KEY = 'student_job_questions';

/* ---------------- Small util ---------------- */
const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-semibold mb-2 text-transparent bg-clip-text gradient-text--green">{children}</h3>
);

function downloadJson(filename: string, data: string | object) {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Child: one applied job item (with QR + scanner/notes upload) ---------------- */
function AppliedJobItem({
  rank,
  job,
  questionsForJob,
}: {
  rank: number;
  job: JobLite;
  questionsForJob: string[];
}) {
  const [scanned, setScanned] = useState<any>(null);
  const [notes, setNotes] = useState<string>('');

  const perJobPayload = {
    type: 'student_job',
    jobId: job.id,
    jobTitle: job.title,
    employer: job.employer,
    id: 's3',
    name: 'Maahir Shaik',
    skills: ['typescript', 'nextjs', 'cv', 'ai', 'sql'],
    questions: questionsForJob,
  };
  const perJobPayloadStr = JSON.stringify(perJobPayload, null, 2);

  const handlePerJobJson = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    try {
      const obj = JSON.parse(text);
      setScanned(obj);
      const key = `student_notes_${obj?.id || 'unknown'}_${obj?.jobId || job.id}`;
      setNotes(localStorage.getItem(key) || '');
    } catch {
      alert('Invalid QR JSON');
    }
  };

  const saveNotes = () => {
    if (!scanned) return;
    const key = `student_notes_${scanned?.id || 'unknown'}_${scanned?.jobId || job.id}`;
    localStorage.setItem(key, notes);
    alert('Notes saved ✅');
  };

  return (
    <li className="p-3 rounded-xl border border-white/10 bg-black/20">
      {/* Header: rank only (no scores) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge text-sm" title="Priority rank">{rank}</span>
          <div className="font-medium">
            <span className="text-[#57c84d]">{job.employer}</span> — {job.title}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs opacity-80 mt-2 whitespace-pre-wrap">{job.jd}</p>

      {/* Questions preview (from FAQ page) */}
      <div className="mt-3">
        <div className="text-xs opacity-80 mb-1">Your questions for this employer:</div>
        {questionsForJob.length ? (
          <ul className="list-disc ml-5 text-xs opacity-90">
            {questionsForJob.slice(0, 7).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        ) : (
          <div className="text-xs opacity-60">
            No questions yet. Add them on the{' '}
            <Link href={`/jobs/${job.id}/faq`} className="underline">FAQ page</Link>.
          </div>
        )}
      </div>

      {/* Employer-scannable QR for this job (shows student + questions) */}
      <div className="mt-3 flex items-start gap-4">
        <div className="shrink-0 text-center">
          <QRCodeCanvas value={perJobPayloadStr} size={90} />
          <div className="text-[10px] opacity-70 mt-1">Employer can scan</div>
          {/* NEW: download button under every QR */}
          <button
            className="mt-1 text-[10px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
            onClick={() => downloadJson(`student-s3-${job.id}.json`, perJobPayloadStr)}
          >
            Download QR (.json)
          </button>
        </div>

        {/* Student’s scanner & notes (upload employer QR JSON) */}
        <div className="flex-1">
          <div className="text-sm font-medium text-transparent bg-clip-text gradient-text--green">
            Scanner & Notes
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="moving-green-btn inline-flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer select-none text-black font-semibold">
              Upload employer QR (JSON)
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => handlePerJobJson(e.target.files?.[0] || undefined)}
                className="hidden"
              />
            </label>
            <span className="text-xs opacity-70">Opens notes & saves locally.</span>
          </div>

          {scanned && (
            <div className="mt-3">
              <div className="text-xs opacity-80 mb-1">Scanned payload:</div>
              <pre className="text-[11px] bg-black/30 p-3 rounded-xl overflow-x-auto">
                {JSON.stringify(scanned, null, 2)}
              </pre>
              <div className="mt-3">
                <label className="text-sm font-medium">Your notes</label>
                <textarea
                  className="input h-28 mt-1"
                  placeholder="Jot down takeaways, follow-ups, contacts…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button className="btn mt-2" onClick={saveNotes}>
                  Save notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/* ---------------- Page ---------------- */
export default function StudentPage() {
  const student = students[2]; // demo user
  const baseJobs = useMemo(() => makeJobs(), []);
  const { loading, scoreCvAgainstJobs } = useEmbeddings();

  // Sync applied ids with localStorage (so /jobs/[id] Apply affects this list)
  const [applied, setApplied] = useState<string[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const arr = JSON.parse(localStorage.getItem(APPLIED_KEY) || '[]');
        setApplied(Array.isArray(arr) ? arr : []);
      } catch {
        setApplied([]);
      }
    };
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);

  // Persist utility
  const writeApplied = (next: string[]) => {
    setApplied(next);
    localStorage.setItem(APPLIED_KEY, JSON.stringify(next));
  };

  // Table toggle Apply
  const toggleApply = (jobId: string) => {
    const next = applied.includes(jobId)
      ? applied.filter((x) => x !== jobId)
      : [...applied, jobId];
    writeApplied(next);
  };

  // scores are still computed (to order), but we don’t display numbers anywhere
  const [scores, setScores] = useState<Record<string, number>>({});
  const [hasScored, setHasScored] = useState(false);
  const [error, setError] = useState<string>('');

  // CV upload (txt only)
  const onUploadCV = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const txt = await extractTextFromFile(file);
      if (!txt.trim()) throw new Error('Could not read text from file');

      const appliedJobs = baseJobs.filter((j) => applied.includes(j.id));
      if (appliedJobs.length === 0) {
        alert('Apply to at least one job first.');
        return;
      }
      const result = await scoreCvAgainstJobs(txt, appliedJobs);
      const next: Record<string, number> = {};
      for (const r of result) next[r.id] = r.score;
      setScores(next);
      setHasScored(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to process file or run scoring.');
      setHasScored(false);
    }
  };

  // Pull saved questions for per-job QR
  let savedQs: Record<string, string[]> = {};
  if (typeof window !== 'undefined') {
    try {
      savedQs = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || '{}');
    } catch {}
  }

  // Order applied: BEFORE scoring → preserve apply order; AFTER scoring → sort by score desc
  const orderedApplied = useMemo(() => {
    const appliedJobs = baseJobs.filter((j) => applied.includes(j.id));
    if (!hasScored) {
      // preserve apply order
      const orderMap = new Map(applied.map((id, idx) => [id, idx]));
      return appliedJobs
        .slice()
        .sort((a, b) => (orderMap.get(a.id)! - orderMap.get(b.id)!))
        .map((job) => ({ job, score: -1 }));
    }
    // rank by score desc
    return appliedJobs
      .map((j) => ({ job: j, score: scores[j.id] ?? -1 }))
      .sort((a, b) => (b.score - a.score) || a.job.title.localeCompare(b.job.title));
  }, [applied, baseJobs, scores, hasScored]);

  return (
    <RoleGuard allow={['student']}>
      {/* Headbar */}
      <div className="sticky top-0 z-10 backdrop-blur bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text gradient-text--mixed">
            Summer of Tech 2026
          </div>
          <Link href="/" className="badge hover:opacity-80">Home</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid lg:grid-cols-3 gap-6">
        {/* LEFT: Jobs available to apply */}
        <div className="lg:col-span-2 card">
          <H>Jobs available to apply</H>
          <table className="table">
            <thead>
              <tr>
                <th>Employer</th>
                <th>Role</th>
                <th className="hidden md:table-cell">FAQ</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {baseJobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link href={`/jobs/${j.id}`} className="font-medium text-[#57c84d] hover:opacity-80">
                      {j.employer}
                    </Link>
                  </td>
                  <td>{j.title}</td>
                  <td className="hidden md:table-cell">
                    <Link className="badge" href={`/jobs/${j.id}/faq`}>7 FAQs</Link>
                  </td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => toggleApply(j.id)}
                      aria-pressed={applied.includes(j.id)}
                    >
                      {applied.includes(j.id) ? 'Applied' : 'Apply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs opacity-70 mt-2">
            Click an <b>employer</b> to view the job description. Each role has a <b>FAQ page</b> (7 common questions).
          </p>
        </div>

        {/* RIGHT: Upload CV */}
        <div className="card lg:col-span-1">
          <H>Upload CV to score applied jobs</H>
          <label className="moving-green-btn inline-flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer select-none text-black font-semibold">
            Choose file
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => onUploadCV(e.target.files?.[0] || undefined)}
              className="hidden"
            />
          </label>
          <p className="text-xs opacity-75 mt-2">Only .txt files please.</p>
          <p className="text-xs opacity-70 mt-2">
            Demo Python app:{' '}
            <a
              href="https://cvjdmatcher.streamlit.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#7cf5a1]"
            >
              CV ↔ JD Matcher
            </a>
          </p>
          {loading && <p className="text-xs opacity-70 mt-2">Scoring… first run may take a few seconds.</p>}
          {hasScored && !loading && <p className="text-sm mt-2">✅ Ranked your applied jobs.</p>}
          {error && <p className="text-xs mt-2 text-red-400">Error: {error}</p>}
        </div>

        {/* RIGHT: Event Recommendations (rank only) */}
        <div className="card lg:col-span-1">
          <H>Event Recommendations</H>
          <details className="mb-3" open={orderedApplied.length > 0}>
            <summary className="cursor-pointer font-medium">Meet & Greet — In-person</summary>
            <div className="mt-2 text-sm opacity-90">
              {orderedApplied.length === 0 ? (
                <p className="text-xs opacity-70">Apply and upload your CV to see a personalised itinerary.</p>
              ) : (
                <>
                  <p className="mb-2">Your optimised booth plan (ranked):</p>
                  <ol className="list-decimal ml-5 space-y-2">
                    {orderedApplied.map(({ job }, i) => (
                      <li key={job.id}>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            <span className="text-[#57c84d]">{job.employer}</span> — {job.title}
                          </span>
                        </div>
                        <ul className="text-xs opacity-80 list-disc ml-4">
                          <li>Priority #{i + 1}. Start here to maximise momentum.</li>
                          <li>
                            Prep: 2 targeted talking points + the questions you saved on the{' '}
                            <Link href={`/jobs/${job.id}/faq`} className="underline">FAQ page</Link>.
                          </li>
                        </ul>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </details>
        </div>

        {/* LEFT (below jobs list): Jobs I’ve applied (ranked) with QR + scanner/notes */}
        <div className="card lg:col-span-2">
          <H>Jobs I’ve applied (ranked)</H>
          {orderedApplied.length === 0 ? (
            <p className="text-sm opacity-70">You haven’t applied to any jobs yet.</p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-3">
              {orderedApplied.map(({ job }, idx) => (
                <div key={job.id} className="flex items-start gap-3">
                  <AppliedJobItem
                    rank={idx + 1}
                    job={job}
                    questionsForJob={ (typeof window !== 'undefined'
                      ? (JSON.parse(localStorage.getItem(QUESTIONS_KEY) || '{}')[job.id] || [])
                      : []) }
                  />
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Moving gradient for the “Choose file” buttons (green) */}
      <style jsx global>{`
        .moving-green-btn {
          background: linear-gradient(
            135deg,
            #c5e8b7,
            #83d475,
            #57c84d,
            #2eb62c,
            #b1ee46,
            #cbff58,
            #dbff74,
            #e5ff9a,
            #4ded30,
            #26d701,
            #00c301,
            #00ab08
          );
          background-size: 300% 300%;
          animation: gradientShift 6s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </RoleGuard>
  );
}
