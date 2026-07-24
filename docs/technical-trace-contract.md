# Technical trace contract

Each `TravelResponse` includes one compact, user-safe trace object:

| Field | Meaning |
|---|---|
| `runId` | Local response-run correlation ID; never an account or secret identifier. |
| `agent` | Fixed orchestration path: `compose-shopping-route`. |
| `queryId` | ClickHouse query correlation ID (or an explicit fixture query ID). |
| `returnedNodeCount` | Number of approved place rows returned to the composer. |
| `provenanceState` | `fixture`, `internal_only`, or `public_demo`. |
| `durationMs` | Repository query duration, not fabricated end-to-end latency. |

The trace may be rendered in a compact demo drawer. It must not include SQL credentials, model prompts, private source URLs, raw rows, account identifiers, or hidden chain-of-thought. The full typed manifest is stored in `response_runs`; subsequent direct-manipulation actions belong in `response_events` with a parent response ID so branch history remains recoverable.

The local five-store adapter emits `provenanceState: internal_only`. Its media references and source details must not cross a public response boundary while the approval manifest remains closed. `runtime_enabled` permits local/internal querying; it does not override `public_demo_allowed` or `demo_approved`.
