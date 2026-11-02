/**
 * category-pages.js — Interactive Catalog Loader & UX for Occasion/Category Pages
 * Powers: Love & Romance, Birthday, Special Occasions, For Her & Him,
 * Corporate Gifts, and Personalize Studio.
 */

const FALLBACK_IMG = 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png';

// Curated Fallbacks if database has fewer items for specific tags
const CURATED_SEED_PRODUCTS = {
  romance: [
    {
      _id: 'seed_rom_1',
      name: 'Custom Couple Spotify Acrylic Song Plaque with Wooden LED Base',
      category: '✨ Acrylic Gifts',
      price: 1299,
      discountPrice: 899,
      offerPercentage: 30,
      imageUrl: 'images/unique/unique_spotify_acrylic.jpg',
      occasions: ['Anniversary Gifts', 'Valentine Special', 'Love & Romance'],
      brand: 'Inithan Romance Studio'
    },
    {
      _id: 'seed_rom_2',
      name: 'Personalized Couple 3D Crystal Heart Glowing Lamp',
      category: '🖼️ Home Decor',
      price: 1599,
      discountPrice: 1199,
      offerPercentage: 25,
      imageUrl: 'images/unique/unique_glow_frame.jpg',
      occasions: ['Anniversary Gifts', 'Couple & Wedding'],
      brand: 'Inithan Romance Studio'
    },
    {
      _id: 'seed_rom_3',
      name: 'Magic Heart Red Couple Color Changing Mug',
      category: '☕ Drinkware',
      price: 699,
      discountPrice: 449,
      offerPercentage: 35,
      imageUrl: 'images/unique/unique_magic_mug.jpg',
      occasions: ['Valentine Special', 'Love & Romance'],
      brand: 'Inithan Drinkware'
    },
    {
      _id: 'seed_rom_4',
      name: 'Forever Love Carved Wooden Photo Plaque with Date & Names',
      category: '🪵 Wooden Gifts',
      price: 1099,
      discountPrice: 799,
      offerPercentage: 27,
      imageUrl: 'images/unique/unique_wood_engraving.jpg',
      occasions: ['Anniversary Gifts', 'Love & Romance'],
      brand: 'Inithan Woodcraft'
    },
    {
      _id: 'seed_rom_5',
      name: 'Custom Couple Photo Keychain with Calendar & Heart Charms',
      category: '🔑 Keychains & Accessories',
      price: 499,
      discountPrice: 299,
      offerPercentage: 40,
      imageUrl: 'images/unique/unique_photo_keychain.jpg',
      occasions: ['Valentine Special', 'Anniversary Gifts'],
      brand: 'Inithan Accessories'
    },
    {
      _id: 'seed_rom_6',
      name: 'Luxury Romantic Keepsake Combo: Red Heart Cushion + Mug + Frame',
      category: '🎁 Photo Gifts',
      price: 2499,
      discountPrice: 1699,
      offerPercentage: 32,
      imageUrl: 'images/occasions/occ_combo_hamper.jpg',
      occasions: ['Valentine Special', 'Anniversary Gifts', 'Love & Romance'],
      brand: 'Inithan Luxury Hampers'
    }
  ],
  birthday: [
    {
      _id: 'seed_bday_1',
      name: 'Personalized Birthday Photo Mosaic Frame with LED Backlight',
      category: '🎁 Photo Gifts',
      price: 1499,
      discountPrice: 999,
      offerPercentage: 33,
      imageUrl: 'images/occasions/occ_wooden_frame.jpg',
      occasions: ['Birthday Gifts', 'Photo Gifts'],
      brand: 'Inithan Birthday Studio'
    },
    {
      _id: 'seed_bday_2',
      name: 'Custom Happy Birthday Magic Mug with Golden Name Print',
      category: '☕ Drinkware',
      price: 699,
      discountPrice: 449,
      offerPercentage: 35,
      imageUrl: 'images/categories/mugs.jpg',
      occasions: ['Birthday Gifts'],
      brand: 'Inithan Drinkware'
    },
    {
      _id: 'seed_bday_3',
      name: 'Glowing Panda & Moon Touch Sensor LED Bedside Lamp',
      category: '🖼️ Home Decor',
      price: 1399,
      discountPrice: 899,
      offerPercentage: 35,
      imageUrl: 'images/occasions/occ_panda_lamp.jpg',
      occasions: ['Birthday Gifts', 'Kids Gifts'],
      brand: 'Inithan Lights'
    },
    {
      _id: 'seed_bday_4',
      name: 'Customized Birthday Celebration Luxury Gift Hamper with Chocolate & Mug',
      category: '🎂 Occasion Gifts',
      price: 2699,
      discountPrice: 1899,
      offerPercentage: 29,
      imageUrl: 'images/occasions/occ_luxury_hamper.jpg',
      occasions: ['Birthday Gifts'],
      brand: 'Inithan Hampers'
    },
    {
      _id: 'seed_bday_5',
      name: 'Personalized Engraved Stainless Steel Water Bottle / Tumbler',
      category: '☕ Drinkware',
      price: 999,
      discountPrice: 699,
      offerPercentage: 30,
      imageUrl: 'images/custom-mug.png',
      occasions: ['Birthday Gifts'],
      brand: 'Inithan Drinkware'
    },
    {
      _id: 'seed_bday_6',
      name: 'Customized Rubiks Photo Cube with 6 Custom Birthday Memories',
      category: '🎉 Party & Event Items',
      price: 899,
      discountPrice: 599,
      offerPercentage: 33,
      imageUrl: 'images/occasions/occ_rubiks_cube.jpg',
      occasions: ['Birthday Gifts'],
      brand: 'Inithan Creative Gifts'
    }
  ],
  occasions: [
    {
      _id: 'seed_occ_1',
      name: 'Royal Couple Wedding Keepsake Frame with Golden Embossed Date',
      category: '💍 Couple & Wedding Gifts',
      price: 1899,
      discountPrice: 1349,
      offerPercentage: 28,
      imageUrl: 'images/occasions/occ_wooden_frame.jpg',
      occasions: ['Wedding Gifts', 'Anniversary Gifts'],
      brand: 'Inithan Wedding Atelier'
    },
    {
      _id: 'seed_occ_2',
      name: 'Griha Pravesh Custom Acrylic LED Name Plate for Home Entrance',
      category: '✨ Acrylic Gifts',
      price: 1699,
      discountPrice: 1199,
      offerPercentage: 29,
      imageUrl: 'images/unique/unique_glow_frame.jpg',
      occasions: ['Housewarming Gifts', 'Home Decor'],
      brand: 'Inithan Home Decor'
    },
    {
      _id: 'seed_occ_3',
      name: 'Baby Birth Details Keepsake Frame with Footprint & Clock',
      category: '👶 Baby & Kids Gifts',
      price: 1499,
      discountPrice: 999,
      offerPercentage: 33,
      imageUrl: 'images/occasions/occ_daily_calendar.jpg',
      occasions: ['Baby Shower Gifts', 'Birth Milestones'],
      brand: 'Inithan Baby Studio'
    },
    {
      _id: 'seed_occ_4',
      name: 'Mom & Dad Special Engraved Wooden Desk Clock with Family Portrait',
      category: '🪵 Wooden Gifts',
      price: 1299,
      discountPrice: 899,
      offerPercentage: 30,
      imageUrl: 'images/unique/unique_wood_engraving.jpg',
      occasions: ['Parents Day', 'Anniversary Gifts'],
      brand: 'Inithan Woodcraft'
    },
    {
      _id: 'seed_occ_5',
      name: 'Festive Luxury Dry Fruit & Customized Memento Gift Box',
      category: '🪔 Festive & Diwali',
      price: 2199,
      discountPrice: 1599,
      offerPercentage: 27,
      imageUrl: 'images/occasions/occ_combo_hamper.jpg',
      occasions: ['Festive & Diwali', 'Special Occasions'],
      brand: 'Inithan Festive'
    },
    {
      _id: 'seed_occ_6',
      name: 'Custom Farewell / Achievement Trophy Plaque with Custom Citation',
      category: '🏆 Awards & Corporate',
      price: 1199,
      discountPrice: 799,
      offerPercentage: 33,
      imageUrl: 'images/categories/engravings.jpg',
      occasions: ['Farewell Gifts', 'Retirement Gifts'],
      brand: 'Inithan Trophies'
    }
  ],
  her_him: [
    {
      _id: 'seed_her_1',
      name: 'Engraved Name Bar Pendant Necklace with Rose Gold Plating',
      category: '✨ Personalized Jewelry',
      gender: 'her',
      price: 1199,
      discountPrice: 799,
      offerPercentage: 33,
      imageUrl: 'images/occasions/occ_engraved_pendant.jpg',
      occasions: ['For Her', 'Romantic Gifts'],
      brand: 'Inithan Jewelry'
    },
    {
      _id: 'seed_her_2',
      name: 'Personalized Leather Wallet with Engraved Name & Secret Love Note',
      category: '🔑 Keychains & Accessories',
      gender: 'her',
      price: 999,
      discountPrice: 649,
      offerPercentage: 35,
      imageUrl: 'images/occasions/occ_womens_wallet.jpg',
      occasions: ['For Her', 'Birthday Gifts'],
      brand: 'Inithan Leather'
    },
    {
      _id: 'seed_her_3',
      name: 'Custom Photo Heart Velvet Cushion with Magic Reversible Sequins',
      category: '🖼️ Home Decor',
      gender: 'her',
      price: 799,
      discountPrice: 499,
      offerPercentage: 37,
      imageUrl: 'images/occasions/occ_heart_cushion.jpg',
      occasions: ['For Her', 'Love & Romance'],
      brand: 'Inithan Home'
    },
    {
      _id: 'seed_him_1',
      name: 'Personalized Matte Black Stainless Steel Temperature Flask',
      category: '☕ Drinkware',
      gender: 'him',
      price: 899,
      discountPrice: 599,
      offerPercentage: 33,
      imageUrl: 'images/custom-mug.png',
      occasions: ['For Him', 'Birthday Gifts'],
      brand: 'Inithan Drinkware'
    },
    {
      _id: 'seed_him_2',
      name: 'Custom Engraved Men Genuine Leather Wallet & Keychain Combo Box',
      category: '🔑 Keychains & Accessories',
      gender: 'him',
      price: 1499,
      discountPrice: 999,
      offerPercentage: 33,
      imageUrl: 'images/unique/unique_photo_keychain.jpg',
      occasions: ['For Him', 'Anniversary Gifts'],
      brand: 'Inithan Leathercraft'
    },
    {
      _id: 'seed_him_3',
      name: 'Laser-Cut Wooden Desk Organizer with Mobile Stand & Name Engraving',
      category: '🪵 Wooden Gifts',
      gender: 'him',
      price: 1099,
      discountPrice: 749,
      offerPercentage: 31,
      imageUrl: 'images/categories/engravings.jpg',
      occasions: ['For Him', 'Corporate Gifts'],
      brand: 'Inithan Woodcraft'
    }
  ],
  corporate: [
    {
      _id: 'seed_corp_1',
      name: 'Executive Welcome Kit: Branded Diary + Metal Pen + 500ml Flask',
      category: '🏆 Awards & Corporate',
      price: 1899,
      discountPrice: 1299,
      offerPercentage: 31,
      imageUrl: 'images/categories/combo.jpg',
      occasions: ['Corporate Events', 'Bulk Orders'],
      brand: 'Inithan Executive'
    },
    {
      _id: 'seed_corp_2',
      name: 'Custom Crystal & Wooden Excellence Memento / Award Trophy',
      category: '🏆 Awards & Corporate',
      price: 1499,
      discountPrice: 999,
      offerPercentage: 33,
      imageUrl: 'images/categories/engravings.jpg',
      occasions: ['Corporate Events', 'Awards'],
      brand: 'Inithan Corporate'
    },
    {
      _id: 'seed_corp_3',
      name: 'Corporate Laser Engraved Metal Keychains with Company Logo (Pack)',
      category: '🔑 Keychains & Accessories',
      price: 399,
      discountPrice: 249,
      offerPercentage: 37,
      imageUrl: 'images/unique/unique_photo_keychain.jpg',
      occasions: ['Corporate Events', 'Bulk Orders'],
      brand: 'Inithan Laser'
    },
    {
      _id: 'seed_corp_4',
      name: 'Branded Thermal Coffee Mug with Spill-Proof Lid & Laser Etching',
      category: '☕ Drinkware',
      price: 799,
      discountPrice: 549,
      offerPercentage: 31,
      imageUrl: 'images/custom-mug.png',
      occasions: ['Corporate Events'],
      brand: 'Inithan Corporate'
    }
  ],
  personalize: [
    {
      _id: 'seed_pers_1',
      name: 'Personalized Magic Ceramic Mug — Color Reveal with Hot Drink',
      category: '☕ Drinkware',
      price: 699,
      discountPrice: 449,
      offerPercentage: 35,
      imageUrl: 'images/unique/unique_magic_mug.jpg',
      occasions: ['Personalize Studio', 'Custom Mug'],
      brand: 'Inithan Atelier'
    },
    {
      _id: 'seed_pers_2',
      name: 'Custom Multi-Photo Collage Wooden Frame (Up to 12 Photos)',
      category: '🎁 Photo Gifts',
      price: 1699,
      discountPrice: 1199,
      offerPercentage: 29,
      imageUrl: 'images/categories/frames.jpg',
      occasions: ['Personalize Studio', 'Photo Gifts'],
      brand: 'Inithan Photo Lab'
    },
    {
      _id: 'seed_pers_3',
      name: 'Custom 3D Warm LED Acrylic Name Lamp with Wooden Stand',
      category: '✨ Acrylic Gifts',
      price: 1299,
      discountPrice: 899,
      offerPercentage: 30,
      imageUrl: 'images/unique/unique_glow_frame.jpg',
      occasions: ['Personalize Studio', 'Lighting'],
      brand: 'Inithan Acrylics'
    },
    {
      _id: 'seed_pers_4',
      name: 'Custom Printed Cotton Cushion Pillow with Vibrant HD Sublimation',
      category: '🖼️ Home Decor',
      price: 699,
      discountPrice: 449,
      offerPercentage: 35,
      imageUrl: 'images/custom-pillow.png',
      occasions: ['Personalize Studio'],
      brand: 'Inithan Textile'
    },
    {
      _id: 'seed_pers_5',
      name: 'Heavy Double-Sided Metal Engraved Photo Keychain',
      category: '🔑 Keychains & Accessories',
      price: 499,
      discountPrice: 299,
      offerPercentage: 40,
      imageUrl: 'images/unique/unique_photo_keychain.jpg',
      occasions: ['Personalize Studio'],
      brand: 'Inithan Laser'
    },
    {
      _id: 'seed_pers_6',
      name: 'Custom Name & Photo Printed 100% Bio-Wash Cotton T-Shirt',
      category: '👕 Printing Services',
      price: 899,
      discountPrice: 599,
      offerPercentage: 33,
      imageUrl: 'images/custom-tshirt.png',
      occasions: ['Personalize Studio'],
      brand: 'Inithan Apparel'
    }
  ]
};

