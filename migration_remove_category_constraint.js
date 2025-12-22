const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function removeCheckConstraint() {
    const client = await pool.connect();
    try {
        console.log('🔄 Eliminando restricción de categorías hardcodeadas...');

        // Drop the check_category constraint
        await client.query(`
      ALTER TABLE products 
      DROP CONSTRAINT IF EXISTS check_category
    `);

        console.log('✅ Restricción check_category eliminada exitosamente');
        console.log('📝 Ahora puedes usar cualquier categoría de la tabla categories');

    } catch (error) {
        console.error('❌ Error eliminando restricción:', error);
    } finally {
        client.release();
        pool.end();
    }
}

removeCheckConstraint();
