/**
 * addressService.js
 * Validates Indian pincodes via the free India Post API (api.postalpincode.in).
 * Falls back gracefully if the API is unreachable.
 */

const PINCODE_API = 'https://api.postalpincode.in/pincode';

/**
 * Look up a pincode and return { valid, state, district, postOffices }
 * @param {string} pincode
 * @returns {Promise<{valid:boolean, state?:string, district?:string, postOffices?:string[]}>}
 */
async function lookupPincode(pincode) {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return { valid: false, message: 'Pincode must be exactly 6 digits and cannot start with 0.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${PINCODE_API}/${pincode}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { valid: false, message: 'Pincode lookup service unavailable.' };
    }

    const data = await response.json();

    if (!Array.isArray(data) || data[0].Status !== 'Success') {
      return { valid: false, message: `Pincode ${pincode} not found in postal records.` };
    }

    const postOffices = data[0].PostOffice || [];
    if (postOffices.length === 0) {
      return { valid: false, message: `Pincode ${pincode} has no associated post offices.` };
    }

    // All post offices under one pincode share state + district
    const state    = postOffices[0].State    || '';
    const district = postOffices[0].District || '';
    const names    = postOffices.map(po => po.Name);

    return { valid: true, pincode, state, district, postOffices: names };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { valid: false, message: 'Pincode verification timed out. Please try again.' };
    }
    console.error('Pincode lookup error:', err.message);
    return { valid: false, message: 'Pincode verification service is currently unavailable.' };
  }
}

/**
 * Validate that a pincode matches the provided state and district.
 * @param {string} pincode
 * @param {string} state
 * @param {string} district
 * @returns {Promise<{valid:boolean, message?:string, data?:object}>}
 */
async function validatePincodeAgainstAddress(pincode, state, district) {
  const result = await lookupPincode(pincode);
  if (!result.valid) return result;

  const normalise = s => (s || '').toLowerCase().trim();

  if (normalise(result.state) !== normalise(state)) {
    return {
      valid: false,
      message: `Pincode ${pincode} belongs to ${result.state}, not ${state}.`,
      data: result,
    };
  }

  if (normalise(result.district) !== normalise(district)) {
    return {
      valid: false,
      message: `Pincode ${pincode} belongs to ${result.district} district, not ${district}.`,
      data: result,
    };
  }

  return { valid: true, data: result };
}

module.exports = { lookupPincode, validatePincodeAgainstAddress };
