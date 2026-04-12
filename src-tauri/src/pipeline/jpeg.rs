use crate::types::PipelineError;
use image::{DynamicImage, GenericImageView};
use mozjpeg::{ColorSpace, Compress, ScanMode};

pub fn encode(
    img: &DynamicImage,
    quality: u8,
    icc: Option<&[u8]>,
    exif: Option<&[u8]>,
) -> Result<Vec<u8>, PipelineError> {
    let rgb = img.to_rgb8();
    let (w, h) = img.dimensions();

    let result = std::panic::catch_unwind(|| -> Result<Vec<u8>, String> {
        let mut comp = Compress::new(ColorSpace::JCS_RGB);
        comp.set_size(w as usize, h as usize);
        comp.set_quality(quality as f32);
        comp.set_scan_optimization_mode(ScanMode::AllComponentsTogether);
        comp.set_optimize_scans(true);
        comp.set_optimize_coding(true);

        let mut started = comp
            .start_compress(Vec::new())
            .map_err(|e| e.to_string())?;

        if let Some(profile) = icc {
            started.write_icc_profile(profile);
        }
        if let Some(ex) = exif {
            // EXIF marker = APP1 (0xE1) with "Exif\0\0" prefix
            let mut payload = Vec::with_capacity(6 + ex.len());
            payload.extend_from_slice(b"Exif\0\0");
            payload.extend_from_slice(ex);
            started.write_marker(mozjpeg::Marker::APP(1), &payload);
        }

        started.write_scanlines(&rgb).map_err(|e| e.to_string())?;
        let bytes = started.finish().map_err(|e| e.to_string())?;
        Ok(bytes)
    });

    match result {
        Ok(Ok(bytes)) => Ok(bytes),
        Ok(Err(msg)) => Err(PipelineError::Other(format!("mozjpeg: {msg}"))),
        Err(_) => Err(PipelineError::Other("mozjpeg panic".into())),
    }
}
