import requests
try:
    res = requests.post("http://127.0.0.1:8000/defence/live-session", json={"messages": []})
    print("STATUS:", res.status_code)
    print("BODY:", res.text)
except Exception as e:
    print("ERR:", e)
