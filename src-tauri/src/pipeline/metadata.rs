use crate::types::Format;
use image::DynamicImage;
use img_parts::{ImageEXIF, ImageICC};

pub fn read_exif_orientation(bytes: &[u8]) -> Option<u32> {
    let mut cursor = std::io::Cursor::new(bytes);
    let exifreader = exif::Reader::new();
    let exif = exifreader.read_from_container(&mut cursor).ok()?;
    let field = exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY)?;
    field.value.get_uint(0)
}

pub fn read_icc(bytes: &[u8], format: Format) -> Option<Vec<u8>> {
    match format {
        Format::Jpeg => {
            let jpeg = img_parts::jpeg::Jpeg::from_bytes(bytes.to_vec().into()).ok()?;
            jpeg.icc_profile().map(|b| b.to_vec())
        }
        Format::Png => {
            let png = img_parts::png::Png::from_bytes(bytes.to_vec().into()).ok()?;
            png.icc_profile().map(|b| b.to_vec())
        }
    }
}

pub fn read_exif_bytes(bytes: &[u8], format: Format) -> Option<Vec<u8>> {
    match format {
        Format::Jpeg => {
            let jpeg = img_parts::jpeg::Jpeg::from_bytes(bytes.to_vec().into()).ok()?;
            jpeg.exif().map(|b| b.to_vec())
        }
        Format::Png => {
            let png = img_parts::png::Png::from_bytes(bytes.to_vec().into()).ok()?;
            png.exif().map(|b| b.to_vec())
        }
    }
}

pub fn apply_orientation(img: DynamicImage, orientation: u32) -> DynamicImage {
    match orientation {
        1 => img,
        2 => img.fliph(),
        3 => img.rotate180(),
        4 => img.flipv(),
        5 => img.rotate90().fliph(),
        6 => img.rotate90(),
        7 => img.rotate270().fliph(),
        8 => img.rotate270(),
        _ => img,
    }
}
