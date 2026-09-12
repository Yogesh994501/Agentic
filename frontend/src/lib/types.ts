export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'NEW'
  | 'INVESTIGATING'
  | 'CONTAINED'
  | 'FALSE_POSITIVE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CLOSED'
  | 'REOPENED';

export type AttackOutcome =
  | 'UNDETERMINED'
  | 'ATTACK_SUCCEEDED'
  | 'ATTACK_FAILED'
  | 'INSUFFICIENT_EVIDENCE';

export type ResponseStatus =
  | 'NONE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'FAILED';

export type VerificationStatus = 'NOT_VERIFIED' | 'PASSED' | 'FAILED';

export interface Alert {
  alert_id: string;
  source: string;
  timestamp: string;
  signature: string;
  severity: AlertSeverity;
  source_ip: string;
  destination_ip: string;
  destination_port: number;
  protocol: string;
  metadata: Record<string, any>;
}

export interface Asset {
  asset_id: string;
  hostname: string;
  ip: string;
  os: string;
  service: string;
  service_version: string;
  environment: string;
  owner: string;
  criticality: string;
  network_zone: string;
  is_externally_exposed: boolean;
}

export interface EvidenceItem {
  evidence_id: string;
  source_tool: string;
  timestamp: string;
  finding: string;
  data: Record<string, any>;
  confidence_impact: number;
  supports_success: boolean;
}

export interface AgentEvent {
  event_id: string;
  timestamp: string;
  incident_id: string;
  event_type:
    | 'OBSERVE'
    | 'PLAN'
    | 'TOOL_CALL'
    | 'TOOL_RESULT'
    | 'EVIDENCE'
    | 'HYPOTHESIS_UPDATE'
    | 'DECISION'
    | 'ACTION'
    | 'VERIFY'
    | 'ADAPT'
    | 'OVERRIDE';
  description: string;
  tool?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  confidence?: number;
  source: string;
}

export interface Incident {
  incident_id: string;
  alert_id: string;
  status: IncidentStatus;
  severity: AlertSeverity;
  current_hypothesis: string;
  attack_outcome: AttackOutcome;
  confidence: number;
  evidence: EvidenceItem[];
  reasoning_summary: string;
  recommended_action?: string;
  response_status: ResponseStatus;
  verification_status: VerificationStatus;
  is_adapted?: boolean;
  adaptation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FirewallRule {
  rule_id: string;
  ip: string;
  action: string;
  enabled: boolean;
  reason: string;
  created_at: string;
}

export interface SandboxState {
  sandbox_status: string;
  active_firewall_blocks: FirewallRule[];
  monitored_assets_count: number;
  recent_alerts_count: number;
  active_incidents_count: number;
  timestamp: string;
  safety_guarantee: string;
}

export interface Scenario {
  scenario_id: string;
  name: string;
  description: string;
  alert_id: string;
  target_asset: string;
  expected_outcome: string;
  expected_confidence_min: number;
  recommend_block: boolean;
  demonstrates: string;
}
