import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

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

  const setFromX = useCallback((clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSlider(Math.max(0, Math.min(100, pct)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => setFromX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, setFromX]);

  // Keyboard: ← →
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null);
      if (e.key === 'ArrowLeft') setSlider((s) => Math.max(0, s - 2));
      if (e.key === 'ArrowRight') setSlider((s) => Math.min(100, s + 2));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, select]);

  if (!selectedId || !job) return null;

  const origSrc = convertFileSrc(job.path);
  const pct = previewSize ? savingsPct(job.originalSize, previewSize) : 0;

  return (
    <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-xl flex flex-col animate-fade-up">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 flex-shrink-0 border-b border-border-soft">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-display italic text-muted text-sm">previewing</span>
          <span className="text-sm truncate">{job.name}</span>
        </div>
        <button
          onClick={() => select(null)}
          className="p-2 text-subtle hover:text-fg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        onPointerDown={(e) => {
          setDragging(true);
          setFromX(e.clientX);
        }}
        className="flex-1 relative overflow-hidden select-none cursor-ew-resize"
      >
        <img
          src={origSrc}
          alt="original"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        {previewUrl && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
          >
            <img
              src={previewUrl}
              alt="compressed"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        )}

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-fg/90 pointer-events-none shadow-[0_0_16px_rgba(250,250,250,0.45)]"
          style={{ left: `${slider}%` }}
        />
        {/* Handle */}
        <div
          className="absolute w-8 h-8 rounded-full border border-fg bg-bg/40 backdrop-blur pointer-events-none flex items-center justify-center"
          style={{
            left: `calc(${slider}% - 16px)`,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <div className="flex items-center gap-0.5 text-fg/80 text-[10px] font-mono">
            <span>‹</span>
            <span>›</span>
          </div>
        </div>

        {/* Corner labels */}
        <div className="absolute top-4 left-4 label bg-bg/60 backdrop-blur-md rounded px-2 py-1 pointer-events-none">
          before
        </div>
        <div className="absolute top-4 right-4 label bg-bg/60 backdrop-blur-md rounded px-2 py-1 pointer-events-none">
          after
        </div>

        {/* Center savings badge */}
        {pct > 0 && !loading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-bg/70 backdrop-blur-md border border-border-soft shadow-inner-hl">
              <span className="font-display italic text-accent text-2xl tnum leading-none">
                −{pct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom stat bar */}
      <div className="border-t border-border-soft px-6 h-14 flex-shrink-0 flex items-center justify-between text-xs font-mono tnum">
        <div className="flex items-baseline gap-2">
          <span className="label">original</span>
          <span>{formatBytes(job.originalSize)}</span>
          <span className="text-faint ml-1">
            · {job.width}×{job.height}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="label">preview</span>
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
