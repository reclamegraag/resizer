import { Check, AlertCircle, MinusCircle, X } from 'lucide-react';
import type { ImageJob } from '../types';
import { formatBytes, savingsPct } from '../lib/format';
import { useStore } from '../state/store';

type Props = { job: ImageJob; index: number; onClick: () => void };

export function FileCard({ job, index, onClick }: Props) {
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

  const indexLabel = `№ ${String(index + 1).padStart(3, '0')}`;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-card bg-bg-2 border border-border-soft shadow-inner-hl overflow-hidden cursor-pointer transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-card-hover animate-fade-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="font-display text-sm italic text-muted tnum">{indexLabel}</span>
        <StatusDot job={job} />
      </div>

      {/* Thumbnail */}
      <div className="relative mt-2 aspect-[5/4] bg-border-soft overflow-hidden">
        {job.thumbnailDataUrl ? (
          <img
            src={job.thumbnailDataUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'saturate(1.05) contrast(1.02)' }}
          />
        ) : (
          <div className="w-full h-full bg-bg-1" />
        )}
        {job.status === 'processing' && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 -inset-x-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}
        {!running && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeJob(job.id);
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-bg/60 backdrop-blur text-muted opacity-0 group-hover:opacity-100 hover:text-fg transition"
            aria-label="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 space-y-1.5">
        <div className="text-[13px] truncate text-fg" title={job.name}>
          {job.name}
        </div>
        <div className="flex items-baseline justify-between text-[11px] font-mono text-subtle tnum">
          <span>
            {job.width}×{job.height}
          </span>
          <span>
            <span className="text-muted">{before}</span>
            <span className="text-faint mx-1">→</span>
            <span className="text-fg">{after}</span>
          </span>
        </div>
        {pct !== null && pct > 0 && (
          <div className="font-display italic text-accent text-lg tnum leading-none">
            −{pct}%
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ job }: { job: ImageJob }) {
  switch (job.status) {
    case 'processing':
      return <span className="w-2 h-2 rounded-full bg-fg animate-pulse" />;
    case 'done':
      return (
        <span className="animate-scale-in">
          <Check className="w-4 h-4 text-accent" strokeWidth={2.5} />
        </span>
      );
    case 'error':
      return (
        <span title={job.errorMessage}>
          <AlertCircle className="w-4 h-4 text-danger" />
        </span>
      );
    case 'skipped':
      return (
        <span title={job.errorMessage || 'skipped'}>
          <MinusCircle className="w-4 h-4 text-subtle" />
        </span>
      );
    default:
      return <span className="w-2 h-2 rounded-full bg-faint" />;
  }
}
