const { pool } = require('../config/database');

class LossModel {
	static async getDistricts() {
		const [rows] = await pool.query('SELECT DISTINCT ilce FROM `su_kayiplari` WHERE TRIM(ilce) <> "" ORDER BY ilce');
		return rows.map(r => r.ilce).filter(Boolean);
	}

	static async getLossTrend(years = 5, ilce = null) {
		const safeYears = Math.max(1, Math.min(20, Number(years)));
		const params = [];
		let where = '';
		if (ilce) {
			where = 'WHERE ilce = ?';
			params.push(ilce);
		}
		params.push(safeYears);
		
		const [rows] = await pool.query(
			`SELECT yil,
					100 * SUM(CAST(REPLACE(COALESCE(toplam_su_kayiplari,'0'), ',', '.') AS DECIMAL(20,4)))
					  / NULLIF(SUM(CAST(REPLACE(COALESCE(sisteme_giren_su_miktari,'0'), ',', '.') AS DECIMAL(20,4))), 0) AS loss_pct
			 FROM \`su_kayiplari\`
			 ${where}
			 GROUP BY yil
			 ORDER BY yil DESC
			 LIMIT ?`,
			params
		);
		return rows.map(r => ({ ym: `${r.yil}-12`, loss: r.loss_pct })).reverse();
	}

	static async getMonthlyLosses(year, ilce = null) {
		// Detect if 'ay' column exists
		const [cols] = await pool.query(
			"SELECT LOWER(COLUMN_NAME) AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'su_kayiplari'"
		);
		const colNames = cols.map(c => c.name);
		const hasAy = colNames.includes('ay');

		if (hasAy) {
			const params = [year];
			let where = 'WHERE yil = ?';
			if (ilce) { where += ' AND ilce = ?'; params.push(ilce); }
			const [mrows] = await pool.query(
				`SELECT CONCAT(yil, '-', LPAD(ay,2,'0')) AS month,
						100 * SUM(CAST(REPLACE(COALESCE(toplam_su_kayiplari,'0'), ',', '.') AS DECIMAL(20,4)))
						  / NULLIF(SUM(CAST(REPLACE(COALESCE(sisteme_giren_su_miktari,'0'), ',', '.') AS DECIMAL(20,4))), 0) AS loss
				 FROM \`su_kayiplari\`
				 ${where}
				 GROUP BY yil, ay
				 ORDER BY yil, ay`,
				params
			);
			const out = mrows.map(r => ({ month: r.month, loss: Number(r.loss || 0) }));
			if (out.length) return out;
		}

		// Yearly fallback
		const yParams = [year];
		let yWhere = 'WHERE yil = ?';
		if (ilce) { yWhere += ' AND ilce = ?'; yParams.push(ilce); }
		const [yearlyRows] = await pool.query(
			`SELECT 100 * SUM(CAST(REPLACE(COALESCE(toplam_su_kayiplari,'0'), ',', '.') AS DECIMAL(20,4)))
					 / NULLIF(SUM(CAST(REPLACE(COALESCE(sisteme_giren_su_miktari,'0'), ',', '.') AS DECIMAL(20,4))), 0) AS loss_pct
			 FROM \`su_kayiplari\` ${yWhere}`,
			yParams
		);
		const yearly = Number(yearlyRows?.[0]?.loss_pct || 0);
		return Array.from({ length: 12 }, (_, i) => ({ month: `${year}-${String(i+1).padStart(2,'0')}`, loss: yearly }));
	}

	static async getLossesByDistrict(year, limit = 10) {
		const safeLimit = Math.max(1, Math.min(50, Number(limit)));
		const [rows] = await pool.query(
			`SELECT ilce AS name, SUM(COALESCE(toplam_su_kayiplari,0)) AS total
			 FROM \`su_kayiplari\`
			 WHERE yil = ?
			 GROUP BY ilce
			 ORDER BY total DESC
			 LIMIT ${safeLimit}`,
			[year]
		);
		return rows;
	}

