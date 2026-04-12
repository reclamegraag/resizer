import { Play, Square, Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { formatBytes } from '../lib/format';
import { cancelBatch, compressBatch } from '../lib/tauri';

export function Footer() {
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);
  const running = useStore((s) => s.batchRunning);
  const clear = useStore((s) => s.clear);
  const setBatchRunning = useStore((s) => s.setBatchRunning);
  const updateJob = useStore((s) => s.updateJob);

  const totalOriginal = jobs.reduce((a, j) => a + j.originalSize, 0);
  const totalOutput = jobs.reduce(
    (a, j) => a + (j.outputSize ?? j.originalSize),
    0,
  );
  const saved = Math.max(0, totalOriginal - totalOutput);
  const doneCount = jobs.filter((j) => j.status === 'done' || j.status === 'skipped').length;

  const start = async () => {
    const queued = jobs.filter(
      (j) => j.status === 'queued' || j.status === 'error',
    );
    if (queued.length === 0) return;
    setBatchRunning(true);
    queued.forEach((j) => updateJob(j.id, { status: 'queued' }));
    await compressBatch(
      queued.map((j) => ({
        id: j.id,
        path: j.path,
        originalSize: j.originalSize,
        width: j.width,
        height: j.height,
      })),
      settings,
    );
  };

  const stop = async () => {
    await cancelBatch();
    setBatchRunning(false);
  };

  if (jobs.length === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 h-14 flex-shrink-0">
      <div className="text-xs font-mono text-muted">
        <span className="text-fg">{jobs.length}</span> files
        {doneCount > 0 && (
          <>
            {' · '}
            <span className="text-accent">saved {formatBytes(saved)}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={clear}
          disabled={running}
          className="p-2 text-muted hover:text-fg disabled:opacity-30"
          aria-label="Clear list"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {running ? (
          <button
            onClick={stop}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-surface border border-border hover:bg-border/30 text-sm"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        ) : (
          <button
            onClick={start}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-fg text-bg text-sm font-medium hover:bg-fg/90"
          >
            <Play className="w-3.5 h-3.5" />
            Compress
          </button>
        )}
      </div>
    </div>
  );
}
