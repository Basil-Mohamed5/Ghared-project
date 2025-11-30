# test_requests.py
import requests

BASE_URL = "http://localhost:5000/api"

def print_response(label, response):
    try:
        print(f"--- {label} ---")
        print(response.json(), "\n")
    except Exception as e:
        print(f"--- {label} ERROR ---")
        print(e, response.text, "\n")

# 0️⃣ Login to get token
login_data = {
    "email": "admin@example.com",  # using the admin user from test data
    "password": "1234"
}
r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print_response("POST Login", r)
token = r.json().get("token") if r.status_code == 200 else None
headers = {"Authorization": f"Bearer {token}"} if token else {}

# 1️⃣ GET transaction types
r = requests.get(f"{BASE_URL}/transaction/types", headers=headers)
print_response("GET Transaction Types", r)

# 2️⃣ create transaction (use a valid sender_user_id existing in DB)
tx = {
    "content": "محتوى تجريبي",
    "sender_user_id": 1,
    "type_id": 1,
    "subject": "موضوع تجريبي"
}
r = requests.post(f"{BASE_URL}/transaction", json=tx, headers=headers)
print_response("POST Transaction", r)

# 3️⃣ send transaction (with notifications)
send_tx = {
    "sender_user_id": 1,
    "type_id": 1,
    "subject": "موضوع إرسال",
    "content": "محتوى إرسال",
    "receiver_user_ids": [2]  # assuming user 2 exists
}
r = requests.post(f"{BASE_URL}/transaction/send", json=send_tx, headers=headers)
print_response("POST Send Transaction", r)

# 4️⃣ send acknowledgment (type_id=2)
ack_tx = {
    "sender_user_id": 1,
    "type_id": 2,
    "subject": "إقرار تجريبي",
    "content": "محتوى إقرار",
    "receiver_user_ids": [2]
}
r = requests.post(f"{BASE_URL}/transaction/send", json=ack_tx, headers=headers)
print_response("POST Send Acknowledgment", r)

# 5️⃣ create draft
draft = {
    "transaction_id": 24,  # using the transaction_id from previous creation
    "archived_by_user_id": 1,
    "storage_path": "C:/drafts/test_draft.pdf"
}
r = requests.post(f"{BASE_URL}/draft", json=draft, headers=headers)
print_response("POST Create Draft", r)

# 6️⃣ get all drafts
r = requests.get(f"{BASE_URL}/draft", headers=headers)
print_response("GET All Drafts", r)

# 7️⃣ get all transactions
r = requests.get(f"{BASE_URL}/transaction", headers=headers)
print_response("GET All Transactions", r)

# 8️⃣ get received transactions
r = requests.get(f"{BASE_URL}/transaction/received/1", headers=headers)
print_response("GET Received Transactions", r)

# 9️⃣ register a new user
register_data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
}
r = requests.post(f"{BASE_URL}/auth/register", json=register_data)
print_response("POST Register", r)

# 10️⃣ test-db endpoint
r = requests.get(f"{BASE_URL}/../test-db")  # Note: this is /test-db, not under /api
print_response("GET Test DB", r)
