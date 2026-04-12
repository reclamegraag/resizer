import { useCallback, useEffect, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { Upload } from 'lucide-react';
import { useStore } from '../state/store';
import { inspectFiles } from '../lib/tauri';

export function DropZone() {
  const addJobs = useStore((s) => s.addJobs);
  const [hover, setHover] = useState(false);

  const ingest = useCallback(
    async (paths: string[]) => {
      const infos = await inspectFiles(paths);
      addJobs(
        infos.map((i) => ({
          ...i,
          status: 'queued' as const,
        })),
      );
    },
    [addJobs],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      const webview = getCurrentWebview();
      unlisten = await webview.onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setHover(true);
        } else if (event.payload.type === 'drop') {
          setHover(false);
          const paths = event.payload.paths;
          void ingest(paths);
        } else {
          setHover(false);
        }
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
      className={`w-full rounded-xl border-2 border-dashed transition-colors px-8 py-14 flex flex-col items-center justify-center gap-3 ${
        hover
          ? 'border-fg bg-surface'
          : 'border-border hover:border-muted hover:bg-surface/50'
      }`}
      aria-label="Drop images or click to browse"
    >
      <Upload className="w-6 h-6 text-muted" strokeWidth={1.5} />
      <div className="text-sm text-fg">drop images here</div>
      <div className="text-xs text-muted">or click to browse · jpg, png</div>
    </button>
  );
}
