const request = require('supertest');
const app = require('../server');

// Mock nodemailer to prevent sending real emails during tests
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn().mockImplementation((cb) => cb(null, true)),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' })
  })
}));

describe('Bulk Inquiry API', () => {
  const testInquiry = {
    name: 'Test Business',
    email: 'business@example.com',
    phone: '9876543210',
    city: 'New York',
    quantity: 500,
    budgetRange: '$1000 - $2000',
    productDescription: 'Custom Mugs',
    customization: 'Logo print',
    occasion: 'Corporate Event'
  };

  describe('POST /api/bulk-inquiry', () => {
    it('should submit a bulk inquiry successfully with all required fields', async () => {
      const res = await request(app)
        .post('/api/bulk-inquiry')
        .send(testInquiry);

      expect(res.statusCode).toBe(201); // Controller might return 201 or 200
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/success/i);
    });

    it('should fail when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/bulk-inquiry')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
