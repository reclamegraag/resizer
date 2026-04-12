use crate::output::resolve_output_path;
use crate::pipeline::{self, estimate::estimate_size};
use crate::scheduler::{is_heavy, Scheduler};
use crate::types::{Estimate, FileInfo, JobProgress, Settings};

use base64::Engine;
use rayon::prelude::*;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

const HEAVY_CONCURRENCY_CAP: usize = 2;

#[tauri::command]
pub async fn inspect_files(paths: Vec<String>) -> Result<Vec<FileInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let results: Vec<FileInfo> = paths
            .into_par_iter()
            .filter_map(|p| inspect_one(p).ok())
            .collect();
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn inspect_one(path_str: String) -> Result<FileInfo, String> {
    let path = PathBuf::from(&path_str);
    let format = pipeline::detect_format(&path).ok_or("unsupported")?;
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    let original_size = meta.len();

    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
    let (w, h) = image::GenericImageView::dimensions(&img);

    // Thumbnail as data URL (200px max)
    let thumb = img.thumbnail(200, 200);
    let mut thumb_bytes = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut thumb_bytes);
        let _ = thumb.write_to(&mut cursor, image::ImageFormat::Jpeg);
    }
    let data_url = if thumb_bytes.is_empty() {
        None
    } else {
        Some(format!(
            "data:image/jpeg;base64,{}",
            base64::engine::general_purpose::STANDARD.encode(&thumb_bytes)
        ))
    };

    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("file")
        .to_string();

    Ok(FileInfo {
        id: uuid::Uuid::new_v4().to_string(),
        path: path_str,
        name,
        format,
        original_size,
        width: w,
        height: h,
        thumbnail_data_url: data_url,
    })
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EstimateInput {
    pub id: String,
    #[allow(dead_code)]
    pub path: String,
    pub format: crate::types::Format,
    pub original_size: u64,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn estimate_batch(items: Vec<EstimateInput>, settings: Settings) -> Vec<Estimate> {
    items
        .into_iter()
        .map(|it| Estimate {
            id: it.id,
            estimated_size: estimate_size(it.format, it.width, it.height, it.original_size, &settings),
        })
        .collect()
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressJob {
    pub id: String,
    pub path: String,
    pub original_size: u64,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn compress_batch(
    app: AppHandle,
    scheduler: State<'_, Scheduler>,
    jobs: Vec<CompressJob>,
    settings: Settings,
) -> Result<(), String> {
    scheduler.start();
    let cancel = scheduler.cancel_flag.clone();

    let pool = rayon::ThreadPoolBuilder::new()
        .num_threads(settings.concurrency.max(1))
        .build()
        .map_err(|e| e.to_string())?;

    let heavy_sema = Arc::new(AtomicUsize::new(0));

    let app_clone = app.clone();
    let scheduler_running = scheduler.running.clone();

    tauri::async_runtime::spawn_blocking(move || {
        pool.install(|| {
            jobs.par_iter().for_each(|job| {
                if cancel.load(Ordering::SeqCst) {
                    return;
                }

                let heavy = is_heavy(job.original_size, job.width, job.height);
                if heavy {
                    // spin-wait for a heavy slot
                    loop {
                        if cancel.load(Ordering::SeqCst) {
                            return;
                        }
                        let cur = heavy_sema.load(Ordering::SeqCst);
                        if cur < HEAVY_CONCURRENCY_CAP
                            && heavy_sema
                                .compare_exchange(cur, cur + 1, Ordering::SeqCst, Ordering::SeqCst)
                                .is_ok()
                        {
                            break;
                        }
                        std::thread::sleep(std::time::Duration::from_millis(25));
                    }
                }

                let _ = app_clone.emit(
                    "job-progress",
                    JobProgress::Processing { id: job.id.clone() },
                );

                let input = PathBuf::from(&job.path);
                let output = resolve_output_path(&input);

                let result = pipeline::compress_to_path(&input, &output, &settings);

                if heavy {
                    heavy_sema.fetch_sub(1, Ordering::SeqCst);
                }

                let event = match result {
                    Ok(size) => {
                        if size >= job.original_size {
                            let _ = std::fs::remove_file(&output);
                            JobProgress::Skipped {
                                id: job.id.clone(),
                                reason: "already optimal".into(),
                            }
                        } else {
                            JobProgress::Done {
                                id: job.id.clone(),
                                output_path: output.to_string_lossy().to_string(),
                                output_size: size,
                            }
                        }
                    }
                    Err(e) => JobProgress::Error {
                        id: job.id.clone(),
                        message: e.to_string(),
                    },
                };
                let _ = app_clone.emit("job-progress", event);
            });
        });

        *scheduler_running.write() = false;
        let _ = app_clone.emit("batch-done", ());
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_batch(scheduler: State<'_, Scheduler>) {
    scheduler.cancel();
    scheduler.stop();
}

#[tauri::command]
pub async fn preview_single(
    path: String,
    settings: Settings,
) -> Result<PreviewResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let p = PathBuf::from(&path);
        let original_bytes = std::fs::read(&p).map_err(|e| e.to_string())?;
        let bytes = pipeline::compress_to_memory(&p, &settings).map_err(|e| e.to_string())?;
        let size = bytes.len() as u64;
        let mime = preview_mime(&p);
        let original_data_url = format!(
            "data:{mime};base64,{}",
            base64::engine::general_purpose::STANDARD.encode(&original_bytes)
        );
        let data_url = format!(
            "data:{mime};base64,{}",
            base64::engine::general_purpose::STANDARD.encode(&bytes)
        );
        Ok(PreviewResult {
            original_data_url,
            data_url,
            size,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResult {
    pub original_data_url: String,
    pub data_url: String,
    pub size: u64,
}

fn preview_mime(path: &PathBuf) -> &'static str {
    match pipeline::detect_format(path) {
        Some(crate::types::Format::Jpeg) => "image/jpeg",
        Some(crate::types::Format::Png) => "image/png",
        None => "application/octet-stream",
    }
}