/**
 * Loads products for the active page, merging database catalog with curated items
 * @param {string} pageType - 'romance' | 'birthday' | 'occasions' | 'her_him' | 'corporate' | 'personalize'
 * @param {string} filterTag - optional sub-filter tag
 */
async function loadCategoryPageProducts(pageType, filterTag = 'all') {
  const grid = document.getElementById('categoryProductsGrid');
  if (!grid) return;

  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;

  // Render Skeleton / Loading state
  grid.innerHTML = Array(4).fill(0).map(() => `
    <div class="product-card skeleton" style="min-height:360px; background:#fff; border-radius:14px; padding:16px;">
      <div style="height:200px; background:#f1f5f9; border-radius:10px; margin-bottom:12px;"></div>
      <div style="height:16px; width:70%; background:#f1f5f9; border-radius:4px; margin-bottom:8px;"></div>
      <div style="height:20px; width:45%; background:#f1f5f9; border-radius:4px;"></div>
    </div>
  `).join('');

  let products = [];

  try {
    const res = await fetch(`${apiBase}/api/products`);
    const data = await res.json();
    if (data.success && Array.isArray(data.products)) {
      const activeProducts = data.products.filter(p => (p.status || 'Active') === 'Active');
      
      // Filter products based on page type
      if (pageType === 'romance') {
        products = activeProducts.filter(p => {
          const str = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.keywords||''}`.toLowerCase();
          return str.includes('romance') || str.includes('love') || str.includes('couple') || 
                 str.includes('anniversary') || str.includes('valentine') || str.includes('wedding');
        });
      } else if (pageType === 'birthday') {
        products = activeProducts.filter(p => {
          const str = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.keywords||''}`.toLowerCase();
          return str.includes('birthday') || str.includes('bday') || str.includes('party') || str.includes('cake');
        });
      } else if (pageType === 'occasions') {
        products = activeProducts.filter(p => {
          const str = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.keywords||''}`.toLowerCase();
          return str.includes('wedding') || str.includes('anniversary') || str.includes('housewarming') || 
                 str.includes('shower') || str.includes('festive') || str.includes('diwali') || str.includes('occasion');
        });
      } else if (pageType === 'her_him') {
        products = activeProducts.filter(p => {
          const str = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.keywords||''}`.toLowerCase();
          return str.includes('her') || str.includes('him') || str.includes('woman') || 
                 str.includes('men') || str.includes('wallet') || str.includes('jewelry') || str.includes('pendant');
        });
      } else if (pageType === 'corporate') {
        products = activeProducts.filter(p => {
          const str = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.keywords||''}`.toLowerCase();
          return str.includes('corporate') || str.includes('office') || str.includes('trophy') || 
                 str.includes('memento') || str.includes('bulk') || str.includes('award') || str.includes('employee');
        });
      } else if (pageType === 'personalize') {
        products = activeProducts.filter(p => {
          return p.allowCustomText || p.allowCustomImage || 
                 `${p.name} ${p.category}`.toLowerCase().includes('custom') ||
                 `${p.name} ${p.category}`.toLowerCase().includes('personalized');
        });
      }
    }
  } catch (err) {
    console.warn('API fetch warning, using curated catalog:', err);
  }

  // Augment with seed products so the category always has a full, vibrant catalog
  const seedList = CURATED_SEED_PRODUCTS[pageType] || [];
  const mergedProducts = [...products];
  seedList.forEach(seed => {
    if (!mergedProducts.some(p => p.name.toLowerCase() === seed.name.toLowerCase())) {
      mergedProducts.push(seed);
    }
  });

  // Apply sub-filter if given
  let displayed = mergedProducts;
  if (filterTag && filterTag !== 'all') {
    const term = filterTag.toLowerCase();
    displayed = mergedProducts.filter(p => {
      const fullText = `${p.name} ${p.category} ${(p.occasions||[]).join(' ')} ${p.gender||''}`.toLowerCase();
      return fullText.includes(term);
    });
  }

  renderCategoryCards(grid, displayed);
}

function renderCategoryCards(grid, list) {
  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background:#fff; border-radius:16px; border:1px solid #e5e7eb;">
        <span style="font-size:2.8rem; display:block; margin-bottom:12px;">🎁</span>
        <h4 style="font-size:1.2rem; font-weight:700; color:#1f2937; margin-bottom:8px;">No gifts found for this filter</h4>
        <p style="color:#6b7280; font-size:0.92rem; margin-bottom:20px;">Try switching to "All" or browse our full personalized collection.</p>
        <button onclick="switchCategoryFilter('all')" class="cat-btn-primary" style="margin:0 auto;">View All Gifts</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(p => {
    const imgSrc = p.imageUrl || FALLBACK_IMG;
    const brand = p.brand || p.category || 'Inithan Custom Gifts';
    const sellingPrice = Number(p.price) || 0;
    let displayPrice = sellingPrice;
    let hasDiscount = false;
    let pct = 0;

    if (p.offerPrice && Number(p.offerPrice) > 0 && Number(p.offerPrice) < sellingPrice) {
      displayPrice = Number(p.offerPrice);
      hasDiscount = true;
      pct = Math.round(((sellingPrice - displayPrice) / sellingPrice) * 100);
    } else if (p.discountPrice && Number(p.discountPrice) > 0 && Number(p.discountPrice) < sellingPrice) {
      displayPrice = Number(p.discountPrice);
      hasDiscount = true;
      pct = (p.offerPercentage && Number(p.offerPercentage) > 0)
        ? Number(p.offerPercentage)
        : Math.round(((sellingPrice - displayPrice) / sellingPrice) * 100);
    } else if (p.offerPercentage && Number(p.offerPercentage) > 0) {
      pct = Number(p.offerPercentage);
      displayPrice = Math.round(sellingPrice * (1 - pct / 100));
      hasDiscount = sellingPrice > displayPrice;
    }

    // Realistic rating
    const seed = (p.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rating = (4.3 + (seed % 6) * 0.1).toFixed(1);
    const reviews = 90 + (seed % 350);

    const detailUrl = p._id && !p._id.startsWith('seed_') 
      ? `product-details.html?id=${p._id}` 
      : `customize-product.html?product=${encodeURIComponent(p.name)}`;

    return `
      <div class="product-card" data-tags="${(p.occasions || []).join(',')}">
        <div class="p-card-media">
          ${hasDiscount && pct > 0 ? `<span class="product-badge sale">${pct}% OFF</span>` : ''}
          <a href="${detailUrl}" class="product-image" title="${p.name.replace(/"/g, '&quot;')}">
            <img src="${imgSrc}" alt="${p.name}" class="p-card-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
          </a>
          <a href="${detailUrl}" class="p-media-action" title="Customize this gift" aria-label="Customize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </a>
        </div>
        <div class="product-info">
          <div class="p-brand-row">
            <span class="p-brand-text">${brand}</span>
          </div>
          <a href="${detailUrl}" class="product-name-link" title="${p.name.replace(/"/g, '&quot;')}">
            <h3 class="product-name">${p.name}</h3>
          </a>
          <div class="product-rating">
            <span class="p-rating-score">${rating}</span>
            <span class="stars">★★★★★</span>
            <span class="count">(${reviews})</span>
          </div>
          <div class="product-price">
            <div class="price-main-wrap">
              <span class="p-price-sym">₹</span><span class="current">${displayPrice.toLocaleString('en-IN')}</span>
            </div>
            ${hasDiscount ? `
              <span class="p-mrp">₹${sellingPrice.toLocaleString('en-IN')}</span>
              <span class="p-discount-pct">(${pct}% off)</span>
            ` : ''}
          </div>
          <div class="p-delivery-tag">
            <span class="p-delivery-main">✨ Custom Photo / Engraving</span>
          </div>
          <div class="p-action-wrapper">
            <button onclick="handleCategoryAddToCart('${p.name.replace(/'/g, "\\'")}', ${displayPrice}, '${imgSrc}', '${p._id}', '${(p.category||'Custom').replace(/'/g, "\\'")}')" class="p-btn-add-cart">
              Add to cart
            </button>
            <a href="${detailUrl}" class="cat-btn-outline" style="padding:8px 14px; font-size:0.8rem; border-radius:8px; border-color:#e2e8f0; color:#374151; font-weight:700; text-align:center;">
              Customize
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleCategoryAddToCart(name, price, img, id, cat) {
  if (typeof addToCart === 'function') {
    addToCart(name, price, img, id, cat);
  } else {
    // Session cart fallback
    const items = typeof getUserCart === 'function' ? getUserCart() : [];
    items.push({ name, price, qty: 1, imageUrl: img, productId: id, category: cat });
    if (typeof saveUserCart === 'function') saveUserCart(items);
    if (typeof showNotification === 'function') {
      showNotification(`🎉 Added "${name}" to your cart!`);
    } else {
      alert(`Added ${name} to cart!`);
    }
  }
}

