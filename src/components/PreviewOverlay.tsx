import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useStore } from '../state/store';
import { previewSingle } from '../lib/tauri';
import { formatBytes, savingsPct } from '../lib/format';

export function PreviewOverlay() {
  const selectedId = useStore((s) => s.selectedId);
  const job = useStore((s) =>
    s.jobs.find((j) => j.id === s.selectedId) || null,
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
        .catch(() => {
          setPreviewUrl(null);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [job, settings]);

  if (!selectedId || !job) return null;

  const origSrc = convertFileSrc(job.path);
  const pct = previewSize ? savingsPct(job.originalSize, previewSize) : 0;

  return (
    <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <div className="text-sm truncate">{job.name}</div>
        <button
          onClick={() => select(null)}
          className="p-2 text-muted hover:text-fg"
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
          className="absolute top-0 bottom-0 w-px bg-fg pointer-events-none"
          style={{ left: `${slider}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="absolute inset-x-0 bottom-8 mx-auto w-2/3 accent-fg"
          aria-label="Before/after slider"
        />
      </div>

      <div className="border-t border-border px-4 h-14 flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-muted">original</span>{' '}
          <span>{formatBytes(job.originalSize)}</span>
        </div>
        <div>
          <span className="text-muted">preview</span>{' '}
          <span>
            {loading
              ? '…'
              : previewSize !== null
                ? formatBytes(previewSize)
                : 'error'}
          </span>
          {pct > 0 && <span className="text-accent ml-2">−{pct}%</span>}
        </div>
      </div>
    </div>
  );
}
