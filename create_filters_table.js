const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createFiltersTable() {
    const client = await pool.connect();
    try {
        console.log('🏗️ Creando tabla de filtros...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS shop_filters (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        label VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✅ Tabla creada.');

        // Seed initial filters
        const initialFilters = [
            { key: 'featured', label: 'Destacados' },
            { key: 'new', label: 'Nuevos' },
            { key: 'discount', label: 'Ofertas' }
        ];

        for (const filter of initialFilters) {
            await client.query(`
        INSERT INTO shop_filters (key, label, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (key) DO NOTHING;
      `, [filter.key, filter.label]);
        }

        console.log('✅ Filtros iniciales insertados.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createFiltersTable();
