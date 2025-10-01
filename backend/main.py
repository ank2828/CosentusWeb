from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
from openai import OpenAI
from datetime import datetime
from typing import Optional

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

# Initialize Neo4j driver
neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI", "bolt://localhost:7687"),
    auth=(
        os.getenv("NEO4J_USER", "neo4j"),
        os.getenv("NEO4J_PASSWORD", "Kashkarian_1228")
    )
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
    return {"status": "COSE AI Backend Running", "version": "1.0.0"}


def search_knowledge_graph(query: str, limit: int = 5):
    """Search Neo4j for relevant context"""
    context_items = []

    with neo4j_driver.session() as session:
        # Search for nodes containing the query text
        result = session.run("""
            MATCH (n:Conversation)
            WHERE n.content CONTAINS $query
            RETURN n.content as content, n.timestamp as timestamp
            ORDER BY n.timestamp DESC
            LIMIT $limit
        """, query=query.lower(), limit=limit)

        for record in result:
            context_items.append({
                "content": record["content"],
                "timestamp": record["timestamp"]
            })

    return context_items


def store_conversation(session_id: str, user_message: str, ai_response: str):
    """Store conversation in Neo4j"""
    with neo4j_driver.session() as session:
        session.run("""
            CREATE (c:Conversation {
                session_id: $session_id,
                user_message: $user_message,
                ai_response: $ai_response,
                content: $content,
                timestamp: datetime()
            })
        """,
            session_id=session_id,
            user_message=user_message,
            ai_response=ai_response,
            content=f"User: {user_message}\nAssistant: {ai_response}"
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # 1. Search knowledge graph for relevant context
        context_items = search_knowledge_graph(request.message, limit=3)

        # Build context text
        context_text = ""
        if context_items:
            for item in context_items:
                context_text += f"- {item['content']}\n"

        # 2. Build prompt with context
        system_prompt = f"""You are COSE AI, an expert assistant for Revenue Cycle Management (RCM).
You help healthcare providers optimize their revenue cycles through AI-powered solutions.

Relevant context from previous conversations:
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

        # 4. Store conversation in knowledge graph
        store_conversation(
            session_id=request.session_id,
            user_message=request.message,
            ai_response=response_text
        )

        return ChatResponse(
            response=response_text,
            context_used=context_items
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@app.post("/api/add-knowledge")
async def add_knowledge(content: str, source: str = "manual"):
    """Endpoint to manually add knowledge to the graph"""
    try:
        with neo4j_driver.session() as session:
            session.run("""
                CREATE (k:Knowledge {
                    content: $content,
                    source: $source,
                    timestamp: datetime()
                })
            """, content=content, source=source)

        return {"status": "success", "message": "Knowledge added to graph"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding knowledge: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
