
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RoleGuard({ allow, children }:{ allow: string[], children: any }){
  const [role, setRole] = useState<string | null>(null);
  useEffect(()=>{ setRole(localStorage.getItem('role')); },[]);
  if (!role) {
    return (
      <div className="max-w-xl mx-auto mt-10 card">
        <h2 className="text-xl font-semibold mb-2">Select a role first</h2>
        <p className="mb-4 opacity-80">Go to the home page and choose a role.</p>
        <Link href="/" className="btn">Go to Home</Link>
      </div>
    );
  }
  if (!allow.includes(role)) {
    return (
      <div className="max-w-xl mx-auto mt-10 card">
        <h2 className="text-xl font-semibold mb-2">Access denied</h2>
        <p className="opacity-80">Your current role is <b>{role}</b>. This page requires: {allow.join(', ')}.</p>
      </div>
    );
  }
  return children;
}
