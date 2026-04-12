mod commands;
mod output;
mod pipeline;
mod scheduler;
mod types;

use scheduler::Scheduler;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Scheduler::new())
        .invoke_handler(tauri::generate_handler![
            commands::inspect_files,
            commands::estimate_batch,
            commands::compress_batch,
            commands::cancel_batch,
            commands::preview_single,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
