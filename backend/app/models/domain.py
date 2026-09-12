from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, Enum):
    NEW = "NEW"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"

class AttackOutcome(str, Enum):
    UNDETERMINED = "UNDETERMINED"
    ATTACK_SUCCEEDED = "ATTACK_SUCCEEDED"
    ATTACK_FAILED = "ATTACK_FAILED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

class ResponseStatus(str, Enum):
    NONE = "NONE"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"

class VerificationStatus(str, Enum):
    NOT_VERIFIED = "NOT_VERIFIED"
    PASSED = "PASSED"
    FAILED = "FAILED"

# --- Models matching MongoDB Collections ---

class Alert(BaseModel):
    alert_id: str
    source: str = "SURICATA"  # SURICATA | SNORT | NIDS
    timestamp: str
    signature: str
    severity: AlertSeverity
    source_ip: str
    destination_ip: str
    destination_port: int
    protocol: str = "TCP"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Asset(BaseModel):
    asset_id: str
    hostname: str
    ip: str
    os: str
    service: str
    service_version: str
    environment: str = "production"
    owner: str = "SecOps"
    criticality: str = "HIGH"  # LOW | MEDIUM | HIGH | CRITICAL
    network_zone: str = "DMZ"  # DMZ | INTERNAL | SECURE_DATA
    is_externally_exposed: bool = True

class Vulnerability(BaseModel):
    cve_id: str
    affected_product: str
    affected_version: str
    cvss: float
    exploitability: str = "HIGH"  # LOW | MEDIUM | HIGH
    description: str
    affected_assets: List[str] = Field(default_factory=list)

class ServerLog(BaseModel):
    log_id: str
    timestamp: str
    asset_id: str
    source_ip: str
    request: str
    endpoint: str
    status_code: int
    response: str
    user: str = "anonymous"
    event_type: str = "HTTP_REQUEST"  # HTTP_REQUEST | AUTH_ATTEMPT | SYSTEM_CALL | DB_QUERY
    details: Dict[str, Any] = Field(default_factory=dict)

class PacketMetadata(BaseModel):
    packet_id: str
    alert_id: str
    packet_count: int
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    request_size_bytes: int
    http_method: Optional[str] = None
    payload_fingerprint: str
    connection_duration_ms: int
    flags: List[str] = Field(default_factory=list)

class AssetConfiguration(BaseModel):
    asset_id: str
    exposed_services: List[str]
    authentication_state: str
    security_configuration: Dict[str, Any]
    simulated_firewall_state: Dict[str, Any]
    application_configuration: Dict[str, Any]

class EvidenceItem(BaseModel):
    evidence_id: str
    source_tool: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    finding: str
    data: Dict[str, Any] = Field(default_factory=dict)
    confidence_impact: int = 0  # e.g. +20, -15
    supports_success: bool = True

class AgentEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"EVT-{datetime.utcnow().strftime('%H%M%S%f')[:10]}")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    incident_id: str
    event_type: str  # OBSERVE | PLAN | TOOL_CALL | TOOL_RESULT | HYPOTHESIS_UPDATE | DECISION | ACTION | VERIFY | ADAPT | OVERRIDE
    description: str
    tool: Optional[str] = None
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    confidence: Optional[int] = None
    source: str = "SentinelFlowAgent"

class ResponseAction(BaseModel):
    action_id: str
    incident_id: str
    action_type: str = "FIREWALL_BLOCK_IP"
    target: str  # IP address or domain
    reason: str
    simulated: bool = True
    status: ResponseStatus = ResponseStatus.PENDING_APPROVAL
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    verification: VerificationStatus = VerificationStatus.NOT_VERIFIED
    details: Dict[str, Any] = Field(default_factory=dict)

class HumanOverride(BaseModel):
    override_id: str = Field(default_factory=lambda: f"OVR-{datetime.utcnow().strftime('%H%M%S%f')[:10]}")
    incident_id: str
    previous_decision: AttackOutcome
    override_decision: AttackOutcome
    reason: str
    operator: str = "Security Analyst"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class FirewallRule(BaseModel):
    rule_id: str
    ip: str
    action: str = "BLOCK"  # BLOCK | ALLOW
    enabled: bool = True
    reason: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class Incident(BaseModel):
    incident_id: str
    alert_id: str
    status: IncidentStatus = IncidentStatus.NEW
    severity: AlertSeverity = AlertSeverity.MEDIUM
    current_hypothesis: str = "Initial alert under investigation."
    attack_outcome: AttackOutcome = AttackOutcome.UNDETERMINED
    confidence: int = 0  # 0 - 100
    evidence: List[EvidenceItem] = Field(default_factory=list)
    reasoning_summary: str = "Investigation initialized."
    recommended_action: Optional[str] = None
    response_status: ResponseStatus = ResponseStatus.NONE
    verification_status: VerificationStatus = VerificationStatus.NOT_VERIFIED
    is_adapted: bool = False
    adaptation_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AuditEvent(BaseModel):
    audit_id: str = Field(default_factory=lambda: f"AUD-{datetime.utcnow().strftime('%H%M%S%f')[:10]}")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    category: str
    action: str
    actor: str
    details: Dict[str, Any]
