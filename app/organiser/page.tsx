'use client';
import RoleGuard from '@/components/RoleGuard';
import { useEffect, useMemo, useRef, useState } from 'react';
import { events, jobs, students } from '@/lib/mock';

// ------- Animated circular KPI (progress ring) -------
function CircularKPI({
  label,
  value,
  max,
  durationMs = 1200,
  suffix = '',
}: {
  label: string;
  value: number;
  max: number;          // controls how "full" the ring gets
  durationMs?: number;  // animation duration
  suffix?: string;      // e.g., '%'
}) {
  const r = 36;                       // circle radius
  const C = 2 * Math.PI * r;          // circumference
  const target = Math.max(0, Math.min(value, max));
  const targetPct = max > 0 ? target / max : 0;

  const [num, setNum] = useState(0);
  const [pct, setPct] = useState(0);  // 0..1
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setNum(0);
    setPct(0);
    // startRef.value = null as any;

    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - (startRef.current as number);
      const k = Math.min(1, elapsed / durationMs);
      // ease-out
      const ease = 1 - Math.pow(1 - k, 3);
      setNum(Math.round(target * ease));
      setPct(targetPct * ease);
      if (k < 1) raf = requestAnimationFrame(step);
    };

    let raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, max, durationMs]);

  const dashOffset = C * (1 - pct);

  return (
    <div className="card flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 100 100" className="shrink-0">
        {/* track */}
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
        {/* progress */}
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className="text-brand"
          strokeDasharray={C}
          strokeDashoffset={C - C * pct}
          style={{ transition: 'stroke-dashoffset 80ms linear' }}
        />
        {/* number */}
        <text x="50" y="54" textAnchor="middle" fontSize="20" fontWeight={700} fill="currentColor">
          {num}
          {suffix}
        </text>
      </svg>
      <div>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-xs opacity-60">Max: {max}{suffix}</div>
      </div>
    </div>
  );
}

export default function OrganiserPage() {
  // simulate metrics
  const [load, setLoad] = useState({
    boothOverload: ['Orion Health'],
    underVisited: ['McCrae Tech'],
  });
  const [rebalanced, setRebalanced] = useState(false);

  // Live ops stats (static demo)
  const stats = useMemo(
    () => ({
      registrations: 380,
      attendance: 312,
      avgWait: '6m 20s',
      faqsResolved: 72,
      interviewsBooked: 48,
    }),
    []
  );

  // KPIs derived from mock data
  const totalJobs = jobs.length;               // e.g., 3 in the mock
  const totalStudents = students.length;       // e.g., 3 in the mock
  const totalStudentsWithoutProfile = students.filter(
    (s) => !s.headline || !s.skills || s.skills.length === 0
  ).length;

  // For a nicer demo, set reasonable "max" caps so the ring doesn't always be 100%
  // Tweak these caps as you add more seed data.
  const MAX_JOBS_CAP = 20;         // pretend programme-wide target
  const MAX_STUDENTS_CAP = 500;    // pretend sign-up target
  const MAX_WITHOUT_PROFILE = Math.max(1, totalStudents); // percentage of students

  return (
    <RoleGuard allow={['organiser']}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* KPI row with animated circular counters */}
        <CircularKPI label="Total Jobs" value={totalJobs} max={MAX_JOBS_CAP} />
        <CircularKPI label="Total Students Signed Up" value={totalStudents} max={MAX_STUDENTS_CAP} />
        <CircularKPI
          label="Students Without Profile Update"
          value={totalStudentsWithoutProfile}
          max={MAX_WITHOUT_PROFILE}
        />

        {/* Live Ops */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Live Ops</h2>
          <ul className="space-y-1">
            <li>
              Registrations: <b>{stats.registrations}</b>
            </li>
            <li>
              Attendance: <b>{stats.attendance}</b>
            </li>
            <li>
              Avg Wait: <b>{stats.avgWait}</b>
            </li>
            <li>
              FAQs resolved: <b>{stats.faqsResolved}</b>
            </li>
            <li>
              Interviews booked: <b>{stats.interviewsBooked}</b>
            </li>
          </ul>
        </div>

        {/* Fairness Monitor */}
        <div className="card">
          <h3 className="font-semibold mb-2">Fairness Monitor</h3>
          <p className="mb-2 text-sm opacity-80">Over-visited booths:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {load.boothOverload.map((x) => (
              <span key={x} className="badge">
                {x}
              </span>
            ))}
          </div>
          <p className="mb-2 text-sm opacity-80">Under-visited booths:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {load.underVisited.map((x) => (
              <span key={x} className="badge">
                {x}
              </span>
            ))}
          </div>
          <button className="btn" onClick={() => setRebalanced(true)}>
            Rebalance Traffic
          </button>
          {rebalanced && (
            <p className="mt-2 text-sm">
              ✅ Rebalance signal sent — student plans updated to diversify visits.
            </p>
          )}
        </div>

        {/* Program Builder */}
        <div className="card">
          <h3 className="font-semibold mb-2">Program Builder</h3>
          <label className="text-sm">Create event</label>
          <input className="input mb-2" placeholder="Name e.g. Online Clinic: System Design" />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Date/time" />
            <input className="input" placeholder="Venue / link" />
          </div>
          <button className="btn mt-3">Save</button>
          <p className="text-xs opacity-70 mt-2">
            This demo is non-persistent; use as a click-through prototype.
          </p>
        </div>

        {/* Jobs & Events */}
        <div className="lg:col-span-3 card">
          <h3 className="font-semibold mb-2">Jobs & Events</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="mb-1 font-medium">Events</h4>
              <ul className="text-sm list-disc ml-5">
                {events.map((ev) => (
                  <li key={ev.id}>
                    {ev.name} — {new Date(ev.datetime).toLocaleString()} @ {ev.venue}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1 font-medium">Jobs</h4>
              <ul className="text-sm list-disc ml-5">
                {jobs.map((j) => (
                  <li key={j.id}>
                    {j.employerName} — {j.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
