import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test_openai():
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"Key loaded: {'Yes (Length: ' + str(len(api_key)) + ')' if api_key else 'No'}")
        
        client = AsyncOpenAI(api_key=api_key)
        print("Sending request...")
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a test bot."},
                {"role": "user", "content": "Say hello world"}
            ],
            max_tokens=150
        )
        print("Response received:", response.choices[0].message.content)
    except Exception as e:
        print("Error encountered:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_openai())
