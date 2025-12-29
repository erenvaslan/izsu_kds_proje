import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import {
	Chart as ChartJS,
	BarElement,
	LineElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Tooltip,
	Legend,
	Filler,
	ArcElement,
	LineController
} from 'chart.js';

// Register Chart.js components
ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ArcElement, LineController);

// Import components
import { LoginPage, Sidebar, Header } from './components';

// Import views
import { DashboardView, AnalyticsView, ReportsView, PredictionsView } from './views';

// Import hooks
import { useAuth, useTheme, useMetrics } from './hooks';

// Import services and utils
import apiService from './services/api';
import { exportToPDF } from './utils';

// Import types
import type { ViewType, TrendPeriod, LossesViewType, LossBreakdown } from './types';

function App() {
	// Auth
	const { token, login, logout } = useAuth();
	
	// Theme
	const { darkMode, toggleTheme } = useTheme();
	
	// App state
	const [statusText, setStatusText] = useState<string>('Loading...');
	const [view, setView] = useState<ViewType>('dashboard');
	const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('3y');
	const [lossesView, setLossesView] = useState<LossesViewType>('line');
	const [showInvestments, setShowInvestments] = useState<boolean>(false);
	const [dttThreshold, setDttThreshold] = useState<number>(20);
	const [selectedDistrict] = useState<string>('');
	const [lossesBreakdown] = useState<LossBreakdown[]>([]);
	
	// Metrics data
	const {
		overview,
		reservoirLatest,
		productionMonthly,
		productionAnnual,
		selectedYear,
		setSelectedYear,
		consumptionTop,
		monthlyLosses,
		lossesByDistrict,
		lossesBreakdownAll,
		daysToThreshold,
		setDaysToThreshold
	} = useMetrics(token);

	// Computed values
	const latestLoss = useMemo<number | null>(() => {
		const vals = monthlyLosses.map(r => Number(r.loss)).filter(v => Number.isFinite(v));
		return vals.length ? vals[vals.length - 1] : null;
	}, [monthlyLosses]);

	// Health check
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setStatusText('API kontrol ediliyor...');
				const health = await apiService.checkHealth();
				if (cancelled) return;
				if (!health.ok) {
					setStatusText('API KAPALI');
					return;
				}
				setStatusText('');
			} catch (e) {
				setStatusText('Yükleme başarısız');
			}
		})();
		return () => { cancelled = true; };
	}, []);

	// Auto-load critical threshold data when switching to predictions view
	useEffect(() => {
		if (view === 'predictions' && token && !daysToThreshold) {
			(async () => {
				try {
					const resp = await apiService.getDaysToThreshold(dttThreshold, 21, 'low');
					if (resp) setDaysToThreshold(resp);
			} catch (e) {
					console.error('Auto-load DTT failed:', e);
				}
			})();
		}
	}, [view, token, daysToThreshold]);

	// Handlers
	const handleLogin = useCallback(async (email: string, password: string) => {
		await login(email, password);
	}, [login]);

	const handleExportPDF = useCallback(() => {
		exportToPDF();
	}, []);

	// Login Page
	if (!token) {
	return (
			<LoginPage 
				onLogin={handleLogin}
				statusText={statusText}
				onStatusChange={setStatusText}
			/>
		);
	}

	// Main Dashboard Layout
	return (
		<div className="app-layout">
			<Sidebar
				view={view}
				onViewChange={setView}
				onLogout={logout}
			/>

			<main className="main-content">
				<Header
					view={view}
					darkMode={darkMode}
					onToggleTheme={toggleTheme}
					onExportPDF={handleExportPDF}
				/>

				<div className="page-content">
					{view === 'dashboard' && (
						<DashboardView
							overview={overview}
							reservoirLatest={reservoirLatest}
							productionMonthly={productionMonthly}
							productionAnnual={productionAnnual}
							selectedYear={selectedYear}
							onSelectedYearChange={setSelectedYear}
							consumptionTop={consumptionTop}
							lossesByDistrict={lossesByDistrict}
							lossesBreakdownAll={lossesBreakdownAll}
							selectedDistrict={selectedDistrict}
							lossesBreakdown={lossesBreakdown}
							lossesView={lossesView}
							onLossesViewChange={setLossesView}
							latestLoss={latestLoss}
							showInvestments={showInvestments}
							onToggleInvestments={() => setShowInvestments(!showInvestments)}
						/>
					)}

					{view === 'analytics' && (
						<AnalyticsView
							productionAnnual={productionAnnual}
							consumptionTop={consumptionTop}
							trendPeriod={trendPeriod}
							onTrendPeriodChange={setTrendPeriod}
						/>
					)}

					{view === 'predictions' && (
						<PredictionsView
							reservoirLatest={reservoirLatest}
							lossesByDistrict={lossesByDistrict}
							lossesBreakdownAll={lossesBreakdownAll}
							overview={overview}
							dttThreshold={dttThreshold}
							onDttThresholdChange={setDttThreshold}
						/>
					)}

					{view === 'reports' && (
						<ReportsView
							overview={overview}
							latestLoss={latestLoss}
							onExportPDF={handleExportPDF}
						/>
			)}
				</div>
			</main>
		</div>
	);
}

const container = document.querySelector<HTMLDivElement>('#app')!;
createRoot(container).render(React.createElement(App));
