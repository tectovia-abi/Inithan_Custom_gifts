const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth API', () => {
  const testUser = {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'password123',
    confirmPassword: 'password123'
  };

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should not register user with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test2@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorType).toBe('MISSING_FIELDS');
    });

    it('should not register user with duplicate email', async () => {
      // Register first user
      await request(app).post('/api/auth/signup').send(testUser);

      // Try registering again
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorType).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user before testing login
      await request(app).post('/api/auth/signup').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
