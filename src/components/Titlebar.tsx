import type { MouseEvent } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import { PresetSelector } from './PresetSelector';

export function Titlebar({ hasJobs, jobsCount }: { hasJobs: boolean; jobsCount: number }) {
  const appWindow = getCurrentWindow();

  const startDragging = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    void appWindow.startDragging();
  };

  const toggleMaximize = (event?: MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    void appWindow.toggleMaximize();
  };

  const minimize = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void appWindow.minimize();
  };

  const close = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void appWindow.close();
  };

  return (
    <header className="flex h-12 flex-shrink-0 items-center gap-4 border-b border-border-soft/60 bg-bg px-4 select-none">
      <div
        className="flex h-full min-w-[160px] items-center gap-2 cursor-grab active:cursor-grabbing"
        onDoubleClick={toggleMaximize}
        onMouseDown={startDragging}
      >
        <span className="text-sm font-medium tracking-tight">resizer</span>
        {hasJobs && (
          <span className="ml-1 font-display text-sm italic text-muted tnum">
            № {String(jobsCount).padStart(2, '0')}
          </span>
        )}
      </div>

      <div
        className="h-full flex-1 cursor-grab active:cursor-grabbing"
        onDoubleClick={toggleMaximize}
        onMouseDown={startDragging}
      />

      <div className="flex items-center gap-4" data-no-drag>
        <PresetSelector />

        <div className="flex items-center gap-2 ml-2">
          <button
            aria-label="Minimize window"
            className="p-1.5 rounded-md hover:bg-border-soft/50 text-muted hover:text-fg transition-colors"
            onClick={minimize}
            tabIndex={-1}
            type="button"
          >
            <Minus size={14} />
          </button>
          <button
            aria-label="Maximize window"
            className="p-1.5 rounded-md hover:bg-border-soft/50 text-muted hover:text-fg transition-colors"
            onClick={toggleMaximize}
            tabIndex={-1}
            type="button"
          >
            <Square size={12} />
          </button>
          <button
            aria-label="Close window"
            className="p-1.5 rounded-md hover:bg-red-500/20 text-muted hover:text-red-500 transition-colors"
            onClick={close}
            tabIndex={-1}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
