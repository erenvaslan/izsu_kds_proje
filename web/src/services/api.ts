import type {
	OverviewData,
	ReservoirData,
	ReservoirTrend,
	ProductionMonthly,
	ProductionAnnual,
	ConsumptionData,
	LossData,
	LossByDistrict,
	LossBreakdown,
	DaysToThresholdData,
	DemandForecast
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:4000';

class ApiService {
	private token: string | null = null;

	setToken(token: string | null) {
		this.token = token;
	}

	private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
		const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
		if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
		const res = await fetch(url, { ...options, headers });
		if (!res.ok) throw new Error(`${res.status}`);
		return res.json();
	}

	// Auth
	async login(email: string, password: string): Promise<{ token: string }> {
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		if (!res.ok) throw new Error('Login failed');
		return res.json();
	}

	async getMe(): Promise<{ user: { role: string; email: string } }> {
		return this.fetchJson(`${API_BASE}/auth/me`);
	}

	// Health
	async checkHealth(): Promise<{ ok: boolean }> {
		return this.fetchJson<{ ok: boolean }>(`${API_BASE}/health`).catch(() => ({ ok: false }));
	}

	// Metrics
	async getOverview(): Promise<OverviewData> {
		return this.fetchJson<OverviewData>(`${API_BASE}/metrics/overview`).catch(() => ({
			avgFill: null,
			totalDailyProduction: null,
			totalSubscribers: null
		}));
	}

	async getReservoirTrend(days = 45): Promise<ReservoirTrend[]> {
		return this.fetchJson<ReservoirTrend[]>(`${API_BASE}/metrics/reservoirs?days=${days}`).catch(() => []);
	}

	async getReservoirLatest(): Promise<ReservoirData[]> {
		return this.fetchJson<ReservoirData[]>(`${API_BASE}/metrics/reservoirs-latest`).catch(() => []);
	}

	async getDaysToThreshold(threshold = 20, window = 21, scenario = 'low'): Promise<DaysToThresholdData | null> {
		return this.fetchJson<DaysToThresholdData>(
			`${API_BASE}/metrics/reservoirs-days-to-threshold?threshold=${threshold}&window=${window}&scenario=${scenario}`
		).catch(() => null);
	}

	async getProductionAnnual(): Promise<ProductionAnnual[]> {
		return this.fetchJson<ProductionAnnual[]>(`${API_BASE}/metrics/production-annual`).catch(() => []);
	}

	async getProductionMonthly(year: number): Promise<ProductionMonthly[]> {
		return this.fetchJson<ProductionMonthly[]>(`${API_BASE}/metrics/production-monthly?year=${year}`).catch(() => []);
	}

	async getConsumptionTop(scope = 'ilce', limit = 10): Promise<ConsumptionData[]> {
		return this.fetchJson<ConsumptionData[]>(
			`${API_BASE}/metrics/consumption-top?scope=${scope}&limit=${limit}`
		).catch(() => []);
	}

	async getMonthlyLosses(year: number, ilce?: string): Promise<LossData[]> {
		const q = ilce ? `&ilce=${encodeURIComponent(ilce)}` : '';
		return this.fetchJson<LossData[]>(`${API_BASE}/metrics/losses-monthly?year=${year}${q}`).catch(() => []);
	}

	async getDistricts(): Promise<string[]> {
		return this.fetchJson<string[]>(`${API_BASE}/metrics/districts`).catch(() => []);
	}

	async getLossesByDistrict(year: number, limit = 10): Promise<LossByDistrict[]> {
		return this.fetchJson<LossByDistrict[]>(
			`${API_BASE}/metrics/losses-by-district?year=${year}&limit=${limit}`
		).catch(() => []);
	}

	async getLossesBreakdown(year: number, ilce: string): Promise<LossBreakdown[]> {
		return this.fetchJson<LossBreakdown[]>(
			`${API_BASE}/metrics/losses-breakdown?year=${year}&ilce=${encodeURIComponent(ilce)}`
		).catch(() => []);
	}

	async getLossesBreakdownAll(year: number): Promise<LossBreakdown[]> {
		return this.fetchJson<LossBreakdown[]>(`${API_BASE}/metrics/losses-breakdown-all?year=${year}`).catch(() => []);
	}

	// Predictions
	async getDemandForecast(scope: string, name: string, horizon = 6): Promise<DemandForecast> {
		return this.fetchJson<DemandForecast>(
			`${API_BASE}/predictions/demand?scope=${scope}&name=${encodeURIComponent(name)}&horizon=${horizon}`
		).catch(() => ({
			unit: 'm3',
			freq: 'monthly',
			history: [],
			forecast: [],
			meta: { model: 'error' },
			error: 'failed'
		}));
	}
}

export const apiService = new ApiService();
export default apiService;

