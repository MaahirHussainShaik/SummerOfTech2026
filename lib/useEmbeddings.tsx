'use client';
import { useCallback, useMemo, useRef, useState } from 'react';

// Minimal job type
export type JobLite = { id: string; title: string; employer?: string; jd: string };

// Helper: load a UMD script and wait until it’s available on window
function loadScript(src: string, globalKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('window not available'));
    // Already present?
    const existing: any = (window as any)[globalKey];
    if (existing) return resolve(existing);

    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => {
      const g: any = (window as any)[globalKey];
      if (!g) return reject(new Error(`Global ${globalKey} not found after script load`));
      resolve(g);
    };
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export function useEmbeddings() {
  const extractorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const loadExtractor = useCallback(async () => {
    if (extractorRef.current) return extractorRef.current;

    let pipeline: any, env: any;

    // 1) Try local ESM (bundled)
    try {
      const mod = await import('@xenova/transformers');
      pipeline = (mod as any).pipeline;
      env = (mod as any).env;
    } catch {
      // 2) Fallback: load UMD via <script>, then read window.transformers
      // Try jsDelivr, then unpkg
      const cdnBase = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1/dist';
      const altBase = 'https://unpkg.com/@xenova/transformers@2.16.1/dist';
      try {
        const g: any = await loadScript(`${cdnBase}/transformers.min.js`, 'transformers');
        pipeline = g.pipeline;
        env = g.env;
      } catch {
        const g: any = await loadScript(`${altBase}/transformers.min.js`, 'transformers');
        pipeline = g.pipeline;
        env = g.env;
      }
    }

    // Prefer WASM for stability (avoids backend registration errors)
    env.backends.onnx.backend = 'wasm';
    env.backends.onnx.wasm.wasmPaths =
      'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1/dist/wasm/';
    env.backends.onnx.wasm.numThreads = 1;
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    extractorRef.current = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    return extractorRef.current;
  }, []);

  const l2norm = (vec: Float32Array | number[]) => {
    let n = 0;
    for (let i = 0; i < vec.length; i++) n += (vec as any)[i] ** 2;
    n = Math.sqrt(n) || 1;
    const out = new Float32Array(vec.length);
    for (let i = 0; i < vec.length; i++) out[i] = (vec as any)[i] / n;
    return out;
  };

  const meanPool = (
    lastHidden: Float32Array,
    seqLen: number,
    hiddenSize: number,
    attentionMask?: Int32Array
  ) => {
    const out = new Float32Array(hiddenSize);
    let count = 0;
    for (let t = 0; t < seqLen; t++) {
      if (!attentionMask || attentionMask[t] === 1) {
        count++;
        const base = t * hiddenSize;
        for (let h = 0; h < hiddenSize; h++) out[h] += lastHidden[base + h];
      }
    }
    if (count > 0) for (let h = 0; h < hiddenSize; h++) out[h] /= count;
    return l2norm(out);
  };

  const embed = useCallback(async (text: string): Promise<Float32Array> => {
    const extractor = await loadExtractor();
    const output = await extractor(text, { pooling: 'none', normalize: false });
    const data = output.data as Float32Array;
    const dims = output.dims as number[]; // [1, seq_len, hidden]
    const seqLen = dims[dims.length - 2];
    const hidden = dims[dims.length - 1];
    const mask: Int32Array | undefined = (output as any).attention_mask;
    return meanPool(data, seqLen, hidden, mask);
  }, [loadExtractor]);

  const cosine = useCallback((a: Float32Array, b: Float32Array) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s; // assumes normalized
  }, []);

  const to0100 = useCallback((sim: number) => Math.round(((sim + 1) / 2) * 100), []);

  const scoreCvAgainstJobs = useCallback(
    async (cvText: string, jobs: JobLite[]) => {
      setLoading(true);
      try {
        const cvVec = await embed(cvText);
        const out: Array<JobLite & { score: number }> = [];
        for (const job of jobs) {
          const jdVec = await embed(job.jd);
          const sim = cosine(cvVec, jdVec);
          out.push({ ...job, score: to0100(sim) });
        }
        out.sort((a, b) => b.score - a.score);
        return out;
      } finally {
        setLoading(false);
      }
    },
    [embed, cosine, to0100]
  );

  return useMemo(() => ({ loading, embed, scoreCvAgainstJobs }), [loading, embed, scoreCvAgainstJobs]);
}
