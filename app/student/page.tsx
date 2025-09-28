'use client';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { students } from '@/lib/mock';
import { useMemo, useState } from 'react';
import { useSimpleScorer as useEmbeddings, JobLite } from '@/lib/useSimpleScorer';

/* ---------------- Jobs seed ---------------- */
function makeJobs(): JobLite[] {
  return [
    {
      id: 'mercury-se',
      employer: 'Mercury',
      title: 'Software Engineer',
      jd: `Software Engineer at Mercury
... (same JD text you pasted) ...`,
    },
    {
      id: 'one-nz-ai-pe',
      employer: 'One New Zealand',
      title: 'AI Product Engineer',
      jd: `AI Product Engineer at One New Zealand
... (same JD text you pasted) ...`,
    },
    {
      id: 'trademe-fs-intern',
      employer: 'Trade Me',
      title: 'Full Stack Developer Intern',
      jd: `Full Stack Developer Intern at Trade Me
... (same JD text you pasted) ...`,
    },
  ];
}

/* ---------------- Helpers ---------------- */
async function loadScript(src: string, globalKey?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('window not available'));
    if (globalKey && (window as any)[globalKey]) return resolve((window as any)[globalKey]);
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve(globalKey ? (window as any)[globalKey] : true);
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'txt') return await file.text();

  if (ext === 'pdf') {
    const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82';
    await loadScript(`${CDN}/pdf.min.js`, 'pdfjsLib');
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(' ') + '\n';
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  if (ext === 'docx') {
    await loadScript('https://unpkg.com/mammoth/mammoth.browser.min.js', 'mammoth');
    const mammoth = (window as any).mammoth;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return (result?.value || '').replace(/\s+/g, ' ').trim();
  }

  throw new Error('Unsupported file type. Please upload .txt, .pdf, or .docx');
}

