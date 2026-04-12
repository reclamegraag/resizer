use parking_lot::RwLock;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct Scheduler {
    pub cancel_flag: Arc<AtomicBool>,
    pub running: Arc<RwLock<bool>>,
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            cancel_flag: Arc::new(AtomicBool::new(false)),
            running: Arc::new(RwLock::new(false)),
        }
    }

    pub fn start(&self) {
        self.cancel_flag.store(false, Ordering::SeqCst);
        *self.running.write() = true;
    }

    pub fn stop(&self) {
        *self.running.write() = false;
    }

    pub fn cancel(&self) {
        self.cancel_flag.store(true, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancel_flag.load(Ordering::SeqCst)
    }
}

/// Classify file as "heavy" to throttle concurrency and avoid OOM.
pub fn is_heavy(size_bytes: u64, width: u32, height: u32) -> bool {
    size_bytes > 50 * 1024 * 1024 || (width as u64 * height as u64) > 16_000_000
}
