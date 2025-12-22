const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function testQuery() {
    try {
        const result = await pool.query(
            'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id',
            [95]
        );

        console.log('Query directo - Variantes:', JSON.stringify(result.rows, null, 2));
        console.log('Campos:', Object.keys(result.rows[0] || {}));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

testQuery();
