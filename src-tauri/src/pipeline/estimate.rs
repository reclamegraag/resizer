use crate::types::{Format, Settings};

/// Heuristic estimate without full encode.
/// Rough model: bytes/pixel * pixel_count, adjusted for format + resize.
pub fn estimate_size(
    format: Format,
    width: u32,
    height: u32,
    original_size: u64,
    settings: &Settings,
) -> u64 {
    let (mut w, mut h) = (width as f64, height as f64);
    if let Some(mw) = settings.max_width {
        if w > mw as f64 {
            let r = mw as f64 / w;
            w *= r;
            h *= r;
        }
    }
    if let Some(mh) = settings.max_height {
        if h > mh as f64 {
            let r = mh as f64 / h;
            w *= r;
            h *= r;
        }
    }
    let pixels = (w * h).max(1.0);

    let bpp = match format {
        Format::Jpeg => {
            // mozjpeg q=82 ~ 0.55 bpp for natural photos
            let q = settings.jpeg_quality as f64;
            0.15 + (q - 50.0).max(0.0) * 0.012
        }
        Format::Png => {
            if settings.png_lossy {
                // pngquant ~0.7-1.5 bpp depending on quality
                let q = settings.png_quality_max as f64;
                0.4 + (q / 100.0) * 1.2
            } else {
                // lossless oxipng ~4-6 bpp on natural
                3.5
            }
        }
    };

    let est = (pixels * bpp / 8.0) as u64;
    est.min(original_size.saturating_sub(1)).max(1024)
}
