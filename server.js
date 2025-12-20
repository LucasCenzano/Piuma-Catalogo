const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Importar configuración y middleware
const securityConfig = require('./config/security');
const { authenticate, requireRole } = require('./middleware/auth');
const { loginLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { loginValidation, productValidation } = require('./utils/validators');
const { generateAccessToken, generateRefreshToken } = require('./utils/tokenService');
const { validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper para queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ========== MIDDLEWARE GLOBAL ==========
app.use(helmet()); // Seguridad headers HTTP
app.use(cors(securityConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter); // Rate limit general

// Logging middleware (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========== RUTAS DE AUTENTICACIÓN ==========

// Login
app.post('/api/auth', loginLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }

  try {
    const { username, password } = req.body;

    const userResult = await query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: userData
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// Cambiar contraseña
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseñas requeridas'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Nueva contraseña debe tener mínimo 8 caracteres'
      });
    }

    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isCurrentValid) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    const newHash = await bcrypt.hash(newPassword, securityConfig.bcrypt.rounds);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE PRODUCTOS (PÚBLICAS) ==========

app.get('/api/products', async (req, res) => {
  try {
    if (req.query.id) {
      const result = await query(
        'SELECT * FROM products WHERE id = $1',
        [parseInt(req.query.id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = result.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      return res.json(product);
    }

    // UPDATE: Order by is_new DESC, then is_featured DESC, then category, then name
    const result = await query(`
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pv.id,
                   'color_name', pv.color_name,
                   'in_stock', pv.in_stock
                 )
               ) FILTER (WHERE pv.id IS NOT NULL), 
               '[]'
             ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.is_active = true 
      GROUP BY p.id
      ORDER BY p.is_new DESC, p.is_featured DESC, p.category, p.name
    `);

    const products = result.rows.map(p => {
      if (typeof p.images_url === 'string') {
        try {
          p.images_url = JSON.parse(p.images_url);
        } catch (e) {
          console.error(`Error parsing images for product ${p.id}:`, e);
          p.images_url = [];
        }
      }
      return p;
    });

    res.json(products);

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS ADMIN (PROTEGIDAS) ==========

// Obtener productos (admin)
app.get('/api/admin/products',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      // UPDATE: Include variants using json_agg, filtering only active variants if needed (but admin sees all usually)
      const result = await query(`
        SELECT p.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', pv.id,
                     'color_name', pv.color_name,
                     'in_stock', pv.in_stock
                   )
                 ) FILTER (WHERE pv.id IS NOT NULL), 
                 '[]'
               ) as variants
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.is_active = true 
        GROUP BY p.id
        ORDER BY p.is_new DESC, p.is_featured DESC, p.category, p.name
      `);

      const products = result.rows.map(p => {
        if (typeof p.images_url === 'string') {
          try {
            p.images_url = JSON.parse(p.images_url);
          } catch (e) {
            console.error(`Error parsing images for product ${p.id}:`, e);
            p.images_url = [];
          }
        }
        return p;
      });

      res.json(products);
    } catch (error) {
      console.error('Error en admin/products:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Crear producto
app.post('/api/admin/products',
  authenticate,
  requireRole('admin'),
  productValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    try {
      const {
        name, price, category, description, inStock, imagesUrl,
        isFeatured, isNew, discountPercentage
      } = req.body;

      const maxIdResult = await query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products'
      );
      const nextId = maxIdResult.rows[0].next_id;

      const result = await query(`
        INSERT INTO products (
          id, name, price, category, description, in_stock, images_url,
          is_featured, is_new, discount_percentage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        nextId,
        name,
        price || '',
        category,
        description || '',
        inStock !== undefined ? inStock : true,
        JSON.stringify(imagesUrl || []),
        isFeatured || false,
        isNew || false,
        discountPercentage || 0
      ]);

      const product = result.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      res.status(201).json({
        message: 'Producto creado',
        product
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Actualizar producto
// Actualizar producto
app.put('/api/admin/products/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { id } = req.params;
      const updates = req.body;
      const { variants } = updates; // Extract variants

      console.log('📝 Actualizando producto:', id);
      console.log('📦 Datos recibidos:', JSON.stringify(updates, null, 2));

      // 1. Update Product Fields
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        'name', 'price', 'category', 'description', 'inStock', 'imagesUrl',
        'isFeatured', 'isNew', 'discountPercentage'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          let dbField = field;
          let value = updates[field];

          // Map field names to DB columns
          if (field === 'inStock') dbField = 'in_stock';
          else if (field === 'imagesUrl') {
            dbField = 'images_url';
            value = JSON.stringify(value);
          }
          else if (field === 'isFeatured') dbField = 'is_featured';
          else if (field === 'isNew') dbField = 'is_new';
          else if (field === 'discountPercentage') dbField = 'discount_percentage';

          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);

          paramCount++;
        }
      }

      if (fields.length > 0) {
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(parseInt(id));

        const result = await client.query(`
          UPDATE products 
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          throw new Error('Producto no encontrado');
        }
      }

      // 2. Handle Variants (if provided)
      if (variants && Array.isArray(variants)) {
        // Delete existing variants
        await client.query('DELETE FROM product_variants WHERE product_id = $1', [parseInt(id)]);

        // Insert new variants
        for (const variant of variants) {
          if (variant.color_name && variant.color_name.trim()) {
            await client.query(`
              INSERT INTO product_variants (product_id, color_name, in_stock)
              VALUES ($1, $2, $3)
            `, [parseInt(id), variant.color_name.trim(), variant.in_stock !== false]);
          }
        }
      }

      await client.query('COMMIT');

      // Fetch updated product with variants
      const finalResult = await client.query(`
        SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', pv.id,
                   'color_name', pv.color_name,
                   'in_stock', pv.in_stock
                 )
               ) FILTER (WHERE pv.id IS NOT NULL), 
               '[]'
             ) as variants
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.id = $1
        GROUP BY p.id
      `, [parseInt(id)]);

      const product = finalResult.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      res.json({
        message: 'Producto actualizado',
        product
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error actualizando producto:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    } finally {
      client.release();
    }
  }
);

// Eliminar producto (versión corregida con "soft delete")
app.delete('/api/admin/products/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Cambiamos DELETE por UPDATE para hacer un "soft delete"
      const result = await query(
        'UPDATE products SET is_active = false WHERE id = $1 RETURNING id, name',
        [parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Cambiamos el mensaje de éxito
      res.json({
        message: 'Producto desactivado exitosamente',
        deactivatedProduct: result.rows[0]
      });

    } catch (error) {
      console.error('Error desactivando producto:', error);

      // ✅ AÑADIMOS MANEJO DE ERROR ESPECÍFICO
      // Si el error es por una foreign key (código 23503 de PostgreSQL)...
      if (error.code === '23503') {
        // Devolvemos un error 409 Conflict, que es más descriptivo
        return res.status(409).json({
          error: 'Este producto no se puede modificar porque está asociado a una o más ventas.'
        });
      }

      // Para cualquier otro error, mantenemos el 500
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========== RUTAS DE VENTAS (PROTEGIDAS) ==========


console.log('🔗 Conectando rutas de ventas y estadísticas...');
const salesHandler = require('./api/sales.js');
const salesStatsHandler = require('./api/sales-stats.js');

// Cualquier petición a /api/sales será manejada por el archivo api/sales.js
app.all('/api/sales', salesHandler);

// Cualquier petición a /api/sales-stats será manejada por api/sales-stats.js
app.all('/api/sales-stats', salesStatsHandler);

console.log('✅ Rutas de ventas y estadísticas conectadas.');

// ========== UTILIDADES ==========

app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as current_time');
    res.json({
      status: 'OK',
      database: 'connected',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor solo si se ejecuta directamente (para desarrollo local)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor de desarrollo ejecutándose en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Exportar la app para Vercel
module.exports = app;