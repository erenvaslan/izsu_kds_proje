// Forecasting utility functions

function exponentialMovingAverage(values, alpha) {
	if (!Array.isArray(values) || !values.length) return [];
	const result = [];
	let prev = Number(values[0] || 0);
	for (let i = 0; i < values.length; i++) {
		const v = Number(values[i] || 0);
		const ema = alpha * v + (1 - alpha) * prev;
		result.push(ema);
		prev = ema;
	}
	return result;
}

function computeEmaResidualSigma(values, alpha) {
	if (!Array.isArray(values) || values.length < 3) return 0;
	const ema = exponentialMovingAverage(values, alpha);
	const residuals = [];
	for (let i = 1; i < values.length; i++) {
		const oneStep = ema[i - 1];
		residuals.push(Number(values[i] || 0) - oneStep);
	}
	const mse = residuals.reduce((a, b) => a + b * b, 0) / residuals.length;
	return Math.sqrt(mse);
}

function clamp(v, min, max) { 
	return Math.max(min, Math.min(max, v)); 
}

function addMonthsLabel(ym, monthsToAdd) {
	const [yStr, mStr] = String(ym).split('-');
	let y = Number(yStr);
	let m = Number(mStr);
	m += monthsToAdd;
	y += Math.floor((m - 1) / 12);
	m = ((m - 1) % 12) + 1;
	return `${y}-${String(m).padStart(2, '0')}`;
}

// Holt-Winters additive seasonal smoothing
function hwAdditive(y, seasonLen, horizon, alpha, beta, gamma) {
	const n = y.length;
	if (n < seasonLen * 2) {
		return { fitted: y.slice(), forecast: Array.from({ length: horizon }, () => y[n - 1] || 0) };
	}
	
	const seasonCount = Math.floor(n / seasonLen);
	const seasonAverages = [];
	for (let s = 0; s < seasonCount; s++) {
		const start = s * seasonLen;
		const seg = y.slice(start, start + seasonLen);
		seasonAverages.push(seg.reduce((a, b) => a + b, 0) / seg.length);
	}
	
	const initLevel = seasonAverages[0];
	const nextLevel = seasonAverages[1] || initLevel;
	let level = initLevel;
	let trend = nextLevel - initLevel;
	
	const seasonals = new Array(seasonLen).fill(0);
	for (let i = 0; i < seasonLen; i++) {
		const vals = [];
		for (let s = 0; s < seasonCount; s++) {
			const idx = s * seasonLen + i;
			if (idx < n) vals.push(y[idx]);
		}
		const avg = seasonAverages.slice(0, vals.length).reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
		seasonals[i] = (vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)) - avg;
	}
	
	const fitted = new Array(n).fill(0);
	for (let t = 0; t < n; t++) {
		const sIdx = t % seasonLen;
		const prevLevel = level;
		const prevTrend = trend;
		const prevSeason = seasonals[sIdx];
		fitted[t] = Math.max(0, prevLevel + prevTrend + prevSeason);
		const actual = y[t];
		level = alpha * (actual - prevSeason) + (1 - alpha) * (prevLevel + prevTrend);
		trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
		seasonals[sIdx] = gamma * (actual - level) + (1 - gamma) * prevSeason;
	}
	
	const forecast = [];
	let fLevel = level;
	let fTrend = trend;
	for (let h = 1; h <= horizon; h++) {
		const sIdx = (n + h - 1) % seasonLen;
		forecast.push(Math.max(0, fLevel + fTrend * h + seasonals[sIdx]));
	}
	return { fitted, forecast };
}

function hwBestForecast(y, seasonLen, horizon) {
	const grid = [0.2, 0.3, 0.4, 0.5];
	let best = null;
	let bestScore = Infinity;
	for (const a of grid) for (const b of grid) for (const g of grid) {
		const { fitted } = hwAdditive(y, seasonLen, horizon, a, b, g);
		const start = Math.max(0, y.length - seasonLen);
		let mape = 0; let cnt = 0;
		for (let i = start; i < y.length; i++) {
			const actual = y[i];
			const pred = fitted[i];
			if (actual > 0) { mape += Math.abs((actual - pred) / actual); cnt++; }
		}
		mape = cnt ? (mape / cnt) : Infinity;
		if (mape < bestScore) { bestScore = mape; best = { a, b, g }; }
	}
	if (!best) best = { a: 0.3, b: 0.2, g: 0.3 };
	const { fitted, forecast } = hwAdditive(y, seasonLen, horizon, best.a, best.b, best.g);
	return { fitted, forecast };
}

