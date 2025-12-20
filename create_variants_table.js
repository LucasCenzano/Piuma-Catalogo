const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function addProductVariants() {
    const client = await pool.connect();
    try {
        console.log('Creating "product_variants" table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        color_name VARCHAR(50) NOT NULL,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create an index for faster lookups
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
      ON product_variants(product_id);
    `);

        console.log('Table "product_variants" created successfully.');

        // Optional: Populate default variants for existing products?
        // User didn't ask, but it might be consistent to have at least one variant if the main prod is in stock.
        // However, existing logic uses product.in_stock. We should keep that for backward compatibility 
        // or eventually migrate entirely.
        // For now, let's keep it hybrid: 
        // - product.in_stock is the "master" switch.
        // - product_variants detail the available colors.

    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
        pool.end();
    }
}

addProductVariants();
