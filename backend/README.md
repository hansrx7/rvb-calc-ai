# RentVsBuy.ai Backend

FastAPI service that powers the financial calculations and OpenAI proxy used by the React frontend.

## Quick start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

# Configure secrets - create backend/.env
cat <<'EOF' > .env
OPENAI_API_KEY=your_openai_key_here
# API_PREFIX=/api
# CORS_ORIGINS=http://localhost:5173
EOF

# Run the API
uvicorn app.main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`. The React frontend looks for the backend at this URL by default (overridable via `VITE_BACKEND_URL`).

## Environment variables

| Name             | Required | Description                                   |
| ---------------- | -------- | --------------------------------------------- |
| `OPENAI_API_KEY` | Yes      | Server-side key for OpenAI chat completions.  |
| `API_PREFIX`     | No       | Defaults to `/api`; set to customise routing. |
| `CORS_ORIGINS`   | No       | Comma-separated list of allowed origins.      |

All variables can be placed in `backend/.env`.

## Available endpoints

| Method | Path                    | Description                                                         |
| ------ | ----------------------- | ------------------------------------------------------------------- |
| GET    | `/health`               | Simple health probe returning `{ "status": "ok" }`.                 |
| POST   | `/api/finance/analyze`  | Accepts scenario inputs and returns monthly snapshots plus totals. |
| POST   | `/api/ai/chat`          | Proxies chat requests to OpenAI using the server-side API key.     |

### `/api/finance/analyze`

Request body:
```jsonc
{
  "inputs": { /* ScenarioInputs payload */ },
  "includeTimeline": false
}
```

Response body summarizes the calculator output, including monthly snapshots, summary statistics, cost breakdowns, and totals used by the charts.

### `/api/ai/chat`

Lightweight wrapper over OpenAI's Chat Completions API. The payload mirrors the OpenAI schema and returns `{ "response": "..." }` containing the assistant message.

## Project structure

```
backend/
├── app/
│   ├── config.py           # Settings and CORS configuration
│   ├── finance/
│   │   └── calculator.py   # Ported financial logic
│   ├── main.py             # FastAPI app factory and routes
│   ├── models.py           # Pydantic models for requests/responses
│   └── services/
│       └── openai_service.py  # OpenAI client wrapper
├── requirements.txt
└── README.md (this file)
```

## Running in production

Use a production ASGI server such as `uvicorn` behind a process manager or container orchestration platform. Example command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Remember to set `CORS_ORIGINS` appropriately when deploying the frontend and backend on different domains.
