const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Iniciando migración...');

        // Agregar columna 'is_featured'
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE
    `);
        console.log('✅ Columna is_featured agregada.');

        // Agregar columna 'is_new'
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE
    `);
        console.log('✅ Columna is_new agregada.');

        // Agregar columna 'discount_percentage'
        await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0
    `);
        console.log('✅ Columna discount_percentage agregada.');

        console.log('🎉 Migración completada exitosamente.');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
