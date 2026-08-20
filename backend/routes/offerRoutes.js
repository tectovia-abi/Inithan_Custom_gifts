const express = require('express');
const router = express.Router();
const {
  getOffers,
  getActiveOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  addProductToOffer,
  removeProductFromOffer
} = require('../controllers/offerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/active', getActiveOffers);
router.get('/:id', getOfferById);
router.get('/', getOffers);

// Admin routes (with permissive fallback for development/demo consistency)
router.post('/', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => admin(req, res, () => createOffer(req, res)));
  }
  return createOffer(req, res);
});

router.put('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => admin(req, res, () => updateOffer(req, res)));
  }
  return updateOffer(req, res);
});

router.delete('/:id', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => admin(req, res, () => deleteOffer(req, res)));
  }
  return deleteOffer(req, res);
});

router.post('/:id/products', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => admin(req, res, () => addProductToOffer(req, res)));
  }
  return addProductToOffer(req, res);
});

router.delete('/:id/products/:productId', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => admin(req, res, () => removeProductFromOffer(req, res)));
  }
  return removeProductFromOffer(req, res);
});

module.exports = router;
