// ============================================
// INITHAT CUSTOM GIFTS - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  loadDatabaseProducts();
  initCountdownTimer();
  initBackToTop();
  initSmoothScroll();
  initParallax();
  initHeartFall();
  initMobileFooterCollapse();
  initTestimonialsCarouselSync();
});

// ============================================
// PAGE LOADER
// ============================================
function initLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }, 1500);
  });

  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }, 4000);
}

// ============================================
// CART MANAGEMENT
// ============================================
function getUserCart() {
  const user = typeof isLoggedIn === 'function' && isLoggedIn() ? JSON.parse(localStorage.getItem('inithat_user')) : null;
  const storageKey = user ? `inithat_cart_${user.email}` : 'inithat_cart_guest';
  let items = JSON.parse(localStorage.getItem(storageKey)) || [];

  if (items.length > 0) {
    const mergedMap = new Map();
    items.forEach(item => {
      const qty = parseInt(item.qty) || 1;
      if (mergedMap.has(item.name)) {
        mergedMap.get(item.name).qty += qty;
      } else {
        mergedMap.set(item.name, { ...item, qty: qty });
      }
    });
    const dedupedItems = Array.from(mergedMap.values());
    if (dedupedItems.length !== items.length) {
      items = dedupedItems;
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }

  return items;
}

function saveUserCart(items) {
  const user = typeof isLoggedIn === 'function' && isLoggedIn() ? JSON.parse(localStorage.getItem('inithat_user')) : null;
  const storageKey = user ? `inithat_cart_${user.email}` : 'inithat_cart_guest';
  localStorage.setItem(storageKey, JSON.stringify(items));
}

// ============================================
// HEART FALL EFFECT
// ============================================
function initHeartFall() {
  const heroSection = document.querySelector('.hero-ref');
  if (!heroSection) return;
  
  const hearts = ['💕', '❤️', '💖', '💝', '🤍'];
  const maxHearts = window.innerWidth <= 768 ? 12 : 35; 

  function createHeart() {
    const currentHearts = heroSection.querySelectorAll('.falling-heart').length;
    if (currentHearts >= maxHearts) return;

    const heart = document.createElement('div');
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.classList.add('falling-heart');
    
    const size = Math.random() * 12 + 10;
    const left = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 3;
    const opacity = Math.random() * 0.5 + 0.3;
    const rotation = Math.random() * 360;

    heart.style.cssText = `
      position: absolute;
      top: -50px;
      left: ${left}%;
      font-size: ${size}px;
      opacity: ${opacity};
      animation: fallLogo ${duration}s linear ${delay}s forwards;
      z-index: 1;
      pointer-events: none;
      transform: rotate(${rotation}deg);
    `;

    heroSection.appendChild(heart);

    setTimeout(() => {
      if (heart.parentNode) {
        heart.remove();
      }
    }, (duration + delay) * 1000);
  }

  for (let i = 0; i < 20; i++) {
    setTimeout(createHeart, i * 200);
  }

  setInterval(createHeart, 400);
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks') || document.getElementById('navMenu') || document.querySelector('.nav-links') || document.querySelector('.nav-menu');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');

    const spans = toggle.querySelectorAll('span');
    if (spans && spans.length >= 3) {
      if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      toggle.classList.remove('active');
      const spans = toggle.querySelectorAll('span');
      if (spans && spans.length >= 3) {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  });
}

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

// ============================================
// LOAD PRODUCTS & DYNAMIC FILTERS FROM DATABASE
// ============================================
let allStorefrontProducts = [];

