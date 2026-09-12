import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.simulation.seed import seed_database

@pytest.fixture(autouse=True)
def setup_sandbox():
    asyncio.run(seed_database())

@pytest.mark.asyncio
async def test_api_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["application"] == "SentinelFlow"

@pytest.mark.asyncio
async def test_api_list_scenarios_and_launch():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List scenarios
        resp = await client.get("/api/sandbox/scenarios")
        assert resp.status_code == 200
        scenarios = resp.json()
        assert "scenario_1" in scenarios

        # Launch Scenario 1
        launch_resp = await client.post("/api/sandbox/scenario/scenario_1")
        assert launch_resp.status_code == 200
        launch_data = launch_resp.json()
        assert launch_data["status"] == "SCENARIO_LAUNCHED"
        assert "incident_id" in launch_data

@pytest.mark.asyncio
async def test_api_get_sandbox_state():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/sandbox/state")
        assert resp.status_code == 200
        data = resp.json()
        assert data["sandbox_status"] == "ACTIVE_ISOLATED"
        assert "monitored_assets_count" in data

@pytest.mark.asyncio
async def test_api_tools_list_and_failure_toggle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tools_resp = await client.get("/api/tools")
        assert tools_resp.status_code == 200
        tools = tools_resp.json()
        tool_names = [t["name"] for t in tools]
        assert "get_alert" in tool_names
        assert "block_ip_simulated" in tool_names

        # Toggle failure
        toggle_resp = await client.post("/api/sandbox/tool-failure", json={
            "tool_name": "get_packet_metadata",
            "should_fail": True
        })
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["is_failing_simulated"] is True
