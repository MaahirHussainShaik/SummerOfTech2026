'use client';
import RoleGuard from '@/components/RoleGuard';
import { onejobs } from '@/lib/mock';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// ---------- Types ----------
type AnyFAQ = { q?: string; a?: string; question?: string; answer?: string; text?: string };

// Student QR (profile-level): questions is a map of jobId -> string[]
type StudentQRProfile = {
  type: 'student';
  id: string;
  name: string;
  skills?: string[];
  questions?: Record<string, string[]>;
};

// Student QR (per-job)
type StudentQRPerJob = {
  type: 'student_job';
  id: string;
  name: string;
  jobId: string;
  jobTitle?: string;
  employer?: string;
  skills?: string[];
  questions?: string[];
  score?: number;
};

type ScannedQuestionGroup = { label: string; list: string[]; score?: number };

// ---------- Type guards (fixes “property X does not exist” errors) ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object';
}
function isStudentProfile(v: unknown): v is StudentQRProfile {
  return (
    isRecord(v) &&
    v.type === 'student' &&
    typeof v.id === 'string' &&
    typeof v.name === 'string'
  );
}
function isStudentPerJob(v: unknown): v is StudentQRPerJob {
  return (
    isRecord(v) &&
    v.type === 'student_job' &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.jobId === 'string'
  );
}

// ---------- FAQ helpers ----------
function normalizeFaq(f: AnyFAQ): { q: string; a: string } {
  return {
    q: (f.q ?? f.question ?? f.text ?? 'Question').toString(),
    a: (f.a ?? f.answer ?? '').toString(),
  };
}

// Your “same 7 questions for every job”
const COMMON_7 = [
  'What does your company do?',
  'What roles are you offering?',
  'What skills or experience are you looking for?',
  'What does the application process look like?',
  'Do you hire international students / sponsor visas?',
  'What is the workplace culture like?',
  'What opportunities exist after the internship?',
].map((q) => ({ q, a: '' }));

function faqsForJob(_jobId: string) {
  // Always return the same 7, normalized
  return COMMON_7.map(normalizeFaq);
}

// ---------- Label helper for scanned questions ----------
function labelFromPayload(jobId?: string, employer?: string, jobTitle?: string) {
  if (employer || jobTitle) return [employer, jobTitle].filter(Boolean).join(' — ');
  const j = jobId ? onejobs.find((x) => x.id === jobId) : null;
  return j ? `${j.employerName} — ${j.title}` : (jobId || 'Job');
}

