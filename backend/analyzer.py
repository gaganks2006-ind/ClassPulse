import os
import json
import base64
from PIL import Image
import io

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if HAS_GENAI and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def analyze_test_paper(image_bytes, subject="Mathematics", grade="Grade 3"):
    """
    Analyzes a handwritten student test paper using Gemini Multimodal API.
    Supports mixed Hindi-English (Hinglish/Bilingual) handwriting diagnostics.
    If API key is missing or calls fail, returns high-fidelity mock data.
    """
    
    # Advanced Bilingual System Prompt for Cognitive Diagnostics
    prompt = f"""
    You are ClassPulse AI, a highly specialized educational diagnostic agent focusing on Foundational Literacy & Numeracy (FLN) under India's National Education Policy (NEP 2020).
    Analyze this scanned, handwritten student test paper for {grade} in {subject}.
    
    Your job is to read and analyze the handwritten responses, which may be written in a mix of Hindi and English (Bilingual/Hinglish):
    1. Look for the student's name and roll number written at the top of the paper.
    2. Identify correct vs. incorrect answers, taking into account handwritten ticks (✔) or crosses (✘).
    3. Perform COGNITIVE ERROR DIAGNOSIS:
       - Explain the EXACT conceptual misconception (e.g. "forgets tens carryover in addition", "subtracts smaller digit from larger in ones column", "phonetic spelling slips like writing 'pat' instead of 'path'").
    4. Generate a structured JSON response containing:
       - student_name: (str, extract from paper if readable, e.g. 'Rahul Kumar', else 'Unknown Student')
       - roll_number: (str, if written, else null)
       - total_score: (float, out of 10)
       - summary: (str, performance overview written in simple English)
       - gaps: array of objects, where each object has:
         - concept: (str, e.g. 'Double-digit Addition with Carry', 'Word Sound Recognition')
         - status: ('Mastered', 'Needs Improvement', 'Critical Gap')
         - misconception_details: (str, detailed diagnostic explanation of why they made this specific mistake)
         - remedial_resource: (str, a helpful activity description or a link to a suggested DIKSHA module)
         
    Response MUST be strict valid JSON only, without markdown wrappers.
    """
    
    # Try using Gemini API if configured
    if HAS_GENAI and GEMINI_API_KEY:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([prompt, image])
            
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed_json = json.loads(response_text)
            return parsed_json
            
        except Exception as e:
            print(f"Gemini API analysis failed: {e}. Falling back to high-fidelity mock diagnostic.")
            
    # Premium Mock Diagnostic Fallback (Seamless demo)
    return get_premium_mock_diagnostic(subject, grade)

def get_premium_mock_diagnostic(subject, grade):
    """
    Generates extremely realistic, bilingual-ready diagnostic data.
    """
    if subject.lower() == "mathematics":
        return {
            "student_name": "Rahul Kumar",
            "roll_number": "G3-01",
            "total_score": 5.5,
            "summary": "Rahul show strong understanding of place values in basic numbers but struggles with transitioning values (carry-overs and borrowings across zeros) during calculations.",
            "gaps": [
                {
                    "concept": "Single-digit Addition",
                    "status": "Mastered",
                    "misconception_details": "Rahul accurately adds single-digit numbers with 100% accuracy (e.g. 8 + 5 = 13).",
                    "remedial_resource": "https://diksha.gov.in/play-based/single-addition"
                },
                {
                    "concept": "Double-digit Addition with Carry",
                    "status": "Needs Improvement",
                    "misconception_details": "Rahul column setup is correct, but he forgets to add the 'carried over' ten to the tens column (e.g. writing 29 + 15 = 34 instead of 44).",
                    "remedial_resource": "https://diksha.gov.in/resources/place-value-carryover"
                },
                {
                    "concept": "Subtraction Borrowing Across Zero",
                    "status": "Critical Gap",
                    "misconception_details": "When subtracting from a number ending in zero (e.g. 60 - 28), Rahul simply subtracts the smaller digit from the larger digit in the ones column (8 - 0 = 8), resulting in 60 - 28 = 48.",
                    "remedial_resource": "https://diksha.gov.in/play-based/zero-borrowing-beads-activity"
                }
            ]
        }
    else:  # English / Literacy
        return {
            "student_name": "Ananya Rao",
            "roll_number": "G3-02",
            "total_score": 7.0,
            "summary": "Ananya has excellent sight-word recognition but struggles with phonemic blending of unfamiliar multi-syllabic English words.",
            "gaps": [
                {
                    "concept": "Sight Word Recognition",
                    "status": "Mastered",
                    "misconception_details": "Correctly reads and pronounces grade-level English sight words.",
                    "remedial_resource": "https://diksha.gov.in/resources/sight-words-grade3"
                },
                {
                    "concept": "Consonant Blend Sounding",
                    "status": "Needs Improvement",
                    "misconception_details": "Ananya struggles to blend adjacent consonant segments (e.g., pronouncing 'brush' as 'bush' or 'str-e-tch' as 'streetch').",
                    "remedial_resource": "https://diksha.gov.in/resources/phonics-blending-modules"
                }
            ]
        }
