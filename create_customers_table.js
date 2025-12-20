const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createCustomersTable() {
    const client = await pool.connect();
    try {
        console.log('🚀 Iniciando corrección de tabla customers...');

        await client.query('BEGIN');

        // 1. Borrar tabla si existe (para asegurar estructura limpia si hubo errores parciales)
        // OJO: En producción esto es peligroso, pero aquí estamos definiendo la estructura inicial
        // Sin embargo, si ya hay datos valiosos, mejor alterar.
        // Como el error dice "column first_name does not exist", significa que la tabla existe pero con otra estructura?
        // Verifiquemos eliminando y recreando para estar seguros del esquema limpio.
        await client.query('DROP TABLE IF EXISTS customers CASCADE');

        // 2. Crear tabla customers con estructura correcta
        await client.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabla customers recreada correctamente.');

        // 3. Agregar columna customer_id a sales si no existe (la anterior pudo fallar o quedar a medias)
        // Primero chequeamos si existe para evitar error
        await client.query(`
      ALTER TABLE sales 
      DROP COLUMN IF EXISTS customer_id;
    `);
        await client.query(`
      ALTER TABLE sales 
      ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;
    `);
        console.log('✅ Columna customer_id agregada a sales.');

        // 4. Migrar datos existentes
        console.log('🔄 Migrando clientes existentes de ventas pasadas...');
        const existingSales = await client.query(`
      SELECT DISTINCT ON (customer_name, customer_lastname, customer_phone) 
        customer_name, customer_lastname, customer_phone, customer_email
      FROM sales
      WHERE customer_name IS NOT NULL
    `);

        let migratedCount = 0;
        for (const sale of existingSales.rows) {
            if (!sale.customer_name) continue;

            // Insertar cliente
            const insertRes = await client.query(`
        INSERT INTO customers (first_name, last_name, phone, email)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [sale.customer_name, sale.customer_lastname, sale.customer_phone, sale.customer_email]);

            const newCustomerId = insertRes.rows[0].id;

            // Actualizar ventas pasadas que coincidan
            await client.query(`
        UPDATE sales
        SET customer_id = $1
        WHERE customer_name = $2
          AND customer_lastname = $3
          AND (customer_phone = $4 OR (customer_phone IS NULL AND $4 IS NULL))
      `, [newCustomerId, sale.customer_name, sale.customer_lastname, sale.customer_phone]);

            migratedCount++;
        }

        console.log(`✅ Migrados ${migratedCount} clientes únicos de ventas históricas.`);

        await client.query('COMMIT');
        console.log('🎉 Todo listo!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creando tabla customers:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createCustomersTable();
