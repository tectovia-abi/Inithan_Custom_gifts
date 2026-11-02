const request = require('supertest');
const app = require('../server');
const WhatsAppMessage = require('../models/WhatsAppMessage');

describe('WhatsApp Cloud API Webhook Integration Tests', () => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'inithan_wa_verify_token_2026';

  describe('GET /api/whatsapp/webhook - Verification Handshake', () => {
    it('should successfully verify Meta webhook handshake when token matches', async () => {
      const challenge = 'random_challenge_12345';
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challenge
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challenge);
    });

    it('should reject handshake when verify token is incorrect', async () => {
      const res = await request(app)
        .get('/api/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': '12345'
        });

      expect(res.status).toBe(403);
    });

    it('should reject request when required query params are missing', async () => {
      const res = await request(app).get('/api/whatsapp/webhook');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/whatsapp/webhook - Event Intake & Processing', () => {
    it('should acknowledge incoming messages with 200 OK and persist message to database', async () => {
      const samplePayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '919944444834',
                    phone_number_id: 'TEST_PHONE_ID'
                  },
                  contacts: [
                    {
                      profile: { name: 'Ravi Kumar' },
                      wa_id: '919876543210'
                    }
                  ],
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid.HBgTESTMESSAGE101',
                      timestamp: '1730528400',
                      text: { body: 'Hello! I need custom gifts' },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(samplePayload);

      expect(res.status).toBe(200);
      expect(res.text).toBe('EVENT_RECEIVED');

      // Verify that message was saved to MongoDB
      const savedMsg = await WhatsAppMessage.findOne({ messageId: 'wamid.HBgTESTMESSAGE101' });
      expect(savedMsg).not.toBeNull();
      expect(savedMsg.from).toBe('919876543210');
      expect(savedMsg.senderName).toBe('Ravi Kumar');
      expect(savedMsg.body).toBe('Hello! I need custom gifts');
    });

    it('should process OTP / message delivery status updates (delivered, read)', async () => {
      // First insert an outgoing message
      const initialMsg = await WhatsAppMessage.create({
        messageId: 'wamid.OUTBOUND_OTP_999',
        direction: 'outgoing',
        type: 'otp',
        to: '919876543210',
        body: 'Your OTP is: 482910',
        status: 'sent'
      });
      expect(initialMsg.status).toBe('sent');

      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '919944444834',
                    phone_number_id: 'TEST_PHONE_ID'
                  },
                  statuses: [
                    {
                      id: 'wamid.OUTBOUND_OTP_999',
                      status: 'delivered',
                      timestamp: '1730528500',
                      recipient_id: '919876543210'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .send(statusPayload);

      expect(res.status).toBe(200);

      // Verify status was updated in database
      const updatedMsg = await WhatsAppMessage.findOne({ messageId: 'wamid.OUTBOUND_OTP_999' });
      expect(updatedMsg.status).toBe('delivered');
      expect(updatedMsg.statusHistory.length).toBeGreaterThan(0);
      expect(updatedMsg.statusHistory[0].status).toBe('delivered');
    });
  });

  describe('GET /api/whatsapp/status - Diagnostic Info', () => {
    it('should return service health status', async () => {
      const res = await request(app).get('/api/whatsapp/status');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('active');
      expect(res.body.features.incomingMessages).toBe(true);
      expect(res.body.features.statusUpdates).toBe(true);
      expect(res.body.features.customerReplies).toBe(true);
      expect(res.body.features.otpReady).toBe(true);
    });
  });
});

