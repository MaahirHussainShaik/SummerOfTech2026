'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [role, setRole] = useState<string>('student');

  useEffect(() => {
    const saved = localStorage.getItem('role');
    if (saved) setRole(saved);
  }, []);

  const save = () => localStorage.setItem('role', role);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT — stacked hero text */}
      <section className="relative flex items-center justify-center md:justify-end p-8 md:p-12">
        <div className="flex items-center gap-6 max-w-[640px] w-full">
          <div className="hidden md:block w-[3px] h-72 rounded-full bg-white/20" />
          <div className="w-full">
            <h1 className="leading-[0.9]">
              {/* Use one of: gradient-text--mixed | gradient-text--green | gradient-text--violet */}
              <span className="block gradient-text--mixed drop-glow text-6xl md:text-7xl font-extrabold">
                Summer
              </span>
              <span className="block gradient-text--mixed drop-glow text-6xl md:text-7xl font-extrabold mt-3">
                Of
              </span>
              <span className="block gradient-text--mixed drop-glow text-6xl md:text-7xl font-extrabold mt-3">
                Tech&nbsp;2026
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* RIGHT — role picker */}
      <section className="flex items-center justify-center p-8 md:p-12">
        <div className="card w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Re-imagining SoT 2026</h2>
          <p className="opacity-80 mb-6">Select a role to explore the prototype UIs.</p>

          <div className="flex items-center gap-3 mb-6">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input max-w-xs"
            >
              <option value="student">Student</option>
              <option value="employer">Employer</option>
              <option value="organiser">Organiser</option>
            </select>
            <button className="btn" onClick={save}>Set Role</button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="badge" href="/student">Go to Student</Link>
            <Link className="badge" href="/employer">Go to Employer</Link>
            <Link className="badge" href="/organiser">Go to Organiser</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
