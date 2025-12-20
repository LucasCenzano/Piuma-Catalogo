// En el archivo: config/security.js

const securityConfig = {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost
      if (origin.indexOf('localhost') !== -1 || origin.indexOf('127.0.0.1') !== -1) {
        return callback(null, true);
      }

      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.x.x.x)
      if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/) ||
        origin.match(/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/) ||
        origin.match(/^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/)) {
        return callback(null, true);
      }

      // Allow custom frontend URL
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }

      // Default: Block but log for debugging
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cache-Control',
      'Expires',
      'Pragma'
    ],
    credentials: true
  },

  // 👇 AÑADE ESTE BLOQUE COMPLETO
  rateLimit: {
    // Configuración para el límite general de la API
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Límite de 100 peticiones por IP cada 15 minutos
      standardHeaders: true,
      legacyHeaders: false,
    },
    // Configuración específica para el login
    login: {
      windowMs: 10 * 60 * 1000, // 10 minutos
      max: 5, // Límite de 5 intentos de login por IP cada 10 minutos
      message: 'Demasiados intentos de inicio de sesión. Por favor, inténtalo de nuevo más tarde.'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'tu_secreto_por_defecto',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },

  bcrypt: {
    rounds: 12
  }
};

module.exports = securityConfig;