	static async getLossBreakdown(year, ilce) {
		const [rows] = await pool.query(
			`SELECT 
				SUM(COALESCE(temin_servis_baglanti_kayip,0)) AS temin_servis_baglanti_kayip,
				SUM(COALESCE(fiziki_kayiplar,0)) AS fiziki_kayiplar,
				SUM(COALESCE(idari_kayiplar,0)) AS idari_kayiplar,
				SUM(COALESCE(izinsiz_tuketim,0)) AS izinsiz_tuketim,
				SUM(COALESCE(depolarda_meydana_gelen_kacak,0)) AS depolarda_meydana_gelen_kacak,
				SUM(COALESCE(sayaclardaki_olcum_hatasi,0)) AS sayaclardaki_olcum_hatasi
			 FROM \`su_kayiplari\`
			 WHERE yil = ? AND ilce = ?`,
			[year, ilce]
		);
		const r = rows?.[0] || {};
		return [
			{ name: 'Temin/Servis/Baglanti', total: Number(r.temin_servis_baglanti_kayip || 0) },
			{ name: 'Fiziki Kayıplar', total: Number(r.fiziki_kayiplar || 0) },
			{ name: 'İdari Kayıplar', total: Number(r.idari_kayiplar || 0) },
			{ name: 'İzinsiz Tüketim', total: Number(r.izinsiz_tuketim || 0) },
			{ name: 'Depolarda Kaçak', total: Number(r.depolarda_meydana_gelen_kacak || 0) },
			{ name: 'Sayaç Ölçüm Hatası', total: Number(r.sayaclardaki_olcum_hatasi || 0) },
		];
	}

	static async getLossBreakdownAll(year) {
		const [rows] = await pool.query(
			`SELECT 
				SUM(COALESCE(temin_servis_baglanti_kayip,0)) AS temin_servis_baglanti_kayip,
				SUM(COALESCE(fiziki_kayiplar,0)) AS fiziki_kayiplar,
				SUM(COALESCE(idari_kayiplar,0)) AS idari_kayiplar,
				SUM(COALESCE(izinsiz_tuketim,0)) AS izinsiz_tuketim,
				SUM(COALESCE(depolarda_meydana_gelen_kacak,0)) AS depolarda_meydana_gelen_kacak,
				SUM(COALESCE(sayaclardaki_olcum_hatasi,0)) AS sayaclardaki_olcum_hatasi
			 FROM \`su_kayiplari\`
			 WHERE yil = ?`,
			[year]
		);
		const r = rows?.[0] || {};
		return [
			{ name: 'Temin/Servis/Baglanti', total: Number(r.temin_servis_baglanti_kayip || 0) },
			{ name: 'Fiziki Kayıplar', total: Number(r.fiziki_kayiplar || 0) },
			{ name: 'İdari Kayıplar', total: Number(r.idari_kayiplar || 0) },
			{ name: 'İzinsiz Tüketim', total: Number(r.izinsiz_tuketim || 0) },
			{ name: 'Depolarda Kaçak', total: Number(r.depolarda_meydana_gelen_kacak || 0) },
			{ name: 'Sayaç Ölçüm Hatası', total: Number(r.sayaclardaki_olcum_hatasi || 0) },
		];
	}

	static async getDistrictAvailability(ilce) {
		const whereIlceEq = `TRIM(ilce) COLLATE utf8mb4_turkish_ci = TRIM(?) COLLATE utf8mb4_turkish_ci`;
		const out = { ilce, monthlyPoints: 0, yearlyPoints: 0, consumptionTotal: 0, subscriberCount: 0, hasProdWeights: false };
		
		const [mCnt] = await pool.query(`SELECT COUNT(1) AS n FROM \`su_kayiplari\` WHERE ${whereIlceEq} AND ay IS NOT NULL`, [ilce]);
		out.monthlyPoints = Number(mCnt?.[0]?.n || 0);
		
		const [yCnt] = await pool.query(`SELECT COUNT(DISTINCT yil) AS n FROM \`su_kayiplari\` WHERE ${whereIlceEq}`, [ilce]);
		out.yearlyPoints = Number(yCnt?.[0]?.n || 0);
		
		const [cons] = await pool.query(
			`SELECT 
				SUM(CAST(REPLACE(COALESCE(ortalama_tuketim, '0'), ',', '.') AS DECIMAL(20,4))
					* CAST(REPLACE(REPLACE(REPLACE(COALESCE(abone_adedi, '0'), '.', ''), ' ', ''), ',', '') AS UNSIGNED)) AS total,
				SUM(CAST(REPLACE(REPLACE(REPLACE(COALESCE(abone_adedi, '0'), '.', ''), ' ', ''), ',', '') AS UNSIGNED)) AS subs
			 FROM \`ilce_mahalle_su_tuketimi\`
			 WHERE ${whereIlceEq}`,
			[ilce]
		);
		out.consumptionTotal = Number(cons?.[0]?.total || 0);
		out.subscriberCount = Number(cons?.[0]?.subs || 0);
		
		const [w] = await pool.query(`SELECT COUNT(DISTINCT ay) AS n FROM \`aylara_kaynaklara_gore_su_uretimi\``);
		out.hasProdWeights = Number(w?.[0]?.n || 0) >= 12;
		
		return out;
	}
}

module.exports = LossModel;

