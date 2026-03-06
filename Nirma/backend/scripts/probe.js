const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'restaurant_user',
    password: process.env.DB_PASSWORD || 'rest123',
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'restaurants' AND column_name = 'id';
        `);
        console.log(res.rows);
    } catch (e) {
        console.error(e.message);
    } finally {
        pool.end();
    }
}
check();
