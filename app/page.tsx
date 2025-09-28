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
            {/* Wrap the select so we can place a custom arrow that matches theme */}
            <div className="relative inline-block">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input themed-select max-w-xs pr-10"
              >
                <option value="student">Student</option>
                <option value="employer">Employer</option>
              </select>
              {/* custom arrow */}
              <svg
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-80"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <button className="btn" onClick={save}>Set Role</button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="badge" href="/student">Go to Student</Link>
            <Link className="badge" href="/employer">Go to Employer</Link>
          </div>
        </div>
      </section>

      {/* On-page CSS to theme the native dropdown */}
      <style jsx global>{`
        /* Keep control on-theme and hide OS arrow */
        .themed-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: rgba(0, 0, 0, 0.4);
          color: #fff;
          border-radius: 0.75rem; /* match .input rounded-xl */
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .themed-select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(124, 245, 161, 0.25);
          border-color: rgba(124, 245, 161, 0.5);
        }
        /* Style option list colors (supported in most modern browsers) */
        .themed-select option {
          background-color: #0b0f14;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
