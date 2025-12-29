const { pool } = require('../config/database');

class DatasetModel {
	static async getAllTables() {
		const [rows] = await pool.query(
			"SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY TABLE_NAME"
		);
		return rows.map(r => r.name);
	}

	static async getTableData(table, limit = 50) {
		const safeLimit = Math.min(Number(limit), 500);
		const [rows] = await pool.query(`SELECT * FROM \`${table}\` LIMIT ${safeLimit}`);
		return rows;
	}
}

module.exports = DatasetModel;

