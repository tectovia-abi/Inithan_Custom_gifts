(function () {
  // ── signup.js — External signup page JS (CSP-safe, no inline scripts) ───────────

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
    ? 'http://127.0.0.1:8081'
    : window.location.origin;

  // Toggle password visibility (reusable for both fields)
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

  // Handle signup form submission to Node.js / MongoDB backend
  async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const btn = document.getElementById('signupSubmitBtn');
    const alertDiv = document.getElementById('authAlert');

    console.log(`%c📝 [FRONTEND ACTION] Signup submitted for: "${fullName}" (${email})`, 'color: #3b82f6; font-weight: bold; font-size: 13px;');

    alertDiv.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
      console.warn('%c⚠️ [FRONTEND VALIDATION] Passwords do not match!', 'color: #f59e0b; font-weight: bold;');
      showAlert('Passwords do not match. Please check and try again.');
      const confirmWrap = document.getElementById('signupConfirmPassword').closest('.form-input-wrap');
      confirmWrap.style.borderColor = '#C41E3A';
      confirmWrap.style.animation = 'shake 0.4s ease';
      setTimeout(() => {
        confirmWrap.style.borderColor = '';
        confirmWrap.style.animation = '';
      }, 1500);
      return;
    }

    btn.textContent = 'CREATING ACCOUNT...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`%c🎉 [FRONTEND SUCCESS] Account created successfully for ${email}!`, 'color: #22c55e; font-weight: bold; font-size: 13px;');
        showAlert(data.message || 'Account created successfully!', true);
        btn.textContent = '✓ ACCOUNT CREATED!';
        btn.style.background = '#2D6A4F';
        btn.style.opacity = '1';

        // Save auth token & session
        if (data.token) {
          if (typeof saveAuthSession === 'function') {
            saveAuthSession(data.user, data.token, true);
          } else {
            localStorage.setItem('inithat_token', data.token);
            localStorage.setItem('inithat_user', JSON.stringify(data.user));
          }
        }

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        if (data.errorType === 'USER_ALREADY_EXISTS') {
          console.error(`%c❌ [FRONTEND ERROR] Account already exists with email: "${email}"`, 'color: #ef4444; font-weight: bold; font-size: 13px;');
        } else {
          console.error(`%c❌ [FRONTEND ERROR] Registration failed: ${data.message}`, 'color: #ef4444; font-weight: bold;');
        }

        showAlert(data.message || 'Registration failed. Please try again.');
        btn.textContent = 'CREATE ACCOUNT';
        btn.style.opacity = '1';
        btn.disabled = false;
      }
    } catch (err) {
      console.error('%c💥 [FRONTEND NETWORK ERROR] Server connection failed during signup:', 'color: #dc2626; font-weight: bold;', err);
      showAlert('Unable to connect to server. Please check your internet or try again later.');
      btn.textContent = 'CREATE ACCOUNT';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }

  function init() {
    // Bind signup form submit via addEventListener (CSP-safe, no inline onsubmit)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }

    // Bind password toggle buttons via addEventListener (CSP-safe, no inline onclick)
    const toggleBtnA = document.querySelector('[data-toggle-pass="signupPassword"]');
    if (toggleBtnA) {
      toggleBtnA.addEventListener('click', () => togglePass('signupPassword', 'eyeA', 'eyeOffA'));
    }

    const toggleBtnB = document.querySelector('[data-toggle-pass="signupConfirmPassword"]');
    if (toggleBtnB) {
      toggleBtnB.addEventListener('click', () => togglePass('signupConfirmPassword', 'eyeB', 'eyeOffB'));
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

    // Mobile toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
