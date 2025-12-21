// api/sales.js - API para gestionar ventas
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

// api/sales.js y api/sales-stats.js

// 👇 REEMPLAZA TODA TU FUNCIÓN "validateToken" CON ESTA VERSIÓN MEJORADA

function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Formato de token inválido o ausente. Se esperaba "Bearer {token}".' };
  }

  try {
    const token = authHeader.substring(7); // Extrae el token después de 'Bearer '

    // Tu token no es un JWT estándar, así que continuamos con tu lógica de decodificación
    // NOTA: Esta decodificación no es segura para producción sin una verificación de firma.
    if (token.startsWith('bearer_')) {
      const tokenData = token.substring(7);
      const decoded = JSON.parse(Buffer.from(tokenData, 'base64').toString());
      if (decoded.exp && decoded.exp < Date.now()) {
        return { valid: false, error: 'Token expirado' };
      }
      if (decoded.role !== 'admin') {
        return { valid: false, error: 'Sin permisos de administrador' };
      }
      return { valid: true, user: decoded };
    }

    // Si el token es un JWT estándar
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return { valid: false, error: 'Token JWT inválido (sin payload)' };
    }

    const decodedJson = atob(payloadBase64);
    const decodedPayload = JSON.parse(decodedJson);

    if (decodedPayload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token expirado' };
    }

    if (decodedPayload.role !== 'admin') {
      return { valid: false, error: 'Sin permisos de administrador' };
    }

    return { valid: true, user: decodedPayload };

  } catch (error) {
    console.error('Error validando token:', error);
    return { valid: false, error: 'Token dañado o inválido' };
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

  // Validar token para operaciones protegidas
  const authHeader = req.headers.authorization;
  const tokenValidation = validateToken(authHeader);

  if (!tokenValidation.valid) {
    console.log('Token inválido:', tokenValidation.error);
    return res.status(401).json({
      error: 'No autorizado',
      details: tokenValidation.error
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Obtener ventas
        if (req.query.id) {
          // Obtener una venta específica con sus detalles
          const saleResult = await query(`
            SELECT s.*, 
                   json_agg(
                     json_build_object(
                       'id', si.id,
                       'product_id', si.product_id,
                       'product_name', p.name,
                       'quantity', si.quantity,
                       'unit_price', si.unit_price,
                       'subtotal', si.subtotal
                     )
                   ) as items
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE s.id = $1
            GROUP BY s.id
          `, [parseInt(req.query.id)]);

          if (saleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
          }

          return res.status(200).json(saleResult.rows[0]);
        } else {
          // Obtener todas las ventas con paginación
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 10;
          const offset = (page - 1) * limit;

          // Filtros opcionales
          const startDate = req.query.start_date;
          const endDate = req.query.end_date;
          const paymentMethod = req.query.payment_method;

          let whereClause = '';
          const queryParams = [];
          let paramCount = 1;

          if (startDate) {
            whereClause += ` AND s.created_at >= $${paramCount}`;
            queryParams.push(startDate);
            paramCount++;
          }

          if (endDate) {
            whereClause += ` AND s.created_at <= $${paramCount}`;
            queryParams.push(endDate);
            paramCount++;
          }

          if (paymentMethod) {
            whereClause += ` AND s.payment_method = $${paramCount}`;
            queryParams.push(paymentMethod);
            paramCount++;
          }

          queryParams.push(limit, offset);

          const salesResult = await query(`
            SELECT s.*,
            COUNT(si.id) as items_count,
            COALESCE(SUM(si.quantity), 0) as total_items,
            json_agg(
              json_build_object(
                'product_name', p.name,
                'variant_name', v.color_name,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'subtotal', si.subtotal
              )
            ) as items
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            LEFT JOIN product_variants v ON si.variant_id = v.id
            WHERE 1 = 1 ${whereClause}
            GROUP BY s.id
            ORDER BY
          CASE 
                WHEN s.status = 'pending' OR(s.total_amount > COALESCE(s.amount_paid, 0)) THEN 0 
                ELSE 1 
              END ASC,
            s.created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
          `, queryParams);

          const generalStats = await query(`
      SELECT 
        COUNT(*) as total_sales,
            COALESCE(SUM(total_amount), 0) as total_revenue, --Total vendido
        
        -- ✅ Total cobrado(Estricto):
            COALESCE(SUM(
              CASE 
            WHEN status = 'pending' THEN COALESCE(amount_paid, 0)
            ELSE total_amount 
          END
            ), 0) as total_collected,

            -- ✅ Total por cobrar(Estricto):
            COALESCE(SUM(
              CASE 
            WHEN status = 'pending' THEN(total_amount - COALESCE(amount_paid, 0))
            ELSE 0 
          END
            ), 0) as total_pending,

            COALESCE(AVG(total_amount), 0) as average_sale
      FROM sales s
      WHERE 1 = 1 ${whereClause}
            `, queryParams.slice(0, -2));

          // Contar total de ventas para paginación
          const countResult = await query(`
            SELECT COUNT(DISTINCT s.id) as total
            FROM sales s
            WHERE 1 = 1 ${whereClause}
            `, queryParams.slice(0, -2));

          return res.status(200).json({
            sales: salesResult.rows,
            pagination: {
              page,
              limit,
              total: parseInt(countResult.rows[0].total),
              pages: Math.ceil(countResult.rows[0].total / limit)
            }
          });
        }

      case 'POST':
        // Crear nueva venta
        const {
          customer_name,
          customer_lastname,
          customer_phone,
          customer_email,
          payment_method,
          total_amount,
          items,
          notes,
          status = 'paid',
          amount_paid
        } = req.body;

        // Validaciones básicas
        if (!customer_name || !customer_lastname || !payment_method || !total_amount || !items || items.length === 0) {
          return res.status(400).json({
            error: 'Datos requeridos: customer_name, customer_lastname, payment_method, total_amount, items'
          });
        }

        if (!['efectivo', 'transferencia'].includes(payment_method.toLowerCase())) {
          return res.status(400).json({
            error: 'payment_method debe ser "efectivo" o "transferencia"'
          });
        }

        // Iniciar transacción
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // 1. Manejo de CLIENTE (Crear o Vincular)
          let customerIdToUse = req.body.customer_id;

          if (customerIdToUse) {
            // Si ya existe el ID, actualizamos sus datos si vienen nuevos y antes estaban vacíos (o se actualizaron)
            const { customer_phone, customer_email } = req.body;
            if (customer_phone || customer_email) {
              await client.query(`
                 UPDATE customers 
                 SET phone = COALESCE($1, phone), 
                     email = COALESCE($2, email),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3
               `, [customer_phone || null, customer_email || null, customerIdToUse]);
            }

          } else {
            // Si no vino ID pero vinieron datos texto, buscamos o creamos el cliente
            const { customer_name, customer_lastname, customer_phone, customer_email } = req.body;

            // Intentar buscar por nombre+apellido+telefono para evitar duplicados obvios
            const existingCustomer = await client.query(`
               SELECT id FROM customers 
               WHERE first_name ILIKE $1 AND last_name ILIKE $2 
               AND(phone = $3 OR($3 IS NULL AND phone IS NULL))
              `, [customer_name.trim(), customer_lastname.trim(), customer_phone?.trim() || null]);

            if (existingCustomer.rows.length > 0) {
              customerIdToUse = existingCustomer.rows[0].id;
              // También actualizar aquí por si acaso faltaba email
              if (customer_email) {
                await client.query('UPDATE customers SET email = $1 WHERE id = $2', [customer_email, customerIdToUse]);
              }
            } else {
              // Crear nuevo cliente automático
              const newCustomer = await client.query(`
                 INSERT INTO customers(first_name, last_name, phone, email, created_at, updated_at)
                 VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id
            `, [customer_name.trim(), customer_lastname.trim(), customer_phone?.trim() || null, customer_email?.trim() || null]);
              customerIdToUse = newCustomer.rows[0].id;
            }
          }

          // Crear la venta
          const saleResult = await client.query(`
            INSERT INTO sales(
              customer_id, customer_name, customer_lastname, customer_phone, customer_email,
              payment_method, total_amount, notes, status, amount_paid, created_at, updated_at
            )
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
            `, [
            customerIdToUse,
            customer_name.trim(),
            customer_lastname.trim(),
            customer_phone?.trim() || null,
            customer_email?.trim() || null,
            payment_method.toLowerCase(),
            parseFloat(total_amount),
            notes?.trim() || null,
            status,
            parseFloat(amount_paid || total_amount) // Default to total if not provided
          ]);

          const saleId = saleResult.rows[0].id;

          // Crear los items de la venta
          for (const item of items) {
            if (!item.product_id || !item.quantity || !item.unit_price) {
              throw new Error('Cada item debe tener product_id, quantity y unit_price');
            }

            const subtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);

            await client.query(`
              INSERT INTO sale_items(sale_id, product_id, variant_id, quantity, unit_price, subtotal)
              VALUES($1, $2, $3, $4, $5, $6)
              `, [
              saleId,
              parseInt(item.product_id),
              item.variant_id ? parseInt(item.variant_id) : null,
              parseInt(item.quantity),
              parseFloat(item.unit_price),
              subtotal
            ]);

            // ACTUALIZAR STOCK (Con lógica avanzada de variantes y cantidades)
            if (item.variant_id) {
              const variantId = parseInt(item.variant_id);
              const quantityToDeduct = parseInt(item.quantity);

              // 1. Decrementar cantidad de la variante
              await client.query(`
                 UPDATE product_variants
                 SET quantity = GREATEST(0, quantity - $1),
            in_stock = (quantity - $1) > 0
                 WHERE id = $2
            `, [quantityToDeduct, variantId]);

              // 2. Verificar estado global del producto (si todas las variantes están sin stock, el producto también)
              const variantStats = await client.query(`
                 SELECT COALESCE(SUM(quantity), 0) as total_quantity
                 FROM product_variants 
                 WHERE product_id = $1
            `, [parseInt(item.product_id)]);

              const totalQuantity = parseInt(variantStats.rows[0].total_quantity);

              // 3. Actualizar producto padre basado en el total de variantes
              await client.query(`
                 UPDATE products
                 SET in_stock = ($2 > 0),
            updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
            `, [parseInt(item.product_id), totalQuantity]);

            } else {
              // Comportamiento Legacy (Sin variantes):
              // Si el producto no tiene variantes, asumimos gestión simple (On/Off) por ahora,
              // o podríamos implementar un campo 'quantity' en products más adelante.
              // Por ahora mantenemos la lógica de ponerlo sin stock si es venta única, 
              // PERO lo ideal sería solo descontar si tuviéramos campo quantity en products.
              // Como no lo tenemos (o no se usa así en legacy), lo dejamos como before (solo apagar si se vende).
              // IMPORTANTE: Si quisieras soportar cantidad en productos sin variante, requeriría migración.

              // Para mantener compatibilidad: Solo marcar como agotado si se vende (lógica antigua simple).
              // Opcional: Podríamos no hacer nada si el usuario maneja stock manual.

              // Mantenemos la lógica de "Venta = Agotado" para productos simples para no romper flujo actual,
              // salvo que el usuario especifique lo contrario explícitamente.
              await client.query(`
                 UPDATE products 
                 SET in_stock = false, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
            `, [parseInt(item.product_id)]);
            }
          }

          await client.query('COMMIT');

          console.log(`✅ Venta creada exitosamente por ${tokenValidation.user.username}: #${saleId}`);

          return res.status(201).json({
            message: 'Venta registrada exitosamente',
            sale: saleResult.rows[0]
          });

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

      case 'PUT':
        // Actualizar una venta existente
        const updateData = req.body;

        if (!updateData.id) {
          return res.status(400).json({ error: 'ID de la venta es requerido' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        // Campos actualizables
        const updatableFields = [
          'customer_name', 'customer_lastname', 'customer_phone',
          'customer_email', 'payment_method', 'notes',
          'status', 'amount_paid' // ✅ AÑADIDO: Permite editar estado y montos
        ];

        updatableFields.forEach(field => {
          if (updateData[field] !== undefined) {
            updates.push(`${field} = $${paramCount++} `);
            values.push(updateData[field]);
          }
        });

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(parseInt(updateData.id));

        const updateResult = await query(`
          UPDATE sales 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
        RETURNING *
          `, values);

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Venta no encontrada' });
        }

        console.log(`✅ Venta actualizada por ${tokenValidation.user.username}: #${updateData.id} `);

        return res.status(200).json({
          message: 'Venta actualizada exitosamente',
          sale: updateResult.rows[0]
        });

      case 'DELETE':
        // Eliminar una venta (solo recomendado para correcciones)
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'ID de la venta es requerido' });
        }

        const client2 = await pool.connect();

        try {
          await client2.query('BEGIN');

          // Primero eliminar los items de la venta
          await client2.query('DELETE FROM sale_items WHERE sale_id = $1', [parseInt(id)]);

          // Luego eliminar la venta
          const deleteResult = await client2.query(
            'DELETE FROM sales WHERE id = $1 RETURNING id, customer_name, customer_lastname, total_amount',
            [parseInt(id)]
          );

          if (deleteResult.rows.length === 0) {
            throw new Error('Venta no encontrada');
          }

          await client2.query('COMMIT');

          console.log(`🗑️ Venta eliminada por ${tokenValidation.user.username}: #${id} `);

          return res.status(200).json({
            message: 'Venta eliminada exitosamente',
            deletedSale: deleteResult.rows[0]
          });

        } catch (error) {
          await client2.query('ROLLBACK');
          throw error;
        } finally {
          client2.release();
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en sales API:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};