use image::{DynamicImage, GenericImageView, imageops::FilterType};

pub fn maybe_resize(
    img: DynamicImage,
    max_w: Option<u32>,
    max_h: Option<u32>,
) -> DynamicImage {
    let (w, h) = img.dimensions();
    let mw = max_w.unwrap_or(u32::MAX);
    let mh = max_h.unwrap_or(u32::MAX);
    if w <= mw && h <= mh {
        return img;
    }
    let ratio_w = mw as f64 / w as f64;
    let ratio_h = mh as f64 / h as f64;
    let ratio = ratio_w.min(ratio_h);
    let nw = (w as f64 * ratio).round().max(1.0) as u32;
    let nh = (h as f64 * ratio).round().max(1.0) as u32;
    img.resize(nw, nh, FilterType::Lanczos3)
}
