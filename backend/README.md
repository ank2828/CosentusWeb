# COSE AI Backend

FastAPI backend with Graphiti knowledge graph integration for the COSE AI chatbot.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up Neo4j:**
   - Install Neo4j Desktop or use Neo4j Aura (cloud)
   - Start Neo4j on `bolt://localhost:7687`
   - Default credentials are in `.env.example`

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

4. **Run the server:**
   ```bash
   python main.py
   # Or use uvicorn directly:
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

- `GET /` - Health check
- `POST /api/chat` - Chat endpoint with Graphiti context
- `POST /api/add-knowledge` - Manually add knowledge to graph

## How It Works

1. User sends message to `/api/chat`
2. Backend searches Neo4j knowledge graph via Graphiti
3. Relevant context is retrieved and added to LLM prompt
4. Claude generates response with context awareness
5. Conversation is stored back in knowledge graph for future context
