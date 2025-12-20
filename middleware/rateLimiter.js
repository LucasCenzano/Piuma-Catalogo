const rateLimit = require('express-rate-limit');
const securityConfig = require('../config/security');

// Safely access config or provide defaults
const rateLimitConfig = securityConfig.rateLimit || {
  login: { windowMs: 10 * 60 * 1000, max: 5, message: 'Too many login attempts' },
  api: { windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }
};

const loginLimiter = rateLimit({
  windowMs: rateLimitConfig.login.windowMs,
  max: rateLimitConfig.login.max,
  message: {
    error: rateLimitConfig.login.message || 'Demasiados intentos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit excedido desde IP: ${req.ip}`);
    res.status(429).json({
      error: rateLimitConfig.login.message,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  },
  validate: { xForwardedForHeader: false } // Disable strict header validation to avoid crashes on some proxies
});

const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.api.windowMs,
  max: rateLimitConfig.api.max,
  standardHeaders: rateLimitConfig.api.standardHeaders !== false,
  legacyHeaders: rateLimitConfig.api.legacyHeaders !== false,
  message: {
    error: 'Demasiadas peticiones',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  validate: { xForwardedForHeader: false }
});

module.exports = {
  loginLimiter,
  apiLimiter
};