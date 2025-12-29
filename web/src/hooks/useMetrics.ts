import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type {
	OverviewData,
	ReservoirData,
	ProductionMonthly,
	ProductionAnnual,
	ConsumptionData,
	LossData,
	LossByDistrict,
	LossBreakdown,
	DaysToThresholdData
} from '../types';

export function useMetrics(token: string | null) {
	const [overview, setOverview] = useState<OverviewData | null>(null);
	const [reservoirLatest, setReservoirLatest] = useState<ReservoirData[]>([]);
	const [productionMonthly, setProductionMonthly] = useState<ProductionMonthly[]>([]);
	const [productionAnnual, setProductionAnnual] = useState<ProductionAnnual[]>([]);
	const [selectedYear, setSelectedYear] = useState<number | ''>('');
	const [consumptionTop, setConsumptionTop] = useState<ConsumptionData[]>([]);
	const [monthlyLosses, setMonthlyLosses] = useState<LossData[]>([]);
	const [districts, setDistricts] = useState<string[]>([]);
	const [lossesByDistrict, setLossesByDistrict] = useState<LossByDistrict[]>([]);
	const [lossesBreakdownAll, setLossesBreakdownAll] = useState<LossBreakdown[]>([]);
	const [daysToThreshold, setDaysToThreshold] = useState<DaysToThresholdData | null>(null);

	useEffect(() => {
		if (!token) return;

		let cancelled = false;
		(async () => {
			const curYear = new Date().getFullYear();

			const [ov, rlatest, pan, pmPrev, pmCur, ct, lPrev, lCur, ds, lbd, lba, dtt] = await Promise.all([
				apiService.getOverview(),
				apiService.getReservoirLatest(),
				apiService.getProductionAnnual(),
				apiService.getProductionMonthly(curYear - 1),
				apiService.getProductionMonthly(curYear),
				apiService.getConsumptionTop('ilce', 10),
				apiService.getMonthlyLosses(2018),
				apiService.getMonthlyLosses(2019),
				apiService.getDistricts(),
				apiService.getLossesByDistrict(2019, 10),
				apiService.getLossesBreakdownAll(2019),
				apiService.getDaysToThreshold(20, 21, 'low')
			]);

			if (cancelled) return;

			setOverview(ov);
			setReservoirLatest(rlatest);
			setProductionAnnual(pan);
			if (pan.length && !selectedYear) setSelectedYear(pan[pan.length - 1].year);
			setProductionMonthly([...pmPrev, ...pmCur]);
			setConsumptionTop(ct);

			const ltCombined = [...lPrev, ...lCur];
			const uniqLoss = Array.from(new Map(ltCombined.map(it => [it.month, it])).values());
			uniqLoss.sort((a, b) => a.month.localeCompare(b.month));
			setMonthlyLosses(uniqLoss.slice(-12));

			setDistricts(ds);
			setLossesByDistrict(lbd);
			setLossesBreakdownAll(lba);
			setDaysToThreshold(dtt);
		})();

		return () => { cancelled = true; };
	}, [token]);

	return {
		overview,
		reservoirLatest,
		productionMonthly,
		productionAnnual,
		selectedYear,
		setSelectedYear,
		consumptionTop,
		monthlyLosses,
		districts,
		lossesByDistrict,
		lossesBreakdownAll,
		daysToThreshold,
		setDaysToThreshold
	};
}

export default useMetrics;

