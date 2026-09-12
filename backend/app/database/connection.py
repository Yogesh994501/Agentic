import logging
import asyncio
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("sentinelflow.db")

class InMemoryCollection:
    """Async MongoDB collection simulator for demo resilience without external daemon."""
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        for doc in self.docs:
            if self._matches(doc, query):
                return dict(doc)
        return None

    async def find(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List] = None, limit: Optional[int] = None):
        query = query or {}
        matches = [dict(d) for d in self.docs if self._matches(d, query)]
        if sort:
            for key, direction in reversed(sort):
                matches.sort(key=lambda x: x.get(key, ""), reverse=(direction < 0))
        if limit is not None:
            matches = matches[:limit]
        
        class AsyncCursor:
            def __init__(self, items):
                self.items = items
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
            async def to_list(self, length: Optional[int] = None):
                if length is None:
                    return list(self.items)
                return list(self.items[:length])
        
        return AsyncCursor(matches)

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        self.docs.append(doc_copy)
        class InsertResult:
            inserted_id = doc_copy.get("_id", "mock_id")
        return InsertResult()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        for d in docs:
            self.docs.append(dict(d))
        class InsertManyResult:
            inserted_ids = [d.get("_id", "mock_id") for d in docs]
        return InsertManyResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_vals = update.get("$set", update)
        for doc in self.docs:
            if self._matches(doc, query):
                doc.update(set_vals)
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        if upsert:
            new_doc = {**query, **set_vals}
            self.docs.append(new_doc)
            class UpsertResult:
                matched_count = 0
                modified_count = 1
                upserted_id = new_doc.get("_id", "mock_id")
            return UpsertResult()
        class NoUpdateResult:
            matched_count = 0
            modified_count = 0
        return NoUpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for idx, doc in enumerate(self.docs):
            if self._matches(doc, query):
                del self.docs[idx]
                class DelResult:
                    deleted_count = 1
                return DelResult()
        class NoDelResult:
            deleted_count = 0
        return NoDelResult()

    async def delete_many(self, query: Dict[str, Any]):
        initial_len = len(self.docs)
        self.docs = [d for d in self.docs if not self._matches(d, query)]
        deleted = initial_len - len(self.docs)
        class DelManyResult:
            deleted_count = deleted
        return DelManyResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for d in self.docs if self._matches(d, query))

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not any(self._matches(doc, subq) for subq in v):
                    return False
            elif isinstance(v, dict):
                if "$in" in v:
                    val = doc.get(k)
                    if isinstance(val, list):
                        if not any(x in v["$in"] for x in val):
                            return False
                    elif val not in v["$in"]:
                        return False
                elif "$regex" in v:
                    import re
                    pattern = v["$regex"]
                    flags = re.IGNORECASE if v.get("$options") == "i" else 0
                    if not re.search(pattern, str(doc.get(k, "")), flags):
                        return False
            elif doc.get(k) != v:
                return False
        return True


class DatabaseManager:
    """Manages connection to real MongoDB or resilient in-memory simulator."""
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Any = None
        self.is_connected_to_mongo: bool = False
        self._in_memory_collections: Dict[str, InMemoryCollection] = {}

    def get_collection(self, name: str):
        if self.is_connected_to_mongo and self.db is not None:
            return self.db[name]
        if name not in self._in_memory_collections:
            self._in_memory_collections[name] = InMemoryCollection(name)
        return self._in_memory_collections[name]

    async def connect(self):
        try:
            # Try to connect to real MongoDB with 1.5s timeout
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Test ping
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_connected_to_mongo = True
            logger.info("Connected to MongoDB at %s", settings.MONGODB_URL)
        except Exception as e:
            self.is_connected_to_mongo = False
            self.client = None
            logger.warning("MongoDB unavailable (%s). Initializing resilient In-Memory Sandbox Database.", e)

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    def reset_in_memory(self):
        self._in_memory_collections.clear()

db_manager = DatabaseManager()

def get_db_manager() -> DatabaseManager:
    return db_manager
