const { pool } = require('../config/database');

class SubscriberModel {
	static async getTotalSubscribers() {
		// Detect column name dynamically
		const [cols] = await pool.query(
			"SELECT LOWER(COLUMN_NAME) AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ilce_abone_sayilari'"
		);
		const colNames = cols.map(c => c.name);
		const candidates = ['abone_sayisi', 'toplam_abone', 'abone_adedi', 'abone', 'abone_sayi', 'toplam_abone_sayisi'];
		let found = candidates.find(n => colNames.includes(n));
		
		if (!found) {
			const [likeCols] = await pool.query(
				"SELECT LOWER(COLUMN_NAME) AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'ilce_abone_sayilari' AND LOWER(COLUMN_NAME) LIKE '%abone%'"
			);
			if (Array.isArray(likeCols) && likeCols.length) {
				found = likeCols[0].name;
			}
		}
		
		if (!found) return 0;
		
		try {
			const [rows] = await pool.query(
				`SELECT IFNULL(SUM(CAST(REGEXP_REPLACE(COALESCE(\`${found}\`, '0'), '[^0-9]', '') AS UNSIGNED)), 0) AS total FROM \`ilce_abone_sayilari\``
			);
			return rows[0]?.total ?? 0;
		} catch (e) {
			const [rows2] = await pool.query(
				`SELECT IFNULL(SUM(CAST(REPLACE(REPLACE(REPLACE(COALESCE(\`${found}\`, '0'), ',', ''), '.', ''), ' ', '') AS UNSIGNED)), 0) AS total FROM \`ilce_abone_sayilari\``
			);
			return rows2[0]?.total ?? 0;
		}
	}
}

module.exports = SubscriberModel;

