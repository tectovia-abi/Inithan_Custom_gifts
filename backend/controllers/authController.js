const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const PasswordResetOtp = require('../models/PasswordResetOtp');
const whatsappService = require('../services/whatsappService');

// Helper function to hash OTP with salt
const hashOtp = (otp) => {
  const salt = process.env.JWT_SECRET || 'fallback_secret_key';
  return crypto.createHash('sha256').update(String(otp) + salt).digest('hex');
};

// Helper function to mask phone number for client privacy
const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length <= 4) return '****';
  const visible = digits.slice(-4);
  const prefix = digits.length > 10 ? '+' + digits.slice(0, digits.length - 10) + ' ' : '';
  return `${prefix}******${visible}`;
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '7d' }
  );
};

const signup = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ [AUTH BACKEND] Database not ready during signup attempt');
      return res.status(503).json({
        success: false,
        errorType: 'DATABASE_DISCONNECTED',
        message: 'Database is currently connecting to MongoDB Atlas. Please ensure your IP is whitelisted and try again in a few seconds.'
      });
    }

    const { fullName, email, phone, password, confirmPassword } = req.body;
    console.log(`\n========================================`);
    console.log(`📥 [AUTH BACKEND] Signup Request Received for: ${email}`);

    // 1. Validation check
    if (!fullName || !email || !phone || !password) {
      console.warn(`⚠️ [AUTH BACKEND] Signup Failed: Missing required fields`);
      return res.status(400).json({
        success: false,
        errorType: 'MISSING_FIELDS',
        message: 'Please fill in all required fields.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        errorType: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 8 characters long.'
      });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumSym = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasUpper || !hasLower || !hasNumSym) {
      return res.status(400).json({
        success: false,
        errorType: 'PASSWORD_TOO_WEAK',
        message: 'Password must include uppercase (A-Z), lowercase (a-z), and at least one number or symbol.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      console.warn(`⚠️ [AUTH BACKEND] Signup Failed: Passwords do not match`);
      return res.status(400).json({
        success: false,
        errorType: 'PASSWORD_MISMATCH',
        message: 'Passwords do not match.'
      });
    }

    // 2. Check if user already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn(`❌ [AUTH BACKEND] Signup Failed: User already exists (${email})`);
      return res.status(400).json({
        success: false,
        errorType: 'USER_ALREADY_EXISTS',
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Create and save new user
    const newUser = await User.create({
      fullName,
      email,
      phone,
      password
    });

    console.log(`✅ [AUTH BACKEND] Signup Successful! User Created ID: ${newUser._id}`);

    // 4. Generate Token
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        isAdmin: !!newUser.isAdmin
      }
    });

  } catch (error) {
    console.error('❌ [AUTH BACKEND] Signup System Error:', error.message);
    return res.status(500).json({
      success: false,
      errorType: 'SERVER_ERROR',
      message: error.message || 'Server error occurred during registration.'
    });
  }
};