/* ---------------- Component ---------------- */
export default function StudentPage() {
  const student = students[2]; // demo user
  const baseJobs = useMemo(() => makeJobs(), []);
  const [applied, setApplied] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [hasScored, setHasScored] = useState(false);
  const [error, setError] = useState<string>('');
  const { loading, scoreCvAgainstJobs } = useEmbeddings();

  // Saved questions from job pages
  let savedQs: Record<string, string[]> = {};
  if (typeof window !== 'undefined') {
    try {
      savedQs = JSON.parse(localStorage.getItem('student_job_questions') || '{}');
    } catch {}
  }

  // Apply/Withdraw
  const toggleApply = (jobId: string) => {
    setApplied((prev) => (prev.includes(jobId) ? prev.filter((x) => x !== jobId) : [...prev, jobId]));
    setHasScored(false);
  };

  // Upload CV then score applied jobs
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

  // Ordered list (for ranking 1..N)
  const orderedApplied = useMemo(() => {
    const items = baseJobs
      .filter((j) => applied.includes(j.id))
      .map((j) => ({ job: j, score: scores[j.id] ?? -1 }));
    return items.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [applied, baseJobs, scores]);

  // Small utility: gradient headings
  const H = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-semibold mb-2 text-transparent bg-clip-text gradient-text--green">{children}</h3>
  );

  return (
    <RoleGuard allow={['student']}>
      {/* ---------- Headbar ---------- */}
      <div className="sticky top-0 z-10 backdrop-blur bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-transparent bg-clip-text gradient-text--mixed">
            Summer of Tech 2026
          </div>
          <Link href="/" className="badge hover:opacity-80">Home</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Jobs available (top) */}
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
                  {/* Employer is green (no underline) and navigates to description */}
                  <td>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="font-medium text-[#57c84d] hover:opacity-80"
                    >
                      {j.employer}
                    </Link>
                  </td>
                  {/* Role is plain text */}
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

        {/* RIGHT COLUMN: Upload CV (smaller), then Event Recommendations */}
        <div className="card lg:col-span-1">
          <H>Upload CV to score applied jobs</H>
          <label className="moving-green-btn inline-flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer select-none text-black font-semibold">
            Choose file
            <input
              type="file"
              accept=".txt,text/plain,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => onUploadCV(e.target.files?.[0] || undefined)}
              className="hidden"
            />
          </label>
          {loading && <p className="text-xs opacity-70 mt-2">Scoring… first run may take a few seconds.</p>}
          {hasScored && !loading && <p className="text-sm mt-2">✅ Scored {applied.length} applied job(s).</p>}
          {error && <p className="text-xs mt-2 text-red-400">Error: {error}</p>}
        </div>

        <div className="card lg:col-span-1">
          <H>Event Recommendations</H>
          <details className="mb-3" open={hasScored && orderedApplied.length > 0}>
            <summary className="cursor-pointer font-medium">Meet & Greet — In-person</summary>
            <div className="mt-2 text-sm opacity-90">
              {!(hasScored && orderedApplied.length > 0) ? (
                <p className="text-xs opacity-70">Apply and upload your CV to see a personalised itinerary.</p>
              ) : (
                <>
                  <p className="mb-2">
                    Your optimised booth plan (ordered by <b>AI fit score</b> among your applied roles):
                  </p>
                  <ol className="list-decimal ml-5 space-y-2">
                    {orderedApplied.map(({ job, score }, i) => (
                      <li key={job.id}>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            <span className="text-[#57c84d]">{job.employer}</span> — {job.title}
                          </span>
                          <span className="badge">{score >= 0 ? score : '—'}</span>
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

          <details className="mb-3">
            <summary className="cursor-pointer font-medium">Online Clinic: How to win Meet & Greet</summary>
            <div className="mt-2 text-sm opacity-90">
              <p className="mb-2">Prioritise employers, strong openings, time-boxing.</p>
              <ul className="list-disc ml-5 text-xs opacity-80">
                <li>Craft 2 tailored talking points per top-scored employer.</li>
                <li>Practice a 30-second pitch mapped to your skills.</li>
              </ul>
            </div>
          </details>

          <details>
            <summary className="cursor-pointer font-medium">Clinic with ex-SoT students</summary>
            <div className="mt-2 text-sm opacity-90">
              <p className="mb-2">Get interview patterns & portfolio tips from grads.</p>
            </div>
          </details>
        </div>

        {/* LEFT COLUMN (below jobs list): Jobs I’ve applied (ranked) with per-job Scanner & Notes */}
        <div className="card lg:col-span-2">
          <H>Jobs I’ve applied (ranked)</H>
          {orderedApplied.length === 0 ? (
            <p className="text-sm opacity-70">You haven’t applied to any jobs yet.</p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-3">
              {orderedApplied.map(({ job, score }, idx) => {
                const questionsForJob = savedQs[job.id] || [];
                const [scanned, setScanned] = useState<any>(null);
                const [notes, setNotes] = useState<string>('');

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
                  <li key={job.id} className="p-3 rounded-xl border border-white/10 bg-black/20">
                    {/* Header row: rank, title, score */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="badge text-sm" title="Priority rank">
                          {idx + 1}
                        </span>
                        <div className="font-medium">
                          <span className="text-[#57c84d]">{job.employer}</span> — {job.title}
                        </div>
                      </div>
                      <div className="badge text-sm">{loading ? '…' : score >= 0 ? score : '—'}</div>
                    </div>

                    {/* Description */}
                    <p className="text-xs opacity-80 mt-2 line-clamp-3 whitespace-pre-wrap">{job.jd}</p>

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

                    {/* Scanner & Notes (JSON upload only) */}
                    <div className="mt-4">
                      <div className="text-sm font-medium text-transparent bg-clip-text gradient-text--green">
                        Scanner & Notes
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <label className="moving-green-btn inline-flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer select-none text-black font-semibold">
                          Upload QR (JSON)
                          <input
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => handlePerJobJson(e.target.files?.[0] || undefined)}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs opacity-70">Upload the employer’s QR JSON.</span>
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Moving gradient for the “Choose file” buttons (green, same vibe as headings) */}
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
