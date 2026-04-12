import { useEffect } from 'react';
import { Hero } from './components/Hero';
import { Titlebar } from './components/Titlebar';
import { FileGrid } from './components/FileGrid';
import { Footer } from './components/Footer';
import { PreviewOverlay } from './components/PreviewOverlay';
import { AdvancedPanel } from './components/AdvancedPanel';
import { GrainOverlay } from './components/GrainOverlay';
import { WindowResizeGrips } from './components/WindowResizeGrips';
import { useStore } from './state/store';
import { estimateBatch, onBatchDone, onJobProgress } from './lib/tauri';

export default function App() {
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);
  const updateJob = useStore((s) => s.updateJob);
  const setBatchRunning = useStore((s) => s.setBatchRunning);

  useEffect(() => {
    const unA = onJobProgress((e) => {
      switch (e.status) {
        case 'Processing':
          updateJob(e.id, { status: 'processing' });
          break;
        case 'Done':
          updateJob(e.id, {
            status: 'done',
            outputPath: e.outputPath,
            outputSize: e.outputSize,
          });
          break;
        case 'Skipped':
          updateJob(e.id, { status: 'skipped', errorMessage: e.reason });
          break;
        case 'Error':
          updateJob(e.id, { status: 'error', errorMessage: e.message });
          break;
      }
    });
    const unB = onBatchDone(() => setBatchRunning(false));
    return () => {
      unA.then((fn) => fn());
      unB.then((fn) => fn());
    };
  }, [updateJob, setBatchRunning]);

  useEffect(() => {
    const pending = jobs.filter(
      (j) => j.status === 'queued' || j.status === 'error',
    );
    if (pending.length === 0) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await estimateBatch(
          pending.map((j) => ({
            id: j.id,
            path: j.path,
            format: j.format,
            originalSize: j.originalSize,
            width: j.width,
            height: j.height,
          })),
          settings,
        );
        if (cancelled) return;
        res.forEach((r) => updateJob(r.id, { estimatedSize: r.estimatedSize }));
      } catch {
        /* ignore */
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, jobs.length]);

  const hasJobs = jobs.length > 0;

  return (
    <div
      className="flex flex-col h-screen bg-bg relative overflow-hidden border border-border-soft/20"
      onContextMenu={(e) => e.preventDefault()}
    >
      <WindowResizeGrips />
      <Titlebar hasJobs={hasJobs} jobsCount={jobs.length} />

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {hasJobs ? (
          <div className="flex-1 min-h-0 overflow-auto py-4">
            <FileGrid />
          </div>
        ) : (
          <Hero />
        )}
      </main>

      <AdvancedPanel />
      <Footer />
      <PreviewOverlay />
      <GrainOverlay />
    </div>
  );
}
