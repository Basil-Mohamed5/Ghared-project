import requests

BASE_URL = "http://localhost:5000/api"

def print_response(label, response):
    try:
        print(f"--- {label} ---")
        print(response.json(), "\n")
    except Exception as e:
        print(f"--- {label} ERROR ---")
        print(e, response.text, "\n")

# Test users
users = [
    {"email": "admin@example.com", "password": "1234", "role": "admin"},
    {"email": "manager@example.com", "password": "1234", "role": "manager"},
    {"email": "user@example.com", "password": "1234", "role": "user"}
]

tokens = {}

# 1. Login all users
for user in users:
    login_data = {"email": user["email"], "password": user["password"]}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print_response(f"POST Login ({user['role']})", r)
    if r.status_code == 200:
        tokens[user["role"]] = r.json().get("token")
    else:
        print(f"Failed to login {user['role']}")

# Use admin token for most tests
admin_headers = {"Authorization": f"Bearer {tokens.get('admin', '')}"}
manager_headers = {"Authorization": f"Bearer {tokens.get('manager', '')}"}
user_headers = {"Authorization": f"Bearer {tokens.get('user', '')}"}

# 2. Test Index Route
r = requests.get(f"{BASE_URL}/")
print_response("GET Index", r)

# 3. Test Auth Routes
register_data = {
    "full_name": "Test User 2",
    "email": "test2@example.com",
    "password": "1234",
    "mobile_number": "01000000001"
}
r = requests.post(f"{BASE_URL}/auth/register", json=register_data)
print_response("POST Register", r)

# 4. Test Transaction Types
r = requests.get(f"{BASE_URL}/transaction/types", headers=admin_headers)
print_response("GET Transaction Types", r)

# 5. Create Transaction
tx = {
    "content": "محتوى معاملة تجريبية شاملة",
    "sender_user_id": 1,
    "type_id": 1,
    "subject": "موضوع تجريبي شامل"
}
r = requests.post(f"{BASE_URL}/transaction", json=tx, headers=admin_headers)
print_response("POST Transaction", r)
transaction_id = r.json().get("transaction", {}).get("transaction_id") if r.status_code == 200 else None

# 6. Get All Transactions
r = requests.get(f"{BASE_URL}/transaction", headers=admin_headers)
print_response("GET All Transactions", r)

# 7. Send Transaction (using admin to manager)
send_tx = {
    "sender_user_id": 1,
    "type_id": 1,
    "subject": "إرسال معاملة تجريبية",
    "content": "محتوى إرسال تجريبي",
    "receiver_user_ids": [2]  # manager user
}
r = requests.post(f"{BASE_URL}/transaction/send", json=send_tx, headers=admin_headers)
print_response("POST Send Transaction", r)

# 8. Send Acknowledgment
ack_tx = {
    "sender_user_id": 1,
    "type_id": 2,
    "subject": "إقرار تجريبي",
    "content": "محتوى إقرار تجريبي",
    "receiver_user_ids": [2]
}
r = requests.post(f"{BASE_URL}/transaction/send", json=ack_tx, headers=admin_headers)
print_response("POST Send Acknowledgment", r)

# 9. Get Received Transactions
r = requests.get(f"{BASE_URL}/transaction/received/2", headers=manager_headers)
print_response("GET Received Transactions", r)

# 10. Reply to Transaction (if we have a transaction to reply to)
if transaction_id:
    reply_tx = {
        "sender_user_id": 2,
        "type_id": 1,
        "subject": "رد على معاملة",
        "content": "محتوى الرد",
        "receiver_user_ids": [1],
        "parent_transaction_id": transaction_id
    }
    r = requests.post(f"{BASE_URL}/transaction/reply", json=reply_tx, headers=manager_headers)
    print_response("POST Reply Transaction", r)

# 11. Get Transaction for Print
if transaction_id:
    r = requests.get(f"{BASE_URL}/transaction/{transaction_id}/print", headers=admin_headers)
    print_response("GET Transaction Print", r)

# 12. Create Draft
draft = {
    "transaction_id": transaction_id or 1,
    "archived_by_user_id": 1,
    "storage_path": "C:/drafts/comprehensive_test.pdf"
}
r = requests.post(f"{BASE_URL}/draft", json=draft, headers=admin_headers)
print_response("POST Create Draft", r)
draft_id = r.json().get("draft", {}).get("draft_id") if r.status_code == 200 else None

# 13. Get All Drafts
r = requests.get(f"{BASE_URL}/draft", headers=admin_headers)
print_response("GET All Drafts", r)

# 14. Send Draft
if draft_id:
    r = requests.post(f"{BASE_URL}/draft/{draft_id}/send", json={}, headers=admin_headers)
    print_response("POST Send Draft", r)

# 15. Delete Draft
if draft_id:
    r = requests.delete(f"{BASE_URL}/draft/{draft_id}", headers=admin_headers)
    print_response("DELETE Draft", r)

# 16. Test DB Connection
r = requests.get("http://localhost:5000/test-db")
print_response("GET Test DB", r)

print("Comprehensive API testing completed!")