const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ [AUTH BACKEND] Login Attempt Blocked: Database is not ready or reconnecting.');
      return res.status(503).json({
        success: false,
        errorType: 'DATABASE_DISCONNECTED',
        message: 'Database is currently connecting to MongoDB Atlas. Please ensure your IP is whitelisted (0.0.0.0/0) and try again.'
      });
    }

    const { email, password } = req.body;
    console.log(`\n========================================`);
    console.log(`🔑 [AUTH BACKEND] Login Attempt Received for: ${email}`);

    if (!email || !password) {
      console.warn(`⚠️ [AUTH BACKEND] Login Failed: Missing email or password`);
      return res.status(400).json({
        success: false,
        errorType: 'MISSING_CREDENTIALS',
        message: 'Please enter both email and password.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`❌ [AUTH BACKEND] Login Failed: No user exists with email (${email})`);
      return res.status(401).json({
        success: false,
        errorType: 'USER_NOT_FOUND',
        message: 'No account found with this email address.'
      });
    }

    // Check password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`❌ [AUTH BACKEND] Login Failed: Incorrect password for (${email})`);
      return res.status(401).json({
        success: false,
        errorType: 'INCORRECT_PASSWORD',
        message: 'Incorrect password. Please try again.'
      });
    }

    console.log(`✅ [AUTH BACKEND] Login Successful for: ${user.fullName} (${user.email})`);

    // Log the user login event in the background database
    try {
      await LoginLog.create({
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });
      console.log(`📝 [AUTH BACKEND] Login event stored in DB for user: ${user.email}`);
    } catch (logErr) {
      console.error('⚠️ [AUTH BACKEND] Failed to write login log:', logErr.message);
    }

    // Generate Token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isAdmin: !!user.isAdmin
      }
    });

  } catch (error) {
    console.error('❌ [AUTH BACKEND] Login System Error:', error.message);
    return res.status(500).json({
      success: false,
      errorType: 'SERVER_ERROR',
      message: 'Server error occurred during login.'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Fetch Users Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user list.'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isAdmin: !!user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Get Profile Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile details.'
    });
  }
};

// @desc    Update user profile (name, phone)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.fullName = fullName.trim();
    if (phone && phone.trim()) {
      user.phone = phone.trim();
    }

    const updatedUser = await user.save();

    console.log(`✅ [AUTH BACKEND] Profile updated for: ${updatedUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        isAdmin: !!updatedUser.isAdmin,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Update Profile Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.'
    });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumberOrSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must include a combination of uppercase letters (A-Z), lowercase letters (a-z), and at least one number or special character.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Verify old password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Set new password (pre('save') hook handles hashing)
    user.password = newPassword;
    await user.save();

    console.log(`🔒 [AUTH BACKEND] Password changed successfully for: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Change Password Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error changing password.'
    });
  }
};

// @desc    Initiate forgot password by sending WhatsApp OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({
        success: false,
        errorType: 'MISSING_IDENTIFIER',
        message: 'Please provide your registered email address or mobile number.'
      });
    }

    const trimmed = String(identifier).trim();
    let user = null;

    if (trimmed.includes('@')) {
      user = await User.findOne({ email: trimmed.toLowerCase() });
    } else {
      const phoneDigits = trimmed.replace(/[^0-9]/g, '');
      const last10 = phoneDigits.slice(-10);
      user = await User.findOne({
        $or: [
          { phone: trimmed },
          { phone: phoneDigits },
          { phone: { $regex: `${last10}$` } }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        errorType: 'USER_NOT_FOUND',
        message: 'No account was found with the provided details. Please verify your email or phone number.'
      });
    }

    // Cooldown check (60 seconds)
    const existingOtp = await PasswordResetOtp.findOne({ userId: user._id, isUsed: false }).sort({ createdAt: -1 });
    if (existingOtp) {
      const elapsedMs = Date.now() - existingOtp.createdAt.getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          errorType: 'COOLDOWN_ACTIVE',
          remainingSeconds,
          message: `Please wait ${remainingSeconds} seconds before requesting a new WhatsApp OTP.`
        });
      }
    }

    // Generate secure 6-digit OTP (100000 - 999999)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate prior unused OTP records
    await PasswordResetOtp.deleteMany({ userId: user._id });

    // Store new OTP
    await PasswordResetOtp.create({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      otpHash,
      expiresAt
    });

    // Send WhatsApp OTP
    const waResult = await whatsappService.sendWhatsAppOtp(user.phone, otpCode);

    console.log(`📲 [AUTH BACKEND] WhatsApp OTP dispatched to ${maskPhone(user.phone)} for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'A 6-digit verification code has been sent to your WhatsApp number.',
      email: user.email,
      maskedPhone: maskPhone(user.phone),
      simulated: Boolean(waResult.simulated)
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Forgot Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while preparing your verification code. Please try again later.'
    });
  }
};

// @desc    Verify WhatsApp OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP are required.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const otpRecord = await PasswordResetOtp.findOne({
      email: cleanEmail,
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        errorType: 'OTP_NOT_FOUND',
        message: 'No active OTP request found. Please request a new verification code.'
      });
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        errorType: 'OTP_EXPIRED',
        message: 'The OTP code has expired. Please request a fresh one.'
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(429).json({
        success: false,
        errorType: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Check hash
    const inputHash = hashOtp(cleanOtp);
    if (inputHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        errorType: 'INVALID_OTP',
        message: `Incorrect OTP code. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Please request a new code.'}`
      });
    }

    // Generate short-lived reset token (15 mins)
    const resetToken = jwt.sign(
      { userId: otpRecord.userId, email: cleanEmail, purpose: 'PASSWORD_RESET' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying OTP code.'
    });
  }
};

