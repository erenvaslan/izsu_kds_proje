require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
	const dbName = process.env.DB_NAME || 'kds';
	const serverConfig = {
		host: process.env.DB_HOST || '127.0.0.1',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASS || ''
	};

	const tableSql = `CREATE TABLE IF NOT EXISTS \`staging_izsu_generic\` (
		id VARCHAR(191) NOT NULL,
		payload JSON NULL,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;

	let serverConn;
	let dbConn;
	try {
		// Connect without database to create it if needed
		serverConn = await mysql.createConnection(serverConfig);
		await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
		console.log(`DATABASE_OK ${dbName}`);

		// Connect to the database and create required tables
		dbConn = await mysql.createConnection({ ...serverConfig, database: dbName });
		await dbConn.query('SET NAMES utf8mb4 COLLATE utf8mb4_general_ci');
		await dbConn.query(tableSql);
		console.log('TABLE_OK staging_izsu_generic');
	} catch (e) {
		console.error('DB_INIT_ERR', e.code || 'ERR', e.message);
		process.exitCode = 1;
	} finally {
		if (dbConn) await dbConn.end();
		if (serverConn) await serverConn.end();
	}
})();


