import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # Register a test soldier
        await client.post("http://localhost:8000/auth/register", json={"name":"Test Soldier", "email":"soldier@test.com", "password":"password", "role":"soldier"})
        # Login
        res = await client.post("http://localhost:8000/auth/token", data={"username":"soldier@test.com", "password":"password"})
        token = res.json().get("access_token", "")
        
        if not token:
            print("Failed to login", res.text)
            return

        res2 = await client.post(
            "http://localhost:8000/defence/live-analyze", 
            json={"question": "How are you feeling?", "answer": "I feel a bit overwhelmed but managing."}, 
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0
        )
        with open("python_error.txt", "w", encoding="utf-8") as f:
            f.write(res2.text)

asyncio.run(test())
