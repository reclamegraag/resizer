import { useCallback, useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { useStore } from '../state/store';
import { inspectFiles } from '../lib/tauri';

export function Hero() {
  const addJobs = useStore((s) => s.addJobs);
  const [hover, setHover] = useState(false);

  const ingest = useCallback(
    async (paths: string[]) => {
      const infos = await inspectFiles(paths);
      addJobs(infos.map((i) => ({ ...i, status: 'queued' as const })));
    },
    [addJobs],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      const webview = getCurrentWebview();
      unlisten = await webview.onDragDropEvent((event) => {
        if (event.payload.type === 'over') setHover(true);
        else if (event.payload.type === 'drop') {
          setHover(false);
          void ingest(event.payload.paths);
        } else setHover(false);
      });
    })();
    return () => {
      unlisten?.();
    };
  }, [ingest]);

  const browse = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    void ingest(paths);
  }, [ingest]);

  return (
    <button
      onClick={browse}
      className={`group relative flex-1 w-full flex flex-col justify-center px-8 md:px-16 py-12 text-left transition-[transform,box-shadow] duration-200 ease-out-expo ${
        hover ? '-translate-y-0.5 shadow-inner-hl' : ''
      }`}
      aria-label="Drop images or click to browse"
    >
      <div className="flex items-center justify-between w-full mb-12">
        <div className="label tnum">№ 001</div>
        <div className="label tnum">RESIZER · 0.1</div>
      </div>

      <h1 className="font-display text-hero text-fg animate-fade-up">
        Resize,
        <br />
        <span className={`transition-colors duration-300 ${hover ? 'text-accent' : ''}`}>
          radically.
        </span>
      </h1>

      <div className="mt-6 w-12 h-px bg-faint" />

      <p className="mt-6 text-muted text-[0.9375rem] leading-relaxed max-w-md animate-fade-up" style={{ animationDelay: '80ms' }}>
        Drop images anywhere.
        <br />
        <span className="text-subtle">JPEG, PNG · batch · parallel · quality-first.</span>
      </p>

      <div
        className={`mt-10 inline-flex items-center gap-2 text-xs text-subtle transition-opacity ${
          hover ? 'opacity-100' : 'opacity-60'
        }`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span>drop or click</span>
      </div>
    </button>
  );
}
