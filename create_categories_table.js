const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const INITIAL_CATEGORIES = [
    'Bandoleras',
    'Carteras',
    'Billeteras',
    'Mochilas',
    'Riñoneras',
    'Porta Celulares'
];

async function createCategoriesTable() {
    console.log('🚀 Creating categories table...');
    const client = await pool.connect();

    try {
        // Create table
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Table product_categories created/verified');

        // Insert initial categories
        console.log('📦 Inserting initial categories...');
        for (const category of INITIAL_CATEGORIES) {
            await client.query(`
        INSERT INTO product_categories (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
      `, [category]);
        }
        console.log('✅ Initial categories inserted');

        // Verify
        const result = await client.query('SELECT * FROM product_categories ORDER BY name');
        console.log('📋 Current categories:', result.rows.map(r => r.name).join(', '));

    } catch (error) {
        console.error('❌ Error creating categories table:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createCategoriesTable();
