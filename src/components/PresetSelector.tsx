import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../state/store';
import { PRESET_LABELS } from '../lib/presets';
import type { Preset } from '../types';

const ORDER: Preset[] = ['web', 'balanced', 'max', 'custom'];

export function PresetSelector() {
  const preset = useStore((s) => s.preset);
  const setPreset = useStore((s) => s.setPreset);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-sm hover:bg-border/30"
      >
        <span className="text-muted text-xs">preset</span>
        <span>{PRESET_LABELS[preset]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-40 rounded-md border border-border bg-surface shadow-xl z-20 overflow-hidden">
            {ORDER.filter((p) => p !== 'custom').map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-border/40 ${
                  preset === p ? 'text-fg' : 'text-muted'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
