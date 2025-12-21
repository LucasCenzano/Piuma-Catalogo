const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🏗️ Migrando inventario...');

        // 1. Add quantity column to product_variants
        await client.query(`
      ALTER TABLE product_variants 
      ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
    `);
        console.log('✅ Columna quantity agregada a product_variants.');

        // 2. Add description/sku column if useful? User just asked for quantity.

    } catch (error) {
        console.error('❌ Error migrando:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
