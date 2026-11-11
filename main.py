import os
import secrets
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()  # must run before anything reads os.getenv

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from grok_ai import generate_grok_prompt, GrokError

app = FastAPI(title="Clauree Wispbyte Backend", version="1.0.1")

# Auth uses a Bearer header (not cookies), so credentials must be off when origins is "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

database = {
    "prompts": [
        {"id": "1", "title": "Grok Refactor", "content": "Analyze code for runtime efficiency and security:", "author": "System"}
    ]
}


class PromptRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    topic_or_content: str = Field(min_length=1, max_length=8000)


class QueueBatchRequest(BaseModel):
    tasks: List[str] = Field(min_length=1, max_length=20)


def verify_auth(authorization: Optional[str] = Header(None)):
    valid_key = os.getenv("WISPBYTE_API_KEY")
    if not valid_key:
        raise HTTPException(status_code=500, detail="WISPBYTE_API_KEY is not set on the server")
    parts = (authorization or "").split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not secrets.compare_digest(parts[1].strip(), valid_key):
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return parts[1]


@app.get("/")
def read_root():
    return {"status": "online", "service": "Clauree Wispbyte Backend"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/v1/prompts")
def get_prompts():
    return {"success": True, "data": database["prompts"]}


@app.post("/v1/prompts/generate-grok")
async def create_grok_prompt(req: PromptRequest, token: str = Depends(verify_auth)):
    try:
        optimized_content = await generate_grok_prompt(req.topic_or_content)
    except GrokError as e:
        raise HTTPException(status_code=502, detail=str(e))

    new_item = {
        "id": str(len(database["prompts"]) + 1),
        "title": req.title,
        "content": optimized_content,
        "author": "Grok AI Engine",
    }
    database["prompts"].append(new_item)
    return {"success": True, "data": new_item}


@app.post("/v1/queue/batch")
async def process_queue_batch(req: QueueBatchRequest, token: str = Depends(verify_auth)):
    results = []
    for task in req.tasks:
        try:
            results.append({"task": task, "result": await generate_grok_prompt(task), "error": None})
        except GrokError as e:
            results.append({"task": task, "result": None, "error": str(e)})
    return {"success": True, "processed": len(results), "results": results}


if __name__ == "__main__":
    import uvicorn

    # Wispbyte gives your server one assigned port; bind to it (set PORT in .env if it isn't injected).
    port = int(os.getenv("SERVER_PORT") or os.getenv("PORT") or 8000)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

# UPDATED
