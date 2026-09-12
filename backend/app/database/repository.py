from typing import List, Optional, Dict, Any
from app.database.connection import db_manager
from app.models.domain import (
    Alert, Asset, Vulnerability, ServerLog, PacketMetadata,
    AssetConfiguration, Incident, AgentEvent, ResponseAction,
    HumanOverride, FirewallRule, AuditEvent
)

class Repository:
    """Typed repository for accessing collections."""

    @staticmethod
    def _alerts():
        return db_manager.get_collection("alerts")

    @staticmethod
    def _assets():
        return db_manager.get_collection("assets")

    @staticmethod
    def _vulnerabilities():
        return db_manager.get_collection("vulnerabilities")

    @staticmethod
    def _server_logs():
        return db_manager.get_collection("server_logs")

    @staticmethod
    def _packet_metadata():
        return db_manager.get_collection("packet_metadata")

    @staticmethod
    def _asset_configurations():
        return db_manager.get_collection("asset_configurations")

    @staticmethod
    def _incidents():
        return db_manager.get_collection("incidents")

    @staticmethod
    def _agent_events():
        return db_manager.get_collection("agent_events")

    @staticmethod
    def _response_actions():
        return db_manager.get_collection("response_actions")

    @staticmethod
    def _human_overrides():
        return db_manager.get_collection("human_overrides")

    @staticmethod
    def _firewall_rules():
        return db_manager.get_collection("firewall_rules")

    @staticmethod
    def _audit_events():
        return db_manager.get_collection("audit_events")

    # --- Alerts ---
    @classmethod
    async def get_alert(cls, alert_id: str) -> Optional[Alert]:
        doc = await cls._alerts().find_one({"alert_id": alert_id})
        return Alert(**doc) if doc else None

    @classmethod
    async def list_alerts(cls, limit: int = 50) -> List[Alert]:
        cursor = await cls._alerts().find({}, limit=limit)
        docs = await cursor.to_list(limit)
        return [Alert(**d) for d in docs]

    @classmethod
    async def save_alert(cls, alert: Alert):
        await cls._alerts().update_one({"alert_id": alert.alert_id}, {"$set": alert.model_dump()}, upsert=True)

    # --- Assets ---
    @classmethod
    async def get_asset(cls, asset_id_or_ip: str) -> Optional[Asset]:
        doc = await cls._assets().find_one({"$or": [{"asset_id": asset_id_or_ip}, {"ip": asset_id_or_ip}]})
        return Asset(**doc) if doc else None

    @classmethod
    async def list_assets(cls) -> List[Asset]:
        cursor = await cls._assets().find({})
        docs = await cursor.to_list(100)
        return [Asset(**d) for d in docs]

    @classmethod
    async def save_asset(cls, asset: Asset):
        await cls._assets().update_one({"asset_id": asset.asset_id}, {"$set": asset.model_dump()}, upsert=True)

    # --- Vulnerabilities ---
    @classmethod
    async def get_vulnerabilities_for_asset(cls, asset_id: str) -> List[Vulnerability]:
        cursor = await cls._vulnerabilities().find({"affected_assets": {"$in": [asset_id]}})
        docs = await cursor.to_list(50)
        return [Vulnerability(**d) for d in docs]

    @classmethod
    async def save_vulnerability(cls, vuln: Vulnerability):
        await cls._vulnerabilities().update_one({"cve_id": vuln.cve_id}, {"$set": vuln.model_dump()}, upsert=True)

    # --- Server Logs ---
    @classmethod
    async def get_logs_for_asset(cls, asset_id: str, limit: int = 50) -> List[ServerLog]:
        cursor = await cls._server_logs().find({"asset_id": asset_id}, limit=limit)
        docs = await cursor.to_list(limit)
        return [ServerLog(**d) for d in docs]

    @classmethod
    async def insert_log(cls, log: ServerLog):
        await cls._server_logs().insert_one(log.model_dump())

    # --- Packet Metadata ---
    @classmethod
    async def get_packet_metadata(cls, alert_id: str) -> Optional[PacketMetadata]:
        doc = await cls._packet_metadata().find_one({"alert_id": alert_id})
        return PacketMetadata(**doc) if doc else None

    @classmethod
    async def save_packet_metadata(cls, pm: PacketMetadata):
        await cls._packet_metadata().update_one({"alert_id": pm.alert_id}, {"$set": pm.model_dump()}, upsert=True)

    # --- Configuration ---
    @classmethod
    async def get_configuration(cls, asset_id: str) -> Optional[AssetConfiguration]:
        doc = await cls._asset_configurations().find_one({"asset_id": asset_id})
        return AssetConfiguration(**doc) if doc else None

    @classmethod
    async def save_configuration(cls, cfg: AssetConfiguration):
        await cls._asset_configurations().update_one({"asset_id": cfg.asset_id}, {"$set": cfg.model_dump()}, upsert=True)

    # --- Incidents ---
    @classmethod
    async def get_incident(cls, incident_id: str) -> Optional[Incident]:
        doc = await cls._incidents().find_one({"incident_id": incident_id})
        return Incident(**doc) if doc else None

    @classmethod
    async def list_incidents(cls, limit: int = 50) -> List[Incident]:
        cursor = await cls._incidents().find({}, sort=[("created_at", -1)], limit=limit)
        docs = await cursor.to_list(limit)
        return [Incident(**d) for d in docs]

    @classmethod
    async def save_incident(cls, incident: Incident):
        await cls._incidents().update_one({"incident_id": incident.incident_id}, {"$set": incident.model_dump()}, upsert=True)

    # --- Agent Events ---
    @classmethod
    async def record_event(cls, event: AgentEvent):
        await cls._agent_events().insert_one(event.model_dump())

    @classmethod
    async def get_events_for_incident(cls, incident_id: str) -> List[AgentEvent]:
        cursor = await cls._agent_events().find({"incident_id": incident_id}, sort=[("timestamp", 1)])
        docs = await cursor.to_list(500)
        return [AgentEvent(**d) for d in docs]

    # --- Response Actions ---
    @classmethod
    async def record_response_action(cls, action: ResponseAction):
        await cls._response_actions().update_one({"action_id": action.action_id}, {"$set": action.model_dump()}, upsert=True)

    @classmethod
    async def get_response_actions(cls, incident_id: Optional[str] = None) -> List[ResponseAction]:
        query = {"incident_id": incident_id} if incident_id else {}
        cursor = await cls._response_actions().find(query, sort=[("timestamp", -1)])
        docs = await cursor.to_list(100)
        return [ResponseAction(**d) for d in docs]

    # --- Human Overrides ---
    @classmethod
    async def record_human_override(cls, override: HumanOverride):
        await cls._human_overrides().insert_one(override.model_dump())

    @classmethod
    async def get_overrides_for_incident(cls, incident_id: str) -> List[HumanOverride]:
        cursor = await cls._human_overrides().find({"incident_id": incident_id})
        docs = await cursor.to_list(50)
        return [HumanOverride(**d) for d in docs]

    # --- Firewall Rules ---
    @classmethod
    async def add_firewall_rule(cls, rule: FirewallRule):
        await cls._firewall_rules().update_one({"ip": rule.ip}, {"$set": rule.model_dump()}, upsert=True)

    @classmethod
    async def get_firewall_rule(cls, ip: str) -> Optional[FirewallRule]:
        doc = await cls._firewall_rules().find_one({"ip": ip, "enabled": True})
        return FirewallRule(**doc) if doc else None

    @classmethod
    async def list_firewall_rules(cls) -> List[FirewallRule]:
        cursor = await cls._firewall_rules().find({"enabled": True})
        docs = await cursor.to_list(100)
        return [FirewallRule(**d) for d in docs]

    @classmethod
    async def remove_firewall_rule(cls, ip: str):
        await cls._firewall_rules().update_one({"ip": ip}, {"$set": {"enabled": False}})

    # --- Audit Log ---
    @classmethod
    async def log_audit(cls, category: str, action: str, actor: str, details: Dict[str, Any]):
        evt = AuditEvent(category=category, action=action, actor=actor, details=details)
        await cls._audit_events().insert_one(evt.model_dump())
