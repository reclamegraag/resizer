import { useMemo } from 'react';
import { useStore } from '../state/store';
import { useCountUp } from '../lib/useCountUp';

function formatMB(bytes: number): string {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function SavingsDisplay() {
  const jobs = useStore((s) => s.jobs);

  const { saved, avgPct, doneCount, total } = useMemo(() => {
    const completed = jobs.filter(
      (j) => j.status === 'done' || j.status === 'skipped',
    );
    const totalOriginal = completed.reduce((a, j) => a + j.originalSize, 0);
    const totalOutput = completed.reduce(
      (a, j) => a + (j.outputSize ?? j.originalSize),
      0,
    );
    const saved = Math.max(0, totalOriginal - totalOutput);
    const pcts = completed
      .filter((j) => j.outputSize !== undefined && j.originalSize > 0)
      .map((j) => ((j.originalSize - (j.outputSize ?? 0)) / j.originalSize) * 100);
    const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
    return {
      saved,
      avgPct: Math.round(avg),
      doneCount: completed.length,
      total: jobs.length,
    };
  }, [jobs]);

  const animSaved = useCountUp(saved, 900);
  const growPct = total > 0 ? doneCount / total : 0;

  return (
    <div className="flex flex-col items-center py-6 select-none">
      <div className="relative">
        <div className="font-display text-display-xl text-fg tnum leading-none tracking-tight">
          {formatMB(animSaved)} <span className="text-muted">saved</span>
        </div>
        <div
          className="absolute -bottom-2 left-0 h-px bg-fg origin-left transition-transform duration-[900ms] ease-out-expo"
          style={{
            width: '100%',
            transform: `scaleX(${growPct})`,
          }}
        />
      </div>
      <div className="mt-6 text-xs font-mono text-subtle tnum">
        <span className="text-muted">{doneCount}</span>
        <span className="text-faint">/{total}</span>
        <span className="mx-2 text-faint">·</span>
        <span>
          avg{' '}
          <span className="text-accent font-medium">
            {avgPct > 0 ? `−${avgPct}%` : '—'}
          </span>
        </span>
      </div>
    </div>
  );
}
