/**
 * ═══════════════════════════════════════════════════════════════
 * DATABASE CONNECTION
 * ═══════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restaurant_management_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Connection event handlers
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Test connection
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('✓ Database connection test successful');
    }
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = (text, params) => {
    return pool.query(text, params);
};

/**
 * Execute multiple queries in a transaction
 * @param {function} callback - Function to execute with client
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    query,
    transaction
};
