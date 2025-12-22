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

// Import handlers for serverless-like structure
const salesHandler = require('./api/sales');
const salesStatsHandler = require('./api/sales-stats');
const customersHandler = require('./api/customers');

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
app.set('trust proxy', 1); // Confía en el primer proxy (Vercel)
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
app.post('/api/auth', /* loginLimiter, */ loginValidation, async (req, res) => {
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
      code: 'INTERNAL_ERROR',
      details: error.message // DEBUG: exposing error
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
                   'in_stock', pv.in_stock,
                   'quantity', pv.quantity
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

// Obtener categorías (Pública)
app.get('/api/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM product_categories WHERE is_active = true ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
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
                     'in_stock', pv.in_stock,
                     'quantity', pv.quantity
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
        isFeatured, isNew, discountPercentage, productCode, unitCostArs
      } = req.body;

      const maxIdResult = await query(
        'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products'
      );
      const nextId = maxIdResult.rows[0].next_id;

      // Sanitize and format price
      const finalPrice = (function (p) {
        if (!p) return '$0';
        // Remove all non-numeric characters except dots and commas
        const clean = String(p).replace(/[^0-9.,-]/g, '');
        // Normalize to use dot as decimal separator
        let normalized = clean.replace(/,/g, '.');
        // Parse to number
        const numericValue = parseFloat(normalized) || 0;
        // Format to Argentine style: $20.000
        const formatted = new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numericValue);
        return formatted;
      })(price);

      const result = await query(`
        INSERT INTO products (
          id, name, price, category, description, in_stock, images_url,
          is_featured, is_new, discount_percentage, tags,
          product_code, unit_cost_ars,
          created_at, updated_at, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        RETURNING *
      `, [
        nextId,
        name,
        finalPrice,
        category,
        description || '',
        inStock !== undefined ? inStock : true,
        JSON.stringify(imagesUrl || []),
        isFeatured || false,
        isNew || false,
        discountPercentage || 0,
        req.body.tags || [],
        productCode || null,
        unitCostArs ? parseFloat(unitCostArs) : 0
      ]);

      const product = result.rows[0];
      if (typeof product.images_url === 'string') {
        product.images_url = JSON.parse(product.images_url);
      }

      // Insert variants if provided
      const { variants } = req.body;
      if (variants && Array.isArray(variants) && variants.length > 0) {
        console.log(`📝 Insertando ${variants.length} variantes...`);
        for (const variant of variants) {
          await query(`
            INSERT INTO product_variants (product_id, color_name, in_stock, quantity, product_code, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            product.id,
            variant.color_name,
            variant.in_stock !== undefined ? variant.in_stock : true,
            parseInt(variant.quantity) || 0,
            variant.product_code || null
          ]);
        }
        product.variants = variants;
      } else {
        product.variants = [];
      }

      res.status(201).json({
        message: 'Producto creado',
        product
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        details: error.message
      });
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
      const allowedFields = [
        'name', 'price', 'category', 'description', 'inStock', 'imagesUrl',
        'isFeatured', 'isNew', 'discountPercentage', 'tags', 'productCode', 'unitCostArs'
      ];
      let paramCount = 1;

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
          else if (field === 'price') {
            // Format price to Argentine style
            const clean = String(value).replace(/[^0-9.,-]/g, '');
            const normalized = clean.replace(/,/g, '.');
            const numericValue = parseFloat(normalized) || 0;
            value = new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(numericValue);
          }
          else if (field === 'isFeatured') dbField = 'is_featured';
          else if (field === 'isNew') dbField = 'is_new';
          else if (field === 'discountPercentage') dbField = 'discount_percentage';
          else if (field === 'productCode') dbField = 'product_code';
          else if (field === 'unitCostArs') {
            dbField = 'unit_cost_ars';
            value = value ? parseFloat(value) : 0;
          }

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
              INSERT INTO product_variants (product_id, color_name, in_stock, quantity, product_code)
              VALUES ($1, $2, $3, $4, $5)
            `, [
              parseInt(id),
              variant.color_name.trim(),
              variant.in_stock !== false,
              parseInt(variant.quantity) || 0,
              variant.product_code || null
            ]);
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
                   'in_stock', pv.in_stock,
                   'quantity', pv.quantity
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

// ========== RUTAS DE CATEGORÍAS (ADMIN) ==========

// Crear categoría
app.post('/api/admin/categories',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre es requerido' });
      }

      const result = await query(
        'INSERT INTO product_categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET is_active = true RETURNING *',
        [name.trim()]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creando categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Eliminar (desactivar) categoría
app.delete('/api/admin/categories/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar si hay productos usando esta categoría
      const catResult = await query('SELECT name FROM product_categories WHERE id = $1', [id]);
      if (catResult.rows.length === 0) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const categoryName = catResult.rows[0].name;

      // Verificar uso en productos activos
      const productsUsage = await query(
        'SELECT COUNT(*) FROM products WHERE category = $1 AND is_active = true',
        [categoryName]
      );

      if (parseInt(productsUsage.rows[0].count) > 0) {
        return res.status(409).json({
          error: `No se puede eliminar la categoría porque hay ${productsUsage.rows[0].count} productos activos usándola.`
        });
      }

      // Soft delete
      await query(
        'UPDATE product_categories SET is_active = false WHERE id = $1',
        [id]
      );

      res.json({ message: 'Categoría eliminada exitosamente' });

    } catch (error) {
    }
  }
);

// ========== RUTAS DE FILTROS (PÚBLICAS Y ADMIN) ==========

// Obtener filtros activos (Pública)
app.get('/api/filters', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM shop_filters WHERE is_active = true ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los filtros (Admin)
app.get('/api/admin/filters',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const result = await query('SELECT * FROM shop_filters ORDER BY id ASC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error obteniendo filtros admin:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Actualizar filtro (Admin)
// Actualizar filtro (Admin)
app.put('/api/admin/filters/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { label, is_active } = req.body;

      const result = await query(
        'UPDATE shop_filters SET label = COALESCE($1, label), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
        [label, is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Filtro no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error actualizando filtro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Crear Filtro (Admin) - Solo para 'custom'
app.post('/api/admin/filters',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { label } = req.body;
      if (!label || !label.trim()) return res.status(400).json({ error: 'Nombre requerido' });

      // Generate key from label
      const key = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');

      const result = await query(
        `INSERT INTO shop_filters (key, label, type, is_active) 
         VALUES ($1, $2, 'custom', true) 
         ON CONFLICT (key) DO NOTHING 
         RETURNING *`,
        [key, label.trim()]
      );

      if (result.rows.length === 0) {
        return res.status(409).json({ error: 'Ya existe un filtro con esa clave' });
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creando filtro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Eliminar Filtro (Admin) - Solo si es custom
app.delete('/api/admin/filters/:id',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const check = await query('SELECT type FROM shop_filters WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Filtro no encontrado' });
      if (check.rows[0].type === 'system') return res.status(403).json({ error: 'No se pueden eliminar filtros del sistema' });

      await query('DELETE FROM shop_filters WHERE id = $1', [id]);
      res.json({ message: 'Filtro eliminado' });
    } catch (error) {
      console.error('Error eliminando filtro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========== RUTAS DE TIPO DE CAMBIO (ADMIN) ==========

// Obtener tipo de cambio actual
app.get('/api/admin/exchange-rate',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const result = await query(
        'SELECT * FROM exchange_rates WHERE currency_from = $1 AND currency_to = $2',
        ['USD', 'ARS']
      );

      if (result.rows.length === 0) {
        return res.json({ rate: 1200, updated_at: new Date() }); // Default
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error obteniendo tipo de cambio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Actualizar tipo de cambio
app.put('/api/admin/exchange-rate',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      const { rate } = req.body;

      if (!rate || rate <= 0) {
        return res.status(400).json({ error: 'Tipo de cambio inválido' });
      }

      const result = await query(`
        INSERT INTO exchange_rates (currency_from, currency_to, rate, updated_at)
        VALUES ('USD', 'ARS', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (currency_from, currency_to)
        DO UPDATE SET rate = $1, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [parseFloat(rate)]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error actualizando tipo de cambio:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// ========== RUTAS DE VENTAS (PROTEGIDAS) ==========




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
    details: err.message // DEBUG: exposing error always
  });
});

// ========== RUTAS DE HANDLERS ESPECIFÍCOS (Migración Serverless a Monolito) ==========
// Para que Vercel/Express manejen correctamente los archivos en /api/

app.all('/api/sales', (req, res) => salesHandler(req, res));
app.all('/api/sales-stats', (req, res) => salesStatsHandler(req, res));
app.all('/api/customers', (req, res) => customersHandler(req, res));

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