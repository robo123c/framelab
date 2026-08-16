# FrameLab

**FrameLab** is a free, open-source, browser-local creator workspace for planning short-form video cuts. Its interaction design is informed by the user-supplied reference, but it does not reuse that service's proprietary source code, names, visual catalogue, or video-processing services.

The demo includes a responsive dark editing surface with local interaction states for choosing footage, aspect ratios, crop modes, caption treatments, presets, a simulated five-cut generation flow, and a dedicated lyrics-and-beat timing workspace.

## Free local workflow

FrameLab works without an account, API key, or paid credit in its current form. Draft creation, interface decisions, local project cards, source selection, preset selection, lyric tokens, and beat markers are demonstration workflows that execute inside the browser. No media is uploaded by the demo and no third-party service is called.

| Route | Purpose |
|---|---|
| `/` | Workstation lobby with local draft cards and workflow entry points. |
| `/project/draft-04/preview` | Three-panel editor for source selection, canvas controls, visual treatments, captions, and local cut readiness. |
| `/project/draft-04/song` | Lyrics and beat-timing workspace with editable tokens and browser-local marker controls. |

> **Non-affiliation notice:** FrameLab is an independent implementation. It is not affiliated with, endorsed by, or a redistribution of the user-supplied reference service.

## Local development

```bash
pnpm install
pnpm dev
```

Then open the local URL Vite prints in the terminal. A production build is available with `pnpm build`.

## Scope

This repository is intentionally **frontend-only**. Inputs and generation controls are demonstrations; connecting media ingest, rendering, transcription, video processing, authentication, storage, or third-party services requires separate backend design and appropriate rights checks. See [SELF_HOSTING.md](./SELF_HOSTING.md) for a free and self-hostable extension plan.

## License

MIT. See [LICENSE](./LICENSE).