async function loadStorefrontFilters() {
  const catContainer = document.getElementById('sidebarCategoryFilters');
  const occContainer = document.getElementById('sidebarOccasionFilters');
  const clearBtn = document.getElementById('clearFiltersBtn');
  const sidebar = document.querySelector('.products-sidebar');
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;

  if (!catContainer && !occContainer) return;

  // 1. Fetch Categories from DB
  if (catContainer) {
    try {
      const res = await fetch(`${apiBase}/api/categories`);
      const data = await res.json();
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        catContainer.innerHTML = data.categories.map(cat => `
          <label class="filter-item">
            <input type="checkbox" value="${cat.name.replace(/"/g, '&quot;')}" class="cat-filter-db">
            <span>${cat.name}</span>
          </label>
        `).join('');
      } else {
        catContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--gray-400);">No categories found</span>';
      }
    } catch (err) {
      console.error('Error loading storefront categories:', err);
      catContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--gray-400);">Failed to load categories</span>';
    }
  }

  // 2. Fetch Occasions from DB
  if (occContainer) {
    try {
      const res = await fetch(`${apiBase}/api/occasions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.occasions) && data.occasions.length > 0) {
        occContainer.innerHTML = data.occasions.map(occ => `
          <label class="filter-item">
            <input type="checkbox" value="${occ.name.replace(/"/g, '&quot;')}" class="occ-filter-db">
            <span>${occ.name}</span>
          </label>
        `).join('');
      } else {
        occContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--gray-400);">No occasions found</span>';
      }
    } catch (err) {
      console.error('Error loading storefront occasions:', err);
      occContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--gray-400);">Failed to load occasions</span>';
    }
  }

  // 3. Attach change listener to sidebar for live filtering when ANY checkbox is toggled
  if (sidebar && !sidebar.dataset.bound) {
    sidebar.dataset.bound = 'true';
    sidebar.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'checkbox') {
        applyStorefrontFilters();
      }
    });
  }

  // 4. Clear Filters Handler
  if (clearBtn) {
    clearBtn.onclick = () => {
      const searchInput = document.getElementById('mainProductSearch');
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.cat-filter-db, .occ-filter-db, .price-filter-db').forEach(cb => cb.checked = false);
      applyStorefrontFilters();
      if (typeof _updateMobileBadge === 'function') _updateMobileBadge();
    };
  }

  // Add search input listener
  const searchInput = document.getElementById('mainProductSearch');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', applyStorefrontFilters);
  }

  // Initialize filter UX enhancements (Show More, mobile drawer, scroll shadows)
  if (typeof initProductsFilterUX === 'function' && !document.body.dataset.filterUxInit) {
    document.body.dataset.filterUxInit = 'true';
    initProductsFilterUX();
  } else if (typeof initFilterShowMore === 'function') {
    initFilterShowMore();
  }
}

async function loadDatabaseProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : window.location.origin;

  // Set up event delegation on grid for Add to Cart & Buy Now buttons (CSP safe)
  if (!grid.dataset.bound) {
    grid.dataset.bound = 'true';
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);
      const img = btn.dataset.img;
      const cat = btn.dataset.cat;

      if (action === 'add-cart') {
        addToCart(name, price, img, id, cat);
      } else if (action === 'buy-now') {
        buyNow(id);
      }
    });
  }

  loadStorefrontFilters();

  try {
    const res = await fetch(`${apiBase}/api/products`);
    const data = await res.json();

    if (data.success && Array.isArray(data.products)) {
      allStorefrontProducts = data.products.filter(p => (p.status || 'Active') === 'Active');
      renderStorefrontProducts(allStorefrontProducts);
    } else {
      allStorefrontProducts = [];
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-600); font-size: 1.1rem; font-weight: 500;">No products found in catalog. Add products in the admin panel to publish them here!</div>';
    }
  } catch (err) {
    console.error('Error loading storefront products:', err);
    allStorefrontProducts = [];
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-600); font-size: 1.1rem; font-weight: 500;">Unable to connect to server. Please check backend.</div>';
  }
}

function renderStorefrontProducts(productList) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (!productList || productList.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-600); font-size: 1.1rem; font-weight: 500;">No products match your selected filters.</div>';
    return;
  }

  const FALLBACK_IMG = 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png';

  grid.innerHTML = productList.map((p) => {
    const imgSrc = p.imageUrl || FALLBACK_IMG;
    const categoryName = p.category || 'Custom Gift';
    const subCatName = p.subCategory ? ` / ${p.subCategory}` : '';
    const occasionsList = Array.isArray(p.occasions) ? p.occasions : [];
    
    const sellingPrice = Number(p.price) || 0;
    
    // Priority: 1. Specific Occasion Offer Price -> 2. Product discountPrice -> 3. Base price
    let displayPrice = sellingPrice;
    let hasOffer = false;
    let badgeText = '';

    if (p.offerPrice && Number(p.offerPrice) > 0 && Number(p.offerPrice) < sellingPrice) {
      displayPrice = Number(p.offerPrice);
      hasOffer = true;
      const calcPct = Math.round(((sellingPrice - displayPrice) / sellingPrice) * 100);
      badgeText = p.offerBadge || `${calcPct}% OFF`;
    } else if (p.discountPrice && Number(p.discountPrice) > 0 && Number(p.discountPrice) < sellingPrice) {
      displayPrice = Number(p.discountPrice);
      hasOffer = true;
      badgeText = p.offerPercentage > 0 ? `${p.offerPercentage}% OFF` : 'SALE';
    } else if (p.offerPercentage && Number(p.offerPercentage) > 0) {
      hasOffer = true;
      badgeText = `${p.offerPercentage}% OFF`;
    }

    return `
      <div class="product-card reveal active" 
           data-category="${(p.category || '').toLowerCase()}"
           data-code="${(p.code || '').toLowerCase()}"
           data-occasions="${occasionsList.join(',').toLowerCase()}"
           data-price="${displayPrice}"
           style="display: block; opacity: 1; transform: none;">
        ${hasOffer ? `<span class="product-badge sale" style="background:#C41E3A;">${badgeText}</span>` : ''}
        <a href="product-details.html?id=${p._id}" class="product-image" style="display: block;">
          <img src="${imgSrc}" alt="${p.name}" class="p-card-img" data-fallback="${FALLBACK_IMG}">
        </a>
        <div class="product-info">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-category" style="font-size:0.75rem; font-weight:700; color:var(--primary);">${p.code || 'GIFT'}</span>
            <span style="font-size:0.75rem; color:#64748b; font-weight:500;">${categoryName}${subCatName}</span>
          </div>
          <a href="product-details.html?id=${p._id}" style="text-decoration: none;"><h3 class="product-name">${p.name}</h3></a>
          
          ${occasionsList.length > 0 ? `
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin: 6px 0;">
              ${occasionsList.slice(0, 2).map(occ => `<span style="font-size:0.7rem; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:2px 6px; border-radius:10px; font-weight:600;">${occ}</span>`).join('')}
              ${occasionsList.length > 2 ? `<span style="font-size:0.7rem; color:#64748b;">+${occasionsList.length - 2} more</span>` : ''}
            </div>
          ` : ''}

          <div class="product-rating" style="margin-top:4px;">
            <span class="stars">★★★★★</span>
            <span class="count">(Custom Gift)</span>
          </div>
          <div class="product-price" style="display:flex; align-items:baseline; gap:8px; margin-top:8px;">
            <span class="current" style="font-size:1.15rem; font-weight:800; color:var(--dark);">₹${displayPrice.toLocaleString('en-IN')}</span>
            ${hasOffer && sellingPrice > displayPrice ? `<span style="text-decoration:line-through; color:#94a3b8; font-size:0.85rem;">₹${sellingPrice.toLocaleString('en-IN')}</span>` : ''}
          </div>
          <div style="display:flex; gap:10px; margin-top:12px;">
            <button data-action="add-cart" data-id="${p._id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-price="${displayPrice}" data-img="${imgSrc}" data-cat="${categoryName.replace(/"/g, '&quot;')}" style="flex:1; padding:8px; border:1px solid var(--primary, #C41E3A); background:transparent; color:var(--primary, #C41E3A); border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s;">Add to Cart</button>
            <button data-action="buy-now" data-id="${p._id}" style="flex:1; padding:8px; background:var(--primary, #C41E3A); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s;">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('img.p-card-img').forEach(img => {
    img.addEventListener('error', function() {
      this.src = this.dataset.fallback || FALLBACK_IMG;
    });
  });
}

function applyStorefrontFilters() {
  const searchInput = document.getElementById('mainProductSearch');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const selectedCategories = Array.from(document.querySelectorAll('.cat-filter-db:checked')).map(cb => cb.value.toLowerCase());
  const selectedOccasions = Array.from(document.querySelectorAll('.occ-filter-db:checked')).map(cb => cb.value.toLowerCase());
  const selectedPrices = Array.from(document.querySelectorAll('.price-filter-db:checked')).map(cb => cb.value);

  if (!allStorefrontProducts || allStorefrontProducts.length === 0) return;

  const filtered = allStorefrontProducts.filter(p => {
    // 1. Search filter
    const nameStr = (p.name || '').toLowerCase();
    const codeStr = (p.code || '').toLowerCase();
    const catStr = (p.category || '').toLowerCase();
    const subCatStr = (p.subCategory || '').toLowerCase();
    const occStr = (Array.isArray(p.occasions) ? p.occasions.join(' ') : '').toLowerCase();
    const kwStr = (p.keywords || '').toLowerCase();

    const matchesSearch = !searchTerm || 
      nameStr.includes(searchTerm) || 
      codeStr.includes(searchTerm) || 
      catStr.includes(searchTerm) || 
      subCatStr.includes(searchTerm) || 
      occStr.includes(searchTerm) || 
      kwStr.includes(searchTerm);

    // 2. Category filter
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(catStr);

    // 3. Occasion filter
    const pOccasions = (Array.isArray(p.occasions) ? p.occasions : []).map(o => o.toLowerCase());
    const matchesOccasion = selectedOccasions.length === 0 || selectedOccasions.some(sel => pOccasions.includes(sel));

    // 4. Price range filter
    const price = Number(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price) || 0;
    let matchesPrice = selectedPrices.length === 0;
    if (!matchesPrice) {
      if (selectedPrices.includes('under500') && price < 500) matchesPrice = true;
      if (selectedPrices.includes('500to1000') && price >= 500 && price <= 1000) matchesPrice = true;
      if (selectedPrices.includes('over1000') && price > 1000) matchesPrice = true;
    }

    return matchesSearch && matchesCategory && matchesOccasion && matchesPrice;
  });

  renderStorefrontProducts(filtered);
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function initCountdownTimer() {
  // If on offers.html (which manages dynamic API-driven countdown timer per offer), do not run legacy generic timer
  if (document.getElementById('offerProductsGrid') || window.location.pathname.includes('offers.html')) {
    return;
  }

  const daysEl = document.getElementById('timerDays');
  if (!daysEl) return;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 15);

  function updateTimer() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    const hEl = document.getElementById('timerHours');
    const mEl = document.getElementById('timerMins');
    const sEl = document.getElementById('timerSecs');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ============================================
// SHOPPING CART (User Session Integrated)
// ============================================
function addToCart(name, price, imageUrl, productId, category) {
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    showNotification('🔒 Please login to add items to your cart!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  let qty = 1;
  const qtyEl = document.getElementById('pdpQty');
  if (qtyEl) {
    qty = parseInt(qtyEl.value) || 1;
  }

  let customText = '';
  const customTextEl = document.getElementById('customerCustomText');
  if (customTextEl) {
    customText = customTextEl.value.trim();
  }

  let customImages = [];
  if (typeof customerPhotosData !== 'undefined' && Array.isArray(customerPhotosData)) {
    customImages = customerPhotosData.filter(Boolean);
  }

  const items = typeof getUserCart === 'function' ? getUserCart() : [];
  
  const existingItemIndex = items.findIndex(item => item.name === name);
  if (existingItemIndex > -1) {
    items[existingItemIndex].qty = (items[existingItemIndex].qty || 1) + qty;
    if (imageUrl) items[existingItemIndex].imageUrl = imageUrl;
    if (productId) items[existingItemIndex].productId = productId;
    if (category) items[existingItemIndex].category = category;
    if (customText) items[existingItemIndex].customText = customText;
    if (customImages.length) items[existingItemIndex].customImages = customImages;
  } else {
    items.push({ 
      name, 
      price, 
      qty, 
      addedAt: new Date().toISOString(),
      imageUrl: imageUrl || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png',
      productId: productId || null,
      category: category || 'Custom Gift',
      customText: customText || '',
      customImages: customImages || []
    });
  }

  if (typeof saveUserCart === 'function') {
    saveUserCart(items);
  }

  updateCartCount();
  showNotification(`${name} added to cart! 🎉`);
}

function buyNow(name, price, imageUrl, productId, category) {
  if (price === undefined) {
    const id = name;
    if (!id || id === 'undefined') {
      showNotification('Product details unavailable.');
      return;
    }
    window.location.href = `product-details.html?id=${id}`;
    return;
  }

  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    showNotification('🔒 Please login to buy items!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }
  
  let qty = 1;
  const qtyEl = document.getElementById('pdpQty');
  if (qtyEl) {
    qty = parseInt(qtyEl.value) || 1;
  }

  let customText = '';
  const customTextEl = document.getElementById('customerCustomText');
  if (customTextEl) {
    customText = customTextEl.value.trim();
  }

  let customImages = [];
  if (typeof customerPhotosData !== 'undefined' && Array.isArray(customerPhotosData)) {
    customImages = customerPhotosData.filter(Boolean);
  }

  const buyNowCart = [{ 
    name, 
    price: Number(price), 
    qty, 
    addedAt: new Date().toISOString(),
    imageUrl: imageUrl || 'https://inithan-custom-gifts-prod-651484323514-eu-north-1-an.s3.eu-north-1.amazonaws.com/static/gift-box.png',
    productId: productId || null,
    category: category || 'Custom Gift',
    customText: customText || '',
    customImages: customImages || []
  }];

  if (typeof saveUserCart === 'function') {
    saveUserCart(buyNowCart);
  }

  updateCartCount();
  window.location.href = 'checkout.html';
}

function updateCartCount() {
  const count = document.getElementById('cartCount');
  if (!count) return;

  const items = typeof getUserCart === 'function' ? getUserCart() : [];
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);
  count.textContent = totalQty;
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: linear-gradient(135deg, #1A1A2E, #2C2C4E);
    color: white;
    padding: 16px 28px;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    z-index: 10000;
    animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.5s forwards;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    border-left: 4px solid #D4A853;
    font-family: 'Inter', sans-serif;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// ============================================
// PARALLAX EFFECT
// ============================================
function initParallax() {
  const heroImg = document.querySelector('.hero-ref-img');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (heroImg && scrolled < window.innerHeight) {
      heroImg.style.transform = `translateY(${scrolled * 0.05}px) rotate(-0.5deg)`;
    }
  });
}

// ============================================
// MOBILE FOOTER ACCORDION COLLAPSE
// ============================================
function initMobileFooterCollapse() {
  if (window.innerWidth > 768) return;
  const headers = document.querySelectorAll('.footer-col h4');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const list = header.nextElementSibling;
      if (list && list.tagName === 'UL') {
        const isOpen = list.style.display === 'block';
        list.style.display = isOpen ? 'none' : 'block';
        header.classList.toggle('collapsed-active', !isOpen);
      }
    });
    const list = header.nextElementSibling;
    if (list && list.tagName === 'UL') {
      list.style.display = 'none';
    }
  });
}

function initTestimonialsCarouselSync() {
  // Testimonials helper if present
}
