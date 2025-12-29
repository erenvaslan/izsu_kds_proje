const ReservoirModel = require('../models/ReservoirModel');
const ProductionModel = require('../models/ProductionModel');
const SubscriberModel = require('../models/SubscriberModel');
const ConsumptionModel = require('../models/ConsumptionModel');
const LossModel = require('../models/LossModel');

class MetricsController {
	static async overview(_req, res) {
		try {
			let avgFill = null;
			try {
				avgFill = await ReservoirModel.getAverageFill();
			} catch {}

			let totalDailyProduction = null;
			try {
				totalDailyProduction = await ProductionModel.getTotalDailyProduction();
			} catch {}

			let totalSubscribers = null;
			try {
				totalSubscribers = await SubscriberModel.getTotalSubscribers();
			} catch {}

			totalSubscribers = Number(totalSubscribers ?? 0);
			res.json({ avgFill, totalDailyProduction, totalSubscribers });
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	static async reservoirs(req, res) {
		const days = Number(req.query.days || 30);
		try {
			const rows = await ReservoirModel.getTrend(days);
			res.json(rows);
		} catch (e) {
			res.json([]);
		}
	}

	static async reservoirsLatest(_req, res) {
		try {
			const rows = await ReservoirModel.getLatestByDam();
			res.json(rows);
		} catch (e) {
			res.json([]);
		}
	}

	static async reservoirsDaysToThreshold(req, res) {
		const threshold = Math.max(0, Math.min(100, Number(req.query.threshold || 20)));
		const window = Math.max(5, Math.min(90, Number(req.query.window || 21)));
		const scenario = String(req.query.scenario || 'low');
		
		try {
			const result = await ReservoirModel.getDaysToThreshold(threshold, window, scenario);
			res.json(result);
		} catch (e) {
			res.json({ threshold, earliestDays: null, earliestDam: null, items: [] });
		}
	}

	static async productionMonthly(req, res) {
		const year = Number(req.query.year || new Date().getFullYear());
		try {
			const rows = await ProductionModel.getMonthlyByYear(year);
			res.json(rows);
		} catch (e) {
			res.json([]);
		}
	}

	static async productionAnnual(_req, res) {
		try {
			const data = await ProductionModel.getAnnualTotals();
			res.json(data);
		} catch (e) {
			res.json([]);
		}
	}

	static async consumptionTop(req, res) {
		const scope = String(req.query.scope || 'ilce').toLowerCase();
		const limit = Number(req.query.limit || 10);
		
		try {
			const rows = await ConsumptionModel.getTopConsumers(scope, limit);
			res.json(rows);
		} catch (e) {
			res.json([]);
		}
	}

	static async lossesTrend(req, res) {
		const years = Number(req.query.years || 5);
		const ilce = req.query.ilce ? String(req.query.ilce) : null;
		
		try {
			const result = await LossModel.getLossTrend(years, ilce);
			res.json(result);
		} catch (e) {
			res.json([]);
		}
	}

	static async districts(_req, res) {
		try {
			const districts = await LossModel.getDistricts();
			res.json(districts);
		} catch (e) {
			res.json([]);
		}
	}

	static async districtAvailability(req, res) {
		const ilce = String(req.query.ilce || '').trim();
		if (!ilce) return res.json({ error: 'missing_ilce' });
		
		try {
			const result = await LossModel.getDistrictAvailability(ilce);
			res.json(result);
		} catch (e) {
			res.json({ error: 'failed' });
		}
	}

	static async lossesMonthly(req, res) {
		const year = Number(req.query.year || new Date().getFullYear());
		const ilce = req.query.ilce ? String(req.query.ilce) : null;
		
		try {
			const result = await LossModel.getMonthlyLosses(year, ilce);
			res.json(result);
		} catch (e) {
			res.json([]);
		}
	}

	static async lossesByDistrict(req, res) {
		const year = Number(req.query.year || new Date().getFullYear());
		const limit = Number(req.query.limit || 10);
		
		try {
			const rows = await LossModel.getLossesByDistrict(year, limit);
			res.json(rows);
		} catch (e) {
			res.json([]);
		}
	}

	static async lossesBreakdown(req, res) {
		const year = Number(req.query.year || new Date().getFullYear());
		const ilce = req.query.ilce ? String(req.query.ilce) : '';
		
		if (!ilce) return res.json([]);
		
		try {
			const result = await LossModel.getLossBreakdown(year, ilce);
			res.json(result);
		} catch (e) {
			res.json([]);
		}
	}

	static async lossesBreakdownAll(req, res) {
		const year = Number(req.query.year || new Date().getFullYear());
		
		try {
			const result = await LossModel.getLossBreakdownAll(year);
			res.json(result);
		} catch (e) {
			res.json([]);
		}
	}

	static async neighborhoods(req, res) {
		const ilce = req.query.ilce ? String(req.query.ilce) : null;
		
		try {
			const result = await ConsumptionModel.getNeighborhoods(ilce);
			res.json(result);
		} catch (e) {
			res.json([]);
		}
	}
}

module.exports = MetricsController;

