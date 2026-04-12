import { create } from 'zustand';
import type { ImageJob, Preset, Settings } from '../types';
import { PRESETS } from '../lib/presets';

type State = {
  jobs: ImageJob[];
  preset: Preset;
  settings: Settings;
  batchRunning: boolean;
  selectedId: string | null;

  setPreset: (p: Preset) => void;
  setSettings: (s: Partial<Settings>) => void;
  addJobs: (jobs: ImageJob[]) => void;
  updateJob: (id: string, patch: Partial<ImageJob>) => void;
  removeJob: (id: string) => void;
  clear: () => void;
  setBatchRunning: (v: boolean) => void;
  select: (id: string | null) => void;
};

export const useStore = create<State>((set) => ({
  jobs: [],
  preset: 'balanced',
  settings: PRESETS.balanced,
  batchRunning: false,
  selectedId: null,

  setPreset: (p) =>
    set(() => ({
      preset: p,
      settings: p === 'custom' ? PRESETS.balanced : PRESETS[p],
    })),
  setSettings: (s) =>
    set((state) => ({
      preset: 'custom',
      settings: { ...state.settings, ...s },
    })),
  addJobs: (jobs) =>
    set((state) => {
      const existingPaths = new Set(state.jobs.map((j) => j.path));
      const fresh = jobs.filter((j) => !existingPaths.has(j.path));
      return { jobs: [...state.jobs, ...fresh] };
    }),
  updateJob: (id, patch) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),
  removeJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),
  clear: () => set({ jobs: [], selectedId: null }),
  setBatchRunning: (v) => set({ batchRunning: v }),
  select: (id) => set({ selectedId: id }),
}));
