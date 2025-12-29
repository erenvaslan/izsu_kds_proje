require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
	const config = {
		host: process.env.DB_HOST || '127.0.0.1',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASS || '',
		database: process.env.DB_NAME || 'kds'
	};
	try {
		const conn = await mysql.createConnection(config);
		await conn.query('SELECT 1');
		console.log('DB_OK');
		await conn.end();
	} catch (e) {
		console.log('DB_ERR', e.code || 'ERR', e.message);
		process.exitCode = 1;
	}
})();



