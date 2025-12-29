const { pool } = require('../config/database');

class AdminModel {
	static async findByEmail(email) {
		const [rows] = await pool.query(
			'SELECT id, `e-mail` AS email, `password` AS password FROM `admin` WHERE `e-mail` = ? LIMIT 1',
			[email]
		);
		return rows.length ? rows[0] : null;
	}

	static async findById(id) {
		const [rows] = await pool.query(
			'SELECT id, `e-mail` AS email FROM `admin` WHERE id = ? LIMIT 1',
			[id]
		);
		return rows.length ? rows[0] : null;
	}
}

module.exports = AdminModel;

