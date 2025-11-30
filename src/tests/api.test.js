import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import authRoutes from '../routes/authRoutes.js';
import transactionRoutes from '../routes/transactionsRoutes.js';
import draftRoutes from '../routes/draftsRoutes.js';
import indexRoutes from '../routes/indexRoutes.js';
import endpointsRoutes from '../routes/endpoints.js';

const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/draft', draftRoutes);
app.use('/api', endpointsRoutes);
app.use('/', indexRoutes);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Test users data
const testUsers = [
    {
        full_name: 'Test Admin',
        email: 'admin@test.com',
        password: '123456',
        mobile_number: '01000000000',
        role: 'admin'
    },
    {
        full_name: 'Test User',
        email: 'user@test.com',
        password: '123456',
        mobile_number: '01000000001',
        role: 'user'
    }
];

let adminToken, userToken, testTransactionId, testDraftId;

describe('API Tests', () => {
    beforeAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM "Draft" WHERE archived_by_user_id IN (SELECT user_id FROM "User" WHERE email LIKE \'%@test.com\')');
        await pool.query('DELETE FROM "Transaction_Receiver" WHERE transaction_id IN (SELECT transaction_id FROM "Transaction" WHERE sender_user_id IN (SELECT user_id FROM "User" WHERE email LIKE \'%@test.com\'))');
        await pool.query('DELETE FROM "Transaction" WHERE sender_user_id IN (SELECT user_id FROM "User" WHERE email LIKE \'%@test.com\')');
        await pool.query('DELETE FROM "User" WHERE email LIKE \'%@test.com\'');
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('Authentication', () => {
        test('POST /api/auth/register - Admin user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUsers[0]);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');
        });

        test('POST /api/auth/register - Regular user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUsers[1]);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');
        });

        test('POST /api/auth/login - Admin user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUsers[0].email,
                    password: testUsers[0].password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            adminToken = response.body.token;
        });

        test('POST /api/auth/login - Regular user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUsers[1].email,
                    password: testUsers[1].password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            userToken = response.body.token;
        });
    });

    describe('Index Route', () => {
        test('GET /', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Transaction Types', () => {
        test('GET /api/transaction/types', async () => {
            const response = await request(app)
                .get('/api/transaction/types')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Transaction Management', () => {
        test('POST /api/transaction - Create transaction', async () => {
            const transactionData = {
                content: 'محتوى معاملة تجريبية شاملة',
                sender_user_id: 1,
                type_id: 1,
                subject: 'موضوع تجريبي شامل'
            };

            const response = await request(app)
                .post('/api/transaction')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(transactionData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('transaction');
            testTransactionId = response.body.transaction.transaction_id;
        });

        test('GET /api/transaction - Get all transactions', async () => {
            const response = await request(app)
                .get('/api/transaction')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/transaction/send - Send transaction', async () => {
            const sendData = {
                sender_user_id: 1,
                type_id: 1,
                subject: 'إرسال معاملة تجريبية',
                content: 'محتوى إرسال تجريبي',
                receiver_user_ids: [2]
            };

            const response = await request(app)
                .post('/api/transaction/send')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(sendData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('transaction');
        });

        test('GET /api/transaction/received/:userId - Get received transactions', async () => {
            const response = await request(app)
                .get('/api/transaction/received/2')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/transaction/reply - Reply to transaction', async () => {
            const replyData = {
                sender_user_id: 2,
                type_id: 1,
                subject: 'رد على معاملة',
                content: 'محتوى الرد',
                receiver_user_ids: [1],
                parent_transaction_id: testTransactionId
            };

            const response = await request(app)
                .post('/api/transaction/reply')
                .set('Authorization', `Bearer ${userToken}`)
                .send(replyData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('transaction');
        });

        test('GET /api/transaction/:id/print - Get transaction for print', async () => {
            const response = await request(app)
                .get(`/api/transaction/${testTransactionId}/print`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('transaction');
        });
    });

    describe('Draft Management', () => {
        test('POST /api/draft - Create draft', async () => {
            const draftData = {
                transaction_id: testTransactionId,
                archived_by_user_id: 1,
                storage_path: 'C:/drafts/test.pdf'
            };

            const response = await request(app)
                .post('/api/draft')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(draftData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('draft');
            testDraftId = response.body.draft.draft_id;
        });

        test('GET /api/draft - Get all drafts', async () => {
            const response = await request(app)
                .get('/api/draft')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/draft/:id/send - Send draft', async () => {
            const response = await request(app)
                .post(`/api/draft/${testDraftId}/send`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });

        test('DELETE /api/draft/:id - Delete draft', async () => {
            const response = await request(app)
                .delete(`/api/draft/${testDraftId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('User Management Endpoints', () => {
        test('GET /api/users - Get all users (admin only)', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/users/:id - Get specific user', async () => {
            const response = await request(app)
                .get('/api/users/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user_id');
        });

        test('PUT /api/users/:id - Update user', async () => {
            const updateData = {
                full_name: 'Updated Test Admin'
            };

            const response = await request(app)
                .put('/api/users/1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('full_name', 'Updated Test Admin');
        });
    });

    describe('System Endpoints', () => {
        test('GET /api/roles - Get all roles', async () => {
            const response = await request(app)
                .get('/api/roles')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/stats - Get system statistics', async () => {
            const response = await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total_users');
            expect(response.body).toHaveProperty('total_transactions');
        });

        test('GET /api/search/transactions - Search transactions', async () => {
            const response = await request(app)
                .get('/api/search/transactions?q=تجريبي')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('GET /api/users - Access denied for regular user', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'الوصول مرفوض');
        });

        test('POST /api/auth/login - Invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });
});
