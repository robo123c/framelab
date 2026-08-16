# FrameLab

**FrameLab** is an original, frontend-only creator-workspace prototype inspired by the interaction patterns in the user-supplied reference. It does not reuse the source service's proprietary implementation, names, visual catalogue, or video-processing services.

The demo includes a responsive dark editing surface with local interaction states for choosing footage, aspect ratios, crop modes, caption treatments, presets, and a simulated five-cut generation flow.

## Local development

```bash
pnpm install
pnpm dev
```

Then open the local URL Vite prints in the terminal. A production build is available with `pnpm build`.

## Scope

This repository is intentionally **frontend-only**. Inputs and generation controls are demonstrations; connecting media ingest, rendering, transcription, video processing, authentication, storage, or third-party services requires separate backend design and appropriate rights checks.

## License

MIT. See [LICENSE](./LICENSE).
