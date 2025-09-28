'use client';
import { useMemo, useState, useCallback } from 'react';

export type JobLite = { id: string; title: string; employer?: string; jd: string };

const STOP = new Set([
  'a','an','the','and','or','but','if','then','else','for','to','of','in','on','at','by','with','from',
  'is','are','was','were','be','being','been','as','it','this','that','these','those','we','you','they',
  'i','me','my','our','your','their','he','she','his','her','them','do','does','did','have','has','had'
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\- ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP.has(t));
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  const n = Math.sqrt(na) * Math.sqrt(nb) || 1;
  const smaller = a.size < b.size ? a : b;
  const larger  = a.size < b.size ? b : a;
  for (const [k, v] of smaller) {
    const u = larger.get(k);
    if (u) dot += v * u;
  }
  return dot / n;
}

export function useSimpleScorer() {
  const [loading, setLoading] = useState(false);

  const scoreCvAgainstJobs = useCallback(async (cvText: string, jobs: JobLite[]) => {
    setLoading(true);
    try {
      // Build a small corpus (CV + all JDs) for IDF
      const docs = [cvText, ...jobs.map(j => j.jd)];
      const toks = docs.map(tokenize);
      const tfs  = toks.map(tf);

      // DF
      const df = new Map<string, number>();
      toks.forEach(set => {
        const uniq = new Set(set);
        uniq.forEach(t => df.set(t, (df.get(t) || 0) + 1));
      });

      const N = docs.length;
      // TF-IDF vectors (as maps)
      const tfidfs = tfs.map((m) => {
        const out = new Map<string, number>();
        for (const [term, f] of m) {
          const dfi = df.get(term) || 1;
          const idf = Math.log((N + 1) / (dfi + 0.5));
          out.set(term, f * idf);
        }
        return out;
      });

      const cvVec = tfidfs[0];
      const results = jobs.map((j, idx) => {
        const sim = cosine(cvVec, tfidfs[idx + 1]);
        // map cosine (≈[0..1]) to 0..100
        const score = Math.round(Math.max(0, Math.min(1, sim)) * 100);
        return { ...j, score };
      }).sort((a, b) => b.score - a.score);

      return results;
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({ loading, scoreCvAgainstJobs }), [loading, scoreCvAgainstJobs]);
}
