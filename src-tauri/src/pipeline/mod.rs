pub mod estimate;
pub mod jpeg;
pub mod metadata;
pub mod png;
pub mod resize;

use crate::types::{Format, PipelineError, Settings};
use image::{DynamicImage, GenericImageView};
use std::path::Path;

pub struct DecodedImage {
    pub image: DynamicImage,
    pub orientation: u32,
    pub icc_profile: Option<Vec<u8>>,
    pub exif_bytes: Option<Vec<u8>>,
    pub format: Format,
}

pub fn detect_format(path: &Path) -> Option<Format> {
    let ext = path.extension()?.to_str()?.to_ascii_lowercase();
    match ext.as_str() {
        "jpg" | "jpeg" => Some(Format::Jpeg),
        "png" => Some(Format::Png),
        _ => None,
    }
}

pub fn decode(path: &Path) -> Result<DecodedImage, PipelineError> {
    let format = detect_format(path)
        .ok_or_else(|| PipelineError::Other("unsupported format".into()))?;
    let bytes = std::fs::read(path)?;

    let orientation = metadata::read_exif_orientation(&bytes).unwrap_or(1);
    let icc_profile = metadata::read_icc(&bytes, format);
    let exif_bytes = metadata::read_exif_bytes(&bytes, format);

    let mut img = image::load_from_memory(&bytes)?;
    img = metadata::apply_orientation(img, orientation);

    Ok(DecodedImage {
        image: img,
        orientation,
        icc_profile,
        exif_bytes,
        format,
    })
}

pub fn compress_to_path(
    input: &Path,
    output: &Path,
    settings: &Settings,
) -> Result<u64, PipelineError> {
    let decoded = decode(input)?;
    let resized = resize::maybe_resize(decoded.image, settings.max_width, settings.max_height);
    let (w, h) = resized.dimensions();
    if w == 0 || h == 0 {
        return Err(PipelineError::Other("zero dimension".into()));
    }

    let bytes = match decoded.format {
        Format::Jpeg => jpeg::encode(
            &resized,
            settings.jpeg_quality,
            if settings.strip_metadata { None } else { decoded.icc_profile.as_deref() },
            if settings.strip_metadata { None } else { decoded.exif_bytes.as_deref() },
        )?,
        Format::Png => {
            if settings.png_lossy {
                png::encode_lossy(
                    &resized,
                    settings.png_quality_min,
                    settings.png_quality_max,
                )?
            } else {
                png::encode_lossless(&resized)?
            }
        }
    };

    std::fs::write(output, &bytes)?;
    Ok(bytes.len() as u64)
}

pub fn compress_to_memory(
    input: &Path,
    settings: &Settings,
) -> Result<Vec<u8>, PipelineError> {
    let decoded = decode(input)?;
    let resized = resize::maybe_resize(decoded.image, settings.max_width, settings.max_height);

    let bytes = match decoded.format {
        Format::Jpeg => jpeg::encode(
            &resized,
            settings.jpeg_quality,
            if settings.strip_metadata { None } else { decoded.icc_profile.as_deref() },
            if settings.strip_metadata { None } else { decoded.exif_bytes.as_deref() },
        )?,
        Format::Png => {
            if settings.png_lossy {
                png::encode_lossy(
                    &resized,
                    settings.png_quality_min,
                    settings.png_quality_max,
                )?
            } else {
                png::encode_lossless(&resized)?
            }
        }
    };
    Ok(bytes)
}
