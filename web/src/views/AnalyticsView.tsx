import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { formatInt } from '../utils';
import { gradientPalette } from '../constants';
import type { ProductionAnnual, ConsumptionData, TrendPeriod } from '../types';

interface AnalyticsViewProps {
	productionAnnual: ProductionAnnual[];
	consumptionTop: ConsumptionData[];
	trendPeriod: TrendPeriod;
	onTrendPeriodChange: (period: TrendPeriod) => void;
}

export function AnalyticsView({
	productionAnnual,
	consumptionTop,
	trendPeriod,
	onTrendPeriodChange
}: AnalyticsViewProps) {
	const filteredProduction = productionAnnual.filter(p => {
		if (trendPeriod === 'all') return true;
		const years = parseInt(trendPeriod);
		return p.year >= new Date().getFullYear() - years;
	});

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			{/* Period Selector */}
			<div className="card">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
					<h3>📈 Tarihsel Veri Analizi</h3>
					<div className="trend-period-selector">
						{(['1y', '3y', '5y', 'all'] as const).map(p => (
							<button
								key={p}
								className={`trend-period-btn ${trendPeriod === p ? 'active' : ''}`}
								onClick={() => onTrendPeriodChange(p)}
							>
								{p === '1y' ? '1 Yıl' : p === '3y' ? '3 Yıl' : p === '5y' ? '5 Yıl' : 'Tümü'}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Annual Production Trend */}
			<div className="chart-card">
				<div className="chart-card-header">
					<h3 className="chart-card-title">💧 Yıllık Üretim Trendi</h3>
					{productionAnnual.length >= 2 && (() => {
						const recent = productionAnnual.slice(-2);
						const change = ((recent[1]?.total || 0) - (recent[0]?.total || 0)) / (recent[0]?.total || 1) * 100;
						return (
							<span className={`trend-indicator ${change > 0 ? 'up' : change < 0 ? 'down' : 'stable'}`}>
								{change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(1)}%
							</span>
						);
					})()}
				</div>
				<div style={{ height: 300 }}>
					<Line
						data={{
							labels: filteredProduction.map(p => p.year.toString()),
							datasets: [{
								label: 'Yıllık Üretim (m³)',
								data: filteredProduction.map(p => p.total),
								borderColor: '#0070d6',
								backgroundColor: 'rgba(0, 112, 214, 0.1)',
								tension: 0.4,
								fill: true,
								pointBackgroundColor: '#0070d6',
								pointBorderColor: 'white',
								pointBorderWidth: 2,
								pointRadius: 6
							}]
						}}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: { display: false },
								tooltip: { 
									backgroundColor: 'rgba(15, 23, 42, 0.9)',
									padding: 12,
									cornerRadius: 8,
									callbacks: {
										label: (ctx) => `Üretim: ${formatInt(ctx.parsed.y)} m³`
									}
								}
							},
							scales: {
								x: { grid: { display: false } },
								y: { 
									beginAtZero: false,
									grid: { color: 'rgba(0,0,0,0.05)' },
									ticks: {
										callback: (v) => `${(Number(v) / 1000000).toFixed(0)}M`
									}
								}
							}
						}}
					/>
				</div>
				{/* Summary Stats */}
				<div style={{ 
					marginTop: 16, 
					display: 'grid', 
					gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
					gap: 16,
					padding: 16,
					background: 'var(--gray-50)',
					borderRadius: 12
				}}>
					<div>
						<div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Toplam</div>
						<div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
							{formatInt(productionAnnual.reduce((a, p) => a + p.total, 0))} m³
						</div>
					</div>
					<div>
						<div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Ortalama</div>
						<div style={{ fontWeight: 700, fontSize: '1.2rem' }}>
							{formatInt(productionAnnual.reduce((a, p) => a + p.total, 0) / (productionAnnual.length || 1))} m³
						</div>
					</div>
					<div>
						<div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Maksimum</div>
						<div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#16a34a' }}>
							{formatInt(Math.max(...productionAnnual.map(p => p.total), 0))} m³
						</div>
					</div>
					<div>
						<div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Minimum</div>
						<div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#dc2626' }}>
							{formatInt(Math.min(...productionAnnual.map(p => p.total), 0))} m³
						</div>
					</div>
				</div>
			</div>

			{/* Year-over-Year Comparison */}
			<div className="chart-card">
				<div className="chart-card-header">
					<h3 className="chart-card-title">📊 Yıllar Arası Karşılaştırma</h3>
				</div>
				<div style={{ height: 300 }}>
					<Bar
						data={{
							labels: productionAnnual.slice(-5).map(p => p.year.toString()),
							datasets: [{
								label: 'Yıllık Üretim',
								data: productionAnnual.slice(-5).map(p => p.total),
								backgroundColor: productionAnnual.slice(-5).map((_, i, arr) => 
									i === arr.length - 1 ? '#0070d6' : 
									i === arr.length - 2 ? '#4da6ff' : 
									'#cbd5e1'
								),
								borderRadius: 8
							}]
						}}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: { 
								legend: { display: false },
								tooltip: { 
									backgroundColor: 'rgba(15, 23, 42, 0.9)',
									padding: 12,
									cornerRadius: 8 
								}
							},
							scales: {
								x: { grid: { display: false } },
								y: {
									beginAtZero: true,
									grid: { color: 'rgba(0,0,0,0.05)' }
								}
							}
						}}
					/>
				</div>
			</div>

			{/* Consumption Analysis */}
			<div className="chart-card">
				<div className="chart-card-header">
					<h3 className="chart-card-title">🏘️ İlçe Bazlı Tüketim Karşılaştırması</h3>
				</div>
				<div style={{ height: 350 }}>
					<Bar
						data={{
							labels: consumptionTop.map(c => c.name),
							datasets: [{
								label: 'Tüketim (m³)',
								data: consumptionTop.map(c => c.total),
								backgroundColor: gradientPalette.slice(0, consumptionTop.length),
								borderRadius: 6
							}]
						}}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							indexAxis: 'y' as const,
							plugins: {
								legend: { display: false },
								tooltip: { 
									backgroundColor: 'rgba(15, 23, 42, 0.9)',
									padding: 12,
									cornerRadius: 8 
								}
							},
							scales: {
								x: { 
									beginAtZero: true,
									grid: { color: 'rgba(0,0,0,0.05)' },
									ticks: {
										callback: (v) => `${(Number(v) / 1000000).toFixed(1)}M`
									}
								},
								y: { grid: { display: false } }
							}
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default AnalyticsView;

