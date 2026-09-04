const express = require('express');
const router  = express.Router();
const { lookupPincode } = require('../services/addressService');

/**
 * GET /api/address/pincode/:pincode
 * Public endpoint — returns postal data for an Indian pincode.
 * Response: { valid, pincode, state, district, postOffices }
 */
router.get('/pincode/:pincode', async (req, res) => {
  const { pincode } = req.params;
  try {
    const result = await lookupPincode(pincode);
    if (!result.valid) {
      return res.status(422).json({ success: false, ...result });
    }
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('Address route error:', err);
    return res.status(500).json({ success: false, message: 'Pincode lookup failed.' });
  }
});

module.exports = router;
