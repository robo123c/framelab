# Self-hosting FrameLab Production Features

FrameLab ships as a free browser-local interface. The document below separates that usable local mode from optional production capabilities so that self-hosters can select their own infrastructure, operating budget, and media-rights posture.

> **Principle:** Keep the FrameLab frontend free and transparent. Media processing should be an optional service owned and operated by the deployment administrator, never an undisclosed paid dependency.

| Capability | Browser-local mode today | Optional self-hosted extension |
|---|---|---|
| Projects and cut parameters | Local interaction state and demo project cards. | Persist project JSON in a database selected by the operator. |
| Media ingest | File chooser accepts a user gesture but does not retain media. | Add signed uploads to operator-controlled object storage or a local filesystem service. |
| Preview and composition | Original static demonstration stills and parameter controls. | Render a preview composition from operator-owned footage using a worker queue. |
| Transcript timing | Editable browser-local token groups. | Add an operator-selected speech-to-text service, then provide a human review step before publishing captions. |
| Beat markers | Clickable browser-local grid with `M` shortcut. | Add an operator-selected audio analysis service and keep manual marker adjustment available. |
| Export | Readiness state only. | Send operator-owned media and render parameters to a self-hosted rendering worker; return a signed, expiring download URL. |

## Suggested extension boundary

The frontend should call only a narrow, documented application API under the self-hoster's control. Its important resource types are `projects`, `assets`, `transcripts`, `beatMaps`, `renderJobs`, and `exports`. A production implementation should expose clear job states—`queued`, `processing`, `review`, `completed`, and `failed`—so the interface never represents a render as complete before it is.

Media import and render requests must preserve rights boundaries. A self-hosted deployment should process only footage and audio that the operator is entitled to use, and should not imply support for downloading, republishing, or transforming material from third-party services without permission.

## Operational sequence

An operator can first deploy the static UI as-is. When production functions are required, they can add media storage and an application API, then attach a background rendering worker. Transcription and beat analysis may be connected later as independent opt-in services; the existing browser-local editors remain the manual fallback.

## Free-software posture

The source is MIT-licensed. FrameLab itself does not require a paid API or a hosted account. Self-hosting can still incur the operator's own infrastructure costs, such as storage, compute, and bandwidth; those costs are outside the application license and remain under the operator's control.
