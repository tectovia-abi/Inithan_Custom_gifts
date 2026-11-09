(function () {
  // ── login.js — External login page JS (CSP-safe, no inline scripts) ────────────

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
    ? 'http://127.0.0.1:8081'
    : window.location.origin;

  // Toggle password visibility
  function togglePass(inputId, eyeId, eyeOffId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(eyeId);
    const eyeOff = document.getElementById(eyeOffId);

    if (input.type === 'password') {
      input.type = 'text';
      eye.style.display = 'none';
      eyeOff.style.display = 'block';
    } else {
      input.type = 'password';
      eye.style.display = 'block';
      eyeOff.style.display = 'none';
    }
  }

  // Helper to show alert messages on form
  function showAlert(message, isSuccess = false) {
    const alertDiv = document.getElementById('authAlert');
    alertDiv.style.display = 'block';
    if (isSuccess) {
      alertDiv.style.background = 'rgba(45, 106, 79, 0.12)';
      alertDiv.style.color = '#2D6A4F';
      alertDiv.style.border = '1px solid rgba(45, 106, 79, 0.3)';
    } else {
      alertDiv.style.background = 'rgba(196, 30, 58, 0.12)';
      alertDiv.style.color = '#C41E3A';
      alertDiv.style.border = '1px solid rgba(196, 30, 58, 0.3)';
    }
    alertDiv.textContent = message;
  }

  // Handle login form submission
  async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmitBtn');
    const alertDiv = document.getElementById('authAlert');

    console.log(`%c🔑 [FRONTEND ACTION] Login submitted for email: "${email}"`, 'color: #3b82f6; font-weight: bold; font-size: 13px;');

    alertDiv.style.display = 'none';

    if (!email || !password) {
      console.warn('%c⚠️ [FRONTEND VALIDATION] Email or password field is empty!', 'color: #f59e0b; font-weight: bold;');
      showAlert('Please enter both email and password.');
      return;
    }

    btn.textContent = 'LOGGING IN...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`%c✅ [FRONTEND SUCCESS] Login authenticated successfully for ${data.user ? data.user.fullName : email}!`, 'color: #22c55e; font-weight: bold; font-size: 13px;');
        showAlert(data.message || 'Login successful!', true);
        btn.textContent = '✓ LOGGED IN!';
        btn.style.background = '#2D6A4F';
        btn.style.opacity = '1';

        if (data.token) {
          const rememberMe = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : true;
          if (typeof saveAuthSession === 'function') {
            saveAuthSession(data.user, data.token, rememberMe);
            console.log('%c🔒 [FRONTEND SESSION] Auth token & user profile stored in session/cookies.', 'color: #6366f1; font-weight: bold;');
          } else {
            localStorage.setItem('inithat_token', data.token);
            localStorage.setItem('inithat_user', JSON.stringify(data.user));
          }
        }

        setTimeout(() => {
          if (data.user && data.user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 1200);
      } else {
        if (data.errorType === 'USER_NOT_FOUND') {
          console.error(`%c❌ [FRONTEND ERROR] No user exists with email: "${email}"`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
        } else if (data.errorType === 'INCORRECT_PASSWORD') {
          console.error(`%c❌ [FRONTEND ERROR] Incorrect password entered for: "${email}"`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
        } else {
          console.error(`%c❌ [FRONTEND ERROR] Authentication failed: ${data.message}`, 'color: #ef4444; font-weight: bold;');
        }

        showAlert(data.message || 'Invalid email or password. Please try again.');
        btn.textContent = 'LOGIN';
        btn.style.opacity = '1';
        btn.disabled = false;
      }
    } catch (err) {
      console.error('%c💥 [FRONTEND NETWORK ERROR] Server connection failed:', 'color: #dc2626; font-weight: bold;', err);
      showAlert('Unable to connect to server. Please check your internet or try again later.');
      btn.textContent = 'LOGIN';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }

  function init() {
    // Bind login form submit via addEventListener (CSP-safe, no inline onsubmit)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Bind password toggle buttons via addEventListener (CSP-safe, no inline onclick)
    const toggleBtnA = document.querySelector('[data-toggle-pass="loginPassword"]');
    if (toggleBtnA) {
      toggleBtnA.addEventListener('click', () => togglePass('loginPassword', 'eyeA', 'eyeOffA'));
    }

    // Mobile toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
      });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    });

    // Auto-redirect if already logged in
    (function () {
      if (localStorage.getItem('inithat_token')) {
        const userStr = localStorage.getItem('inithat_user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && (user.id || user._id || user.email)) {
              if (user.isAdmin) {
                window.location.href = 'admin-dashboard.html';
                return;
              }
              window.location.href = 'index.html';
            }
          } catch (e) {}
        }
      }
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
