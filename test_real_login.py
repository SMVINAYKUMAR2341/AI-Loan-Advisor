import httpx
import asyncio

async def test():
    url = "http://localhost:8001/admin/login"
    payload = {
        "admin_id": "LAAD202501",
        "email": "Vinaykumarsm2341@gmail.com",
        "password": "Vinay@123",
        "pin": "234124"
    }
    print(f"Testing login with payload: {payload}")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
