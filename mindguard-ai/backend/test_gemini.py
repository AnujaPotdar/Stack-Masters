import google.generativeai as genai
import os
import sys

# use the user's provided api key or the one from environment
key = "AIzaSyB8i28c3YCBfTpG7llh9emNoK_0TYj3Cg4"
genai.configure(api_key=key)

try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content("Hello, this is a test.")
    print("SUCCESS")
    print(response.text)
except Exception as e:
    print("FAILED")
    print(repr(e))
    sys.exit(1)
