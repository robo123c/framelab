# Reference Workflow Map

The user-supplied project exposes a compact creator workflow with three principal views. This map captures **visible behavior and information architecture only**; it does not reproduce source code, service branding, proprietary rendering systems, or catalogue media.

| Reference view | Visible workflow pattern | FrameLab implementation target |
|---|---|---|
| Dashboard | A compact top rail, workflow-mode cards, project cards, account/credit controls, and a new-project action. | A free local project dashboard with original mode cards, a create-project control, and saved in-browser draft cards. |
| Preview editor | Left-side source selection and import controls; a staged portrait preview; format and crop controls; look/preset cards; text treatment controls; an output-readiness state. | A responsive three-panel editor with local state transitions, original generated preview stills, preset selection, simulated cut generation, and browser-local draft state. |
| Lyrics and beats | A project heading and editor return link; audio-duration status; editable word chips grouped into lines; lyric confirmation; beat-marker waveform with add, remove, clear, import, and confirmation controls. | A timing route with editable word chips, a browser-local transcript, a beat-grid editor, audio-clock simulation, local confirmations, and original copy. |

## Free and Open-Source Boundary

FrameLab will be published under MIT and will remain usable without an account or paid service for its local demo workflows. The clone will use original branding and rights-cleared generated media. Features that require compute or rights-sensitive integration—server-side rendering, public-platform downloading, storage, transcription, or beat detection—will be documented as **optional self-hosted extension points**, not silently backed by paid proprietary services.
