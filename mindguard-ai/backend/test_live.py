import requests

try:
    url = "http://localhost:8000/defence/interaction-session"
    res = requests.post(url, json={"messages": []})
    print(res.status_code)
    print(res.text)
except Exception as e:
    print(e)
