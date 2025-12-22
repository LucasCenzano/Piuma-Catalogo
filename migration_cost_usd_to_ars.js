const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Cambiando costo unitario de USD a ARS...');

        // 1. Renombrar columna antigua
        await client.query(`
      ALTER TABLE products 
      RENAME COLUMN unit_cost_usd TO unit_cost_ars
    `);
        console.log('✅ Columna renombrada: unit_cost_usd -> unit_cost_ars');

        // 2. Convertir valores existentes de USD a ARS usando el tipo de cambio actual
        const exchangeRateResult = await client.query(`
      SELECT rate FROM exchange_rates 
      WHERE currency_from = 'USD' AND currency_to = 'ARS' 
      ORDER BY updated_at DESC LIMIT 1
    `);

        const exchangeRate = exchangeRateResult.rows[0]?.rate || 1200;
        console.log(`📊 Tipo de cambio usado para conversión: ${exchangeRate} ARS/USD`);

        await client.query(`
      UPDATE products 
      SET unit_cost_ars = unit_cost_ars * $1
      WHERE unit_cost_ars > 0
    `, [exchangeRate]);

        console.log('✅ Valores convertidos de USD a ARS');
        console.log('🎉 Migración completada exitosamente.');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
