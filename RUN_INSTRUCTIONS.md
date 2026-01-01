# Run Instructions

## Prerequisites
- **Python** (3.9+)
- **Node.js** (18+)
- **npm** (or bun/yarn)

## Backend (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`.
   API Documentation: `http://127.0.0.1:8000/docs`.

## Frontend (Vite + React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
   *(Note: If you are working inside `frontend/secure-identity-hub-main`, navigate there instead, but the main `frontend` directory appears to be the primary workspace.)*

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will usually be hosted at `http://localhost:5173` (check the terminal output).
