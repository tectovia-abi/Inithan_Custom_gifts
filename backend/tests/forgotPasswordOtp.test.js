const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const crypto = require('crypto');

describe('Forgot Password via WhatsApp OTP Integration Tests', () => {
  const testUser = {
    fullName: 'Anitha Ramesh',
    email: 'anitha@example.com',
    phone: '9876543210',
    password: 'OldPassword123!'
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await PasswordResetOtp.deleteMany({});
    await User.create(testUser);
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate OTP and dispatch via WhatsApp for valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: 'anitha@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe('anitha@example.com');
      expect(res.body.maskedPhone).toContain('3210');

      const otpRecord = await PasswordResetOtp.findOne({ email: 'anitha@example.com' });
      expect(otpRecord).not.toBeNull();
      expect(otpRecord.otpHash).toBeDefined();
    });

    it('should find user and dispatch WhatsApp OTP when given mobile number', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: '9876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.email).toBe('anitha@example.com');
    });

    it('should reject request when account does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: 'unknown@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorType).toBe('USER_NOT_FOUND');
    });

    it('should enforce cooldown if OTP requested repeatedly within 60s', async () => {
      const firstRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: 'anitha@example.com' });
      expect(firstRes.status).toBe(200);

      const secondRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: 'anitha@example.com' });
      expect(secondRes.status).toBe(429);
      expect(secondRes.body.errorType).toBe('COOLDOWN_ACTIVE');
    });
  });

  describe('POST /api/auth/verify-otp and reset-password', () => {
    it('should reject invalid OTP code and track failed attempts', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ identifier: 'anitha@example.com' });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'anitha@example.com', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.errorType).toBe('INVALID_OTP');

      const otpRecord = await PasswordResetOtp.findOne({ email: 'anitha@example.com' });
      expect(otpRecord.attempts).toBe(1);
    });

    it('should verify correct OTP, reset password, and allow login with new password', async () => {
      // Create manual OTP record with known code
      const knownOtp = '789123';
      const salt = process.env.JWT_SECRET || 'fallback_secret_key';
      const otpHash = crypto.createHash('sha256').update(knownOtp + salt).digest('hex');
      const user = await User.findOne({ email: 'anitha@example.com' });

      await PasswordResetOtp.create({
        userId: user._id,
        email: user.email,
        phone: user.phone,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

      // 1. Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'anitha@example.com', otp: knownOtp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.resetToken).toBeDefined();

      // 2. Reset Password using resetToken
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          resetToken: verifyRes.body.resetToken,
          newPassword: 'BrandNewSecurePassword123!',
          confirmPassword: 'BrandNewSecurePassword123!'
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Test logging in with old password (must fail)
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'anitha@example.com', password: 'OldPassword123!' });
      expect(oldLoginRes.status).toBe(401);

      // 4. Test logging in with new password (must succeed!)
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'anitha@example.com', password: 'BrandNewSecurePassword123!' });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.token).toBeDefined();
    });
  });
});

