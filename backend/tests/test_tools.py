import asyncio
import pytest
from app.simulation.seed import seed_database
from app.tools.sandbox_tools import (
    get_alert, get_asset, get_vulnerabilities, get_packet_metadata,
    get_server_logs, get_configuration, block_ip_simulated, verify_block,
    get_environment_state
)
from app.tools.registry import tool_registry

@pytest.fixture(autouse=True)
def setup_sandbox():
    asyncio.run(seed_database())

@pytest.mark.asyncio
async def test_get_alert():
    res = await get_alert("ALT-1001")
    assert "alert_id" in res
    assert res["alert_id"] == "ALT-1001"
    assert res["severity"] == "HIGH"
    assert res["destination_ip"] == "10.0.10.15"

@pytest.mark.asyncio
async def test_get_asset():
    res = await get_asset("Server-07")
    assert res["asset_id"] == "Server-07"
    assert res["ip"] == "10.0.10.15"
    assert "Tomcat" in res["service"]

@pytest.mark.asyncio
async def test_get_vulnerabilities():
    res = await get_vulnerabilities("Server-07")
    assert res["count"] >= 1
    cves = [v["cve_id"] for v in res["vulnerabilities"]]
    assert "CVE-2023-50164" in cves

@pytest.mark.asyncio
async def test_get_packet_metadata():
    res = await get_packet_metadata("ALT-1001")
    assert res["alert_id"] == "ALT-1001"
    assert res["http_method"] == "POST"
    assert "ognl" in res["payload_fingerprint"].lower()

@pytest.mark.asyncio
async def test_get_server_logs():
    res = await get_server_logs("Server-07")
    assert res["count"] >= 1
    has_200 = any(l["status_code"] == 200 for l in res["logs"])
    assert has_200 is True

@pytest.mark.asyncio
async def test_simulated_firewall_block_and_verify():
    test_ip = "198.51.100.23"
    # Initially not blocked
    v_before = await verify_block(test_ip)
    assert v_before["blocked"] is False

    # Block simulated
    block_res = await block_ip_simulated(test_ip, "Automated test containment")
    assert block_res["success"] is True
    assert block_res["simulated"] is True

    # Verify block
    v_after = await verify_block(test_ip)
    assert v_after["blocked"] is True
    assert v_after["status"] == "VERIFICATION_PASSED"

@pytest.mark.asyncio
async def test_tool_registry_security_and_failure_toggle():
    # Security rejection of unregistered tool
    rejected = await tool_registry.execute("malicious_unregistered_tool", {})
    assert rejected["success"] is False
    assert rejected.get("is_security_rejection") is True

    # Valid execution
    valid = await tool_registry.execute("get_alert", {"alert_id": "ALT-1001"})
    assert valid["success"] is True

    # Simulated failure toggle
    tool_registry.set_tool_failure("get_server_logs", True)
    failing = await tool_registry.execute("get_server_logs", {"asset_id": "Server-07"})
    assert failing["success"] is False
    assert failing.get("is_simulated_failure") is True

    # Reset failure toggle
    tool_registry.set_tool_failure("get_server_logs", False)
    restored = await tool_registry.execute("get_server_logs", {"asset_id": "Server-07"})
    assert restored["success"] is True
