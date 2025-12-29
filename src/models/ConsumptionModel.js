const { pool } = require('../config/database');

class ConsumptionModel {
	static async getTopConsumers(scope = 'ilce', limit = 10) {
		const safeScope = scope === 'mahalle' ? 'mahalle' : 'ilce';
		const safeLimit = Math.max(1, Math.min(50, Number(limit)));
		
		const [rows] = await pool.query(
			`SELECT \`${safeScope}\` AS name,
					SUM(
						CAST(REPLACE(COALESCE(ortalama_tuketim, '0'), ',', '.') AS DECIMAL(20,4))
						* CAST(REPLACE(REPLACE(REPLACE(COALESCE(abone_adedi, '0'), '.', ''), ' ', ''), ',', '') AS UNSIGNED)
					) AS total
			 FROM \`ilce_mahalle_su_tuketimi\`
			 GROUP BY \`${safeScope}\`
			 ORDER BY total DESC
			 LIMIT ${safeLimit}`
		);
		return rows;
	}

	static async getNeighborhoods(ilce = null) {
		const params = [];
		let where = '';
		if (ilce) {
			where = 'WHERE ilce = ?';
			params.push(ilce);
		}
		const [rows] = await pool.query(
			`SELECT DISTINCT mahalle FROM \`ilce_mahalle_su_tuketimi\` ${where} ORDER BY mahalle`,
			params
		);
		return rows.map(r => r.mahalle).filter(Boolean);
	}
}

module.exports = ConsumptionModel;