// @desc    Reset password using verified resetToken OR email + otp
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, resetToken, newPassword, confirmPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumSym = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumSym) {
      return res.status(400).json({
        success: false,
        message: 'Password must include uppercase (A-Z), lowercase (a-z), and at least one number or symbol.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    let userId = null;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'fallback_secret_key');
        if (decoded.purpose !== 'PASSWORD_RESET') {
          return res.status(401).json({ success: false, message: 'Invalid reset authorization token.' });
        }
        userId = decoded.userId;
      } catch (jwtErr) {
        return res.status(401).json({
          success: false,
          errorType: 'TOKEN_EXPIRED',
          message: 'Reset authorization session expired. Please verify your OTP again.'
        });
      }
    } else if (email && otp) {
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanOtp = String(otp).trim();
      const otpRecord = await PasswordResetOtp.findOne({ email: cleanEmail, isUsed: false }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'No active OTP request found.' });
      }
      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
      }
      if (hashOtp(cleanOtp) !== otpRecord.otpHash) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }
      userId = otpRecord.userId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Verification credential missing (OTP or reset token required).'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Save new password - pre('save') hook handles bcrypt hashing
    user.password = newPassword;
    await user.save();

    // Clean up OTP records for this user
    await PasswordResetOtp.deleteMany({ userId: user._id });

    console.log(`🔐 [AUTH BACKEND] Password successfully reset for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in.'
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Reset Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password.'
    });
  }
};

// @desc    Resend WhatsApp OTP with 60s cooldown
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const lookupKey = String(email || identifier || '').trim();

    if (!lookupKey) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is required to resend OTP.'
      });
    }

    let user = null;
    if (lookupKey.includes('@')) {
      user = await User.findOne({ email: lookupKey.toLowerCase() });
    } else {
      const phoneDigits = lookupKey.replace(/[^0-9]/g, '');
      const last10 = phoneDigits.slice(-10);
      user = await User.findOne({
        $or: [
          { phone: lookupKey },
          { phone: phoneDigits },
          { phone: { $regex: `${last10}$` } }
        ]
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Check cooldown
    const existingOtp = await PasswordResetOtp.findOne({ userId: user._id, isUsed: false }).sort({ createdAt: -1 });
    if (existingOtp) {
      const elapsedMs = Date.now() - existingOtp.createdAt.getTime();
      if (elapsedMs < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          errorType: 'COOLDOWN_ACTIVE',
          remainingSeconds,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
        });
      }
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordResetOtp.deleteMany({ userId: user._id });
    await PasswordResetOtp.create({
      userId: user._id,
      email: user.email,
      phone: user.phone,
      otpHash,
      expiresAt
    });

    const waResult = await whatsappService.sendWhatsAppOtp(user.phone, otpCode);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit OTP has been sent to your WhatsApp number.',
      email: user.email,
      maskedPhone: maskPhone(user.phone),
      simulated: Boolean(waResult.simulated)
    });
  } catch (error) {
    console.error('❌ [AUTH BACKEND] Resend OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resending OTP.'
    });
  }
};

module.exports = {
  signup,
  login,
  getUsers,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  resendOtp
};
