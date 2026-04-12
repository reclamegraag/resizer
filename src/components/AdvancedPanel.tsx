import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../state/store';

export function AdvancedPanel() {
  const [open, setOpen] = useState(false);
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <div className="border-t border-border-soft">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 h-11 text-xs text-subtle hover:text-fg transition"
      >
        <span className="label">advanced</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 grid grid-cols-2 gap-x-8 gap-y-4 text-xs animate-fade-up">
          <Control label={`JPEG quality · ${settings.jpegQuality}`}>
            <input
              type="range"
              min={50}
              max={95}
              value={settings.jpegQuality}
              onChange={(e) =>
                setSettings({ jpegQuality: Number(e.target.value) })
              }
              className="w-full"
            />
          </Control>

          <Control
            label={`PNG quality · ${settings.pngQualityMin}–${settings.pngQualityMax}`}
          >
            <input
              type="range"
              min={40}
              max={100}
              value={settings.pngQualityMax}
              disabled={!settings.pngLossy}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSettings({
                  pngQualityMax: v,
                  pngQualityMin: Math.max(30, Math.min(settings.pngQualityMin, v - 5)),
                });
              }}
              className="w-full disabled:opacity-30"
            />
          </Control>

          <Control label="Max width (px)">
            <NumInput
              value={settings.maxWidth}
              onChange={(v) => setSettings({ maxWidth: v })}
            />
          </Control>

          <Control label="Max height (px)">
            <NumInput
              value={settings.maxHeight}
              onChange={(v) => setSettings({ maxHeight: v })}
            />
          </Control>

          <Check
            checked={settings.pngLossy}
            onChange={(v) => setSettings({ pngLossy: v })}
            label="PNG lossy (pngquant)"
          />
          <Check
            checked={settings.stripMetadata}
            onChange={(v) => setSettings({ stripMetadata: v })}
            label="Strip metadata"
          />
        </div>
      )}
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function NumInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      placeholder="none"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="bg-bg-1 border border-border-soft rounded-md px-3 h-9 font-mono text-fg placeholder:text-faint focus:border-fg/40 outline-none transition"
    />
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none h-9">
      <span
        className={`relative w-4 h-4 rounded-sm border transition ${
          checked ? 'bg-fg border-fg' : 'bg-bg-1 border-border'
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="absolute inset-0 w-full h-full text-bg"
            aria-hidden
          >
            <path
              d="M3 8l3.5 3.5L13 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-muted">{label}</span>
    </label>
  );
}
