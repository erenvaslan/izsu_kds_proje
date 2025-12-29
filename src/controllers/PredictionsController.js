const { pool } = require('../config/database');
const ForecastUtils = require('../utils/forecast');

class PredictionsController {
	static async demand(req, res) {
		const scope = (String(req.query.scope || 'ilce').toLowerCase() === 'mahalle') ? 'mahalle' : 'ilce';
		const name = String(req.query.name || '').trim();
		const horizon = Math.max(1, Math.min(18, Number(req.query.horizon || 6)));
		
		if (!name) {
			return res.status(400).json({ error: 'name is required' });
		}
		
		try {
			const whereIlceEq = `TRIM(ilce) COLLATE utf8mb4_turkish_ci = TRIM(?) COLLATE utf8mb4_turkish_ci`;
			let history = [];

			if (scope === 'ilce') {
				// Only use monthly series directly from su_kayiplari
				const [cols] = await pool.query(
					"SELECT LOWER(COLUMN_NAME) AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'su_kayiplari'"
				);
				const colNames = cols.map(c => c.name);
				const hasAy = colNames.includes('ay');
				
				if (hasAy) {
					const [rows] = await pool.query(
						`SELECT CONCAT(yil, '-', LPAD(ay,2,'0')) AS month,
								SUM(CAST(REPLACE(COALESCE(sisteme_giren_su_miktari,'0'), ',', '.') AS DECIMAL(20,4))
								  - CAST(REPLACE(COALESCE(toplam_su_kayiplari,'0'), ',', '.') AS DECIMAL(20,4))) AS demand
						 FROM \`su_kayiplari\`
						 WHERE ${whereIlceEq}
						 GROUP BY yil, ay
						 ORDER BY yil, ay`,
						[name]
					);
					history = rows.map(r => ({ month: r.month, value: Number(r.demand || 0) }));
				}
			} else {
				// mahalle scope
				const [rows] = await pool.query(
					`SELECT COALESCE(ortalama_tuketim, 0) AS avg_cons, COALESCE(abone_adedi, 0) AS subs
					 FROM \`ilce_mahalle_su_tuketimi\`
					 WHERE mahalle = ?
					 LIMIT 1`,
					[name]
				);
				const r = rows?.[0];
				const monthly = Number(r?.avg_cons || 0) * Number(r?.subs || 0);
				const now = new Date();
				const base = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
				const months = [];
				for (let i = 11; i >= 0; i--) months.push(i);
				let cur = base;
				for (let i of months) {
					let y = Number(cur.slice(0,4));
					let m = Number(cur.slice(5,7));
					let back = y*12 + m - i;
					let by = Math.floor((back-1)/12);
					let bm = ((back-1)%12)+1;
					history.push({ month: `${by}-${String(bm).padStart(2,'0')}`, value: monthly });
				}
			}

			// Process history
			const map = new Map();
			for (const h of history) map.set(h.month, h.value);
			let histMonths = Array.from(map.keys()).sort();
			let histValues = histMonths.map(m => Number(map.get(m) || 0));

			// Choose model and forecast
			let modelUsed = 'seasonal_naive';
			let fcMid = [];

			if (histValues.length < 12) {
				// Try fallback strategies
				history = await PredictionsController._buildFallbackHistory(name, whereIlceEq, pool);
				const map2 = new Map();
				for (const h of history) map2.set(h.month, h.value);
				histMonths = Array.from(map2.keys()).sort();
				histValues = histMonths.map(m => Number(map2.get(m) || 0));
			}

			// Choose model based on data length
			if (histValues.length >= 12) {
				fcMid = ForecastUtils.seasonalNaiveAdjusted(histValues, 12, horizon);
				modelUsed = 'seasonal_naive';
			} else if (histValues.length >= 6) {
				const { forecast: hFc } = ForecastUtils.holtBestForecast(histValues, horizon);
				fcMid = hFc;
				modelUsed = 'holt_linear';
			} else {
				const last3 = histValues.slice(-3);
				const sma3 = last3.length ? last3.reduce((a,b)=>a+b,0) / last3.length : 0;
				fcMid = Array.from({ length: horizon }, () => sma3);
				modelUsed = 'sma3';
			}

			// Compute uncertainty bands
			const slope = ForecastUtils.linearRegressionSlope(histValues);
			const trendAdj = slope * 0.5;
			
			const mean = histValues.length ? histValues.reduce((a, b) => a + b, 0) / histValues.length : 0;
			const variance = histValues.length ? histValues.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / histValues.length : 0;
			const stdDev = Math.sqrt(variance);
			
			let q10 = -stdDev * 0.5;
			let q90 = stdDev * 0.5;
			
			if (histValues.length > 12) {
				const residuals = [];
				for (let i = 12; i < histValues.length; i++) {
					const pred = histValues[i - 12];
					residuals.push(histValues[i] - pred);
				}
				if (residuals.length >= 3) {
					q10 = ForecastUtils.percentile(residuals, 0.10);
					q90 = ForecastUtils.percentile(residuals, 0.90);
				}
			}
			
			if (histValues.length === 12) {
				const cv = mean > 0 ? stdDev / mean : 0;
				q10 = -mean * cv * 0.15;
				q90 = mean * cv * 0.15;
			}
			
			const fcP50 = fcMid.map((v, i) => Math.max(0, v + trendAdj * (i + 1)));
			const fcP10 = fcMid.map((v, i) => Math.max(0, v + trendAdj * (i + 1) + q10 * (1 + i * 0.1)));
			const fcP90 = fcMid.map((v, i) => Math.max(0, v + trendAdj * (i + 1) + q90 * (1 + i * 0.1)));
			const lastLabel = histMonths[histMonths.length - 1] || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
			const fcLabels = Array.from({ length: horizon }, (_v, i) => ForecastUtils.addMonthsLabel(lastLabel, i + 1));

			return res.json({
				unit: 'm3',
				freq: 'monthly',
				history: histMonths.map((m, idx) => ({ ts: m, value: histValues[idx] })),
				forecast: fcLabels.map((m, idx) => ({ ts: m, p10: fcP10[idx], p50: fcP50[idx], p90: fcP90[idx] })),
				meta: { model: modelUsed, dataRange: { start: histMonths[0], end: histMonths[histMonths.length - 1] }, numPoints: histValues.length }
			});
		} catch (e) {
			res.json({ error: 'failed', unit: 'm3', freq: 'monthly', history: [], forecast: [], meta: { message: String(e && e.message || 'error') } });
		}
	}

