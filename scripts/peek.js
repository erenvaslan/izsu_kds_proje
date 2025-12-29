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

	const [tables] = await conn.execute(
		"SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = ? ORDER BY TABLE_NAME",
		[dbName]
	);
	if (tables.length === 0) {
		console.log('NO_TABLES');
		await conn.end();
		return;
	}
	console.log('TABLES', tables.map(t => t.name));

	const previewTables = tables.slice(0, Math.min(5, tables.length)).map(t => t.name);
	for (const t of previewTables) {
		const [countRows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
		console.log(`COUNT ${t}`, countRows[0].c);
		if (countRows[0].c > 0) {
			const [rows] = await conn.query(`SELECT * FROM \`${t}\` LIMIT 5`);
			console.log(`SAMPLE ${t}`, rows);
		}
	}

	await conn.end();
})().catch(e => { console.error('PEEK_ERR', e.message); process.exitCode = 1; });


