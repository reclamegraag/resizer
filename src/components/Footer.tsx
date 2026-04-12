import { Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { SavingsDisplay } from './SavingsDisplay';
import { CompressButton } from './CompressButton';

export function Footer() {
  const jobs = useStore((s) => s.jobs);
  const running = useStore((s) => s.batchRunning);
  const clear = useStore((s) => s.clear);

  if (jobs.length === 0) return null;

  return (
    <div className="border-t border-border-soft bg-bg-1/40 shadow-inner-hl">
      <SavingsDisplay />
      <div className="flex items-center justify-between px-5 h-14 border-t border-border-soft">
        <button
          onClick={clear}
          disabled={running}
          className="inline-flex items-center gap-2 text-xs text-subtle hover:text-fg disabled:opacity-30 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
        <CompressButton />
      </div>
    </div>
  );
}
