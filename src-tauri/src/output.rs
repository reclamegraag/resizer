use std::path::{Path, PathBuf};

/// Produces e.g. `photo.jpg` -> `photo-compressed.jpg`, auto-incrementing on conflict.
pub fn resolve_output_path(input: &Path) -> PathBuf {
    let parent = input.parent().unwrap_or_else(|| Path::new("."));
    let stem = input
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");
    let ext = input
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("bin");

    let base = parent.join(format!("{stem}-compressed.{ext}"));
    if !base.exists() {
        return base;
    }
    for i in 2..10_000 {
        let candidate = parent.join(format!("{stem}-compressed-{i}.{ext}"));
        if !candidate.exists() {
            return candidate;
        }
    }
    parent.join(format!("{stem}-compressed-{}.{ext}", uuid::Uuid::new_v4()))
}
