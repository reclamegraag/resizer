import { useStore } from '../state/store';
import { cancelBatch, compressBatch } from '../lib/tauri';

export function CompressButton() {
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);
  const running = useStore((s) => s.batchRunning);
  const setBatchRunning = useStore((s) => s.setBatchRunning);
  const updateJob = useStore((s) => s.updateJob);

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

  if (running) {
    return (
      <button
        onClick={stop}
        className="group relative inline-flex items-center gap-3 pl-5 pr-6 h-11 rounded-full bg-surface border border-border text-sm hover:border-fg/40 transition"
      >
        <span className="relative w-2 h-2 rounded-full bg-fg">
          <span className="absolute inset-0 rounded-full bg-fg animate-ping" />
        </span>
        <span className="font-medium">Processing</span>
        <span className="text-subtle text-xs">· click to stop</span>
      </button>
    );
  }

  return (
    <button
      onClick={start}
      disabled={jobs.length === 0}
      className="group inline-flex items-center gap-3 pl-6 pr-5 h-11 rounded-full bg-fg text-bg text-sm font-medium transition-all duration-200 ease-out-expo hover:pr-6 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span>Compress</span>
      <span className="font-display italic text-lg leading-none transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}
