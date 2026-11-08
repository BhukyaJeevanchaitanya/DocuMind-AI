import json
import time
from google import genai
from backend.config import GEMINI_API_KEY

# Create Gemini API client
client = genai.Client(api_key=GEMINI_API_KEY)


def generate_documentation(code: str):

    prompt = f"""
    You are an expert software developer and technical writer.

    Analyze the following source code and generate clear technical documentation.

    Include:
    1. Overview
    2. Purpose of the code
    3. Explanation of important functions
    4. Input and output details
    5. Step-by-step working
    6. Example usage

    Source Code:
    {code}
    """

    # Retry Gemini request up to 3 times
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            if not response.text:
                raise RuntimeError("Gemini returned an empty response.")

            return response.text

        except Exception as error:

            error_message = str(error).upper()

            is_temporary_error = (
                "503" in error_message
                or "UNAVAILABLE" in error_message
                or "429" in error_message
                or "RESOURCE_EXHAUSTED" in error_message
            )

            if is_temporary_error and attempt < 2:
                wait_time = 2 ** (attempt + 1)
                print(
                    f"Gemini is busy. Retrying in {wait_time} seconds..."
                )
                time.sleep(wait_time)

            else:
                raise RuntimeError(
                    "Gemini is temporarily unavailable or the API "
                    "request failed. Please try again later."
                ) from error
            

def generate_change_analysis(analysis: dict):

    prompt = f"""
    You are an expert software engineer and technical writer.

    Analyze the following Git Diff analysis results.

    {json.dumps(analysis, indent=2)}

    Provide a structured report containing:

    1. Change Summary
       Explain what changed in the source code.

    2. Modified Functions
       Identify the affected functions or classes.

    3. Impact Analysis
       Explain how these changes affect program behavior.

    4. Documentation Impact
       Identify which documentation sections need updating.

    5. Recommendations
       Suggest documentation updates and important
       considerations for developers.

    Use clear headings and professional technical language.
    Do not invent functions or changes that are not present
    in the supplied analysis.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        if not response.text:
            raise RuntimeError("Gemini returned an empty response.")

        return response.text

    except Exception as error:
        raise RuntimeError(
            "Unable to generate Git Diff explanation. "
            "Please try again later."
        ) from error
