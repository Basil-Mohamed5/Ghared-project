import requests

BASE_URL = "http://localhost:5000"

def print_response(label, response):
    try:
        print(f"--- {label} ---")
        print(response.json(), "\n")
    except Exception as e:
        print(f"--- {label} ERROR ---")
        print(e, response.text, "\n")

# ----------------------------
# 1️⃣ GET all transaction types
response = requests.get(f"{BASE_URL}/transactions/types")
print_response("GET Transaction Types", response)

# ----------------------------
# 2️⃣ POST a new transaction
transaction_data = {
    "content": "محتوى المعاملة التجريبي",
    "sender_user_id": 1,
    "type_id": 1,
    "subject": "عنوان المعاملة التجريبي",
    "code": "TRX_TEST_PY"
}
response = requests.post(f"{BASE_URL}/transactions", json=transaction_data)
print_response("POST Transaction", response)
transaction_id = response.json().get("transaction", {}).get("transaction_id")

# ----------------------------
# 3️⃣ GET all drafts
response = requests.get(f"{BASE_URL}/drafts")
print_response("GET Drafts", response)

# ----------------------------
# 4️⃣ POST a new draft
draft_data = {
    "transaction_id": transaction_id,
    "archived_by_user_id": 1,
    "storage_path": "C:/drafts/test_python.pdf"
}
response = requests.post(f"{BASE_URL}/drafts", json=draft_data)
print_response("POST Draft", response)
draft_id = response.json().get("draft", {}).get("draft_id")

# ----------------------------
# 5️⃣ SEND draft (convert to transaction)
response = requests.post(f"{BASE_URL}/drafts/{draft_id}/send")
print_response(f"SEND Draft {draft_id}", response)

# ----------------------------
# 6️⃣ DELETE draft
response = requests.delete(f"{BASE_URL}/drafts/{draft_id}")
print_response(f"DELETE Draft {draft_id}", response)

# ----------------------------
# 7️⃣ GET all transactions to confirm
response = requests.get(f"{BASE_URL}/transactions")
print_response("GET Transactions", response)
