/**
 * auth.js — Professional Session & Auth State Manager
 * Handles user authentication, session persistence, cookies/localStorage,
 * and user-specific shopping cart management.
 */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
  ? 'http://127.0.0.1:8081'
  : window.location.origin;

// ── Cookie Helper Functions (Professional Session Fallback) ──────────────────
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}

function eraseCookie(name) {
  document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
}

// ── Read Auth State ──────────────────────────────────────────────────────────
function getAuthUser() {
  try {
    const userStr = localStorage.getItem('inithat_user') || sessionStorage.getItem('inithat_user') || getCookie('inithat_user');
    const token = localStorage.getItem('inithat_token') || sessionStorage.getItem('inithat_token') || getCookie('inithat_token');
    if (userStr && token && userStr !== 'undefined' && token !== 'undefined') {
      const user = JSON.parse(userStr);
      if (user && (user.id || user._id || user.email)) {
        return user;
      }
    }
  } catch (e) {
    console.error('Error parsing auth user session:', e);
  }
  return null;
}

function isLoggedIn() {
  return !!getAuthUser();
}



// ── Save Session ─────────────────────────────────────────────────────────────
function saveAuthSession(user, token, rememberMe = true) {
  const userStr = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem('inithat_user', userStr);
    localStorage.setItem('inithat_token', token);
    setCookie('inithat_user', userStr, 7);
    setCookie('inithat_token', token, 7);
  } else {
    sessionStorage.setItem('inithat_user', userStr);
    sessionStorage.setItem('inithat_token', token);
    setCookie('inithat_user', userStr, 1);
    setCookie('inithat_token', token, 1);
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('inithat_token');
  localStorage.removeItem('inithat_user');
  sessionStorage.removeItem('inithat_token');
  sessionStorage.removeItem('inithat_user');
  eraseCookie('inithat_token');
  eraseCookie('inithat_user');
  window.location.href = 'login.html';
}

// ── User-Specific Cart Session Management ────────────────────────────────────
function getUserCartKey() {
  const user = getAuthUser();
  if (!user) return null;
  const identifier = user.id || user._id || user.email || 'guest';
  return `inithat_cart_${identifier}`;
}

function getUserCart() {
  const cartKey = getUserCartKey();
  if (!cartKey) return [];
  try {
    const data = localStorage.getItem(cartKey) || sessionStorage.getItem(cartKey);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveUserCart(cartItems) {
  const cartKey = getUserCartKey();
  if (!cartKey) return;
  const data = JSON.stringify(cartItems);
  localStorage.setItem(cartKey, data);
  sessionStorage.setItem(cartKey, data);
}

// ── Update Navbar Elements Based on Auth Credentials ─────────────────────────
function updateNavbar() {
  const user = getAuthUser();

  const loginBtn = document.getElementById('navLoginBtn');
  const signupBtn = document.getElementById('navSignupBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const userGreet = document.getElementById('navUserGreet');
  const cartEl = document.getElementById('navCart');
  const cartCount = document.getElementById('cartCount');

  if (user) {
    // LOGGED IN: Hide Login & Signup. Show Avatar & Cart.
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none'; // Hide standalone logout button since it's in the dropdown now
    if (cartEl) {
      cartEl.style.display = 'flex';
      cartEl.style.cursor = 'pointer';
      cartEl.onclick = () => window.location.href = 'cart.html';
    }

    if (userGreet) {
      userGreet.style.display = 'inline-flex';
      userGreet.style.alignItems = 'center';
      userGreet.style.position = 'relative'; // Important for absolute positioning of dropdown
      userGreet.style.overflow = 'visible';

      const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
      const initial = firstName.charAt(0).toUpperCase();

      userGreet.innerHTML = `
        <div class="user-avatar-container" id="userAvatarContainer">
          <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--gold, #D4A853); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 2px solid white;">
            ${initial}
          </div>
          <span style="color: var(--dark, #1A1A2E); font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 4px;">
            Hi, ${firstName} <span style="font-size: 0.7rem;">▼</span>
          </span>
          <div id="avatarDropdown" class="avatar-dropdown-menu">
            <div style="padding: 15px; border-bottom: 1px solid var(--gray-200, #E8E8E8); background: var(--off-white, #FFF8F0);">
              <strong style="color: var(--dark, #1A1A2E); font-size: 1rem; display: block;">${user.fullName || 'User'}</strong>
              <span style="color: var(--gray-500, #6B6B6B); font-size: 0.8rem;">${user.email || ''}</span>
            </div>
            <ul>
              ${user.isAdmin ? `<li><a href="admin-dashboard.html" class="admin-link">👑 Admin Dashboard</a></li>` : ''}
              <li><a href="#">📦 My Retail Orders</a></li>
              <li><a href="my-bulk-orders.html">🏢 My Bulk Inquiries</a></li>
              <li><a href="cart.html">🛒 My Cart</a></li>
              <li><a href="#">👤 My Profile</a></li>
              <li><a href="#">🔒 Change Password</a></li>
              <li><a href="#" data-action="logout" class="logout-link">🚪 Logout</a></li>
            </ul>
          </div>
        </div>
      `;
    }

    // Update cart count for logged in user
    if (cartCount) {
      const items = getUserCart();
      cartCount.textContent = items.length;
    }
  } else {
    // LOGGED OUT: Show Login & Signup. Hide Logout, Greeting, AND CART!
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (signupBtn) signupBtn.style.display = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (cartEl) cartEl.style.display = 'none'; // HIDE CART WHEN NOT LOGGED IN!
    if (userGreet) userGreet.style.display = 'none';
  }
}

// ── Avatar Dropdown & Logout Event Delegation (CSP compliant) ───────────────
document.addEventListener('click', function (event) {
  const avatarContainer = event.target.closest('#userAvatarContainer');
  const dropdown = document.getElementById('avatarDropdown');
  
  if (avatarContainer) {
    // Toggle dropdown visibility when clicking the avatar container
    if (dropdown && !event.target.closest('.avatar-dropdown-menu')) {
      event.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  } else {
    // Clicked outside the avatar container — hide the dropdown
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }

  // Handle Logout Action
  const logoutLink = event.target.closest('[data-action="logout"]');
  if (logoutLink) {
    event.preventDefault();
    logout();
  }
});


// Run updateNavbar on DOM ready and on load
document.addEventListener('DOMContentLoaded', updateNavbar);
window.addEventListener('load', updateNavbar);
