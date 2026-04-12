import type { Preset, Settings } from '../types';

const cpus =
  typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 4;

export const PRESETS: Record<Exclude<Preset, 'custom'>, Settings> = {
  web: {
    jpegQuality: 75,
    pngLossy: true,
    pngQualityMin: 60,
    pngQualityMax: 75,
    maxWidth: 1920,
    maxHeight: null,
    stripMetadata: true,
    concurrency: cpus,
  },
  balanced: {
    jpegQuality: 82,
    pngLossy: true,
    pngQualityMin: 70,
    pngQualityMax: 85,
    maxWidth: null,
    maxHeight: null,
    stripMetadata: true,
    concurrency: cpus,
  },
  max: {
    jpegQuality: 92,
    pngLossy: false,
    pngQualityMin: 90,
    pngQualityMax: 100,
    maxWidth: null,
    maxHeight: null,
    stripMetadata: false,
    concurrency: cpus,
  },
};

export const PRESET_LABELS: Record<Preset, string> = {
  web: 'Web',
  balanced: 'Balanced',
  max: 'Max quality',
  custom: 'Custom',
};
