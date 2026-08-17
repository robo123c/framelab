# FrameLab

**FrameLab** is a free, open-source creator workspace for planning and running short-form video-cut workflows. It provides a browser-local mode for zero-account planning, a persistent authenticated workspace for projects and asset metadata, and an optional self-hosted worker for operator-controlled media processing.

Its interaction design is informed by the user-supplied reference, but this project does not reuse that service’s proprietary source code, names, visual catalogue, or video-processing services.

## What is included

| Capability | Browser-local mode | Persistent workspace | Optional self-hosted worker |
|---|---|---|---|
| Project planning | Yes | Yes | Not required |
| Editor controls and treatment choices | Yes | Yes, saved to the project | Not required |
| Lyrics and beat markers | Yes | Yes, saved to the project | Not required |
| Asset upload | Not retained | Stored as authenticated project assets | Not required |
| Render plan | Local readiness state | Queued job with lifecycle tracking | Claims and processes jobs |
| Final export | Not available | Shown when a worker reports an artifact | Operator-configured |

FrameLab does not require credits or a paid rendering API. A deployment operator can use the full persistent workspace without registering a worker. Storage, bandwidth, and computing costs, where applicable, remain under the operator’s own infrastructure choices.

## Application routes

| Route | Purpose |
|---|---|
| `/` or `/dashboard` | Workstation lobby with local and authenticated project cards. |
| `/project/draft-04/preview` | Three-panel editor for source selection, canvas controls, visual treatments, captions, and local cut readiness. |
| `/project/draft-04/song` | Lyrics and beat-timing workspace with editable tokens and browser-local marker controls. |
| `/project/:id/preview` | Authenticated persistent editor with asset metadata and render-job status. |
| `/project/:id/song` | Authenticated persistent lyrics-and-beat editor. |
| `/workers` | Worker registration, fleet status, and protocol guidance. |

> **Non-affiliation notice:** FrameLab is an independent implementation. It is not affiliated with, endorsed by, or a redistribution of the user-supplied reference service.

## Local development

```bash
pnpm install
pnpm dev
```

Then open the local URL printed in the terminal. Run the full test and build checks with:

```bash
pnpm test
pnpm build
```

## Persistent workspace

The integrated application uses authenticated project ownership and server-side API procedures for projects, assets, transcript tokens, beat markers, render jobs, and worker registrations. File bytes are stored in managed file storage; the database stores only metadata and storage references.

Database tables are defined in `drizzle/schema.ts`. Apply the generated migration according to the managed deployment workflow before using persistence in another environment.

## Optional self-hosted worker

The [`worker/`](./worker) starter implements a pull model. Register a worker in `/workers`, copy the one-time-issued token, set the three required process variables on the worker machine, and run `pnpm start` from that directory. The worker claims only authorized queued jobs and reports `processing`, `review`, `completed`, or `failed` status.

Set `FRAMEWORK_RENDER_COMMAND` only on the operator-controlled worker. A successful command can return an `outputUrl` JSON field on standard output to attach an export to the job. The worker starter deliberately does not select or bundle a transcoder, keeping the media pipeline under the operator’s control.

## Security and privacy

Projects are scoped to authenticated owners. Worker tokens are stored as hashes, and the raw token is displayed only when it is issued. Keep real worker tokens and any renderer configuration out of source control. Process only media that the deployment operator is entitled to use. See [docs/OPERATIONS.md](./docs/OPERATIONS.md) for the implementation boundary and operational checklist.

## License

MIT. See [LICENSE](./LICENSE).
