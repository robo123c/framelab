# FrameLab Analysis Adapter Contracts

FrameLab keeps automated transcription and beat analysis optional. An operator can connect any local or hosted analysis program to the worker, provided it returns the structured data below to `worker.applyAnalysis` using the registered worker identifier and token.

## Transcript result

Transcript tokens preserve their editorial order and can carry precise timing in milliseconds. A worker may omit `startMs` and `endMs` when only an editable transcript is available.

```json
{
  "projectId": 42,
  "tokens": [
    {"lineIndex": 0, "tokenIndex": 0, "text": "Move", "startMs": 120, "endMs": 420},
    {"lineIndex": 0, "tokenIndex": 1, "text": "without", "startMs": 430, "endMs": 760}
  ]
}
```

## Beat-analysis result

Each beat marker uses a non-negative millisecond offset plus an integer strength from 1 through 100.

```json
{
  "projectId": 42,
  "beats": [
    {"timestampMs": 0, "strength": 90},
    {"timestampMs": 740, "strength": 56}
  ]
}
```

The adapter can submit either or both arrays in one call. The application replaces only the submitted collection. Workers may write analysis only to projects owned by the same operator that registered the worker.
