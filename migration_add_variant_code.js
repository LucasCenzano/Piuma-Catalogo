const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function addVariantProductCode() {
    const client = await pool.connect();
    try {
        console.log('🔄 Agregando código de producto a las variantes...');

        // Add product_code column to product_variants
        await client.query(`
      ALTER TABLE product_variants 
      ADD COLUMN IF NOT EXISTS product_code VARCHAR(100)
    `);

        console.log('✅ Columna product_code agregada a product_variants');

        // Add index for better search performance
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_variants_product_code 
      ON product_variants(product_code)
    `);

        console.log('✅ Índice creado para búsqueda rápida por código');
        console.log('📝 Ahora cada variante puede tener su propio código de producto');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

addVariantProductCode();
