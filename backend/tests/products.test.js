const request = require('supertest');
const app = require('../server');
const Product = require('../models/Product');

describe('Product API', () => {
  const testProduct = {
    name: 'Custom Photo Mug',
    code: 'MUG-123',
    description: 'A beautiful custom mug with your photo.',
    price: 15.99,
    category: 'Mugs',
    image: 'mug.jpg',
    inStock: true
  };

  let createdProductId;

  beforeEach(async () => {
    const product = await Product.create(testProduct);
    createdProductId = product._id;
  });

  describe('GET /api/products', () => {
    it('should fetch all products successfully', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0].name).toBe(testProduct.name);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch a single product by valid ID', async () => {
      const res = await request(app).get(`/api/products/${createdProductId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe(testProduct.name);
    });

    it('should return 404 for a valid but non-existent ID', async () => {
      const nonExistentId = '5f4dcc3b5aa765d61d8327deb882cf99'.slice(0, 24); // 24 hex char valid mongo id
      const res = await request(app).get(`/api/products/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return error for invalid ID format', async () => {
      const res = await request(app).get(`/api/products/invalid-id-format`);

      // Express usually throws CastError which controller handles as 500 or 400
      expect(res.statusCode).not.toBe(200);
      expect(res.body.success).toBe(false);
    });
  });
});
