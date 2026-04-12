import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
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

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [slider, setSlider] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job) {
      setOriginalUrl(null);
      setPreviewUrl(null);
      setPreviewSize(null);
      setLoadError(false);
      return;
    }

    setSlider(50);
    setLoadError(false);
    setOriginalUrl(job.thumbnailDataUrl ?? null);
    setPreviewUrl(null);
    setPreviewSize(null);
    setLoading(true);

    let cancelled = false;
    const t = setTimeout(() => {
      previewSingle(job.path, settings)
        .then((r) => {
          if (cancelled) return;
          setOriginalUrl(r.originalDataUrl || job.thumbnailDataUrl || null);
          setPreviewUrl(r.dataUrl);
          setPreviewSize(r.size);
        })
        .catch(() => {
          if (cancelled) return;
          setLoadError(true);
          setPreviewUrl(null);
          setPreviewSize(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [job, settings]);

  const setFromX = useCallback((clientX: number) => {
    const el = frameRef.current;
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

  const compareReady = Boolean(originalUrl && previewUrl);
  const pct = previewSize ? savingsPct(job.originalSize, previewSize) : 0;
  const aspectRatio = `${job.width} / ${job.height}`;
  const frameWidth = `min(100%, 1100px, calc((100vh - 15rem) * ${job.width / job.height}))`;

  return (
    <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-xl flex flex-col animate-fade-up">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 flex-shrink-0 border-b border-border-soft bg-bg/88">
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-display italic text-muted text-sm">previewing</span>
          <span className="text-sm truncate">{job.name}</span>
        </div>
        <button
          onClick={() => select(null)}
          className="p-2 text-muted hover:text-fg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stage */}
      <div className="flex-1 min-h-0 px-4 py-5 md:px-8 md:py-8 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="w-full max-w-6xl flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 text-xs md:text-sm text-muted">
              <p className="font-mono tnum text-subtle">
                left: original · right: preview
              </p>
              <p className="text-subtle">
                {compareReady ? 'drag the divider to compare' : loading ? 'building preview…' : 'preview unavailable'}
              </p>
            </div>

            <div
              ref={frameRef}
              onPointerDown={(e) => {
                if (!compareReady) return;
                setDragging(true);
                setFromX(e.clientX);
              }}
              className={`relative mx-auto w-full overflow-hidden rounded-[24px] border border-border-soft bg-bg-1 shadow-[0_32px_80px_rgba(0,0,0,0.55)] select-none ${compareReady ? 'cursor-ew-resize' : 'cursor-default'}`}
              style={{
                aspectRatio,
                width: frameWidth,
                maxHeight: 'calc(100vh - 15rem)',
              }}
            >
              {originalUrl ? (
                <img
                  src={originalUrl}
                  alt="original"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none bg-bg-1"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-1 text-subtle">
                  Original unavailable
                </div>
              )}

              {previewUrl && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
                >
                  <img
                    src={previewUrl}
                    alt="preview"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain bg-bg-1"
                  />
                </div>
              )}

              {!compareReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/42 backdrop-blur-sm text-center px-6">
                  <div className="rounded-full border border-border-soft bg-bg/88 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] text-muted">
                    {loading ? 'Generating preview' : 'Preview state'}
                  </div>
                  <p className="max-w-sm text-sm text-muted">
                    {loadError
                      ? 'The preview could not be rendered for this file.'
                      : 'Preparing a compare view with the original on the left and the compressed result on the right.'}
                  </p>
                </div>
              )}

              <div className="absolute top-4 left-4 label bg-bg/84 border border-border-soft rounded px-2.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] pointer-events-none">
                original
              </div>
              <div className="absolute top-4 right-4 label bg-bg/84 border border-border-soft rounded px-2.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] pointer-events-none">
                preview
              </div>

              {compareReady && (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-px bg-fg/90 pointer-events-none shadow-[0_0_16px_rgba(250,250,250,0.45)]"
                    style={{ left: `${slider}%` }}
                  />
                  <div
                    className="absolute w-8 h-8 rounded-full border border-fg/80 bg-bg/82 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.45)] pointer-events-none flex items-center justify-center"
                    style={{
                      left: `calc(${slider}% - 16px)`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <div className="flex items-center gap-0.5 text-fg text-[10px] font-mono">
                      <span>‹</span>
                      <span>›</span>
                    </div>
                  </div>
                </>
              )}

              {pct > 0 && !loading && previewSize !== null && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="px-4 py-2 rounded-full bg-bg/88 backdrop-blur-md border border-border-soft shadow-inner-hl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    <span className="font-display italic text-accent text-2xl tnum leading-none">
                      −{pct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono tnum text-muted">
              <div className="rounded-2xl border border-border-soft bg-bg/72 px-4 py-3">
                <div className="label mb-2">original</div>
                <div>{formatBytes(job.originalSize)}</div>
                <div className="text-subtle mt-1">
                  {job.width}×{job.height}
                </div>
              </div>
              <div className="rounded-2xl border border-border-soft bg-bg/72 px-4 py-3 text-right">
                <div className="label mb-2">preview</div>
                <div>
                  {loading
                    ? '…'
                    : previewSize !== null
                      ? formatBytes(previewSize)
                      : 'error'}
                </div>
                <div className="text-subtle mt-1">
                  {previewSize !== null ? `${pct > 0 ? `-${pct}%` : '0%'} size change` : loadError ? 'render failed' : 'waiting'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
