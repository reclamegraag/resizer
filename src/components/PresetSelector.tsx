import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../state/store';
import { PRESET_LABELS } from '../lib/presets';
import type { Preset } from '../types';

const ORDER: Array<Exclude<Preset, 'custom'>> = ['web', 'balanced', 'max'];

const PRESET_META: Record<Exclude<Preset, 'custom'>, string> = {
  web: 'q 75 · 1920 · strip',
  balanced: 'q 82 · strip',
  max: 'q 92 · lossless · keep',
};

export function PresetSelector() {
  const preset = useStore((s) => s.preset);
  const setPreset = useStore((s) => s.setPreset);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-3 pl-3 pr-3 h-9 rounded-full border border-border-soft bg-bg-1 hover:border-border transition"
      >
        <span className="label">preset</span>
        <span className="font-display italic text-[15px] text-fg">
          {PRESET_LABELS[preset]}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-subtle transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-panel border border-border-soft bg-bg-1 shadow-2xl shadow-inner-hl z-20 overflow-hidden animate-fade-up">
            {ORDER.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-bg-2 transition flex items-center justify-between ${
                  preset === p ? 'bg-bg-2/60' : ''
                }`}
              >
                <span className="font-display italic text-[17px] text-fg">
                  {PRESET_LABELS[p]}
                </span>
                <span className="font-mono text-[10px] text-subtle tracking-wide">
                  {PRESET_META[p]}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
