import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    model = genai.GenerativeModel("gemini-pro-latest")
    response = model.generate_content("Hello, this is a test.")
    print("SUCCESS")
    print(response.text)
except Exception as e:
    print("FAILED")
    print(repr(e))
