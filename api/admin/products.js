// api/admin/products.js - Versión actualizada con descripción
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Función para validar el token
function validateToken(authHeader) {
  if (!authHeader) {
    return { valid: false, error: 'No se proporcionó token' };
  }

  try {
    let token = authHeader;

    // Remover prefijos si existen
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (authHeader.startsWith('bearer_')) {
      // El token ya viene con bearer_ desde auth.js
      token = authHeader;
    }

    // Para token con formato bearer_xxxxx
    if (token.startsWith('bearer_')) {
      const tokenData = token.substring(7);
      const decoded = JSON.parse(Buffer.from(tokenData, 'base64').toString());

      // Verificar expiración
      if (decoded.exp && decoded.exp < Date.now()) {
        return { valid: false, error: 'Token expirado' };
      }

      // Verificar que sea admin
      if (decoded.role !== 'admin') {
        return { valid: false, error: 'Sin permisos de administrador' };
      }

      return { valid: true, user: decoded };
    }

    return { valid: false, error: 'Formato de token inválido' };
  } catch (error) {
    console.error('Error validando token:', error);
    return { valid: false, error: 'Token inválido' };
  }
}

module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar token
  const authHeader = req.headers.authorization;
  console.log('Authorization header recibido:', authHeader ? authHeader.substring(0, 30) + '...' : 'No presente');

  const tokenValidation = validateToken(authHeader);

  if (!tokenValidation.valid) {
    console.log('Token inválido:', tokenValidation.error);
    return res.status(401).json({
      error: 'No autorizado',
      details: tokenValidation.error
    });
  }

  console.log('Token válido, usuario:', tokenValidation.user.username);

  try {
    switch (req.method) {
      case 'GET':
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
            try {
              product.images_url = JSON.parse(product.images_url);
            } catch (e) {
              product.images_url = [];
            }
          }

          return res.status(200).json(product);
        } else {
          const result = await query(`
            SELECT *, 
              CASE WHEN in_stock THEN 'En Stock' ELSE 'Sin Stock' END as stock_status,
              created_at,
              updated_at
            FROM products
            WHERE is_active = true
            ORDER BY category, name
          `);

          const products = result.rows.map(product => {
            if (typeof product.images_url === 'string') {
              try {
                product.images_url = JSON.parse(product.images_url);
              } catch (e) {
                product.images_url = [];
              }
            }
            return product;
          });

          console.log(`Enviando ${products.length} productos`);
          return res.status(200).json(products);
        }

      case 'POST':
        console.log('📝 Creando producto...');
        try {
          const {
            name, price, category, description, inStock, imagesUrl,
            isFeatured, isNew, discountPercentage, tags, variants
          } = req.body;

          if (!name || !category) {
            return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
          }

          // Obtener el siguiente ID disponible
          const maxIdResult = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM products');
          const nextId = maxIdResult.rows[0].next_id;

          // Sanitizar precio
          const finalPrice = (function (p) {
            if (!p) return 0;
            const clean = String(p).replace(/[^0-9.,-]/g, '');
            let normalized = clean.replace(/,/g, '.');
            return parseFloat(normalized) || 0;
          })(price);

          console.log('📝 Insertando producto principal:', { nextId, name });

          const createResult = await query(`
            INSERT INTO products (
              id, name, price, category, description, in_stock, images_url, 
              is_featured, is_new, discount_percentage, tags,
              created_at, updated_at, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
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
            parseInt(discountPercentage) || 0,
            tags || [] // Array de tags
          ]);

          const newProduct = createResult.rows[0];

          // Insertar variantes si existen
          if (variants && Array.isArray(variants) && variants.length > 0) {
            console.log(`📝 Insertando ${variants.length} variantes...`);
            for (const variant of variants) {
              await query(`
                INSERT INTO product_variants (product_id, color_name, in_stock, quantity, created_at, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `, [
                newProduct.id,
                variant.color_name,
                variant.in_stock !== undefined ? variant.in_stock : true,
                parseInt(variant.quantity) || 0
              ]);
            }
          }

          if (typeof newProduct.images_url === 'string') {
            try { newProduct.images_url = JSON.parse(newProduct.images_url); } catch (e) { newProduct.images_url = []; }
          }

          // Adjuntar variantes en la respuesta
          newProduct.variants = variants || [];

          return res.status(201).json({
            message: 'Producto creado exitosamente',
            product: newProduct
          });

        } catch (postError) {
          console.error('❌ Error específico en POST /products:', postError);
          return res.status(500).json({
            error: 'Error creando producto en base de datos',
            details: postError.message,
            code: postError.code
          });
        }

      case 'PUT':
        const updateData = req.body;

        if (!updateData.id) {
          return res.status(400).json({ error: 'ID del producto es requerido' });
        }

        console.log('📝 Datos de actualización recibidos:', updateData);

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (updateData.name !== undefined) {
          updates.push(`name = $${paramCount++}`);
          values.push(updateData.name);
        }
        if (updateData.price !== undefined) {
          updates.push(`price = $${paramCount++}`);
          values.push((function (p) {
            if (!p) return 0;
            const clean = String(p).replace(/[^0-9.,-]/g, '');
            let normalized = clean.replace(/,/g, '.');
            return parseFloat(normalized) || 0;
          })(updateData.price));
        }
        if (updateData.category !== undefined) {
          updates.push(`category = $${paramCount++}`);
          values.push(updateData.category);
        }
        if (updateData.description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(updateData.description);
        }
        if (updateData.inStock !== undefined) {
          updates.push(`in_stock = $${paramCount++}`);
          values.push(updateData.inStock);
        }
        if (updateData.imagesUrl !== undefined) {
          updates.push(`images_url = $${paramCount++}`);
          values.push(JSON.stringify(updateData.imagesUrl));
        }
        // Nuevos campos
        if (updateData.isFeatured !== undefined) {
          updates.push(`is_featured = $${paramCount++}`);
          values.push(updateData.isFeatured);
        }
        if (updateData.isNew !== undefined) {
          updates.push(`is_new = $${paramCount++}`);
          values.push(updateData.isNew);
        }
        if (updateData.discountPercentage !== undefined) {
          updates.push(`discount_percentage = $${paramCount++}`);
          values.push(updateData.discountPercentage);
        }
        if (updateData.tags !== undefined) {
          updates.push(`tags = $${paramCount++}`);
          values.push(updateData.tags);
        }

        // Actualizar variantes: Estrategia simple -> Borrar todas de este producto y recrearlas
        // SOLO si variants se pasa en el body
        if (updateData.variants && Array.isArray(updateData.variants)) {
          console.log(`🔄 Actualizando variantes para producto ${updateData.id}...`);
          // Primero borrar existentes
          await query('DELETE FROM product_variants WHERE product_id = $1', [updateData.id]);
          // Insertar nuevas
          for (const variant of updateData.variants) {
            await query(`
                INSERT INTO product_variants (product_id, color_name, in_stock, quantity, created_at, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `, [
              updateData.id,
              variant.color_name,
              variant.in_stock !== undefined ? variant.in_stock : true,
              parseInt(variant.quantity) || 0
            ]);
          }
        }

        if (updates.length > 0) {
          updates.push(`updated_at = CURRENT_TIMESTAMP`);
          values.push(parseInt(updateData.id));

          const updateQuery = `
              UPDATE products 
              SET ${updates.join(', ')}
              WHERE id = $${paramCount}
              RETURNING *
            `;

          const updateResult = await query(updateQuery, values);
          if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
          }

          const updatedProduct = updateResult.rows[0];
          if (typeof updatedProduct.images_url === 'string') {
            try { updatedProduct.images_url = JSON.parse(updatedProduct.images_url); } catch (e) { updatedProduct.images_url = []; }
          }
          // Retornar variantes actualizadas también
          updatedProduct.variants = updateData.variants || []; // Simplificación, deberíamos re-consultar si queremos datos reales de la BD

          return res.status(200).json({
            message: 'Producto actualizado exitosamente',
            product: updatedProduct
          });
        } else {
          // Si solo se actualizaron variantes o nada
          return res.status(200).json({ message: 'Datos actualizados' });
        }

      case 'DELETE':
        const urlParts = req.url.split('/');
        const productId = urlParts[urlParts.length - 1];

        if (!productId || isNaN(parseInt(productId))) {
          return res.status(400).json({ error: 'ID de producto inválido en la URL' });
        }

        // Desactivar
        const softDeleteResult = await query(
          'UPDATE products SET is_active = false WHERE id = $1 RETURNING id, name',
          [parseInt(productId)]
        );

        if (softDeleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
        }

        return res.status(200).json({
          message: 'Producto desactivado exitosamente',
          product: softDeleteResult.rows[0]
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('❌ Error GLOBAL en admin products API:', error);
    return res.status(500).json({
      error: 'Error interno del servidor (Global)',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
