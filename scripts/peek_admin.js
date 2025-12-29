require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
	const dbName = process.env.DB_NAME;
	const conn = await mysql.createConnection({
		host: process.env.DB_HOST || '127.0.0.1',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASS || '',
		database: dbName
	});

	try {
		const [cols] = await conn.query('DESCRIBE `admin`');
		console.log('ADMIN_COLUMNS', cols.map(c => ({ Field: c.Field, Type: c.Type })));
		const [rows] = await conn.query('SELECT * FROM `admin` LIMIT 3');
		console.log('ADMIN_SAMPLE', rows);
	} finally {
		await conn.end();
	}
})().catch(e => { console.error('PEEK_ADMIN_ERR', e.message); process.exitCode = 1; });


