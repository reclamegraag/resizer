import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  FileInfo,
  ImageJob,
  JobProgressEvent,
  Settings,
} from '../types';

export async function inspectFiles(paths: string[]): Promise<FileInfo[]> {
  return invoke<FileInfo[]>('inspect_files', { paths });
}

export async function estimateBatch(
  items: Array<Pick<ImageJob, 'id' | 'path' | 'format' | 'originalSize' | 'width' | 'height'>>,
  settings: Settings,
): Promise<Array<{ id: string; estimatedSize: number }>> {
  return invoke('estimate_batch', { items, settings });
}

export async function compressBatch(
  jobs: Array<{ id: string; path: string; originalSize: number; width: number; height: number }>,
  settings: Settings,
): Promise<void> {
  return invoke('compress_batch', { jobs, settings });
}

export async function cancelBatch(): Promise<void> {
  return invoke('cancel_batch');
}

export async function previewSingle(
  path: string,
  settings: Settings,
): Promise<{ dataUrl: string; size: number }> {
  return invoke('preview_single', { path, settings });
}

export function onJobProgress(cb: (e: JobProgressEvent) => void) {
  return listen<JobProgressEvent>('job-progress', (event) => cb(event.payload));
}

export function onBatchDone(cb: () => void) {
  return listen('batch-done', () => cb());
}
