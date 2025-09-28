
'use client';
import { useState } from 'react';
import type { FAQ } from '@/lib/mock';

export default function FAQConsole({ initial }:{ initial: FAQ[] }) {
  const [faqs, setFaqs] = useState<FAQ[]>(initial);

  const approve = (id: string, answer: string) => {
    setFaqs(prev => prev.map(f => f.id===id ? { ...f, answer } : f));
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">FAQ Console</h3>
      <table className="table">
        <thead><tr><th>Question</th><th>Answer</th><th>Action</th></tr></thead>
        <tbody>
          {faqs.map(f => (
            <tr key={f.id}>
              <td className="align-top">{f.question}</td>
              <td className="align-top">{f.answer ?? <span className="opacity-60">Pending…</span>}</td>
              <td className="align-top">
                {!f.answer && (
                  <button className="btn" onClick={()=>approve(f.id, 'See our Careers page → Yes for grads; interns case-by-case.')}>
                    Approve & Publish
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs opacity-70">Ask-once-answer-always: approved answers auto-pop to students at check-in.</p>
    </div>
  );
}
