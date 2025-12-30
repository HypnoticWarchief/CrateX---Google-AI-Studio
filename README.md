
# CrateX - AI Music Organizer

CrateX is a local-first web application for organizing DJ music libraries using Python, FastAPI, and React. It can be run locally for development or built into a Docker container for deployment.

## Prerequisites

1.  **Python 3.10+** (for local dev)
2.  **Node.js 18+** (for local dev)
3.  **Docker** (for containerized deployment)
4.  **Google Gemini API Key**

## Option 1: Running with Docker (Recommended)

This method packages the frontend and backend into a single container, just like a production deployment.

1.  **Create a `.env` file:**
    ```bash
    echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
    ```

2.  **Build and run the container:**
    ```bash
    docker build -t cratex-app .
    docker run -p 8080:8080 --env-file .env cratex-app
    ```

3.  Open your browser to `http://localhost:8080`.

## Option 2: Local Development

This requires running the frontend and backend in separate terminals.

### 1. Backend (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Create a .env file if you haven't already
# The key for local python dev MUST be named GEMINI_API_KEY
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run the server
uvicorn main:app --reload
```

The API will run at `http://localhost:8000`.

### 2. Frontend (React)

In a separate terminal:

```bash
# Install dependencies
npm install

# Start the dev server (Vite will automatically load the .env file)
npm run dev
```

The UI will run at `http://localhost:5173` (or the port specified by Vite).

## Usage

1.  Open the Web UI.
2.  The application will connect to the backend. The status indicator will show "ONLINE".
3.  Enter the absolute path to your Music folder (e.g., `/Users/name/Music/Unsorted`).
4.  Click "Analyze Library" to run a safe dry-run.
5.  Review the proposed changes in the modal.
6.  If satisfied, click "Confirm & Move Files".
7.  View the final sorted library in the Results View.
