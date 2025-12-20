const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function addVariantIdToSaleItems() {
    const client = await pool.connect();
    try {
        console.log('Adding "variant_id" column to "sale_items" table...');

        await client.query(`
      ALTER TABLE sale_items 
      ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
    `);

        console.log('Column "variant_id" added successfully.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        client.release();
        pool.end();
    }
}

addVariantIdToSaleItems();
