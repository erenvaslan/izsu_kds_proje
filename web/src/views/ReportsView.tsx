import React from 'react';
import { Pie } from 'react-chartjs-2';
import { formatInt } from '../utils';
import { gradientPalette } from '../constants';
import type { OverviewData } from '../types';

interface ReportsViewProps {
	overview: OverviewData | null;
	latestLoss: number | null;
	onExportPDF: () => void;
}

export function ReportsView({ overview, latestLoss, onExportPDF }: ReportsViewProps) {
	const dailyProd = overview?.totalDailyProduction || 500000;
	const lossRate = (latestLoss || 25) / 100;
	const costPerM3 = 8.5;
	const waterPrice = 15;

	const dailyCost = dailyProd * costPerM3;
	const monthlyCost = dailyCost * 30;
	const yearlyCost = dailyCost * 365;

	const dailyLoss = dailyProd * lossRate;
	const dailyLossCost = dailyLoss * waterPrice;
	const yearlyLossCost = dailyLossCost * 365;

	const sellableWater = dailyProd * (1 - lossRate);
	const dailyRevenue = sellableWater * waterPrice;
	const yearlyRevenue = dailyRevenue * 365;

	// Loss Reduction ROI
	const currentLossRate = lossRate;
	const targetLossRate = 0.15;
	const reductionTarget = currentLossRate - targetLossRate;
	const dailySaving = dailyProd * reductionTarget * waterPrice;
	const yearlySaving = dailySaving * 365;
	const investmentCost = 150000000;
	const paybackYearsLoss = investmentCost / yearlySaving;

	// Capacity Expansion ROI
	const additionalCapacity = 50000000;
	const additionalRevenue = additionalCapacity * waterPrice * 0.75;
	const capacityInvestment = 500000000;
	const paybackYearsCapacity = capacityInvestment / additionalRevenue;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			{/* Cost Summary */}
			<div className="card">
				<h3 style={{ marginBottom: 20 }}>💰 Maliyet Özeti</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
					{/* Water Production Cost */}
					<div className="cost-card">
						<h4 style={{ marginBottom: 16, color: 'var(--primary-600)' }}>💧 Su Üretim Maliyeti</h4>
						<div className="cost-item">
							<span className="cost-label">m³ Başına Maliyet</span>
							<span className="cost-value">₺{costPerM3.toFixed(2)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Günlük Maliyet</span>
							<span className="cost-value">₺{formatInt(dailyCost)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Aylık Maliyet</span>
							<span className="cost-value">₺{formatInt(monthlyCost)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Yıllık Maliyet</span>
							<span className="cost-value" style={{ fontSize: '1.3rem', color: '#0070d6' }}>₺{formatInt(yearlyCost)}</span>
						</div>
					</div>

					{/* Water Loss Cost */}
					<div className="cost-card" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)', borderColor: '#fecaca' }}>
						<h4 style={{ marginBottom: 16, color: '#dc2626' }}>⚠️ Su Kayıp Maliyeti</h4>
						<div className="cost-item">
							<span className="cost-label">Kayıp Oranı</span>
							<span className="cost-value negative">{(lossRate * 100).toFixed(1)}%</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Günlük Kayıp</span>
							<span className="cost-value negative">{formatInt(dailyLoss)} m³</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Günlük Kayıp Maliyeti</span>
							<span className="cost-value negative">₺{formatInt(dailyLossCost)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Yıllık Kayıp Maliyeti</span>
							<span className="cost-value negative" style={{ fontSize: '1.3rem' }}>₺{formatInt(yearlyLossCost)}</span>
						</div>
					</div>

					{/* Revenue Projection */}
					<div className="cost-card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', borderColor: '#86efac' }}>
						<h4 style={{ marginBottom: 16, color: '#16a34a' }}>📈 Gelir Projeksiyonu</h4>
						<div className="cost-item">
							<span className="cost-label">Satılabilir Su</span>
							<span className="cost-value positive">{formatInt(sellableWater)} m³/gün</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">m³ Satış Fiyatı</span>
							<span className="cost-value">₺{waterPrice.toFixed(2)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Günlük Gelir</span>
							<span className="cost-value positive">₺{formatInt(dailyRevenue)}</span>
						</div>
						<div className="cost-item">
							<span className="cost-label">Yıllık Gelir</span>
							<span className="cost-value positive" style={{ fontSize: '1.3rem' }}>₺{formatInt(yearlyRevenue)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* ROI Analysis */}
			<div className="card">
				<h3 style={{ marginBottom: 20 }}>🎯 Yatırım Geri Dönüşü (ROI) Analizi</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
					{/* Loss Reduction ROI */}
					<div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 12 }}>
						<h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>🔧 Kayıp Azaltma Yatırımı</h4>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Hedef Kayıp Oranı</span>
							<span style={{ fontWeight: 600 }}>%15</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Azaltılacak Kayıp</span>
							<span style={{ fontWeight: 600, color: '#16a34a' }}>{(reductionTarget * 100).toFixed(1)}%</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Yıllık Tasarruf</span>
							<span style={{ fontWeight: 700, color: '#16a34a' }}>₺{formatInt(yearlySaving)}</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Tahmini Yatırım</span>
							<span style={{ fontWeight: 600 }}>₺{formatInt(investmentCost)}</span>
						</div>
						<div style={{ 
							marginTop: 16, 
							padding: 12, 
							background: paybackYearsLoss < 5 ? '#dcfce7' : paybackYearsLoss < 10 ? '#fef3c7' : '#fee2e2',
							borderRadius: 8,
							textAlign: 'center'
						}}>
							<div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Geri Dönüş Süresi</div>
							<div style={{ 
								fontSize: '1.5rem', 
								fontWeight: 700,
								color: paybackYearsLoss < 5 ? '#16a34a' : paybackYearsLoss < 10 ? '#b45309' : '#dc2626'
							}}>
								{paybackYearsLoss.toFixed(1)} Yıl
							</div>
						</div>
					</div>

					{/* Capacity Expansion ROI */}
					<div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 12 }}>
						<h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>🏗️ Kapasite Artırma Yatırımı</h4>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Ek Kapasite</span>
							<span style={{ fontWeight: 600 }}>50M m³/yıl</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Potansiyel Ek Gelir</span>
							<span style={{ fontWeight: 700, color: '#16a34a' }}>₺{formatInt(additionalRevenue)}/yıl</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
							<span style={{ color: 'var(--text-secondary)' }}>Tahmini Yatırım</span>
							<span style={{ fontWeight: 600 }}>₺{formatInt(capacityInvestment)}</span>
						</div>
						<div style={{ 
							marginTop: 16, 
							padding: 12, 
							background: paybackYearsCapacity < 5 ? '#dcfce7' : paybackYearsCapacity < 10 ? '#fef3c7' : '#fee2e2',
							borderRadius: 8,
							textAlign: 'center'
						}}>
							<div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Geri Dönüş Süresi</div>
							<div style={{ 
								fontSize: '1.5rem', 
								fontWeight: 700,
								color: paybackYearsCapacity < 5 ? '#16a34a' : paybackYearsCapacity < 10 ? '#b45309' : '#dc2626'
							}}>
								{paybackYearsCapacity.toFixed(1)} Yıl
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Cost Breakdown Chart */}
			<div className="chart-card">
				<div className="chart-card-header">
					<h3 className="chart-card-title">📊 Maliyet Dağılımı</h3>
				</div>
				<div style={{ height: 300 }}>
					<Pie
						data={{
							labels: ['Üretim Maliyeti', 'İşletme Giderleri', 'Personel', 'Bakım/Onarım', 'Enerji', 'Diğer'],
							datasets: [{
								data: [35, 20, 18, 12, 10, 5],
								backgroundColor: gradientPalette.slice(0, 6),
								borderWidth: 0
							}]
						}}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							plugins: {
								legend: { 
									position: 'right' as const,
									labels: { boxWidth: 12, padding: 16 }
								},
								tooltip: {
									backgroundColor: 'rgba(15, 23, 42, 0.9)',
									padding: 12,
									cornerRadius: 8,
									callbacks: {
										label: (ctx) => `${ctx.label}: %${ctx.parsed}`
									}
								}
							}
						}}
					/>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="card">
				<h3 style={{ marginBottom: 16 }}>📥 Raporlar</h3>
				<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
					<button className="btn btn-primary" onClick={onExportPDF}>
						📄 PDF Raporu Yazdır
					</button>
				</div>
				<p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
					💡 Raporlar mevcut dashboard verilerini içerir.
				</p>
			</div>
		</div>
	);
}

export default ReportsView;

