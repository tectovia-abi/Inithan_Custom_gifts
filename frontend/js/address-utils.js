/**
 * address-utils.js
 * Shared utility for State dropdown, District dropdown, and Distance/Zone-based Shipping Fee Calculation.
 */

(function () {
  /**
   * Distance/Zone-based Shipping Fee Calculator
   * Origin: Tamil Nadu, India
   * @param {string} state
   * @returns {{ fee: number, zoneName: string, description: string, distanceTier: string }}
   */
  function getShippingFee(state) {
    const normState = (state || '').toLowerCase().trim();

    if (!state) {
      return {
        fee: 40,
        zoneName: 'Local Zone (Tamil Nadu / Puducherry)',
        description: 'Standard local delivery (1-3 days)',
        distanceTier: '0 - 400 km'
      };
    }

    // Zone 1: Local / Home State & UT (0 - 400 km) -> ₹40
    const zone1 = ['tamil nadu', 'puducherry'];
    if (zone1.some(s => normState.includes(s))) {
      return {
        fee: 40,
        zoneName: 'Local Zone (Tamil Nadu / Puducherry)',
        description: 'Fast local delivery (1-3 days)',
        distanceTier: '0 - 400 km'
      };
    }

    // Zone 2: South India Regional (400 - 900 km) -> ₹60
    const zone2 = ['kerala', 'karnataka', 'andhra pradesh', 'telangana'];
    if (zone2.some(s => normState.includes(s))) {
      return {
        fee: 60,
        zoneName: 'South India Regional Zone',
        description: 'Regional express delivery (2-4 days)',
        distanceTier: '400 - 900 km'
      };
    }

    // Zone 3: Remote / Special Regions / Islands / Hill Stations -> ₹120
    const zone3 = [
      'jammu and kashmir', 'ladakh', 'himachal pradesh', 'uttarakhand',
      'assam', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim',
      'andaman and nicobar islands', 'lakshadweep'
    ];
    if (zone3.some(s => normState.includes(s))) {
      return {
        fee: 120,
        zoneName: 'Special / Remote Zone (Hills, North-East, Islands)',
        description: 'Special zone delivery (4-7 days)',
        distanceTier: '1500+ km / Hills / Islands'
      };
    }

    // Zone 4: Rest of India (900+ km) -> ₹80
    return {
      fee: 80,
      zoneName: 'National Zone (Rest of India)',
      description: 'Standard national delivery (3-5 days)',
      distanceTier: '900 - 1500 km'
    };
  }

  /**
   * Populate State select dropdown
   */
  function populateStates(stateSelect, selectedState = '') {
    if (!stateSelect || !window.INDIA_LOCATION_DATA) return;
    
    const states = Object.keys(window.INDIA_LOCATION_DATA).sort();
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    states.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      if (state.toLowerCase() === (selectedState || '').toLowerCase()) {
        opt.selected = true;
      }
      stateSelect.appendChild(opt);
    });
  }

  /**
   * Populate District dropdown based on selected State
   */
  function populateDistricts(districtSelect, stateName, selectedDistrict = '') {
    if (!districtSelect) return;
    districtSelect.innerHTML = '<option value="">Select District</option>';
    
    if (!stateName || !window.INDIA_LOCATION_DATA || !window.INDIA_LOCATION_DATA[stateName]) {
      districtSelect.disabled = true;
      return;
    }

    districtSelect.disabled = false;
    const districts = (window.INDIA_LOCATION_DATA[stateName] || []).slice().sort();
    
    districts.forEach(dist => {
      const opt = document.createElement('option');
      opt.value = dist;
      opt.textContent = dist;
      if (dist.toLowerCase() === (selectedDistrict || '').toLowerCase()) {
        opt.selected = true;
      }
      districtSelect.appendChild(opt);
    });
  }

  /**
   * Initialize a complete shipping address form with state, district, city and live shipping fee calculation
   */
  function initAddressForm(options) {
    const {
      stateSelectId = 'state',
      districtSelectId = 'district',
      pincodeInputId = 'pincode',
      statusElementId = 'pincodeStatus',
      onShippingChange = null,
      initialState = 'Tamil Nadu',
      initialDistrict = '',
      initialPincode = ''
    } = options;

    const stateSelect = document.getElementById(stateSelectId);
    const districtSelect = document.getElementById(districtSelectId);
    const pincodeInput = document.getElementById(pincodeInputId);
    const statusEl = document.getElementById(statusElementId);

    function updateShippingForState(state) {
      const shippingInfo = getShippingFee(state);
      if (onShippingChange) {
        onShippingChange(shippingInfo);
      }
    }

    if (stateSelect) {
      populateStates(stateSelect, initialState);

      stateSelect.addEventListener('change', () => {
        const selectedState = stateSelect.value;
        populateDistricts(districtSelect, selectedState);
        updateShippingForState(selectedState);
      });
    }

    if (districtSelect) {
      if (initialState) {
        populateDistricts(districtSelect, initialState, initialDistrict);
      } else {
        districtSelect.disabled = true;
      }
    }

    if (pincodeInput) {
      if (initialPincode) {
        pincodeInput.value = initialPincode;
      }

      pincodeInput.addEventListener('input', (e) => {
        // Enforce 6 digits max
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        if (statusEl) {
          if (e.target.value.length === 6) {
            statusEl.style.display = 'none';
          }
        }
      });
    }

    // Trigger initial shipping calculation
    if (initialState) {
      updateShippingForState(initialState);
    }

    return {
      getShippingFee: (s) => getShippingFee(s || (stateSelect ? stateSelect.value : '')),
      populateStates: (s) => populateStates(stateSelect, s),
      populateDistricts: (s, d) => populateDistricts(districtSelect, s, d)
    };
  }

  // Export globally
  window.AddressUtils = {
    getShippingFee,
    populateStates,
    populateDistricts,
    initAddressForm
  };
})();
