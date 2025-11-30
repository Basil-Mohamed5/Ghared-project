# TODO List for Task Implementation

## Task: Add verification in createDraft for transaction existence, review route protections and sensitive data, ensure UTF-8 in responses.

### Steps:
1. **Review createDraft**: Confirm transaction existence check is present (already done). ✅
2. **Add protection to unprotected routes in transactionsRoutes.js**: Add 'protect' middleware to getTransactionTypes, createTransaction, getAllTransactions. ✅
3. **Secure sensitive data in getAllTransactions**: Modify to filter transactions by authenticated user instead of returning all. ✅
4. **Ensure UTF-8 in responses**: Add charset=utf-8 to JSON responses in controllers. ✅
5. **Test changes**: Run the server and verify endpoints. ✅

### Dependent Files:
- src/routes/transactionsRoutes.js
- src/controllers/transactionController.js

### Followup Steps:
- After edits, test the API endpoints to ensure protections work and UTF-8 is enforced.
