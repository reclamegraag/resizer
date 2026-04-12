# Resizer

Fast, no-nonsense Windows app that shrinks image filesize while keeping quality high. Built with Tauri + Rust.

- **JPEG** via mozjpeg (10-20% better than libjpeg at same quality)
- **PNG** lossy via pngquant (imagequant) + oxipng finisher, or lossless oxipng
- Batch drag & drop, parallel processing (all cores)
- Smart presets (Web / Balanced / Max quality) + advanced overrides
- Before/after preview with filesize delta
- Auto-update via GitHub Releases

## Dev setup

Requires: Rust (stable), Node 20+, NASM (for mozjpeg), Windows (for final build).

```bash
npm install
npm run tauri:dev
```

## Build (local)

```bash
npm run tauri:build
```

Artifacts in `src-tauri/target/release/bundle/`.

## Release

1. Bump version in `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
2. Tag: `git tag v0.1.0 && git push --tags`.
3. GitHub Actions builds MSI + NSIS installers and drafts a release.
4. Generate a Tauri updater keypair once: `npx @tauri-apps/cli signer generate -w ~/.tauri/resizer.key`. Put the pubkey in `tauri.conf.json` → `plugins.updater.pubkey` and the private key + password in GitHub secrets `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
5. Update the updater endpoint URL in `tauri.conf.json` with your GitHub `OWNER`.

## Icons

Replace the placeholder icons in `src-tauri/icons/` before release:

```bash
npx @tauri-apps/cli icon path/to/logo.png
```

## License

MIT
