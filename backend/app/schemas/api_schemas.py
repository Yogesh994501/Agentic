from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.models.domain import AttackOutcome, IncidentStatus, AlertSeverity

class CreateIncidentRequest(BaseModel):
    alert_id: str

class InvestigateRequest(BaseModel):
    max_steps: Optional[int] = 8

class InjectEvidenceRequest(BaseModel):
    evidence_id: Optional[str] = None
    finding: str
    data: Dict[str, Any] = {}
    confidence_impact: int = 25
    supports_success: bool = True

class HumanOverrideRequest(BaseModel):
    override_decision: str  # "APPROVE_RESPONSE" | "REJECT_RESPONSE" | "FORCE_BLOCK" | "RELEASE_BLOCK" | "MARK_FALSE_POSITIVE" | "REOPEN"
    reason: str
    operator: str = "SOC Analyst"

class ToolFailureToggleRequest(BaseModel):
    tool_name: str
    should_fail: bool

class ScenarioTriggerRequest(BaseModel):
    scenario_id: str
    auto_investigate: bool = True
