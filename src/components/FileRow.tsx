import { Check, AlertCircle, Loader2, X, MinusCircle } from 'lucide-react';
import type { ImageJob } from '../types';
import { formatBytes, savingsPct } from '../lib/format';
import { useStore } from '../state/store';

type Props = { job: ImageJob; onClick: () => void };

export function FileRow({ job, onClick }: Props) {
  const removeJob = useStore((s) => s.removeJob);
  const running = useStore((s) => s.batchRunning);

  const before = formatBytes(job.originalSize);
  const after =
    job.outputSize !== undefined
      ? formatBytes(job.outputSize)
      : job.estimatedSize !== undefined
        ? `~${formatBytes(job.estimatedSize)}`
        : '—';
  const pct =
    job.outputSize !== undefined
      ? savingsPct(job.originalSize, job.outputSize)
      : job.estimatedSize !== undefined
        ? savingsPct(job.originalSize, job.estimatedSize)
        : null;

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 h-14 px-3 rounded-md hover:bg-surface cursor-pointer"
    >
      <div className="w-10 h-10 rounded bg-border/40 overflow-hidden flex-shrink-0">
        {job.thumbnailDataUrl && (
          <img src={job.thumbnailDataUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{job.name}</div>
        <div className="text-xs text-muted font-mono">
          {job.width}×{job.height}
        </div>
      </div>
      <div className="text-right font-mono text-xs whitespace-nowrap">
        <div>
          <span className="text-muted">{before}</span>
          <span className="text-muted"> → </span>
          <span className="text-fg">{after}</span>
        </div>
        {pct !== null && pct > 0 && (
          <div className="text-accent">−{pct}%</div>
        )}
      </div>
      <StatusIcon job={job} />
      {!running && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeJob(job.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-fg transition"
          aria-label="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function StatusIcon({ job }: { job: ImageJob }) {
  switch (job.status) {
    case 'processing':
      return <Loader2 className="w-4 h-4 text-muted animate-spin" />;
    case 'done':
      return <Check className="w-4 h-4 text-accent" />;
    case 'error':
      return (
        <span title={job.errorMessage}>
          <AlertCircle className="w-4 h-4 text-danger" />
        </span>
      );
    case 'skipped':
      return (
        <span title={job.errorMessage || 'skipped'}>
          <MinusCircle className="w-4 h-4 text-muted" />
        </span>
      );
    default:
      return <div className="w-4 h-4" />;
  }
}
