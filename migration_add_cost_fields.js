const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Iniciando migración de campos de costo...');

        // 1. Agregar columnas a products
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS product_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS unit_cost_usd NUMERIC(10, 2) DEFAULT 0
    `);
        console.log('✅ Columnas product_code y unit_cost_usd agregadas a products.');

        // 2. Crear tabla para tipo de cambio
        await client.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        currency_from VARCHAR(3) NOT NULL,
        currency_to VARCHAR(3) NOT NULL,
        rate NUMERIC(10, 4) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(currency_from, currency_to)
      )
    `);
        console.log('✅ Tabla exchange_rates creada.');

        // 3. Insertar tipo de cambio inicial USD -> ARS (puedes actualizarlo después)
        await client.query(`
      INSERT INTO exchange_rates (currency_from, currency_to, rate)
      VALUES ('USD', 'ARS', 1200.00)
      ON CONFLICT (currency_from, currency_to) 
      DO UPDATE SET rate = EXCLUDED.rate, updated_at = CURRENT_TIMESTAMP
    `);
        console.log('✅ Tipo de cambio USD->ARS inicial configurado (1200 ARS).');

        // 4. Crear índice para product_code
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_product_code 
      ON products(product_code)
    `);
        console.log('✅ Índice creado para product_code.');

        console.log('🎉 Migración completada exitosamente.');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
