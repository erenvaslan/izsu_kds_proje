// API Response Types
export interface OverviewData {
	avgFill: number | null;
	totalDailyProduction: number | null;
	totalSubscribers: number | null;
}

export interface ReservoirData {
	name: string;
	fill: number;
}

export interface ReservoirTrend {
	dt: string;
	avg_fill: number;
}

export interface ProductionMonthly {
	month: string;
	source: string;
	total: number;
}

export interface ProductionAnnual {
	year: number;
	total: number;
}

export interface ConsumptionData {
	name: string;
	total: number;
}

export interface LossData {
	month: string;
	loss: number;
}

export interface LossByDistrict {
	name: string;
	total: number;
}

export interface LossBreakdown {
	name: string;
	total: number;
}

export interface DaysToThresholdItem {
	name: string;
	currentFill: number | null;
	slopePerDay: number;
	daysToThreshold: number | null;
}

export interface DaysToThresholdData {
	threshold: number;
	earliestDays: number | null;
	earliestDam: string | null;
	items: DaysToThresholdItem[];
}

export interface DemandForecast {
	unit: string;
	freq: string;
	history: Array<{ ts: string; value: number }>;
	forecast: Array<{ ts: string; p10: number; p50: number; p90: number }>;
	meta: {
		model: string;
		dataRange?: { start: string; end: string };
		numPoints?: number;
		message?: string;
	};
	error?: string;
}

// App State Types
export type ViewType = 'dashboard' | 'predictions' | 'analytics' | 'reports';
export type TrendPeriod = '1y' | '3y' | '5y' | 'all';
export type LossesViewType = 'line' | 'pie';
export type SimScenario = 'drought' | 'normal' | 'rainy';

export interface User {
	role: string;
	email: string;
}

// Chart Types
export interface ChartColors {
	primary: string;
	primaryLight: string;
	success: string;
	successLight: string;
	warning: string;
	warningLight: string;
	danger: string;
	dangerLight: string;
	violet: string;
	violetLight: string;
	cyan: string;
	cyanLight: string;
}

