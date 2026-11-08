
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.gemini_service import (
    generate_documentation,
    generate_change_analysis
)

from backend.diff_service import analyze_git_diff


app = FastAPI(
    title="DocuMind AI",
    description="Intelligent Code Documentation Assistant",
    version="1.0.0"
)


# Allow our local frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ======================================
# REQUEST MODELS
# ======================================

class CodeRequest(BaseModel):
    code: str


class CodeDiffRequest(BaseModel):
    diff: str


# ======================================
# HOME ROUTE
# ======================================

@app.get("/")
def home():
    return {
        "message": "Welcome to DocuMind AI!",
        "status": "running"
    }


# ======================================
# EXISTING CODE DOCUMENTATION API
# ======================================

@app.post("/api/analyze")
def analyze_code(request: CodeRequest):

    code = request.code.strip()

    if not code:
        return {
            "success": False,
            "message": "Please provide code to analyze."
        }

    try:

        documentation = generate_documentation(code)

        return {
            "success": True,
            "message": "Documentation generated successfully!",
            "documentation": documentation
        }

    except Exception as error:

        return {
            "success": False,
            "message": f"Gemini API error: {error}"
        }


# ======================================
# GIT DIFF ANALYSIS WITH GEMINI AI
# ======================================

@app.post("/api/analyze-diff")
def analyze_code_diff(request: CodeDiffRequest):

    diff_text = request.diff.strip()

    if not diff_text:
        return {
            "success": False,
            "message": "Please provide Git diff content."
        }

    try:

        # STEP 1: Analyze Git Diff
        result = analyze_git_diff(diff_text)

        # STEP 2: Generate AI Change Explanation
        ai_analysis = generate_change_analysis(result)

        return {
            "success": True,
            "message": "Git Diff analyzed successfully!",
            "analysis": result,
            "ai_analysis": ai_analysis
        }

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }

    except Exception as error:

        return {
            "success": False,
            "message": f"Git Diff analysis error: {error}"
        }
