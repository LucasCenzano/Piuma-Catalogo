const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🏗️ Migrando base de datos...');

        // 1. Add tags column to products
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    `);
        console.log('✅ Columna tags agregada a products.');

        // 2. Add type column to shop_filters
        await client.query(`
      ALTER TABLE shop_filters 
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'system';
    `);
        console.log('✅ Columna type agregada a shop_filters.');

        // 3. Mark existing filters as system
        await client.query(`
      UPDATE shop_filters SET type = 'system' WHERE key IN ('featured', 'new', 'discount');
    `);
        console.log('✅ Filtros existentes marcados como system.');

    } catch (error) {
        console.error('❌ Error migrando:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
