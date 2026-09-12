# SentinelFlow — Technical Overview

## 1. Mathematical Scoring & Correlation Logic

The SentinelFlow decision engine computes incident outcome using a weighted evidence model:

$$\text{Net Score} = \sum_{e \in E^+} \text{Impact}(e) - \sum_{e \in E^-} \text{Impact}(e)$$

Where:
- $E^+$ represents evidence items supporting exploitation (e.g. vulnerable host exposure, exploit payload pattern match, HTTP 200 execution logs, spawned root shells, unauthorized DB queries).
- $E^-$ represents protective or mitigating evidence (e.g. WAF 403 blocks, parameter rejection, unexploitable versions, benign handshake resets).
- When $\sum \text{Impact}(E^+) \ge 60$ and $E^+ > 1.5 \times E^-$, the agent determines $\text{ATTACK\_SUCCEEDED}$ with confidence scaled up to 98%.
- When $\sum \text{Impact}(E^-) \ge 40$ and $E^- > 1.5 \times E^+$, the outcome is classified as $\text{ATTACK\_FAILED / FALSE\_POSITIVE}$.
- When telemetry is balanced or signals conflict without conclusive server-side verification, the agent assigns $\text{INSUFFICIENT\_EVIDENCE}$, preventing hallucinated blocks.

## 2. API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & environment mode |
| `GET` | `/api/incidents` | List all tracked incidents |
| `POST` | `/api/incidents` | Ingest alert and instantiate incident |
| `POST` | `/api/incidents/{id}/investigate` | Start autonomous investigation loop |
| `GET` | `/api/events/stream` | Server-Sent Events (SSE) live event broadcast |
| `POST` | `/api/incidents/{id}/inject-evidence` | Inject contradictory or delayed evidence |
| `POST` | `/api/incidents/{id}/override` | Analyst human override action |
| `POST` | `/api/sandbox/scenario/{id}` | Launch pre-configured demonstration scenario |
| `POST` | `/api/sandbox/tool-failure` | Toggle simulated tool downtime |
| `POST` | `/api/sandbox/reset` | Restore sandbox to clean baseline |

## 3. Sandboxed Safe Tools

All tools are registered within the `ToolRegistry` with signature inspection and runtime allowlisting:
- `get_alert(alert_id: str)`
- `get_packet_metadata(alert_id: str)`
- `get_asset(asset_id_or_ip: str)`
- `get_vulnerabilities(asset_id: str)`
- `get_server_logs(asset_id: str)`
- `get_configuration(asset_id: str)`
- `block_ip_simulated(ip: str, reason: str)`
- `verify_block(ip: str)`
- `inject_new_evidence(incident_id: str, evidence: dict)`
