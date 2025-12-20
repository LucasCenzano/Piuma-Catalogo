const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function addColumns() {
    const client = await pool.connect();
    try {
        console.log('Adding "status" and "amount_paid" columns to "sales" table...');

        await client.query(`
      ALTER TABLE sales 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid',
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2);
    `);

        // Set default amount_paid to total_amount for existing records if null
        await client.query(`
      UPDATE sales 
      SET amount_paid = total_amount 
      WHERE amount_paid IS NULL;
    `);

        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        client.release();
        pool.end();
    }
}

addColumns();
