from typing import Dict, Any, List
from datetime import datetime
from app.database.repository import Repository
from app.models.domain import FirewallRule

class SandboxManager:
    """Manages the synthetic security sandbox state."""

    @staticmethod
    async def get_state() -> Dict[str, Any]:
        rules = await Repository.list_firewall_rules()
        assets = await Repository.list_assets()
        alerts = await Repository.list_alerts(limit=10)
        incidents = await Repository.list_incidents(limit=10)
        
        return {
            "sandbox_status": "ACTIVE_ISOLATED",
            "active_firewall_blocks": [r.model_dump() for r in rules],
            "monitored_assets_count": len(assets),
            "recent_alerts_count": len(alerts),
            "active_incidents_count": len(incidents),
            "timestamp": datetime.utcnow().isoformat(),
            "safety_guarantee": "All actions are strictly synthetic. No real OS firewall or network modifications occur."
        }

    @staticmethod
    async def reset() -> Dict[str, Any]:
        from app.simulation.seed import seed_database
        await seed_database()
        return {"status": "RESET_SUCCESSFUL", "message": "Synthetic sandbox restored to baseline clean state."}
