# Design Ground Truth: ContentReady Project Clone

## Reference Specification

The user-provided ContentReady project editor is the ground-truth reference. The clone will reproduce its **dense, dark, desktop-first creator workspace** rather than reuse its brand assets, proprietary video-processing logic, catalogue media, or copyrighted scenepack imagery. The implementation will remain an original, frontend-only interface that demonstrates the interaction patterns with safely local placeholder data.

## Chosen Approach: Film Lab Console

### Design Movement

Contemporary **post-production software UI** with a cinematic control-room sensibility: low-key black surfaces, dimensional panels, pale mint status signals, and a deliberately compact information architecture.

### Core Principles

1. Treat the workspace as a tool, not a landing page: controls are grouped by the order in which a creator makes decisions.
2. Establish hierarchy with tonal layering and type scale rather than decorative borders or oversized cards.
3. Keep feedback direct and legible: selection, generation state, aspect ratio, and output readiness use a consistent mint signal.
4. Preserve the reference's editor density while making the layout responsive and keyboard-friendly.

### Color Philosophy

Near-black green replaces generic charcoal to evoke a color-grading suite. Mint is reserved for commitment states, active tools, and successful output; graphite panels recede behind the work. The signature color is **Signal Mint** (`#8FF0B5`), which reads as a technical status indicator rather than decorative neon.

### Layout Paradigm

The screen is organized as a **cinema workbench**: a compact top rail, a narrow source tray on the left, a broad staged preview in the center, and a parameter stack on the right. On smaller screens, the source tray and inspector resolve into intentional horizontal sections rather than being squeezed into an unusable desktop shell.

### Signature Elements

1. A soft, abstract green studio-light field behind the interface.
2. A small, bracketed waveform mark in the header and export view.
3. Slim uppercase labels paired with deliberately large editorial titles.

### Interaction Philosophy

Controls acknowledge input immediately with subtle tint, a 160ms transform response, and plain-language toast feedback. A usable no-code demo lets people change a source, apply a preset, alter the crop, switch format, and simulate render progress entirely in the browser.

### Animation

Panel and toast transitions use 160–220ms custom ease-out motion. Preview frame changes crossfade; selected source cards lift by 2px with a mint edge. Non-essential ambient light motion is disabled for reduced-motion preferences. No looping animation competes with the editing workflow.

### Typography System

`Space Grotesk` provides the compact, technically confident UI voice; `DM Sans` supports body copy and metadata. Interface labels are uppercase with tracked letter spacing, primary action labels are semibold, and the project title has a large, inked editorial weight.

### Brand Essence

**FrameLab is a browser-native, open-source creative workstation for assembling short-form video ideas into a clear edit plan.** Its personality is **precise, cinematic, and generous**.

### Brand Voice

Headlines are declarative, control labels are concise, and microcopy explains constraints without patronizing the creator. Example lines: “Shape the cut before the timeline.” and “Five directions are ready to review.” Generic welcome language is deliberately avoided.

### Wordmark & Logo

The wordmark pairs `Frame` with a small waveform-cut `Lab` suffix. The standalone logo is a bold, text-free bracketed waveform: two mint timing brackets holding a short white sine stroke, rendered at a visible 32px size in the header and favicon.

### Signature Brand Color

**Signal Mint — `#8FF0B5`**

## Style Decisions

- The bracketed waveform is a recurring FrameLab system motif in the header, staged preview, readiness status, and export state; it is a product signature, not generic decoration.
- Signal Mint is reserved for active selection, confirmed readiness, progress success, and primary commitment actions. Inactive controls remain graphite, white, or muted green-black.
- Editorial moments should read like concise cut-room direction with cinematic confidence rather than generic SaaS copy.
