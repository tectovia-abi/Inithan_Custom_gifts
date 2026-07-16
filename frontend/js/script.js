// ============================================
// INITHAT CUSTOM GIFTS - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  loadDatabaseProducts();
  initProductTabs();
  initCountdownTimer();
  initBackToTop();
  initSmoothScroll();
  initParallax();
  initHeartFall();
});

// ============================================
// PAGE LOADER
// ============================================
function initLoader() {
  const loader = document.getElementById('pageLoader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      // Trigger hero animations
      document.body.style.overflow = 'auto';
    }, 1500);
  });

  // Failsafe - hide loader after 4 seconds max
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

  // Deduplicate items to fix legacy duplicate entries and update storage
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
  const maxHearts = 35; 

  function createHeart() {
    const currentHearts = heroSection.querySelectorAll('.falling-heart').length;
    if (currentHearts >= maxHearts) return;

    const heart = document.createElement('div');
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.classList.add('falling-heart');
    
    // Small sizes: 10px to 22px
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

  window.addEventListener('scroll', () => {
    // Toggle scrolled class
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link highlighting
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

// ============================================
// MOBILE MENU
// ============================================
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');

    // Animate hamburger
    const spans = toggle.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      toggle.classList.remove('active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
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
// LOAD PRODUCTS FROM MONGODB DATABASE
// ============================================
async function loadDatabaseProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : 'http://127.0.0.1:5000';

  const renderProducts = (productList) => {
    grid.innerHTML = productList.map((p) => {
      const imgSrc = p.imageUrl || 'images/gift-box.png';
      const kw = (p.keywords || '').toLowerCase();
      let category = 'mugs';
      if (kw.includes('frame') || kw.includes('photo')) category = 'frames';
      else if (kw.includes('keychain') || kw.includes('jewelry') || kw.includes('accessory')) category = 'accessories';
      else if (kw.includes('tshirt') || kw.includes('apparel') || kw.includes('pillow')) category = 'apparel';

      const safeName = p.name.replace(/'/g, "\\'");

      return `
        <div class="product-card reveal active" data-category="${category}" style="display: block; opacity: 1; transform: none;">
          <span class="product-badge sale">HOT</span>
          <a href="product-details.html?id=${p._id}" class="product-image" style="display: block;">
            <img src="${imgSrc}" alt="${p.name}" onerror="this.src='images/gift-box.png'">
          </a>
          <div class="product-info">
            <span class="product-category">${p.code || 'GIFT'}</span>
            <a href="product-details.html?id=${p._id}" style="text-decoration: none;"><h3 class="product-name">${p.name}</h3></a>
            <div class="product-rating">
              <span class="stars">★★★★★</span>
              <span class="count">(Custom Gift)</span>
            </div>
            <div class="product-price">
              <span class="current">₹${Number(p.price).toLocaleString('en-IN')}</span>
            </div>
            <div style="display:flex; gap:10px; margin-top:15px;">
              <button onclick="addToCart('${safeName}', ${p.price}, '${imgSrc}', '${p._id}', '${p.category || 'Custom Gift'}')" style="flex:1; padding:8px; border:1px solid var(--primary, #C41E3A); background:transparent; color:var(--primary, #C41E3A); border-radius:6px; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s;">Add to Cart</button>
              <button onclick="buyNow('${p._id}', '${safeName}', ${p.price}, '${imgSrc}', '${p.category || 'Custom Gift'}')" style="flex:1; padding:8px; background:var(--primary, #C41E3A); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s;">Buy Now</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    initProductTabs();
  };

  const fallbackList = [
    { name: 'Personalized Photo Mug', code: 'MUG-001', price: 499, keywords: 'mug, photo, ceramic', imageUrl: 'images/custom-mug.png' },
    { name: 'Engraved Wooden Frame', code: 'FRM-002', price: 899, keywords: 'frame, wooden, photo', imageUrl: 'images/custom-frame.png' },
    { name: 'Engraved Metal Keychain', code: 'KEY-003', price: 349, keywords: 'keychain, metal, accessory', imageUrl: 'images/custom-keychain.png' },
    { name: 'Custom Printed Pillow', code: 'PIL-004', price: 699, keywords: 'pillow, cushion, apparel', imageUrl: 'images/custom-pillow.png' },
    { name: 'Custom Printed T-Shirt', code: 'TSH-005', price: 599, keywords: 'tshirt, apparel, fashion', imageUrl: 'images/custom-tshirt.png' },
    { name: 'Custom Gold Pendant', code: 'JWL-006', price: 1499, keywords: 'jewelry, pendant, accessory', imageUrl: 'images/custom-jewelry.png' }
  ];

  try {
    const res = await fetch(`${apiBase}/api/products`);
    const data = await res.json();

    if (data.success && data.products && data.products.length > 0) {
      renderProducts(data.products);
    } else {
      renderProducts(fallbackList);
    }
  } catch (err) {
    console.log('Backend connection offline, rendering fallback catalog items.', err);
    renderProducts(fallbackList);
  }
}

// ============================================
// PRODUCT FILTER TABS
// ============================================
function initProductTabs() {
  const tabs = document.querySelectorAll('.product-tab');
  const searchInput = document.getElementById('mainProductSearch');
  const checkboxes = document.querySelectorAll('.filter-item input[type="checkbox"]');
  
  if (!tabs.length && !searchInput) return;

  const applyFilter = () => {
    // Get active tab
    const activeTabEl = document.querySelector('.product-tab.active');
    const tabFilter = activeTabEl ? activeTabEl.dataset.filter : 'all';
    
    // Get search term
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // Get selected categories from sidebar
    const catCheckboxes = document.querySelectorAll('.cat-filter:checked');
    const selectedCats = Array.from(catCheckboxes).map(cb => cb.value);

    const products = document.querySelectorAll('.product-card');
    products.forEach((product, index) => {
      const category = product.dataset.category || '';
      const name = product.querySelector('.product-name') ? product.querySelector('.product-name').textContent.toLowerCase() : '';
      
      const matchTab = (tabFilter === 'all' || category === tabFilter);
      const matchSearch = name.includes(searchTerm) || category.includes(searchTerm);
      const matchSidebar = selectedCats.length === 0 || selectedCats.includes(category);
      
      if (matchTab && matchSearch && matchSidebar) {
        product.style.display = 'block';
        product.style.opacity = '1';
        product.style.animation = `fadeInUp 0.4s ease ${index * 0.04}s both`;
      } else {
        product.style.display = 'none';
      }
    });
  };

  if (tabs.length) {
    tabs.forEach(tab => {
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
      newTab.addEventListener('click', () => {
        document.querySelectorAll('.product-tab').forEach(t => t.classList.remove('active'));
        newTab.classList.add('active');
        applyFilter();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }

  if (checkboxes.length) {
    checkboxes.forEach(cb => cb.addEventListener('change', applyFilter));
  }

  // Init
  setTimeout(() => applyFilter(), 100);
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function initCountdownTimer() {
  // Set target date to 15 days from now
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

    document.getElementById('timerDays').textContent = String(days).padStart(2, '0');
    document.getElementById('timerHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('timerMins').textContent = String(mins).padStart(2, '0');
    document.getElementById('timerSecs').textContent = String(secs).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ============================================
// SHOPPING CART (User Session Integrated)
// ============================================
function addToCart(name, price, imageUrl, productId, category) {
  // Check if user is logged in using auth.js helper
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    showNotification('🔒 Please login to add items to your cart!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  // Get quantity if on PDP
  let qty = 1;
  const qtyEl = document.getElementById('pdpQty');
  if (qtyEl) {
    qty = parseInt(qtyEl.value) || 1;
  }

  const items = typeof getUserCart === 'function' ? getUserCart() : [];
  
  // Check if item already exists in cart to prevent duplicates
  const existingItemIndex = items.findIndex(item => item.name === name);
  if (existingItemIndex > -1) {
    items[existingItemIndex].qty = (items[existingItemIndex].qty || 1) + qty;
    if (imageUrl) items[existingItemIndex].imageUrl = imageUrl;
    if (productId) items[existingItemIndex].productId = productId;
    if (category) items[existingItemIndex].category = category;
  } else {
    items.push({ 
      name, 
      price, 
      qty, 
      addedAt: new Date().toISOString(),
      imageUrl: imageUrl || 'images/gift-box.png',
      productId: productId || null,
      category: category || 'Custom Gift'
    });
  }

  if (typeof saveUserCart === 'function') {
    saveUserCart(items);
  }

  updateCartCount();
  showNotification(`${name} added to cart! 🎉`);
}

function buyNow(name, price, imageUrl, productId, category) {
  // If called from the product grid (only id passed), redirect to product details page
  if (price === undefined) {
    const id = name;
    if (!id || id === 'undefined') {
      showNotification('Product details unavailable.');
      return;
    }
    window.location.href = `product-details.html?id=${id}`;
    return;
  }

  // Called from the Product Details Page: buyNow(name, price, imageUrl, productId, category)
  // Check if user is logged in
  if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
    showNotification('🔒 Please login to buy items!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }
  
  // Get quantity from PDP qty selector
  let qty = 1;
  const qtyEl = document.getElementById('pdpQty');
  if (qtyEl) {
    qty = parseInt(qtyEl.value) || 1;
  }

  // For 'Buy Now', replace cart with only this item at the selected quantity
  // This ensures checkout always shows exactly what the user intends to buy
  const buyNowCart = [{ 
    name, 
    price: Number(price), 
    qty, 
    addedAt: new Date().toISOString(),
    imageUrl: imageUrl || 'images/gift-box.png',
    productId: productId || null,
    category: category || 'Custom Gift'
  }];

  if (typeof saveUserCart === 'function') {
    saveUserCart(buyNowCart);
  }

  updateCartCount();
  
  // Redirect directly to Checkout
  window.location.href = 'checkout.html';
}

function updateCartCount() {
  const count = document.getElementById('cartCount');
  if (!count) return;

  const items = typeof getUserCart === 'function' ? getUserCart() : [];
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.qty) || 1), 0);
  count.textContent = totalQty;
  count.style.animation = 'none';
  count.offsetHeight; // Trigger reflow
  count.style.animation = 'cartBounce 0.5s ease';
}

// ============================================
// WISHLIST TOGGLE
// ============================================
function toggleWishlist(el) {
  el.classList.toggle('active');
  if (el.classList.contains('active')) {
    el.textContent = '♥';
    el.style.color = '#C41E3A';
    showNotification('Added to wishlist! ❤️');
  } else {
    el.textContent = '♡';
    el.style.color = '';
    showNotification('Removed from wishlist');
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message) {
  // Remove existing notification
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

  // Add fadeOut animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeOut {
      to { opacity: 0; transform: translateX(30px); }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}

// ============================================
// NEWSLETTER FORM
// ============================================
function handleNewsletter(event) {
  event.preventDefault();
  const email = document.getElementById('newsletterEmail').value;
  if (email) {
    showNotification(`Thanks for subscribing, ${email}! 🎉`);
    document.getElementById('newsletterEmail').value = '';
  }
}

// ============================================
// BACK TO TOP BUTTON
// ============================================
function initBackToTop() {
  const btn = document.getElementById('backToTop');

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
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
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
// CURSOR SPARKLE EFFECT (Optional Enhancement)
// ============================================
document.addEventListener('click', (e) => {
  createSparkle(e.clientX, e.clientY);
});

function createSparkle(x, y) {
  const sparkles = ['✨', '⭐', '💫', '🌟'];
  for (let i = 0; i < 3; i++) {
    const sparkle = document.createElement('div');
    sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    sparkle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      font-size: ${Math.random() * 10 + 8}px;
      z-index: 99999;
      animation: sparkleAnim 0.8s ease forwards;
    `;
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  }
}

// Add sparkle animation
const sparkleStyle = document.createElement('style');
sparkleStyle.textContent = `
  @keyframes sparkleAnim {
    0% {
      opacity: 1;
      transform: translate(0, 0) scale(1) rotate(0deg);
    }
    100% {
      opacity: 0;
      transform: translate(${Math.random() * 60 - 30}px, ${-Math.random() * 60 - 20}px) scale(0) rotate(180deg);
    }
  }
`;
document.head.appendChild(sparkleStyle);
