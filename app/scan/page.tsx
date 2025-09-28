
'use client';
import { useEffect, useState } from 'react';

export default function Scan(){
  const [payload, setPayload] = useState<any>(null);
  useEffect(()=>{
    const hash = decodeURIComponent(window.location.hash.slice(1));
    try { setPayload(JSON.parse(hash)); } catch {}
  },[]);

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Scan Result</h2>
      {!payload && <p className="opacity-80">Supply QR payload via URL hash.</p>}
      {payload && (
        <div>
          <p className="mb-2">Type: <b>{payload.type}</b></p>
          <p className="mb-2">Name: <b>{payload.name}</b></p>
          <p className="mb-2">Skills: {payload.skills?.join(', ')}</p>
          <div className="text-sm opacity-80">Auto-FAQ will display for common questions; new questions are captured for approval.</div>
        </div>
      )}
    </div>
  );
}
