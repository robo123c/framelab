# FrameLab Operations Guide

FrameLab separates editing data from media processing. The browser and application API manage user-owned projects, persistent metadata, timing data, queued render plans, and worker registrations. The optional worker is a separate process installed and operated by the deployment administrator.

## Deployment boundary

| Area | FrameLab application | Self-hosted worker |
|---|---|---|
| User identity | Authenticated creator account | One-time-issued worker credential |
| Project data | Database records scoped to the project owner | Read-only job payload for the claimed job |
| Files | Managed storage reference and asset metadata | Downloads only operator-authorized assets and emits an operator-owned export URL |
| Processing | Queues and observes job state | Runs the administrator’s selected rendering command |

The application can operate without a worker. In that state, it continues to preserve projects, uploads, timing, and render plans, while queued renders do not progress. This is intentional: media processing should begin only when the operator supplies a suitable machine and renderer.

## Worker lifecycle

The operator registers a worker in the application, receives a one-time token, and stores it only in the worker’s local runtime configuration. The worker then repeatedly claims a queued job, posts progress, and reports one of the allowed outcomes. A successful renderer should write an artifact object containing `outputUrl` to standard output; FrameLab makes that link available from the editor.

| State | Meaning | Next action |
|---|---|---|
| `queued` | A creator requested a render plan. | An authorized worker may claim it. |
| `processing` | A worker acknowledged the job. | The worker posts a subsequent state. |
| `review` | The worker completed its command without an attached export URL. | The operator reviews or attaches an artifact in their own process. |
| `completed` | An export URL was reported. | The creator may open the linked export. |
| `failed` | The worker reported a clear failure. | The creator can update the plan and queue another job. |

## Data handling checklist

The deployment administrator should use only media and text they are entitled to process. Upload limits, duration limits, file-type validation, virus scanning, retention, and deletion policies should be established for the deployment’s own requirements. The worker starter rejects no media by itself beyond the API’s input limits; a production renderer should validate all assets before processing.

Worker credentials should never appear in Git history, public logs, issue reports, or client-side code. Rotate a worker by registering a replacement and retiring the older runtime configuration. The application stores a token hash and display hint rather than the original token.

## Development checks

Run `pnpm check`, `pnpm test`, and `pnpm build` before release. Validate the dashboard, a local project route, a persistent project route after sign-in, the timing route, and `/workers` at desktop and narrow mobile widths. For a production worker, first use a non-sensitive test asset and verify that the reported `outputUrl` is controlled by the deployment operator.