	static async _buildFallbackHistory(name, whereIlceEq, pool) {
		// Try yearly fallback
		const [yrows] = await pool.query(
			`SELECT yil AS year,
					SUM(CAST(REPLACE(COALESCE(sisteme_giren_su_miktari,'0'), ',', '.') AS DECIMAL(20,4))
					  - CAST(REPLACE(COALESCE(toplam_su_kayiplari,'0'), ',', '.') AS DECIMAL(20,4))) AS demand
			 FROM \`su_kayiplari\`
			 WHERE ${whereIlceEq}
			 GROUP BY yil
			 ORDER BY yil`,
			[name]
		);
		
		if (Array.isArray(yrows) && yrows.length) {
			const [wrows] = await pool.query(
				`SELECT ay, SUM(COALESCE(uretim_miktari,0)) AS total
				 FROM \`aylara_kaynaklara_gore_su_uretimi\`
				 GROUP BY ay
				 ORDER BY ay`
			);
			const monthTotals = new Array(12).fill(0);
			for (const wr of wrows || []) {
				const m = Number(wr.ay || 0);
				if (m>=1 && m<=12) monthTotals[m-1] = Number(wr.total || 0);
			}
			const sumAll = monthTotals.reduce((a,b)=>a+b,0) || 1;
			const weights = monthTotals.map(v => (v>0? v/sumAll : 1/12));

			const history = [];
			for (const r of yrows) {
				const yTotal = Number(r.demand || 0);
				for (let m = 1; m <= 12; m++) {
					const val = yTotal * (weights[m-1] || (1/12));
					history.push({ month: `${r.year}-${String(m).padStart(2,'0')}`, value: val });
				}
			}
			return history;
		}
		
		return [];
	}
}

module.exports = PredictionsController;

