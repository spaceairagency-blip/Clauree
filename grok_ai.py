import os
import aiohttp

GROK_API_KEY = os.getenv("GROK_API_KEY", "your_grok_api_key_here")
GROK_API_URL = "https://api.x.ai/v1/chat/completions"

async def generate_grok_prompt(topic: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "grok-beta",
        "messages": [
            {"role": "system", "content": "You are an elite prompt engineer. Write a clean, highly effective system prompt for Claude based on the user's topic."},
            {"role": "user", "content": f"Create a prompt for: {topic}"}
        ],
        "temperature": 0.7
    }

    async import aiohttp
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(GROK_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data["choices"]["message"]["content"]
                else:
                    return f"Fallback: Structured engineering template for {topic}."
        except Exception:
            return f"Act as an expert developer. Thoroughly evaluate and optimize code/architecture regarding: {topic}"
