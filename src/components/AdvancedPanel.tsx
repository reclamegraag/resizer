import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../state/store';

export function AdvancedPanel() {
  const [open, setOpen] = useState(false);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 h-10 text-xs text-muted hover:text-fg"
      >
        <span>advanced</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-4 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-muted">JPEG quality · {settings.jpegQuality}</span>
            <input
              type="range"
              min={50}
              max={95}
              value={settings.jpegQuality}
              onChange={(e) =>
                setSettings({ jpegQuality: Number(e.target.value) })
              }
              className="accent-fg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">
              PNG quality · {settings.pngQualityMin}-{settings.pngQualityMax}
            </span>
            <input
              type="range"
              min={40}
              max={100}
              value={settings.pngQualityMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSettings({
                  pngQualityMax: v,
                  pngQualityMin: Math.min(settings.pngQualityMin, v - 5),
                });
              }}
              className="accent-fg"
              disabled={!settings.pngLossy}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Max width (px)</span>
            <input
              type="number"
              placeholder="none"
              value={settings.maxWidth ?? ''}
              onChange={(e) =>
                setSettings({
                  maxWidth: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="bg-surface border border-border rounded px-2 py-1 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted">Max height (px)</span>
            <input
              type="number"
              placeholder="none"
              value={settings.maxHeight ?? ''}
              onChange={(e) =>
                setSettings({
                  maxHeight: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="bg-surface border border-border rounded px-2 py-1 font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.pngLossy}
              onChange={(e) => setSettings({ pngLossy: e.target.checked })}
              className="accent-fg"
            />
            <span>PNG lossy (pngquant)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.stripMetadata}
              onChange={(e) => setSettings({ stripMetadata: e.target.checked })}
              className="accent-fg"
            />
            <span>Strip metadata (EXIF/ICC)</span>
          </label>
        </div>
      )}
    </div>
  );
}
