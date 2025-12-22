const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixPrice() {
    try {
        await pool.query(
            'UPDATE products SET price = $1 WHERE id = $2',
            ['$30.000', 95]
        );
        console.log('✅ Precio actualizado a $30.000');

        const result = await pool.query('SELECT id, name, price FROM products WHERE id = 95');
        console.log('Verificación:', result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

fixPrice();
