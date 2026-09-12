from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import db_manager
from app.simulation.seed import seed_database
from app.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinelflow.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SentinelFlow Autonomous SOC Engine...")
    await db_manager.connect()
    # Check if database needs initial seeding
    alerts_col = db_manager.get_collection("alerts")
    count = await alerts_col.count_documents({})
    if count == 0:
        logger.info("Empty database detected. Seeding initial synthetic scenarios...")
        await seed_database()
    logger.info("SentinelFlow ready for live investigation.")
    yield
    logger.info("Shutting down SentinelFlow engine...")
    await db_manager.disconnect()

app = FastAPI(
    title="SentinelFlow Autonomous SOC Agent",
    description="Autonomous SOC investigation, evidence correlation, and simulated response platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js / Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "SentinelFlow Autonomous SOC Agent",
        "version": "1.0.0",
        "status": "ONLINE",
        "environment": "SYNTHETIC_SANDBOX",
        "api_docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
