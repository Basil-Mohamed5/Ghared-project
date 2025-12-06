# University Portal Backend API - Endpoints Documentation

This document outlines the API endpoints for the Transaction and Draft management system. Transaction and Draft endpoints require authentication via JWT token in the Authorization header.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Transaction and Draft endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

Auth endpoints (login/register) are public and don't require authentication.

---

## Authentication Endpoints

### 1. Register User
- **Method:** POST
- **Endpoint:** `/auth/register`
- **Description:** Creates a new user account
- **Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}
```

### 2. Login User
- **Method:** POST
- **Endpoint:** `/auth/login`
- **Description:** Authenticates a user and returns JWT token
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}
```

---

## Transaction Endpoints

### 1. Get Transaction Types
- **Method:** GET
- **Endpoint:** `/transaction/types`
- **Description:** Returns available transaction types (normal, iqrar)
- **Auth Required:** Yes
- **Response:**
```json
[
  {
    "value": "normal",
    "label": "معاملة عادية"
  },
  {
    "value": "iqrar",
    "label": "إقرار"
  }
]
```

### 2. Create Transaction
- **Method:** POST
- **Endpoint:** `/transaction`
- **Description:** Creates a new transaction
- **Auth Required:** Yes
- **Body:**
```json
{
  "receiver_id": 2,
  "type": "normal",
  "content": "Transaction content",
  "attachments": "[]"
}
```
- **Response:**
```json
{
  "message": "Transaction created successfully",
  "transactionId": 1
}
```

---

## Draft Endpoints

### 1. Get All Drafts
- **Method:** GET
- **Endpoint:** `/draft`
- **Description:** Returns all drafts for the authenticated user
- **Auth Required:** Yes
- **Response:**
```json
[
  {
    "id": 1,
    "content": "Draft content",
    "attachments": "[]",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Delete Draft
- **Method:** DELETE
- **Endpoint:** `/draft/:id`
- **Description:** Deletes a draft by ID
- **Auth Required:** Yes
- **Response:**
```json
{
  "message": "Draft deleted"
}
```

### 3. Send Draft as Transaction
- **Method:** POST
- **Endpoint:** `/draft/:id/send`
- **Description:** Converts a draft to a transaction and sends it
- **Auth Required:** Yes
- **Body:**
```json
{
  "receiver_id": 2,
  "type": "normal"
}
```
- **Response:**
```json
{
  "message": "Draft sent as transaction",
  "transactionId": 1
}
```

---

## Error Responses
All endpoints may return the following error formats:

### 400 Bad Request
```json
{
  "error": "Invalid transaction type"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Draft not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Database Tables
The system uses the following PostgreSQL tables:
- `users` - User information (with roles/levels)
- `transactions` - Transaction records
- `drafts` - Draft records
- `notifications` - Notification records

## Environment Variables
Required environment variables in `.env`:
- `DB_HOST` - Database host (localhost)
- `DB_USER` - Database user (postgres)
- `DB_PASSWORD` - Database password (1234)
- `DB_NAME` - Database name (university_portal)
- `DB_PORT` - Database port (5432)
- `JWT_SECRET` - JWT secret key
- `PORT` - Server port (default: 5000)
