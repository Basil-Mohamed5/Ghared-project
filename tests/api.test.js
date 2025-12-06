import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';
import fs from 'fs';

describe('API Tests', () => {
    let token;
    let userId;
    let receiverId;
    let draftId;
    let transactionId;

    beforeAll(async () => {
        // Recreate tables with correct schema
        await pool.query('DROP TABLE IF EXISTS notifications');
        await pool.query('DROP TABLE IF EXISTS transactions');
        await pool.query('DROP TABLE IF EXISTS drafts');
        await pool.query('DROP TABLE IF EXISTS users');

        // Create tables from tables.sql
        const sql = fs.readFileSync('tables.sql', 'utf8');
        const queries = sql.split(';').filter(q => q.trim());
        for (const query of queries) {
            if (query.trim()) {
                await pool.query(query);
            }
        }
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('Auth Endpoints', () => {
        test('POST /api/auth/register - should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Registered successfully');
            expect(res.body).toHaveProperty('user');
            userId = res.body.user.id;
        });

        test('POST /api/auth/register - should register a second user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User 2',
                    email: 'test2@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Registered successfully');
            expect(res.body).toHaveProperty('user');
            receiverId = res.body.user.id;
        });

        test('POST /api/auth/login - should login user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Login successful');
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('token');
            token = res.body.token;
        });
    });

    describe('Transaction Endpoints', () => {
        test('GET /api/transactions/types - should return transaction types', async () => {
            const res = await request(app)
                .get('/api/transactions/types')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toEqual([
                { value: 'normal', label: 'معاملة عادية' },
                { value: 'iqrar', label: 'إقرار' }
            ]);
        });

        test('POST /api/transactions - should create a transaction', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    receiver_id: receiverId,
                    type: 'normal',
                    content: 'Test transaction content'
                });

            if (res.status !== 201) {
                console.log('Transaction creation failed:', res.status, res.body);
            }
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Transaction created');
            expect(res.body).toHaveProperty('transactionId');
            transactionId = res.body.transactionId;
        });

        test('GET /api/transactions/inbox - should get inbox transactions', async () => {
            const res = await request(app)
                .get('/api/transactions/inbox')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test('GET /api/transactions/sent - should get sent transactions', async () => {
            const res = await request(app)
                .get('/api/transactions/sent')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Draft Endpoints', () => {
        test('POST /api/drafts - should create a draft', async () => {
            const res = await request(app)
                .post('/api/drafts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Test draft content'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Draft created');
            expect(res.body).toHaveProperty('draftId');
            draftId = res.body.draftId;
        });

        test('GET /api/drafts - should get all drafts', async () => {
            const res = await request(app)
                .get('/api/drafts')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        test('GET /api/drafts/:id - should get draft by id', async () => {
            const res = await request(app)
                .get(`/api/drafts/${draftId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', draftId);
            expect(res.body).toHaveProperty('content', 'Test draft content');
        });

        test('POST /api/drafts/:id/send - should send draft as transaction', async () => {
            const res = await request(app)
                .post(`/api/drafts/${draftId}/send`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    receiver_id: userId,
                    type: 'normal'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Draft sent as transaction');
            expect(res.body).toHaveProperty('transactionId');
        });

        test('DELETE /api/drafts/:id - should delete draft', async () => {
            // Create another draft first
            const createRes = await request(app)
                .post('/api/drafts')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    content: 'Draft to delete'
                });
            const deleteId = createRes.body.draftId;

            const res = await request(app)
                .delete(`/api/drafts/${deleteId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Draft deleted');
        });
    });

    describe('Error Cases', () => {
        test('POST /api/transactions - should fail without auth', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .send({
                    receiver_id: userId,
                    type: 'normal',
                    content: 'Test'
                });

            expect(res.status).toBe(401);
        });

        test('GET /api/drafts - should fail without auth', async () => {
            const res = await request(app)
                .get('/api/drafts');

            expect(res.status).toBe(401);
        });

        test('POST /api/auth/register - should fail with invalid data', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: '',
                    email: 'invalid',
                    password: ''
                });

            expect(res.status).toBe(400);
        });
    });
});
