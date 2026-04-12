import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useStore } from '../state/store';
import { previewSingle } from '../lib/tauri';
import { formatBytes, savingsPct } from '../lib/format';

export function PreviewOverlay() {
  const selectedId = useStore((s) => s.selectedId);
  const job = useStore(
    (s) => s.jobs.find((j) => j.id === s.selectedId) || null,
  );
  const settings = useStore((s) => s.settings);
  const select = useStore((s) => s.select);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [slider, setSlider] = useState(50);

  useEffect(() => {
    if (!job) {
      setPreviewUrl(null);
      setPreviewSize(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      previewSingle(job.path, settings)
        .then((r) => {
          setPreviewUrl(r.dataUrl);
          setPreviewSize(r.size);
        })
        .catch(() => setPreviewUrl(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [job, settings]);

  if (!selectedId || !job) return null;

  const origSrc = convertFileSrc(job.path);
  const pct = previewSize ? savingsPct(job.originalSize, previewSize) : 0;

  return (
    <div className="fixed inset-0 z-40 bg-bg/90 backdrop-blur-xl flex flex-col animate-fade-up">
      <div className="flex items-center justify-between px-6 h-14 border-b border-border-soft">
        <div className="flex items-baseline gap-3">
          <span className="font-display italic text-muted text-sm">previewing</span>
          <span className="text-sm truncate max-w-[60vw]">{job.name}</span>
        </div>
        <button
          onClick={() => select(null)}
          className="p-2 text-subtle hover:text-fg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <img
          src={origSrc}
          alt="original"
          className="absolute inset-0 w-full h-full object-contain"
        />
        {previewUrl && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
          >
            <img
              src={previewUrl}
              alt="compressed"
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        )}
        <div
          className="absolute top-0 bottom-0 w-px bg-fg/80 pointer-events-none shadow-[0_0_12px_rgba(250,250,250,0.3)]"
          style={{ left: `${slider}%` }}
        />
        <div
          className="absolute w-6 h-6 rounded-full border border-fg bg-bg/70 backdrop-blur pointer-events-none"
          style={{ left: `calc(${slider}% - 12px)`, top: '50%', transform: 'translateY(-50%)' }}
        />
        <div className="absolute top-4 left-4 label bg-bg/70 backdrop-blur rounded px-2 py-1">before</div>
        <div className="absolute top-4 right-4 label bg-bg/70 backdrop-blur rounded px-2 py-1">after</div>
        <input
          type="range"
          min={0}
          max={100}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="absolute inset-x-0 bottom-8 mx-auto w-2/3"
          aria-label="Before/after slider"
        />
      </div>

      <div className="border-t border-border-soft px-6 h-16 flex items-center justify-between text-xs font-mono tnum">
        <div>
          <span className="label mr-2">original</span>
          <span>{formatBytes(job.originalSize)}</span>
        </div>
        <div className="text-center">
          {pct > 0 && (
            <span className="font-display italic text-accent text-xl tnum">
              −{pct}%
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="label mr-2">preview</span>
          <span>
            {loading
              ? '…'
              : previewSize !== null
                ? formatBytes(previewSize)
                : 'error'}
          </span>
        </div>
      </div>
    </div>
  );
}
