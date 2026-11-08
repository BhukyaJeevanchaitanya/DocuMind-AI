
import os
from pathlib import Path
from dotenv import load_dotenv

# Find the main project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the project root
load_dotenv(BASE_DIR / ".env")

# Read the Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Check whether the API key is available
if not GEMINI_API_KEY:
    raise ValueError("Gemini API key not found. Check your .env file.")
