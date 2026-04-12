export type Format = 'jpeg' | 'png';

export type Preset = 'web' | 'balanced' | 'max' | 'custom';

export type Settings = {
  jpegQuality: number;
  pngLossy: boolean;
  pngQualityMin: number;
  pngQualityMax: number;
  maxWidth: number | null;
  maxHeight: number | null;
  stripMetadata: boolean;
  concurrency: number;
};

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'done'
  | 'error'
  | 'skipped';

export type ImageJob = {
  id: string;
  path: string;
  name: string;
  format: Format;
  originalSize: number;
  width: number;
  height: number;
  thumbnailDataUrl?: string;
  estimatedSize?: number;
  status: JobStatus;
  outputPath?: string;
  outputSize?: number;
  errorMessage?: string;
};

export type FileInfo = {
  id: string;
  path: string;
  name: string;
  format: Format;
  originalSize: number;
  width: number;
  height: number;
  thumbnailDataUrl?: string;
};

export type JobProgressEvent =
  | { status: 'Processing'; id: string }
  | { status: 'Done'; id: string; outputPath: string; outputSize: number }
  | { status: 'Skipped'; id: string; reason: string }
  | { status: 'Error'; id: string; message: string };
