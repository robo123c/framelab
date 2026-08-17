# FrameLab Self-Hosted Worker

This worker is optional. The main FrameLab application works without it for persistent projects, assets, timing data, and render planning.

## Setup

First register a worker in the FrameLab **Workers** screen. Copy the one-time token and add its identifier plus the app URL to a local, uncommitted configuration source. `config.example.json` shows the required values; do not save the real token in source control.

```bash
cd worker
pnpm install
export FRAMELAB_APP_URL=https://your-framelab.example
export FRAMELAB_WORKER_ID=1
export FRAMELAB_WORKER_TOKEN=framelab_replace_with_the_once-issued_token
pnpm start
```

The starter uses a pull workflow. It asks for one authorized queued job at a time and reports processing state. By default it advances a job to `review` because a rendering binary has not been selected. Set `FRAMEWORK_RENDER_COMMAND` to a command on the worker machine that accepts the job payload as JSON on standard input.

When the configured command completes, write a JSON object to standard output. If it contains `outputUrl`, FrameLab records the job as `completed` and shows the linked export in the editor. Otherwise it records the job as `review`, allowing the operator to attach an artifact through their own workflow.

```json
{"outputKey":"operator/exports/draft-04.mp4","outputUrl":"https://operator-controlled.example/exports/draft-04.mp4"}
```

For optional local transcription and beat-analysis programs, use the structured results documented in [ADAPTER_CONTRACTS.md](./ADAPTER_CONTRACTS.md). The worker identity may submit transcript tokens, beat markers, or both only for projects owned by its registering operator.

## Safety boundary

The worker token is a credential. Keep it in local environment configuration rather than source control. The worker should process only media the deployment operator has the right to use, validate all input, enforce its own file-size and duration limits, and store rendered artifacts only in locations under the operator’s control.
