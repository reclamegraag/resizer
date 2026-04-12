use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Jpeg,
    Png,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub jpeg_quality: u8,
    pub png_lossy: bool,
    pub png_quality_min: u8,
    pub png_quality_max: u8,
    pub max_width: Option<u32>,
    pub max_height: Option<u32>,
    pub strip_metadata: bool,
    pub concurrency: usize,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            jpeg_quality: 82,
            png_lossy: true,
            png_quality_min: 70,
            png_quality_max: 85,
            max_width: None,
            max_height: None,
            strip_metadata: true,
            concurrency: num_cpus_best(),
        }
    }
}

fn num_cpus_best() -> usize {
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub format: Format,
    pub original_size: u64,
    pub width: u32,
    pub height: u32,
    pub thumbnail_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "status")]
pub enum JobProgress {
    Processing { id: String },
    Done { id: String, output_path: String, output_size: u64 },
    Skipped { id: String, reason: String },
    Error { id: String, message: String },
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Estimate {
    pub id: String,
    pub estimated_size: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum PipelineError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("image: {0}")]
    Image(#[from] image::ImageError),
    #[error("{0}")]
    Other(String),
}

impl From<anyhow::Error> for PipelineError {
    fn from(e: anyhow::Error) -> Self {
        PipelineError::Other(e.to_string())
    }
}
