const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/security');

const loginLimiter = rateLimit({
  windowMs: rateLimitConfig.login.windowMs,
  max: rateLimitConfig.login.max,
  message: {
    error: rateLimitConfig.login.message,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit excedido desde IP: ${req.ip}`);
    res.status(429).json({
      error: rateLimitConfig.login.message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimitConfig.login.windowMs / 1000)
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.api.windowMs,
  max: rateLimitConfig.api.max,
  standardHeaders: rateLimitConfig.api.standardHeaders,
  legacyHeaders: rateLimitConfig.api.legacyHeaders,
  message: {
    error: 'Demasiadas peticiones',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  loginLimiter,
  apiLimiter
};