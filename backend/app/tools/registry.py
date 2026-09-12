import inspect
import logging
from typing import Dict, Any, Callable, List, Optional
from pydantic import BaseModel
from app.tools import sandbox_tools

logger = logging.getLogger("sentinelflow.tools")

class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]

class ToolRegistry:
    """Secure registry for sandboxed agent tools with strict allowlisting and failure simulation."""
    
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._tool_metadata: Dict[str, str] = {}
        self._simulated_failures: Dict[str, bool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        defaults = [
            sandbox_tools.get_alert,
            sandbox_tools.get_packet_metadata,
            sandbox_tools.get_asset,
            sandbox_tools.get_vulnerabilities,
            sandbox_tools.get_server_logs,
            sandbox_tools.get_configuration,
            sandbox_tools.get_previous_responses,
            sandbox_tools.block_ip_simulated,
            sandbox_tools.verify_block,
            sandbox_tools.get_environment_state,
            sandbox_tools.inject_new_evidence
        ]
        for fn in defaults:
            self.register_tool(fn)

    def register_tool(self, fn: Callable):
        name = fn.__name__
        self._tools[name] = fn
        self._tool_metadata[name] = fn.__doc__ or "No description provided."
        logger.info("Registered sandbox tool: %s", name)

    def is_tool_allowed(self, name: str) -> bool:
        return name in self._tools

    def get_available_tools(self) -> List[Dict[str, Any]]:
        result = []
        for name, fn in self._tools.items():
            sig = inspect.signature(fn)
            params = {}
            for p_name, p_param in sig.parameters.items():
                params[p_name] = {
                    "type": str(p_param.annotation if p_param.annotation != inspect._empty else "Any"),
                    "default": str(p_param.default) if p_param.default != inspect._empty else None
                }
            result.append({
                "name": name,
                "description": self._tool_metadata.get(name, ""),
                "parameters": params,
                "is_failing_simulated": self._simulated_failures.get(name, False)
            })
        return result

    def set_tool_failure(self, tool_name: str, should_fail: bool):
        """Allows simulation of tool failures to test agent resilience."""
        self._simulated_failures[tool_name] = should_fail
        logger.warning("Simulated failure for tool '%s' set to: %s", tool_name, should_fail)

    def get_tool_failure_status(self) -> Dict[str, bool]:
        return dict(self._simulated_failures)

    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a registered tool securely after validating allowlist and simulating failures."""
        if not self.is_tool_allowed(tool_name):
            logger.error("Security violation: Attempted call to unregistered tool '%s'", tool_name)
            return {
                "success": False,
                "error": f"Tool '{tool_name}' is not in the allowed Sandbox ToolRegistry.",
                "is_security_rejection": True
            }

        # Check if failure is simulated
        if self._simulated_failures.get(tool_name, False):
            logger.warning("Tool '%s' failed due to simulated sandbox disruption.", tool_name)
            return {
                "success": False,
                "status": "TOOL_UNAVAILABLE",
                "error": f"Simulated sandbox failure: {tool_name} is currently offline or unreachable.",
                "is_simulated_failure": True
            }

        fn = self._tools[tool_name]
        try:
            # Bind arguments to check validity
            sig = inspect.signature(fn)
            bound_args = sig.bind_partial(**arguments)
            bound_args.apply_defaults()
            
            result = await fn(**bound_args.arguments)
            return {
                "success": True,
                "tool_name": tool_name,
                "result": result
            }
        except TypeError as te:
            logger.error("Invalid arguments for tool '%s': %s", tool_name, te)
            return {
                "success": False,
                "error": f"Invalid arguments for {tool_name}: {str(te)}"
            }
        except Exception as e:
            logger.error("Execution error in tool '%s': %s", tool_name, e)
            return {
                "success": False,
                "error": f"Tool execution failed: {str(e)}"
            }

tool_registry = ToolRegistry()
