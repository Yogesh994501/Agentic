from app.config import settings
from app.llm.base import LLMProvider, LLMStepDecision
from app.llm.mock import MockProvider
from app.llm.gemini import GeminiProvider
from app.llm.openai import OpenAIProvider

def get_llm_provider() -> LLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider()
    elif provider_name == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider()
    return MockProvider()