export default function EmployerPage() {
  const [jobId, setJobId] = useState(onejobs[0].id);
  const job = onejobs.find((j) => j.id === jobId)!;

  // ---------------- Employer FAQs (7 Qs) with answers ----------------
  const currentFaqs = useMemo(() => faqsForJob(jobId), [jobId]);
  const [faqAnswers, setFaqAnswers] = useState<string[]>(Array(7).fill(''));

  useEffect(() => {
    const key = `employer_faq_answers_${jobId}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(saved) && saved.length === 7) setFaqAnswers(saved);
      else setFaqAnswers(currentFaqs.map((f) => f.a || ''));
    } catch {
      setFaqAnswers(currentFaqs.map((f) => f.a || ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, currentFaqs.length]);

  const saveFaqAnswers = () => {
    const key = `employer_faq_answers_${jobId}`;
    localStorage.setItem(key, JSON.stringify(faqAnswers));
    alert('FAQ answers saved ✅');
  };

  // ---------------- Employer QR (JSON only) ----------------
  const employerQrPayload = useMemo(() => {
    const packed = currentFaqs.map((f, i) => ({
      q: f.q,
      a: faqAnswers[i] || f.a || '',
    }));
    return JSON.stringify(
      {
        type: 'employer',
        employerId: job.id,
        employerName: job.employerName,
        jobTitle: job.title,
        faqs: packed,
      },
      null,
      2
    );
  }, [currentFaqs, faqAnswers, job]);

  const downloadQRJSON = () => {
    const blob = new Blob([employerQrPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employer-${job.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------- Scan student QR → timer + approve/not + show questions ----------------
  const [scanInfo, setScanInfo] = useState<null | { id: string; name: string; skills: string[] }>(null);
  const [scannedQs, setScannedQs] = useState<ScannedQuestionGroup[]>([]);
  const [countdown, setCountdown] = useState(5 * 60);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [decision, setDecision] = useState<'approve' | 'not' | ''>('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHasStarted(false);
  };

  useEffect(() => {
    if (hasStarted) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted]);

  const handleUploadQR = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;

      // Narrow to either profile or per-job
      if (isStudentProfile(raw) || isStudentPerJob(raw)) {
        const skills = Array.isArray(raw.skills) ? raw.skills : [];
        setScanInfo({ id: raw.id, name: raw.name, skills });

        const groups: ScannedQuestionGroup[] = [];

        if (isStudentProfile(raw)) {
          // questions: Record<jobId, string[]>
          if (raw.questions && isRecord(raw.questions)) {
            for (const [k, arr] of Object.entries(raw.questions)) {
              if (Array.isArray(arr) && arr.length) {
                groups.push({
                  label: labelFromPayload(k),
                  list: arr.filter(Boolean),
                });
              }
            }
          }
        } else if (isStudentPerJob(raw)) {
          // per-job QR
          const list = Array.isArray(raw.questions) ? raw.questions.filter(Boolean) : [];
          groups.push({
            label: labelFromPayload(raw.jobId, raw.employer, raw.jobTitle),
            list,
            score: typeof raw.score === 'number' ? raw.score : undefined,
          });
        }

        setScannedQs(groups);
        setCountdown(5 * 60);
        setHasStarted(true);
        setDecision('');
        setReasons([]);
        setFeedbackSaved(false);
      } else {
        alert('Invalid QR payload. Upload the JSON from the Student page.');
      }
    } catch {
      alert('Could not parse file. Upload a valid Student QR JSON.');
    }
  };

  const submitFeedback = () => {
    if (!scanInfo) return;
    stopTimer();
    let message = 'Feedback recorded.';
    if (decision === 'approve') {
      message = 'Feedback recorded: Approved to proceed.';
    } else if (decision === 'not') {
      const why = reasons.length ? reasons.join('; ') : 'general fit issues';
      message = `Feedback recorded: Not proceeding — ${why}.`;
    }
    alert(message);
    setFeedbackSaved(true);
  };

  const mmss = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <RoleGuard allow={['employer']}>
      <div className="grid gap-6">
        {/* Your Roles */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Your Roles</h2>
          <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {onejobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.employerName} — {j.title}
              </option>
            ))}
          </select>
          <p className="text-xs opacity-75 mt-2">
            Select a role to configure FAQs and generate your company QR for students to scan.
          </p>
        </div>

        {/* Employer QR (JSON only) */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Your Company QR (for students to scan)</h3>
          <p className="text-sm opacity-80 mb-3">
            Students can scan this at your booth to open notes and view your FAQs.
          </p>
          <div className="flex items-center gap-6">
            <QRCodeCanvas id="employerQR" value={employerQrPayload} size={140} />
            <div className="flex-1">
              <div className="text-lg font-semibold">{job.employerName}</div>
              <div className="opacity-80 text-sm">{job.title}</div>
              <div className="mt-3 flex gap-2">
                <button className="btn" onClick={downloadQRJSON}>Download QR (JSON)</button>
              </div>
            </div>
          </div>
        </div>

        {/* Top 7 FAQs with answer inputs */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Top 7 FAQs</h3>
          <div className="space-y-3">
            {currentFaqs.map((f, i) => (
              <div key={i} className="p-3 rounded-xl border border-white/10 bg-black/20">
                <div className="font-medium">{i + 1}. {f.q}</div>
                <textarea
                  className="input mt-2 h-20"
                  placeholder="Type your answer…"
                  value={faqAnswers[i] || ''}
                  onChange={(e) =>
                    setFaqAnswers((prev) => {
                      const next = [...prev];
                      next[i] = e.target.value;
                      return next;
                    })
                  }
                />
              </div>
            ))}
          </div>
          <button className="btn mt-3" onClick={saveFaqAnswers}>Save Answers</button>
          <p className="text-xs opacity-70 mt-2">
            Answers are stored locally (demo). The QR above will include your Q&amp;A.
          </p>
        </div>

        {/* Scan student QR → timer + approve/not + show questions (+score) */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Scan Student QR (upload JSON)</h3>
          <p className="text-sm opacity-80 mb-3">
            Upload the <b>student QR JSON</b> (profile or per-job) to start a timed conversation.
          </p>
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleUploadQR(e.target.files?.[0] || undefined)}
            className="mb-4"
          />
          {!scanInfo && <div className="text-sm opacity-70">No scan loaded yet.</div>}
          {scanInfo && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">
                    <span className="opacity-80">Student:</span> <b>{scanInfo.name}</b>
                  </div>
                  <div className="text-xs opacity-80">
                    Skills: {scanInfo.skills.join(', ') || '—'}
                  </div>
                </div>
                <div className="badge text-base">⏱ {mmss(countdown)}</div>
              </div>

              {scannedQs.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium mb-2">Student’s prepared questions</div>
                  <div className="space-y-2">
                    {scannedQs.map((g, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-white/10 bg-black/20">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs opacity-80">{g.label}</div>
                          {typeof g.score === 'number' && <span className="badge">{g.score}</span>}
                        </div>
                        <ul className="list-disc ml-5">
                          {g.list.map((q, qi) => (
                            <li key={qi} className="text-sm">{q}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm">
                <div className="mb-2 font-medium">Decision</div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={() => setDecision('approve')}
                    />
                    Approve
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="decision"
                      value="not"
                      checked={decision === 'not'}
                      onChange={() => setDecision('not')}
                    />
                    Not
                  </label>
                </div>
              </div>

              {decision === 'not' && (
                <div className="text-sm">
                  <div className="mb-2 font-medium">Why not? (select all that apply)</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      'Gaps in DS&A',
                      'Skills mismatch with required stack',
                      'Insufficient project depth',
                      'Communication needs improvement',
                      'Limited availability/fit',
                      'Other (generic)',
                    ].map((r) => (
                      <label key={r} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reasons.includes(r)}
                          onChange={() =>
                            setReasons((prev) =>
                              prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
                            )
                          }
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button className="btn" onClick={submitFeedback} disabled={!decision || feedbackSaved}>
                  {feedbackSaved ? 'Feedback saved' : 'Submit'}
                </button>
                {feedbackSaved && <span className="text-xs opacity-80">Feedback recorded ✅</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
