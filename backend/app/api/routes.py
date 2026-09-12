import asyncio
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from sse_starlette.sse import EventSourceResponse
from app.config import settings
from app.database.repository import Repository
from app.agents.orchestrator import orchestrator
from app.tools.registry import tool_registry
from app.sandbox.state import SandboxManager
from app.simulation.scenarios import SCENARIOS
from app.api.sse import event_bus
from app.schemas.api_schemas import (
    CreateIncidentRequest, InvestigateRequest, InjectEvidenceRequest,
    HumanOverrideRequest, ToolFailureToggleRequest, ScenarioTriggerRequest
)

router = APIRouter()

# --- Health & Diagnostics ---
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
        "environment": "SANDBOX_EDUCATIONAL_SIMULATION",
        "demo_mode": settings.DEMO_MODE,
        "llm_provider": settings.LLM_PROVIDER
    }

# --- Incidents ---
@router.post("/incidents")
async def create_incident(req: CreateIncidentRequest):
    try:
        incident = await orchestrator.create_incident(req.alert_id)
        return incident.model_dump()
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/incidents")
async def list_incidents(limit: int = 50):
    incidents = await Repository.list_incidents(limit=limit)
    return [inc.model_dump() for inc in incidents]

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    inc = await Repository.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return inc.model_dump()

@router.post("/incidents/{incident_id}/investigate")
async def start_investigation(incident_id: str, req: InvestigateRequest, background_tasks: BackgroundTasks):
    inc = await Repository.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    
    # Run async in background or awaitable
    background_tasks.add_task(orchestrator.run_investigation, incident_id, req.max_steps)
    return {"status": "INVESTIGATION_STARTED", "incident_id": incident_id}

@router.get("/incidents/{incident_id}/events")
async def get_incident_events(incident_id: str):
    events = await Repository.get_events_for_incident(incident_id)
    return [e.model_dump() for e in events]

@router.get("/incidents/{incident_id}/evidence")
async def get_incident_evidence(incident_id: str):
    inc = await Repository.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return [e.model_dump() for e in inc.evidence]

@router.post("/incidents/{incident_id}/response")
async def execute_manual_response(incident_id: str):
    inc = await Repository.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    alert = await Repository.get_alert(inc.alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {inc.alert_id} not found.")
    
    result = await orchestrator.apply_human_override(
        incident_id=incident_id,
        override_decision="FORCE_BLOCK",
        reason="Operator approved simulated containment response via SOC console.",
        operator="SOC Analyst"
    )
    return result.model_dump()

@router.post("/incidents/{incident_id}/override")
async def human_override(incident_id: str, req: HumanOverrideRequest):
    try:
        updated = await orchestrator.apply_human_override(
            incident_id=incident_id,
            override_decision=req.override_decision,
            reason=req.reason,
            operator=req.operator
        )
        return updated.model_dump()
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.post("/incidents/{incident_id}/inject-evidence")
async def inject_evidence(incident_id: str, req: InjectEvidenceRequest, background_tasks: BackgroundTasks):
    try:
        evidence_dict = req.model_dump()
        # Trigger dynamic adaptation in background so UI receives real-time stream!
        background_tasks.add_task(orchestrator.inject_evidence_and_reassess, incident_id, evidence_dict)
        return {"status": "EVIDENCE_INJECTED_REASSESSMENT_LAUNCHED", "incident_id": incident_id}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

# --- Server-Sent Events (SSE) Live Event Stream ---
@router.get("/events/stream")
async def live_event_stream(request: Request):
    """Server-Sent Events endpoint streaming live AgentEvents to the frontend."""
    queue = event_bus.subscribe()

    async def event_generator():
        try:
            # Send initial keepalive
            yield {"event": "connected", "data": json.dumps({"status": "LIVE_STREAM_ACTIVE"})}
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {"event": "agent_event", "data": json.dumps(event_data)}
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield {"event": "ping", "data": "keepalive"}
        finally:
            event_bus.unsubscribe(queue)

    return EventSourceResponse(event_generator())

# --- Sandbox & Simulation Controls ---
@router.get("/sandbox/state")
async def get_sandbox_state():
    return await SandboxManager.get_state()

@router.post("/sandbox/reset")
async def reset_sandbox():
    return await SandboxManager.reset()

@router.get("/sandbox/scenarios")
async def list_scenarios():
    return SCENARIOS

@router.post("/sandbox/scenario/{scenario_id}")
async def launch_scenario(scenario_id: str, background_tasks: BackgroundTasks):
    if scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found.")
    
    scenario = SCENARIOS[scenario_id]
    alert_id = scenario["alert_id"]
    
    incident = await orchestrator.create_incident(alert_id)
    background_tasks.add_task(orchestrator.run_investigation, incident.incident_id)
    
    return {
        "status": "SCENARIO_LAUNCHED",
        "scenario": scenario,
        "incident_id": incident.incident_id
    }

@router.post("/sandbox/tool-failure")
async def toggle_tool_failure(req: ToolFailureToggleRequest):
    tool_registry.set_tool_failure(req.tool_name, req.should_fail)
    return {
        "tool_name": req.tool_name,
        "is_failing_simulated": req.should_fail,
        "active_failures": tool_registry.get_tool_failure_status()
    }

# --- Telemetry & Catalogs ---
@router.get("/tools")
async def list_tools():
    return tool_registry.get_available_tools()

@router.get("/alerts")
async def list_alerts():
    alerts = await Repository.list_alerts(limit=50)
    return [a.model_dump() for a in alerts]

@router.get("/assets")
async def list_assets():
    assets = await Repository.list_assets()
    return [a.model_dump() for a in assets]