// Interactive Pill Switcher helper
function switchCategoryFilter(filterTerm, btnEl) {
  if (btnEl) {
    const parent = btnEl.parentElement;
    if (parent) {
      parent.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
  }
  const pageType = document.body.dataset.pageType;
  if (pageType) {
    loadCategoryPageProducts(pageType, filterTerm);
  }
}

// Corporate Bulk Calculator
function initCorporateCalc() {
  const qtyInput = document.getElementById('corpQty');
  const typeSelect = document.getElementById('corpProductType');
  const resultDisplay = document.getElementById('corpEstPrice');
  const discountDisplay = document.getElementById('corpDiscountTier');

  if (!qtyInput || !typeSelect || !resultDisplay) return;

  function recalculate() {
    const qty = parseInt(qtyInput.value) || 25;
    const basePrice = parseInt(typeSelect.value) || 500;

    let discountPercent = 10;
    if (qty >= 100) discountPercent = 25;
    else if (qty >= 50) discountPercent = 18;
    else if (qty >= 25) discountPercent = 12;

    const unitPrice = Math.round(basePrice * (1 - discountPercent / 100));
    const totalPrice = unitPrice * qty;

    resultDisplay.textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
    if (discountDisplay) {
      discountDisplay.textContent = `${discountPercent}% Bulk Discount Applied (₹${unitPrice}/unit)`;
    }
  }

  qtyInput.addEventListener('input', recalculate);
  typeSelect.addEventListener('change', recalculate);
  recalculate();
}

// WhatsApp Quick Inquiry
function openWhatsAppInquiry(defaultMsg) {
  const phone = '919944444834';
  const text = encodeURIComponent(defaultMsg || 'Hello Inithan Custom Gifts, I would like to inquire about personalized gifts.');
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}
