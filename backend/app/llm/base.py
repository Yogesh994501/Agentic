from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class LLMStepDecision(BaseModel):
    assessment: str = Field(description="One of: success | failure | uncertain | investigating")
    confidence: int = Field(ge=0, le=100, description="Confidence score from 0 to 100")
    reason: str = Field(description="Explanation of current hypothesis, evidence gap, or final conclusion")
    hypothesis: Optional[str] = Field(default=None, description="Working hypothesis about the attack state")
    evidence_ids: List[str] = Field(default_factory=list, description="IDs of evidence that support this deduction")
    missing_evidence: List[str] = Field(default_factory=list, description="Identified gaps requiring tool invocation")
    next_tool: Optional[str] = Field(default=None, description="Name of the next tool to invoke")
    next_tool_arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments for the next tool")
    response_recommended: bool = Field(default=False, description="Whether containment action is justified")
    recommended_target: Optional[str] = Field(default=None, description="Target IP or entity to contain")

class LLMProvider(ABC):
    @abstractmethod
    async def decide_next_step(
        self,
        incident_id: str,
        alert_data: Dict[str, Any],
        accumulated_evidence: List[Dict[str, Any]],
        working_hypothesis: str,
        current_confidence: int,
        executed_tools: List[str],
        failed_tools: List[str]
    ) -> LLMStepDecision:
        """Determines the next action, hypothesis update, or final verdict."""
        pass
