import uuid
from typing import Dict, Any, List, Optional
from app.models.domain import EvidenceItem

class EvidenceManager:
    """Extracts, formats, and correlates facts into scored EvidenceItems."""

    @staticmethod
    def extract_evidence_from_result(tool_name: str, tool_result: Dict[str, Any]) -> Optional[EvidenceItem]:
        ev_id = f"EVD-{uuid.uuid4().hex[:6].upper()}"
        res = tool_result.get("result", {})

        if tool_name == "get_asset":
            hostname = res.get("hostname", "Unknown")
            os_ver = res.get("os", "Unknown")
            is_exposed = res.get("is_externally_exposed", False)
            service = res.get("service", "")
            return EvidenceItem(
                evidence_id=ev_id,
                source_tool="get_asset",
                finding=f"Host '{hostname}' runs {service} on {os_ver}. Externally exposed: {is_exposed}.",
                data=res,
                confidence_impact=15,
                supports_success=is_exposed
            )

        elif tool_name == "get_vulnerabilities":
            vulns = res.get("vulnerabilities", [])
            count = res.get("count", 0)
            if count > 0:
                cve_list = ", ".join([v.get("cve_id", "") for v in vulns[:3]])
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_vulnerabilities",
                    finding=f"Found {count} known CVE(s) matching asset ({cve_list}).",
                    data=res,
                    confidence_impact=20,
                    supports_success=True
                )
            else:
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_vulnerabilities",
                    finding="No known CVE vulnerabilities detected for host software stack.",
                    data=res,
                    confidence_impact=-15,
                    supports_success=False
                )

        elif tool_name == "get_packet_metadata":
            pkt_count = res.get("packet_count", 0)
            fp = res.get("payload_fingerprint", "")
            method = res.get("http_method", "N/A")
            size = res.get("request_size_bytes", 0)
            is_suspicious = ("ognl" in fp.lower() or "eval" in fp.lower() or "union select" in fp.lower())
            return EvidenceItem(
                evidence_id=ev_id,
                source_tool="get_packet_metadata",
                finding=f"Observed {pkt_count} packets ({size} bytes, {method}). Payload fingerprint: {fp[:90]}...",
                data=res,
                confidence_impact=20 if is_suspicious else 5,
                supports_success=is_suspicious
            )

        elif tool_name == "get_server_logs":
            logs = res.get("logs", [])
            # Search for execution logs, 200 vs 403
            status_codes = [l.get("status_code") for l in logs]
            has_200 = any(c == 200 for c in status_codes)
            has_403 = any(c == 403 for c in status_codes)
            has_unauth_db = any(l.get("event_type") == "DB_QUERY" and l.get("details", {}).get("unauthorized") for l in logs)
            has_shell = any("uid=0" in l.get("response", "") or "spawned" in l.get("response", "").lower() for l in logs)

            if has_shell or has_unauth_db:
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_server_logs",
                    finding="Server logs confirm command execution / unauthorized database access with root privileges.",
                    data=res,
                    confidence_impact=35,
                    supports_success=True
                )
            elif has_403:
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_server_logs",
                    finding="Server logs show request was dropped by perimeter filter with HTTP 403 Forbidden.",
                    data=res,
                    confidence_impact=-30,
                    supports_success=False
                )
            elif has_200:
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_server_logs",
                    finding="Server logs show HTTP 200 OK processing suspicious payload.",
                    data=res,
                    confidence_impact=20,
                    supports_success=True
                )
            else:
                return EvidenceItem(
                    evidence_id=ev_id,
                    source_tool="get_server_logs",
                    finding="Server logs show benign traffic or incomplete handshake with zero persistence.",
                    data=res,
                    confidence_impact=-10,
                    supports_success=False
                )

        elif tool_name == "get_configuration":
            waf = res.get("security_configuration", {}).get("waf_status", "UNKNOWN")
            return EvidenceItem(
                evidence_id=ev_id,
                source_tool="get_configuration",
                finding=f"Host configuration retrieved: WAF status is {waf}.",
                data=res,
                confidence_impact=10,
                supports_success=(waf != "BLOCKING_ACTIVE")
            )

        elif tool_name == "inject_new_evidence":
            finding = res.get("finding", "New telemetric evidence injected.")
            return EvidenceItem(
                evidence_id=ev_id,
                source_tool="inject_new_evidence",
                finding=finding,
                data=res,
                confidence_impact=35,
                supports_success=True
            )

        return None
