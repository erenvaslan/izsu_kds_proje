const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASS || '',
	database: process.env.DB_NAME || 'kds',
	charset: 'utf8mb4_general_ci',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_POOL || 10),
	queueLimit: 0
});

async function pingDatabase() {
	const [rows] = await pool.query('SELECT 1 as ok');
	return rows[0]?.ok === 1;
}

async function initializeConnection() {
	try {
		await pool.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
		await pool.query('SELECT 1');
		return true;
	} catch (e) {
		console.error('DB connection failed:', e.message);
		return false;
	}
}

module.exports = { pool, pingDatabase, initializeConnection };

