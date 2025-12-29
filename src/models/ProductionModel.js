const { pool } = require('../config/database');

class ProductionModel {
	static async getTotalDailyProduction() {
		const [rows] = await pool.query('SELECT SUM(uretim_miktari) AS total FROM `gunluk_su_uretimi`');
		return rows[0]?.total ?? null;
	}

	static async getMonthlyByYear(year) {
		const [rows] = await pool.query(
			`SELECT CONCAT(yil, '-', LPAD(ay,2,'0')) AS month, uretim_kaynagi AS source, SUM(uretim_miktari) AS total
			 FROM \`aylara_kaynaklara_gore_su_uretimi\`
			 WHERE yil = ?
			 GROUP BY yil, ay, uretim_kaynagi
			 ORDER BY yil, ay`,
			[year]
		);
		return rows;
	}

	static async getAnnualTotals() {
		const [rows] = await pool.query(
			`SELECT yil AS year, SUM(COALESCE(uretim_miktari,0)) AS total
			 FROM \`aylara_kaynaklara_gore_su_uretimi\`
			 GROUP BY yil
			 ORDER BY yil`
		);
		return rows.map(r => ({ year: Number(r.year), total: Number(r.total || 0) }));
	}
}

module.exports = ProductionModel;

