# DocuMind AI – Intelligent Code Documentation Assistant

DocuMind AI is an AI-powered code documentation assistant that automatically generates technical documentation from source code. It also analyzes Git diffs to identify code changes, understand their impact, and provide documentation recommendations using Google Gemini AI.

## Features

- **AI Code Documentation:** Generate technical documentation from source code.
- **Code Input:** Upload a code file or paste source code manually.
- **Git Diff Analysis:** Analyze Git diffs to identify added, deleted, and modified lines.
- **AI Impact Analysis:** Generate change summaries, impact analysis, and recommendations.
- **Documentation Review:** Edit, approve, or reject generated documentation.
- **Export Options:** Download approved documentation in Markdown, PDF, and TXT formats.

## Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Python
- FastAPI
- Uvicorn

**AI Integration**
- Google Gemini API (`gemini-2.5-flash`)

**Testing**
- Pytest

## Project Structure

```text
DocuMind-AI/
│
├── backend/
│   ├── config.py
│   ├── diff_service.py
│   ├── gemini_service.py
│   └── main.py
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── tests/
│   └── test_diff_service.py
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd DocuMind-AI
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure the Gemini API Key

Create a `.env` file in the project root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder with your own Gemini API key.

### 6. Start the Backend Server

```bash
python -m uvicorn backend.main:app --reload --reload-dir backend
```

The backend server runs at:

`http://127.0.0.1:8000`

### 7. Run the Frontend

Open the `frontend/index.html` file using the VS Code Live Server extension.

The frontend will be available at:

`http://127.0.0.1:5500/frontend/index.html`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/api/analyze` | Generate code documentation |
| POST | `/api/analyze-diff` | Analyze Git diff changes |

## Running Tests

Execute the following command from the project root:

```bash
python -m pytest -v
```

## Application Workflow

1. Upload a source code file or paste code manually.
2. Generate AI-powered technical documentation.
3. Paste a Git diff to analyze code changes.
4. Review the AI-generated impact analysis.
5. Edit, approve, or reject the generated documentation.
6. Download approved documentation in your preferred format.

## Future Enhancements

- Support for additional programming languages.
- GitHub repository integration.
- Advanced code change visualization.
- More detailed documentation templates.

## Author

Developed as an AI-powered software development project using Python, FastAPI, JavaScript, and Google Gemini AI.
