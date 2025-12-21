// api/customers.js - API para gestionar clientes
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

// Reutilizamos la función de validación de token
function validateToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Formato de token inválido o ausente. Se esperaba "Bearer {token}".' };
  }

  try {
    const token = authHeader.substring(7);

    // Soporte token simple (como en sales.js)
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

    // JWT estándar
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return { valid: false, error: 'Token JWT inválido (sin payload)' };
    const decodedPayload = JSON.parse(atob(payloadBase64));
    if (decodedPayload.exp * 1000 < Date.now()) return { valid: false, error: 'Token expirado' };
    if (decodedPayload.role !== 'admin') return { valid: false, error: 'Sin permisos de administrador' };
    return { valid: true, user: decodedPayload };
  } catch (error) {
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

  // Validar token
  const authHeader = req.headers.authorization;
  const tokenValidation = validateToken(authHeader);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: 'No autorizado', details: tokenValidation.error });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Buscar clientes
        const search = req.query.search;
        let queryText = `
          SELECT c.*, 
            COUNT(s.id) as total_purchases, 
            COALESCE(SUM(s.total_amount), 0) as total_spent,
            COALESCE(SUM(CASE WHEN s.status = 'pending' THEN (s.total_amount - COALESCE(s.amount_paid, 0)) ELSE 0 END), 0) as total_debt,
            MAX(s.created_at) as last_purchase
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
        `;
        const params = [];

        if (search) {
          queryText += ` WHERE (
            c.first_name ILIKE $1 OR 
            c.last_name ILIKE $1 OR 
            (c.first_name || ' ' || c.last_name) ILIKE $1 OR
            c.phone ILIKE $1 OR 
            c.email ILIKE $1
          )`;
          params.push(`%${search}%`);
        }

        // Sorting
        const sortBy = req.query.sortBy || 'spent'; // name, recent, spent, purchases, debt
        let sortOrder = req.query.sortOrder || 'desc';
        // Sanitize sortOrder to prevent SQL injection
        if (sortOrder.toLowerCase() !== 'asc' && sortOrder.toLowerCase() !== 'desc') {
          sortOrder = 'desc';
        }

        queryText += ` GROUP BY c.id`;

        switch (sortBy) {
          case 'name':
            queryText += ` ORDER BY c.first_name ${sortOrder}, c.last_name ${sortOrder}`;
            break;
          case 'recent':
            // Clientes más recientes (por última compra o creación)
            queryText += ` ORDER BY COALESCE(MAX(s.created_at), c.created_at) ${sortOrder}`;
            break;
          case 'purchases':
            queryText += ` ORDER BY total_purchases ${sortOrder}`;
            break;
          case 'debt':
            queryText += ` ORDER BY total_debt ${sortOrder}`;
            break;
          case 'spent':
          default:
            queryText += ` ORDER BY total_spent ${sortOrder}`;
            break;
        }

        // Paginación si se quisiera (opcional por ahora)
        queryText += ' LIMIT 50';

        const result = await query(queryText, params);
        return res.status(200).json(result.rows);

      case 'POST':
        // Crear cliente manualmente
        const { first_name, last_name, phone, email, notes } = req.body;
        if (!first_name || !last_name) {
          return res.status(400).json({ error: 'Nombre y apellido requeridos' });
        }

        const newCustomer = await query(`
          INSERT INTO customers (first_name, last_name, phone, email, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [first_name.trim(), last_name.trim(), phone?.trim(), email?.trim(), notes?.trim()]);

        return res.status(201).json(newCustomer.rows[0]);

      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en customers API:', error);
    return res.status(500).json({ error: 'Error interno', details: error.message });
  }
};