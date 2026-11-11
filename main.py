from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from grok_ai import generate_grok_prompt

app = FastAPI(title="Clauree Wispbyte Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database = {
    "prompts": [
        {"id": "1", "title": "Grok Refactor", "content": "Analyze code for runtime efficiency and security:", "author": "System"}
    ]
}

class PromptRequest(BaseModel):
    title: str
    topic_or_content: str

VALID_API_KEY = os.getenv("WISPBYTE_API_KEY", "wispbyte_secret_live_key")

def verify_auth(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    if token != VALID_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return token

@app.get("/v1/prompts")
def get_prompts():
    return {"success": True, "data": database["prompts"]}

@app.post("/v1/prompts/generate-grok")
async def create_grok_prompt(req: PromptRequest, token: str = Depends(verify_auth)):
    optimized_content = await generate_grok_prompt(req.topic_or_content)
    
    new_item = {
        "id": str(len(database["prompts"]) + 1),
        "title": req.title,
        "content": optimized_content,
        "author": "Grok AI Engine"
    }
    database["prompts"].append(new_item)
    return {"success": True, "data": new_item}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