// Holt's linear trend (double exponential smoothing)
function holtLinear(y, horizon, alpha, beta) {
	const n = y.length;
	if (n === 0) return { fitted: [], forecast: Array.from({ length: horizon }, () => 0) };
	let level = y[0];
	let trend = (n >= 2) ? (y[1] - y[0]) : 0;
	const fitted = new Array(n).fill(0);
	for (let t = 0; t < n; t++) {
		const prevLevel = level;
		const prevTrend = trend;
		fitted[t] = prevLevel + prevTrend;
		const actual = y[t];
		level = alpha * actual + (1 - alpha) * (prevLevel + prevTrend);
		trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
	}
	const forecast = [];
	for (let h = 1; h <= horizon; h++) forecast.push(Math.max(0, level + trend * h));
	return { fitted, forecast };
}

function holtBestForecast(y, horizon) {
	const grid = [0.2, 0.3, 0.4, 0.5];
	let best = null;
	let bestScore = Infinity;
	for (const a of grid) for (const b of grid) {
		const { fitted } = holtLinear(y, horizon, a, b);
		const start = Math.max(0, y.length - Math.min(12, y.length));
		let mape = 0; let cnt = 0;
		for (let i = start; i < y.length; i++) {
			const actual = y[i];
			const pred = fitted[i];
			if (actual > 0) { mape += Math.abs((actual - pred) / actual); cnt++; }
		}
		mape = cnt ? (mape / cnt) : Infinity;
		if (mape < bestScore) { bestScore = mape; best = { a, b }; }
	}
	if (!best) best = { a: 0.3, b: 0.2 };
	return holtLinear(y, horizon, best.a, best.b);
}

function percentile(arr, p) {
	const a = arr.slice().sort((x, y) => x - y);
	if (!a.length) return 0;
	const idx = (a.length - 1) * p;
	const lo = Math.floor(idx);
	const hi = Math.ceil(idx);
	if (lo === hi) return a[lo];
	const w = idx - lo;
	return a[lo] * (1 - w) + a[hi] * w;
}

function linearRegressionSlope(values) {
	const n = values.length;
	if (n < 2) return 0;
	let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
	for (let i = 0; i < n; i++) {
		const x = i;
		const y = Number(values[i] || 0);
		sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
	}
	const denom = n * sumXX - sumX * sumX;
	if (denom === 0) return 0;
	return (n * sumXY - sumX * sumY) / denom;
}

// Seasonal naive with simple growth adjustment
function seasonalNaiveAdjusted(values, seasonLen, horizon) {
	const n = values.length;
	if (n < seasonLen) {
		const last = values[n - 1] || 0;
		return Array.from({ length: horizon }, () => last);
	}
	const lastSeason = values.slice(n - seasonLen);
	const recentMean = (() => {
		const k = Math.min(3, lastSeason.length);
		const arr = lastSeason.slice(-k);
		return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
	})();
	const priorStart = Math.max(0, n - seasonLen - seasonLen);
	const priorSeason = values.slice(priorStart, priorStart + seasonLen);
	const priorMean = priorSeason.length ? (priorSeason.reduce((a, b) => a + b, 0) / priorSeason.length) : recentMean || 1;
	const growth = priorMean > 0 ? (recentMean / priorMean) : 1;
	const fc = [];
	for (let h = 0; h < horizon; h++) {
		const base = lastSeason[h % seasonLen] || lastSeason[lastSeason.length - 1] || 0;
		const scale = Math.pow(growth, (h + 1) / seasonLen);
		fc.push(Math.max(0, base * scale));
	}
	return fc;
}

module.exports = {
	exponentialMovingAverage,
	computeEmaResidualSigma,
	clamp,
	addMonthsLabel,
	hwAdditive,
	hwBestForecast,
	holtLinear,
	holtBestForecast,
	percentile,
	linearRegressionSlope,
	seasonalNaiveAdjusted
};

