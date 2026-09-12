import asyncio
import json
import logging
from typing import Dict, List, Any
from app.models.domain import AgentEvent

logger = logging.getLogger("sentinelflow.sse")

class EventBus:
    """In-memory event bus broadcasting AgentEvents to connected SSE clients."""
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self._subscribers.append(q)
        logger.info("New SSE client subscribed. Total clients: %d", len(self._subscribers))
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)
            logger.info("SSE client unsubscribed. Remaining clients: %d", len(self._subscribers))

    async def broadcast(self, event: AgentEvent):
        payload = event.model_dump()
        dead = []
        for q in self._subscribers:
            try:
                q.put_nowait(payload)
            except Exception:
                dead.append(q)
        for d in dead:
            self.unsubscribe(d)

event_bus = EventBus()
