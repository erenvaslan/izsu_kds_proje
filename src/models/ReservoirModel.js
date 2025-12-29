const { pool } = require('../config/database');

class ReservoirModel {
	static async getAverageFill() {
		const [latestRows] = await pool.query('SELECT MAX(durum_tarihi) AS latest FROM `baraj_doluluk_oranlari`');
		const latest = latestRows?.[0]?.latest;
		if (!latest) return null;
		
		const [rows] = await pool.query(
			'SELECT AVG(CAST(doluluk_orani AS DECIMAL(10,2))) AS avg_fill FROM `baraj_doluluk_oranlari` WHERE DATE(durum_tarihi) = DATE(?)',
			[latest]
		);
		return rows[0]?.avg_fill ?? null;
	}

	static async getTrend(days = 30) {
		const safeDays = Math.max(1, Math.min(365, Number(days)));
		const [rows] = await pool.query(
			`SELECT DATE(durum_tarihi) AS dt, AVG(CAST(doluluk_orani AS DECIMAL(10,2))) AS avg_fill
			 FROM \`baraj_doluluk_oranlari\`
			 GROUP BY DATE(durum_tarihi)
			 ORDER BY dt DESC
			 LIMIT ?`,
			[safeDays]
		);
		return rows.reverse();
	}

	static async getLatestByDam() {
		const [latestRows] = await pool.query('SELECT MAX(DATE(durum_tarihi)) AS latest FROM `baraj_doluluk_oranlari`');
		const latest = latestRows?.[0]?.latest;
		if (!latest) return [];
		
		const [rows] = await pool.query(
			`SELECT baraj_adi AS name, AVG(CAST(doluluk_orani AS DECIMAL(10,2))) AS fill
			 FROM \`baraj_doluluk_oranlari\`
			 WHERE DATE(durum_tarihi) = DATE(?)
			 GROUP BY baraj_adi
			 ORDER BY name`,
			[latest]
		);
		return rows.map(r => ({ name: r.name, fill: Number(r.fill || 0) }));
	}

	static async getDaysToThreshold(threshold = 20, window = 21, scenario = 'low') {
		const win = Math.floor(Math.max(5, Math.min(90, window)));
		
		let [rows] = await pool.query(
			`SELECT t.baraj_adi AS name, DATE(t.durum_tarihi) AS dt,
					AVG(CAST(t.doluluk_orani AS DECIMAL(10,2))) AS fill
			 FROM \`baraj_doluluk_oranlari\` t
			 INNER JOIN (
				 SELECT DATE(durum_tarihi) AS dt
				 FROM \`baraj_doluluk_oranlari\`
				 GROUP BY DATE(durum_tarihi)
				 ORDER BY dt DESC
				 LIMIT ${win}
			 ) d ON DATE(t.durum_tarihi) = d.dt
			 GROUP BY name, dt
			 ORDER BY name, dt`
		);
		
		if (!rows || rows.length < 2) {
			const fallbackWin = 90;
			const [rows2] = await pool.query(
				`SELECT t.baraj_adi AS name, DATE(t.durum_tarihi) AS dt,
						AVG(CAST(t.doluluk_orani AS DECIMAL(10,2))) AS fill
				 FROM \`baraj_doluluk_oranlari\` t
				 INNER JOIN (
					 SELECT DATE(durum_tarihi) AS dt
					 FROM \`baraj_doluluk_oranlari\`
					 GROUP BY DATE(durum_tarihi)
					 ORDER BY dt DESC
					 LIMIT ${fallbackWin}
				 ) d ON DATE(t.durum_tarihi) = d.dt
				 GROUP BY name, dt
				 ORDER BY name, dt`
			);
			rows = rows2;
		}
		
		// Build per-dam series
		const byDam = new Map();
		for (const r of rows) {
			const name = r.name;
			const dt = String(r.dt);
			const fill = Number(r.fill || 0);
			if (!byDam.has(name)) byDam.set(name, []);
			byDam.get(name).push({ dt, fill });
		}
		
		// Compute slope and days to threshold per dam
		function slopeOf(series) {
			const y = series.map(p => p.fill);
			const n = y.length;
			if (n < 3) return 0;
			let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
			for (let i = 0; i < n; i++) {
				sumX += i; sumY += y[i]; sumXY += i * y[i]; sumXX += i * i;
			}
			const denom = n * sumXX - sumX * sumX;
			if (denom === 0) return 0;
			return (n * sumXY - sumX * sumY) / denom;
		}
		
		const items = [];
		for (const [name, seriesDesc] of byDam.entries()) {
			const series = seriesDesc.slice().sort((a, b) => a.dt.localeCompare(b.dt));
			const cur = series.length ? series[series.length - 1].fill : null;
			const slope = slopeOf(series);
			
			// Mean daily change
			let meanDelta = 0;
			if (series.length >= 2) {
				let sum = 0; let cnt = 0;
				for (let i = 1; i < series.length; i++) { sum += (series[i].fill - series[i-1].fill); cnt++; }
				meanDelta = cnt ? (sum / cnt) : 0;
			}
			
			// In low-rain scenario, enforce a conservative negative drift
			let drift = slope;
			if (scenario === 'low') {
				const fallbackNeg = -Math.max(0.05, Math.abs(meanDelta) * 0.5 || 0.1);
				drift = Math.min(slope, fallbackNeg);
			}
			
			let days = null;
			if (cur != null && cur > threshold && drift < 0) {
				const need = cur - threshold;
				const d = need / (-drift);
				if (Number.isFinite(d) && d >= 0) days = Math.ceil(d);
			} else if (cur != null && cur <= threshold) {
				days = 0;
			}
			items.push({ name, currentFill: cur, slopePerDay: slope, daysToThreshold: days });
		}
		
		const validDays = items.map(it => it.daysToThreshold).filter(d => d != null && Number.isFinite(d));
		const earliestDays = validDays.length ? Math.min(...validDays) : null;
		const atDam = earliestDays != null ? (items.find(it => it.daysToThreshold === earliestDays)?.name || null) : null;
		
		return { threshold, earliestDays, earliestDam: atDam, items };
	}
}

module.exports = ReservoirModel;

