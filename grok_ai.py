import os
import aiohttp

GROK_API_URL = "https://api.x.ai/v1/chat/completions"


class GrokError(Exception):
    """Raised when the xAI API call fails, so errors never get saved as prompts."""


async def generate_grok_prompt(topic: str) -> str:
    # Read at call time so values from .env are always picked up.
    api_key = os.getenv("GROK_API_KEY")
    if not api_key:
        raise GrokError("GROK_API_KEY is not set on the server")
    model = os.getenv("GROK_MODEL", "grok-3")  # grok-beta is retired; override via GROK_MODEL

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an elite prompt engineer. Write a clean, highly effective system prompt for Claude based on the user's topic."},
            {"role": "user", "content": f"Create a prompt for: {topic}"},
        ],
        "temperature": 0.7,
    }

    timeout = aiohttp.ClientTimeout(total=60)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(GROK_API_URL, json=payload, headers=headers) as response:
                if response.status != 200:
                    raise GrokError(f"xAI API error ({response.status}): {(await response.text())[:300]}")
                data = await response.json()
                return data["choices"][0]["message"]["content"]
    except GrokError:
        raise
    except (aiohttp.ClientError, KeyError, IndexError, TimeoutError) as e:
        raise GrokError(f"Grok request failed: {e}")
