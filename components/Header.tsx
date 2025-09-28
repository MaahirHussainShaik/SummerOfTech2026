
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(()=>{ setRole(localStorage.getItem('role')); },[]);
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold">SoT 2026 Prototype</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/student" className="badge">Student</Link>
          <Link href="/employer" className="badge">Employer</Link>
          <Link href="/organiser" className="badge">Organiser</Link>
          <span className="opacity-70">Role: {role ?? 'guest'}</span>
        </nav>
      </div>
    </header>
  );
}
