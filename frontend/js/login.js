(function () {
  // ── login.js — External login page JS (CSP-safe, no inline scripts) ────────────

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8081'
    ? 'http://127.0.0.1:8081'
    : window.location.origin;

  // Toggle password visibility
  function togglePass(inputId, eyeId, eyeOffId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const eye = eyeId ? document.getElementById(eyeId) : null;
    const eyeOff = eyeOffId ? document.getElementById(eyeOffId) : null;

    if (input.type === 'password') {
      input.type = 'text';
      if (eye) eye.style.display = 'none';
      if (eyeOff) eyeOff.style.display = 'block';
    } else {
      input.type = 'password';
      if (eye) eye.style.display = 'block';
      if (eyeOff) eyeOff.style.display = 'none';
    }
  }

  // Helper to show alert messages on form
  function showAlert(message, isSuccess = false) {
    const alertDiv = document.getElementById('authAlert');
    if (!alertDiv) return;
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

    if (alertDiv) alertDiv.style.display = 'none';

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

  // ── WhatsApp Forgot Password Controller ─────────────────────────────────────
  let activeResetEmail = '';
  let resendInterval = null;

  function showForgotAlert(message, isSuccess = false) {
    const alertBox = document.getElementById('forgotAlert');
    if (!alertBox) return;
    alertBox.style.display = 'block';
    if (isSuccess) {
      alertBox.style.background = 'rgba(37, 211, 102, 0.15)';
      alertBox.style.color = '#128C7E';
      alertBox.style.border = '1px solid rgba(37, 211, 102, 0.4)';
    } else {
      alertBox.style.background = 'rgba(239, 68, 68, 0.12)';
      alertBox.style.color = '#b91c1c';
      alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    }
    alertBox.textContent = message;
  }

  function hideForgotAlert() {
    const alertBox = document.getElementById('forgotAlert');
    if (alertBox) alertBox.style.display = 'none';
  }

  function switchForgotStep(stepNumber) {
    hideForgotAlert();
    const steps = [document.getElementById('waStep1'), document.getElementById('waStep2'), document.getElementById('waStep3')];
    steps.forEach((step, idx) => {
      if (step) {
        if (idx + 1 === stepNumber) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      }
    });

    if (stepNumber === 1) {
      const input = document.getElementById('forgotIdentifier');
      if (input) setTimeout(() => input.focus(), 100);
    } else if (stepNumber === 2) {
      const input = document.getElementById('forgotOtp');
      if (input) setTimeout(() => input.focus(), 100);
    }
  }

  function startResendCooldown(totalSeconds = 60) {
    if (resendInterval) clearInterval(resendInterval);
    const countdownEl = document.getElementById('resendCountdown');
    const countdownContainer = document.getElementById('countdownContainer');
    const resendBtn = document.getElementById('resendOtpBtn');

    if (!countdownEl || !resendBtn) return;

    let remaining = totalSeconds;
    resendBtn.disabled = true;
    if (countdownContainer) countdownContainer.style.display = 'inline';
    countdownEl.textContent = remaining;

    resendInterval = setInterval(() => {
      remaining -= 1;
      countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(resendInterval);
        resendBtn.disabled = false;
        if (countdownContainer) countdownContainer.style.display = 'none';
      }
    }, 1000);
  }

  function openModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;
    switchForgotStep(1);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (resendInterval) clearInterval(resendInterval);
    hideForgotAlert();
  }

  // Handle Step 1: Send OTP to WhatsApp
  async function handleForgotRequest(event) {
    event.preventDefault();
    const identifierInput = document.getElementById('forgotIdentifier');
    const btn = document.getElementById('sendOtpBtn');
    const identifier = identifierInput ? identifierInput.value.trim() : '';

    if (!identifier) {
      showForgotAlert('Please enter your registered email address or mobile number.');
      return;
    }

    hideForgotAlert();
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Sending WhatsApp OTP...</span> <span>⏳</span>';

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        activeResetEmail = data.email || identifier;
        const destEl = document.getElementById('otpDestinationText');
        if (destEl) {
          destEl.textContent = data.maskedPhone || 'your registered WhatsApp';
        }

        switchForgotStep(2);
        startResendCooldown(60);
        showForgotAlert(data.message || 'OTP dispatched to your WhatsApp!', true);
      } else {
        showForgotAlert(data.message || 'Unable to send OTP. Please check your details.');
      }
    } catch (err) {
      console.error('💥 [FORGOT PASSWORD] Network Error:', err);
      showForgotAlert('Could not reach the server. Please check your network connection.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // Handle Resend OTP button click
  async function handleResendOtp() {
    if (!activeResetEmail) return;
    const resendBtn = document.getElementById('resendOtpBtn');
    if (resendBtn) resendBtn.disabled = true;

    hideForgotAlert();

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeResetEmail })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        startResendCooldown(60);
        showForgotAlert('A new OTP has been sent to your WhatsApp number!', true);
      } else {
        if (data.remainingSeconds) {
          startResendCooldown(data.remainingSeconds);
        }
        showForgotAlert(data.message || 'Could not resend OTP right now.');
      }
    } catch (err) {
      showForgotAlert('Connection failed. Please try again.');
      if (resendBtn) resendBtn.disabled = false;
    }
  }

  // Handle Step 2: Verify OTP and Reset Password
  async function handleResetSubmit(event) {
    event.preventDefault();

    const otpInput = document.getElementById('forgotOtp');
    const newPassInput = document.getElementById('forgotNewPassword');
    const confirmPassInput = document.getElementById('forgotConfirmPassword');
    const btn = document.getElementById('resetSubmitBtn');

    const otp = otpInput ? otpInput.value.trim() : '';
    const newPassword = newPassInput ? newPassInput.value : '';
    const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

    if (!otp || otp.length !== 6) {
      showForgotAlert('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 8) {
      showForgotAlert('New password must be at least 8 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumSym = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumSym) {
      showForgotAlert('Password must include uppercase, lowercase, and a number or symbol.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showForgotAlert('Passwords do not match. Please verify.');
      return;
    }

    hideForgotAlert();
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>Updating Password...</span> <span>⏳</span>';

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeResetEmail,
          otp,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        switchForgotStep(3);
      } else {
        showForgotAlert(data.message || 'Failed to reset password. Please check your OTP.');
      }
    } catch (err) {
      console.error('💥 [RESET PASSWORD] Network Error:', err);
      showForgotAlert('Server connection failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  function init() {
    // Bind login form submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    // Bind password toggle buttons
    const toggleBtnA = document.querySelector('[data-toggle-pass="loginPassword"]');
    if (toggleBtnA) {
      toggleBtnA.addEventListener('click', () => togglePass('loginPassword', 'eyeA', 'eyeOffA'));
    }

    // Modal triggers
    const openForgotLink = document.getElementById('openForgotModal');
    if (openForgotLink) {
      openForgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }

    const closeForgotBtn = document.getElementById('closeForgotModal');
    if (closeForgotBtn) {
      closeForgotBtn.addEventListener('click', closeModal);
    }

    const modalOverlay = document.getElementById('forgotPasswordModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    // Esc key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });

    // Forgot form binds
    const forgotRequestForm = document.getElementById('forgotRequestForm');
    if (forgotRequestForm) {
      forgotRequestForm.addEventListener('submit', handleForgotRequest);
    }

    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', handleResendOtp);
    }

    const forgotResetForm = document.getElementById('forgotResetForm');
    if (forgotResetForm) {
      forgotResetForm.addEventListener('submit', handleResetSubmit);
    }

    // Toggle buttons inside modal
    document.querySelectorAll('#forgotPasswordModal [data-toggle-pass]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-toggle-pass');
        const input = document.getElementById(targetId);
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    });

    // Success screen "Back to Login"
    const goToLoginBtn = document.getElementById('goToLoginBtn');
    if (goToLoginBtn) {
      goToLoginBtn.addEventListener('click', () => {
        closeModal();
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail && activeResetEmail) {
          loginEmail.value = activeResetEmail;
        }
        const loginPassword = document.getElementById('loginPassword');
        if (loginPassword) loginPassword.focus();
      });
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
