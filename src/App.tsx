import { useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { PresetSelector } from './components/PresetSelector';
import { FileList } from './components/FileList';
import { Footer } from './components/Footer';
import { PreviewOverlay } from './components/PreviewOverlay';
import { AdvancedPanel } from './components/AdvancedPanel';
import { useStore } from './state/store';
import { estimateBatch, onBatchDone, onJobProgress } from './lib/tauri';

export default function App() {
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);
  const updateJob = useStore((s) => s.updateJob);
  const setBatchRunning = useStore((s) => s.setBatchRunning);

  // Subscribe to backend events
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

  // Re-estimate on settings change
  useEffect(() => {
    const pending = jobs.filter((j) => j.status === 'queued' || j.status === 'error');
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

  return (
    <div className="flex flex-col h-screen bg-bg">
      <header className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="font-medium tracking-tight">resizer</div>
        <PresetSelector />
      </header>

      <main className="flex-1 min-h-0 flex flex-col px-4 pb-2 gap-4">
        <DropZone />
        <FileList />
      </main>

      <AdvancedPanel />
      <Footer />
      <PreviewOverlay />
    </div>
  );
}
