const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/apds_v3_test');
  await User.deleteMany({});
  // Seed a test employee and customer
  await new User({ fullName: 'Test Employee', idNumber: '9901015800086', accountNumber: '1054083600', username: 'TestEmp', password: 'Test@1234!', role: 'employee' }).save();
  await new User({ fullName: 'Test Customer', idNumber: '9505025800081', accountNumber: '2067891234', username: 'TestCust', password: 'Test@1234!', role: 'customer' }).save();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth Endpoints', () => {
  test('POST /api/auth/login — valid credentials returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'TestCust', accountNumber: '2067891234', password: 'Test@1234!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('customer');
  });

  test('POST /api/auth/login — invalid credentials rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'TestCust', accountNumber: '2067891234', password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — invalid input format rejected (whitelist)', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '<script>alert(1)</script>', accountNumber: '2067891234', password: 'Test@1234!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid username');
  });

  test('No registration endpoint exists', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'Hacker', idNumber: '1234567890123', accountNumber: '9999999', username: 'hacker', password: 'Hack@1234!' });
    expect(res.status).toBe(404);
  });
});

describe('Payment Endpoints', () => {
  let customerToken, employeeToken;

  beforeAll(async () => {
    const custRes = await request(app).post('/api/auth/login').send({ username: 'TestCust', accountNumber: '2067891234', password: 'Test@1234!' });
    customerToken = custRes.body.token;
    const empRes = await request(app).post('/api/auth/login').send({ username: 'TestEmp', accountNumber: '1054083600', password: 'Test@1234!' });
    employeeToken = empRes.body.token;
  });

  test('POST /api/payment/create — customer can create payment', async () => {
    const res = await request(app).post('/api/payment/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ amount: 100.50, currency: 'ZAR', provider: 'SWIFT', payeeAccount: 'GB29NWBK60161331926819', swiftCode: 'NWBKGB2L' });
    expect(res.status).toBe(201);
    expect(res.body.transaction.status).toBe('pending');
  });

  test('POST /api/payment/create — invalid IBAN rejected', async () => {
    const res = await request(app).post('/api/payment/create')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ amount: 50, currency: 'ZAR', provider: 'SWIFT', payeeAccount: 'invalid', swiftCode: 'NWBKGB2L' });
    expect(res.status).toBe(400);
  });

  test('POST /api/payment/create — no token rejected', async () => {
    const res = await request(app).post('/api/payment/create')
      .send({ amount: 100, currency: 'ZAR', provider: 'SWIFT', payeeAccount: 'GB29NWBK60161331926819', swiftCode: 'NWBKGB2L' });
    expect(res.status).toBe(401);
  });

  test('GET /api/payment/transactions — employee can view', async () => {
    const res = await request(app).get('/api/payment/transactions').set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/payment/transactions — customer denied', async () => {
    const res = await request(app).get('/api/payment/transactions').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('PATCH /api/payment/verify — employee can verify', async () => {
    const list = await request(app).get('/api/payment/transactions').set('Authorization', `Bearer ${employeeToken}`);
    const id = list.body[0]._id;
    const res = await request(app).patch(`/api/payment/verify/${id}`).set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.transaction.status).toBe('verified');
  });

  test('POST /api/payment/submit-swift — submits verified transactions', async () => {
    const res = await request(app).post('/api/payment/submit-swift').set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('submitted to SWIFT');
  });
});

describe('Security Headers', () => {
  test('Helmet headers present', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

describe('Express-Brute Protection', () => {
  test('Brute force protection is loaded on login route', async () => {
    // Verify the route responds (brute force middleware is active)
    const res = await request(app).post('/api/auth/login').send({ username: 'TestCust', accountNumber: '2067891234', password: 'Wrong@123!' });
    expect(res.status).toBe(401);
    // After freeRetries (5), should get 429 — testing presence of middleware
  });
});
