# CrateX - AI Music Organizer

CrateX is a local-first web application for organizing DJ music libraries using Python, FastAPI, and React.

## Prerequisites

1.  **Python 3.10+**
2.  **Node.js 18+**
3.  **Google Gemini API Key** (Set as `GEMINI_API_KEY` in env)

## Installation

### 1. Backend (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Create a .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Run the server
python main.py
```

The API will run at `http://localhost:8000`.

### 2. Frontend (React)

In a separate terminal:

```bash
# Install dependencies (assuming a standard create-react-app or vite setup)
npm install

# Start the dev server
npm start
```

The UI will run at `http://localhost:3000` (or the port specified by your bundler).

## Usage

1.  Open the Web UI.
2.  Enter the absolute path to your Music folder (e.g., `/Users/name/Music/Unsorted`).
3.  Ensure "Dry Run" is selected for safety.
4.  Click "Start Pipeline".
5.  Watch the logs. If satisfied, switch to "Execute" and run again.

## Safety

-   **Dry Run Default**: No files are touched unless explicitly requested.
-   **Rollback**: Use the emergency rollback button to undo file moves.
-   **Local Processing**: No audio leaves your machine. Only metadata is sent to Gemini.
