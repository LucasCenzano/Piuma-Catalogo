const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_variants';
    `);
        console.log('Product Variants Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`));

        const prodRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products';
      `);
        console.log('Products Columns:', prodRes.rows.map(r => `${r.column_name} (${r.data_type})`));

        const salesRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sale_items';
      `);
        console.log('Sale Items Columns:', salesRes.rows.map(r => `${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();
