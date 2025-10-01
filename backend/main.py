from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graphiti_core import Graphiti
import os
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime
from typing import Optional
import asyncio

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Graphiti with Neo4j
graphiti = Graphiti(
    os.getenv("NEO4J_URI", "bolt://localhost:7687"),
    os.getenv("NEO4J_USER", "neo4j"),
    os.getenv("NEO4J_PASSWORD", "Kashkarian_1228")
)

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = None
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    response: str
    context_used: list = []


@app.get("/")
async def root():
    return {"status": "COSE AI Backend Running with Graphiti", "version": "2.0.0"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 1. Search knowledge graph with Graphiti for relevant context
        search_results = await graphiti.search(
            query=request.message,
            num_results=5
        )

        # Extract facts and context from search results
        context_items = []
        context_text = ""

        if search_results:
            for result in search_results:
                fact = getattr(result, 'fact', None) or getattr(result, 'content', str(result))
                score = getattr(result, 'score', 0)

                context_items.append({
                    "content": fact,
                    "score": score
                })
                context_text += f"- {fact}\n"

        # 2. Build prompt with extracted knowledge
        system_prompt = f"""You are COSE AI, an expert assistant for Revenue Cycle Management (RCM).
You help healthcare providers optimize their revenue cycles through AI-powered solutions.

Relevant knowledge from graph database:
{context_text if context_text else "No previous context found."}

Use this context to provide accurate, helpful responses about RCM topics."""

        # 3. Send to OpenAI with context
        if client:
            completion = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message}
                ],
                max_tokens=1024
            )
            response_text = completion.choices[0].message.content
        else:
            # Fallback if no API key
            response_text = f"I'm COSE AI, your RCM assistant. (Note: OpenAI API key not configured - using demo mode). You asked: {request.message}"

        # 4. Store conversation in Graphiti knowledge graph
        # Graphiti automatically extracts entities and relationships!
        episode_content = f"User asked: {request.message}\nAssistant responded: {response_text}"

        await graphiti.add_episode(
            name=f"chat_{request.session_id}_{datetime.utcnow().timestamp()}",
            episode_body=episode_content,
            source_description="COSE AI Chat Interface",
            reference_time=datetime.utcnow()
        )

        return ChatResponse(
            response=response_text,
            context_used=context_items
        )

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@app.post("/api/add-knowledge")
async def add_knowledge(content: str, source: str = "manual"):
    """Endpoint to manually add knowledge to the graph"""
    try:
        await graphiti.add_episode(
            name=f"knowledge_{datetime.utcnow().timestamp()}",
            episode_body=content,
            source_description=source,
            reference_time=datetime.utcnow()
        )

        return {"status": "success", "message": "Knowledge added to graph with entity extraction"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding knowledge: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
