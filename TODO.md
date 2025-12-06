# Final Deliverables Checklist

## Required Files for Submission

### 1) Transaction Routes (src/routes/transactionRoutes.js)
- [x] All required routes added
- [x] Imports fixed
- [x] Controller linked with middleware
- [x] getDraftById route added (in draftsRoutes.js)

### 2) Transaction Controller (src/controllers/transactionController.js)
- [x] MySQL JOIN fixed in getSent
- [x] getDraftById added (in draftController.js)
- [x] Code organized
- [x] Error handling improved
- [x] Additional functions: getAllTransactions, replyToTransaction, getTransactionForPrint

### 3) Database Config (src/config/db.js)
- [x] Uses .env
- [x] Connection Pool implemented
- [x] MySQL connection configured

### 4) Environment File (.env)
- [x] MySQL values set
- [x] JWT_SECRET included

### 5) Postman Collection (project.postman_collection.json)
- [x] Tests for createTransaction
- [x] Tests for getAllTransactions
- [x] Tests for getSentTransactions
- [x] Tests for getReceivedTransactions
- [x] Tests for getDraftById
- [x] Tests for replyToTransaction
- [x] Tests for getTransactionForPrint

## Files NOT to Submit
- [x] login/register (authController.js, authRoutes.js)
- [x] models
- [x] front-end

## Completed Tasks
- [x] All TODO items implemented
- [x] Code tested and working
- [x] Files organized as per requirements
