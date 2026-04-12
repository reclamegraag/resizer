use crate::types::PipelineError;
use image::{DynamicImage, GenericImageView};
use imagequant::{Attributes, RGBA};
use oxipng::{optimize_from_memory, Options};

pub fn encode_lossy(
    img: &DynamicImage,
    q_min: u8,
    q_max: u8,
) -> Result<Vec<u8>, PipelineError> {
    let rgba = img.to_rgba8();
    let (w, h) = img.dimensions();
    let pixels: Vec<RGBA> = rgba
        .chunks_exact(4)
        .map(|c| RGBA::new(c[0], c[1], c[2], c[3]))
        .collect();

    let mut attr = Attributes::new();
    attr.set_quality(q_min.min(q_max), q_max)
        .map_err(|e| PipelineError::Other(format!("imagequant quality: {e:?}")))?;
    attr.set_speed(4)
        .map_err(|e| PipelineError::Other(format!("imagequant speed: {e:?}")))?;

    let mut liq_image = attr
        .new_image(pixels.as_slice(), w as usize, h as usize, 0.0)
        .map_err(|e| PipelineError::Other(format!("imagequant image: {e:?}")))?;

    let mut quantized = attr
        .quantize(&mut liq_image)
        .map_err(|e| PipelineError::Other(format!("imagequant quantize: {e:?}")))?;

    quantized.set_dithering_level(1.0).ok();
    let (palette, indexed) = quantized
        .remapped(&mut liq_image)
        .map_err(|e| PipelineError::Other(format!("imagequant remap: {e:?}")))?;

    let mut buf = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut buf, w, h);
        encoder.set_color(png::ColorType::Indexed);
        encoder.set_depth(png::BitDepth::Eight);

        let mut plte = Vec::with_capacity(palette.len() * 3);
        let mut trns = Vec::with_capacity(palette.len());
        for c in &palette {
            plte.push(c.r);
            plte.push(c.g);
            plte.push(c.b);
            trns.push(c.a);
        }
        encoder.set_palette(plte);
        encoder.set_trns(trns);

        let mut writer = encoder
            .write_header()
            .map_err(|e| PipelineError::Other(format!("png header: {e}")))?;
        writer
            .write_image_data(&indexed)
            .map_err(|e| PipelineError::Other(format!("png data: {e}")))?;
    }

    // Run through oxipng finisher
    let opts = Options::from_preset(4);
    let optimized = optimize_from_memory(&buf, &opts)
        .map_err(|e| PipelineError::Other(format!("oxipng: {e}")))?;
    Ok(optimized)
}

pub fn encode_lossless(img: &DynamicImage) -> Result<Vec<u8>, PipelineError> {
    let rgba = img.to_rgba8();
    let (w, h) = img.dimensions();

    let mut buf = Vec::new();
    {
        let mut encoder = png::Encoder::new(&mut buf, w, h);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder
            .write_header()
            .map_err(|e| PipelineError::Other(format!("png header: {e}")))?;
        writer
            .write_image_data(&rgba)
            .map_err(|e| PipelineError::Other(format!("png data: {e}")))?;
    }

    let opts = Options::from_preset(4);
    let optimized = optimize_from_memory(&buf, &opts)
        .map_err(|e| PipelineError::Other(format!("oxipng: {e}")))?;
    Ok(optimized)
}
