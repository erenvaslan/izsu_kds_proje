import React, { useMemo, Suspense, lazy } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Icons, KPICard, ChartCard } from '../components';
import { formatInt, formatMonthLabel } from '../utils';
import { gradientPalette, chartColors } from '../constants';
import type { 
	OverviewData, 
	ReservoirData, 
	ProductionMonthly, 
	ProductionAnnual,
	ConsumptionData,
	LossByDistrict,
	LossBreakdown,
	LossesViewType
} from '../types';

const IzmirMap = lazy(() => import('../IzmirMap'));

interface DashboardViewProps {
	overview: OverviewData | null;
	reservoirLatest: ReservoirData[];
	productionMonthly: ProductionMonthly[];
	productionAnnual: ProductionAnnual[];
	selectedYear: number | '';
	onSelectedYearChange: (year: number) => void;
	consumptionTop: ConsumptionData[];
	lossesByDistrict: LossByDistrict[];
	lossesBreakdownAll: LossBreakdown[];
	selectedDistrict: string;
	lossesBreakdown: LossBreakdown[];
	lossesView: LossesViewType;
	onLossesViewChange: (view: LossesViewType) => void;
	latestLoss: number | null;
	showInvestments: boolean;
	onToggleInvestments: () => void;
}

export function DashboardView({
	overview,
	reservoirLatest,
	productionMonthly,
	productionAnnual,
	selectedYear,
	onSelectedYearChange,
	consumptionTop,
	lossesByDistrict,
	lossesBreakdownAll,
	selectedDistrict,
	lossesBreakdown,
	lossesView,
	onLossesViewChange,
	latestLoss,
	showInvestments,
	onToggleInvestments
}: DashboardViewProps) {
	// Chart data computations
	const reservoirLatestChart = useMemo(() => {
		const labels = reservoirLatest.map(r => r.name);
		const dataValues = reservoirLatest.map(r => Number(r.fill || 0));
		return {
			labels,
			datasets: [{
				label: 'Doluluk (%)',
				data: dataValues,
				backgroundColor: labels.map((_, i) => gradientPalette[i % gradientPalette.length]),
				borderRadius: 8,
				borderSkipped: false,
			}]
		};
	}, [reservoirLatest]);

	const productionMonthlyChart = useMemo(() => {
		const months = Array.from(new Set(productionMonthly.map(r => r.month))).sort();
		const sources = Array.from(new Set(productionMonthly.map(r => r.source))).sort();
		const datasets = sources.map((s, idx) => {
			const data = months.map(m => {
				const found = productionMonthly.find(r => r.month === m && r.source === s);
				return Number(found?.total || 0);
			});
			return {
				label: s,
				data,
				backgroundColor: gradientPalette[idx % gradientPalette.length],
				borderRadius: 4,
				stack: 'prod'
			};
		});
		return { labels: months.map(formatMonthLabel), datasets };
	}, [productionMonthly]);

	const consumptionTopChart = useMemo(() => {
		const labels = consumptionTop.map(r => r.name);
		const dataValues = consumptionTop.map(r => Number(r.total || 0));
		return {
			labels,
			datasets: [{
				label: 'Tüketim (Top 10 İlçe)',
				data: dataValues,
				backgroundColor: chartColors.success,
				borderRadius: 8,
			}]
		};
	}, [consumptionTop]);

	const lossesPieData = useMemo(() => {
		const source = selectedDistrict ? lossesBreakdown : lossesBreakdownAll;
		const labels = source.map(r => r.name);
		const dataValues = source.map(r => Number(r.total || 0));
		return {
			labels,
			datasets: [{
				label: 'Kayıp (m³)',
				data: dataValues,
				backgroundColor: gradientPalette.slice(0, labels.length),
				borderWidth: 0,
			}]
		};
	}, [selectedDistrict, lossesBreakdown, lossesBreakdownAll]);

	return (
		<>
			{/* KPI Cards */}
			<div className="kpi-grid">
				<KPICard
					icon={<Icons.Droplet />}
					iconColor="blue"
					label="Ortalama Doluluk"
					value={overview?.avgFill != null ? `${Number(overview.avgFill).toFixed(1)}%` : '-'}
				/>
				<KPICard
					icon={<Icons.Chart />}
					iconColor="green"
					label="Günlük Üretim"
					value={overview?.totalDailyProduction != null ? `${formatInt(overview.totalDailyProduction)} m³` : '-'}
					variant="success"
				/>
				<KPICard
					icon={<Icons.Calendar />}
					iconColor="violet"
					label={`Yıllık Üretim (${selectedYear || '-'})`}
					value={(() => {
						const cur = productionAnnual.find(p => p.year === selectedYear);
						return cur ? `${formatInt(cur.total)} m³` : '-';
					})()}
					variant="info"
				>
					<select
						value={selectedYear}
						onChange={e => onSelectedYearChange(Number(e.target.value))}
						style={{ marginTop: 8, padding: '6px 12px', fontSize: '0.8rem' }}
					>
						{productionAnnual.map(p => (
							<option key={p.year} value={p.year}>{p.year}</option>
						))}
					</select>
				</KPICard>
				<KPICard
					icon={<Icons.Users />}
					iconColor="amber"
					label="Toplam Abone"
					value={overview?.totalSubscribers != null ? formatInt(overview.totalSubscribers) : '-'}
					variant="warning"
				/>
			</div>

			{/* Charts Grid */}
			<div className="chart-grid">
				{/* Reservoir Chart */}
				<ChartCard title="🏔️ Baraj Doluluk Oranları">
					<Bar data={reservoirLatestChart} options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { display: false },
							tooltip: {
								backgroundColor: 'rgba(15, 23, 42, 0.9)',
								padding: 12,
								cornerRadius: 8,
								callbacks: { label: (ctx) => ctx.parsed.y != null ? `${ctx.parsed.y.toFixed(1)}%` : '' }
							}
						},
						scales: {
							x: {
								grid: { display: false },
								ticks: { maxRotation: 45, font: { size: 11 } }
							},
							y: {
								beginAtZero: true,
								max: 100,
								grid: { color: 'rgba(0,0,0,0.05)' },
								ticks: { callback: (v) => `${v}%` }
							}
						}
					}} />
				</ChartCard>

				{/* Production Chart */}
				<ChartCard title="💧 Aylık Üretim">
					<Bar data={productionMonthlyChart} options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 16 } },
							tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8 }
						},
						scales: {
							x: { stacked: true, grid: { display: false } },
							y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
						}
					}} />
				</ChartCard>

				{/* Consumption Chart */}
				<ChartCard title="🏘️ En Çok Tüketen İlçeler">
					<Bar data={consumptionTopChart} options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y' as const,
						plugins: {
							legend: { display: false },
							tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8 }
						},
						scales: {
							x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
							y: { grid: { display: false } }
						}
					}} />
				</ChartCard>

				{/* Losses Chart */}
				<ChartCard 
					title="⚠️ Su Kayıpları Analizi"
					headerRight={
						<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
							<select
								value={lossesView}
								onChange={e => onLossesViewChange(e.target.value as LossesViewType)}
								style={{ padding: '6px 12px', fontSize: '0.85rem' }}
							>
								<option value="line">İlçe Bazlı</option>
								<option value="pie">Kayıp Türleri</option>
							</select>
							{latestLoss != null && (
								<span className="badge badge-warning">Genel: {latestLoss.toFixed(1)}%</span>
							)}
						</div>
					}
					footer={
						<div style={{ 
							marginTop: 12, 
							padding: 12, 
							background: 'var(--gray-50)', 
							borderRadius: 8,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							flexWrap: 'wrap',
							gap: 12
						}}>
							<div>
								<span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Toplam Kayıp: </span>
								<strong style={{ color: 'var(--gray-800)' }}>
									{formatInt(lossesByDistrict.reduce((a, r) => a + Number(r.total || 0), 0))} m³
								</strong>
							</div>
							<div>
								<span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Kayıp Oranı: </span>
								<strong style={{ color: '#b45309' }}>{latestLoss?.toFixed(1) || '-'}%</strong>
							</div>
							<div>
								<span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>En Çok Kayıp: </span>
								<strong style={{ color: '#dc2626' }}>{lossesByDistrict[0]?.name || '-'}</strong>
							</div>
						</div>
					}
				>
					{lossesView === 'line' ? (
						<Bar 
							data={{
								labels: lossesByDistrict.slice(0, 10).map(r => r.name),
								datasets: [{
									label: 'Toplam Kayıp (m³)',
									data: lossesByDistrict.slice(0, 10).map(r => Number(r.total || 0)),
									backgroundColor: lossesByDistrict.slice(0, 10).map((_, i) => 
										i === 0 ? '#dc2626' : i < 3 ? '#f59e0b' : '#0070d6'
									),
									borderRadius: 6,
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
										cornerRadius: 8,
										callbacks: {
											label: (ctx) => `Kayıp: ${formatInt(ctx.parsed.x)} m³`
										}
									}
								},
								scales: {
									x: { 
										beginAtZero: true,
										grid: { color: 'rgba(0,0,0,0.05)' },
										ticks: {
											callback: (v) => {
												const num = Number(v);
												if (num >= 1000000) return `${(num/1000000).toFixed(1)}M`;
												if (num >= 1000) return `${(num/1000).toFixed(0)}K`;
												return String(v);
											}
										}
									},
									y: { 
										grid: { display: false },
										ticks: { font: { size: 11 } }
									}
								}
							}}
						/>
					) : (
						<Pie data={lossesPieData} options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: { 
									position: 'right' as const, 
									labels: { 
										boxWidth: 12, 
										padding: 10,
										font: { size: 11 }
									} 
								},
								tooltip: { 
									backgroundColor: 'rgba(15, 23, 42, 0.9)', 
									padding: 12, 
									cornerRadius: 8,
									callbacks: {
										label: (ctx) => `${ctx.label}: ${formatInt(ctx.parsed)} m³`
									}
								}
							}
						}} />
					)}
				</ChartCard>
			</div>

			{/* İzmir Map */}
			<ChartCard 
				title={`🗺️ İzmir Haritası - ${showInvestments ? 'Yatırım Önerileri' : 'Baraj Konumları'}`}
				fullWidth
				headerRight={
					<div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
						<button
							onClick={onToggleInvestments}
							style={{
								padding: '6px 12px',
								borderRadius: 8,
								border: 'none',
								background: showInvestments ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'var(--gray-200)',
								color: showInvestments ? 'white' : 'var(--gray-700)',
								fontSize: '0.85rem',
								fontWeight: 500,
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								transition: 'all 0.2s ease'
							}}
						>
							🏗️ {showInvestments ? 'Yatırımları Gizle' : 'Yatırım Önerilerini Göster'}
						</button>
						
						{!showInvestments ? (
							<>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }}></div>
									<span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>&gt;40%</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
									<span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>20-40%</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626' }}></div>
									<span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>&lt;20%</span>
								</div>
							</>
						) : (
							<>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<span style={{ fontSize: '0.9rem' }}>🔧</span>
									<span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Şebeke</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<span style={{ fontSize: '0.9rem' }}>🏗️</span>
									<span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Depo</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<span style={{ fontSize: '0.9rem' }}>🚰</span>
									<span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Hat</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<span style={{ fontSize: '0.9rem' }}>💧</span>
									<span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>Baraj</span>
								</div>
							</>
						)}
					</div>
				}
				footer={showInvestments ? (
					<div style={{ marginTop: 16 }}>
						<h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
							📋 Yatırım Önerileri Özeti
						</h4>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
							{/* Yüksek Öncelik */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
								borderRadius: 8,
								borderLeft: '4px solid #dc2626'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>
									YÜKSEK ÖNCELİK
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>5</div>
								<div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Proje</div>
							</div>
							{/* Orta Öncelik */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', 
								borderRadius: 8,
								borderLeft: '4px solid #f59e0b'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, marginBottom: 4 }}>
									ORTA ÖNCELİK
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>5</div>
								<div style={{ fontSize: '0.75rem', color: '#b45309' }}>Proje</div>
							</div>
							{/* Düşük Öncelik */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
								borderRadius: 8,
								borderLeft: '4px solid #22c55e'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: 4 }}>
									DÜŞÜK ÖNCELİK
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>2</div>
								<div style={{ fontSize: '0.75rem', color: '#15803d' }}>Proje</div>
							</div>
							{/* Toplam Yatırım */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', 
								borderRadius: 8,
								borderLeft: '4px solid #8b5cf6'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#5b21b6', fontWeight: 600, marginBottom: 4 }}>
									TOPLAM YATIRIM
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#8b5cf6' }}>~1 Milyar ₺</div>
								<div style={{ fontSize: '0.75rem', color: '#7c3aed' }}>Tahmini</div>
							</div>
						</div>
						
						{/* Yatırım Türleri Dağılımı */}
						<div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ 
									width: 28, 
									height: 28, 
									background: '#f59e0b', 
									borderRadius: 6, 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									fontSize: '0.9rem'
								}}>🔧</span>
								<div>
									<div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Şebeke Yenileme</div>
									<div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>3 proje • 135M ₺</div>
								</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ 
									width: 28, 
									height: 28, 
									background: '#8b5cf6', 
									borderRadius: 6, 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									fontSize: '0.9rem'
								}}>🏗️</span>
								<div>
									<div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Yeni Su Deposu</div>
									<div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>4 proje • 127M ₺</div>
								</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ 
									width: 28, 
									height: 28, 
									background: '#0070d6', 
									borderRadius: 6, 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									fontSize: '0.9rem'
								}}>🚰</span>
								<div>
									<div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Boru Hattı</div>
									<div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>3 proje • 188M ₺</div>
								</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span style={{ 
									width: 28, 
									height: 28, 
									background: '#10b981', 
									borderRadius: 6, 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									fontSize: '0.9rem'
								}}>💧</span>
								<div>
									<div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Baraj/Gölet</div>
									<div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>2 proje • 500M ₺</div>
								</div>
							</div>
						</div>
						
						<div style={{ 
							marginTop: 16, 
							padding: 12, 
							background: 'var(--gray-50)', 
							borderRadius: 8,
							fontSize: '0.8rem',
							color: 'var(--gray-600)'
						}}>
							💡 <strong>Not:</strong> Haritadaki işaretçilere tıklayarak proje detaylarını görüntüleyebilirsiniz.
							Öncelik seviyeleri kayıp oranları, nüfus yoğunluğu ve altyapı yaşına göre DSS tarafından hesaplanmıştır.
						</div>
					</div>
				) : (
					<div style={{ marginTop: 16 }}>
						<h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
							📊 Baraj Durumu Özeti
						</h4>
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
							{/* Kritik Durum */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', 
								borderRadius: 8,
								borderLeft: '4px solid #dc2626'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>
									KRİTİK (&lt;20%)
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
									{reservoirLatest.filter(r => r.fill < 20).length}
								</div>
								<div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Baraj</div>
							</div>
							{/* Uyarı Durumu */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', 
								borderRadius: 8,
								borderLeft: '4px solid #f59e0b'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600, marginBottom: 4 }}>
									UYARI (20-40%)
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
									{reservoirLatest.filter(r => r.fill >= 20 && r.fill < 40).length}
								</div>
								<div style={{ fontSize: '0.75rem', color: '#b45309' }}>Baraj</div>
							</div>
							{/* Normal Durum */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
								borderRadius: 8,
								borderLeft: '4px solid #22c55e'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: 4 }}>
									NORMAL (&gt;40%)
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
									{reservoirLatest.filter(r => r.fill >= 40).length}
								</div>
								<div style={{ fontSize: '0.75rem', color: '#15803d' }}>Baraj</div>
							</div>
							{/* Toplam Kapasite */}
							<div style={{ 
								padding: 12, 
								background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', 
								borderRadius: 8,
								borderLeft: '4px solid #0070d6'
							}}>
								<div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, marginBottom: 4 }}>
									TOPLAM BARAJ
								</div>
								<div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0070d6' }}>{reservoirLatest.length}</div>
								<div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Aktif</div>
							</div>
						</div>
						<div style={{ 
							marginTop: 12, 
							padding: 10, 
							background: 'var(--gray-50)', 
							borderRadius: 8,
							fontSize: '0.8rem',
							color: 'var(--gray-600)'
						}}>
							💡 Baraj işaretçilerine tıklayarak detaylı doluluk bilgilerini görüntüleyebilirsiniz.
							<strong> "Yatırım Önerilerini Göster"</strong> butonu ile DSS tarafından hesaplanan yatırım önerilerini inceleyebilirsiniz.
						</div>
					</div>
				)}
				customHeight={500}
			>
				<Suspense fallback={
					<div style={{ 
						height: '100%', 
						display: 'flex', 
						alignItems: 'center', 
						justifyContent: 'center',
						background: 'var(--gray-50)',
						borderRadius: 12
					}}>
						<div style={{ textAlign: 'center' }}>
							<div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺️</div>
							<div style={{ color: 'var(--gray-500)' }}>Harita yükleniyor...</div>
						</div>
					</div>
				}>
					<IzmirMap reservoirData={reservoirLatest} showInvestments={showInvestments} />
				</Suspense>
			</ChartCard>
		</>
	);
}

export default DashboardView;

