import React, { useState } from 'react';
import { formatInt } from '../utils';
import type { ReservoirData, LossByDistrict, LossBreakdown, OverviewData, SimScenario } from '../types';

interface PredictionsViewProps {
	reservoirLatest: ReservoirData[];
	lossesByDistrict: LossByDistrict[];
	lossesBreakdownAll: LossBreakdown[];
	overview: OverviewData | null;
	dttThreshold: number;
	onDttThresholdChange: (threshold: number) => void;
}

export function PredictionsView({
	reservoirLatest,
	lossesByDistrict,
	lossesBreakdownAll,
	overview,
	dttThreshold,
	onDttThresholdChange
}: PredictionsViewProps) {
	// DSS Simulator States
	const [simScenario, setSimScenario] = useState<SimScenario>('normal');
	const [simHorizon, setSimHorizon] = useState<number>(6);
	const [simPopGrowth, setSimPopGrowth] = useState<number>(1);
	const [simLossReduction, setSimLossReduction] = useState<number>(0);

	// What-If Analysis States
	const [whatIfPopChange, setWhatIfPopChange] = useState<number>(0);
	const [whatIfConsumptionChange, setWhatIfConsumptionChange] = useState<number>(0);
	const [whatIfLossChange, setWhatIfLossChange] = useState<number>(0);
	const [whatIfNewCapacity, setWhatIfNewCapacity] = useState<number>(0);
	const [whatIfPriceIncrease, setWhatIfPriceIncrease] = useState<number>(0);

	// Reservoir Analysis
	const critical = reservoirLatest.filter(r => r.fill <= dttThreshold);
	const warning = reservoirLatest.filter(r => r.fill > dttThreshold && r.fill <= dttThreshold * 2);
	const safe = reservoirLatest.filter(r => r.fill > dttThreshold * 2);
	const avgFill = reservoirLatest.length ? reservoirLatest.reduce((a, r) => a + r.fill, 0) / reservoirLatest.length : 50;

	// Simulation calculations
	const scenarioLabels = {
		drought: { name: 'Kuraklık', color: '#dc2626', bg: '#fee2e2' },
		normal: { name: 'Normal', color: '#0070d6', bg: '#dbeafe' },
		rainy: { name: 'Bol Yağış', color: '#16a34a', bg: '#dcfce7' }
	};

	const scenarioMultipliers = {
		drought: { supply: 0.7, demand: 1.15 },
		normal: { supply: 1.0, demand: 1.0 },
		rainy: { supply: 1.3, demand: 0.9 }
	};

	const mult = scenarioMultipliers[simScenario];
	const label = scenarioLabels[simScenario];

	const monthlyFillChange = simScenario === 'drought' ? -4 : simScenario === 'rainy' ? 2 : -1;
	const adjustedChange = monthlyFillChange + (simLossReduction * 0.2);
	const monthlyDemandGrowth = (simPopGrowth / 12) / 100;

	const projectedFills: number[] = [];
	let currentFill = avgFill;
	for (let i = 0; i < simHorizon; i++) {
		currentFill = Math.max(0, Math.min(100, currentFill + adjustedChange - (monthlyDemandGrowth * 100)));
		projectedFills.push(currentFill);
	}

	const finalFill = projectedFills[projectedFills.length - 1];
	const minFill = Math.min(...projectedFills);
	const riskLevel = minFill < 20 ? 'critical' : minFill < 40 ? 'warning' : 'safe';

	const totalProduction = overview?.totalDailyProduction || 0;
	const waterSaved = simLossReduction > 0 ? (totalProduction * (simLossReduction / 100) * simHorizon * 30).toFixed(0) : '0';

	// What-If Analysis calculations
	const baseProduction = overview?.totalDailyProduction || 500000;
	const baseLossRate = 25;
	const baseCapacity = 800;
	const baseWaterPrice = 15;

	const demandChange = ((whatIfPopChange / 100) + (whatIfConsumptionChange / 100)) * 100;
	const newWaterPrice = baseWaterPrice * (1 + whatIfPriceIncrease / 100);
	const priceElasticityEffect = whatIfPriceIncrease * -0.3;
	const finalDemandChange = demandChange + priceElasticityEffect;
	const supplyChange = (whatIfLossChange / baseLossRate * 100) + (whatIfNewCapacity / baseCapacity * 100) / 10;
	const netBalance = supplyChange - finalDemandChange;
	const riskScore = Math.max(0, Math.min(100, 50 - netBalance));
	const whatIfRiskLevel = riskScore > 70 ? 'critical' : riskScore > 40 ? 'warning' : 'safe';

	const additionalRevenueCalc = whatIfPriceIncrease > 0 
		? baseProduction * 365 * (newWaterPrice - baseWaterPrice) * (1 - Math.abs(priceElasticityEffect) / 100)
		: 0;
	const savingsFromLossReductionCalc = whatIfLossChange > 0
		? baseProduction * 365 * (whatIfLossChange / 100) * baseWaterPrice
		: 0;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			{/* Reservoir Status Card */}
			<div className="card">
				<h3 style={{ marginBottom: 16 }}>🏔️ Baraj Doluluk Durumu</h3>
				<p style={{ marginBottom: 16, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
					Güncel baraj doluluk oranları ve kritik seviye analizi
				</p>
				
				<div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
					<div className="form-group" style={{ width: 140 }}>
						<label>Kritik Eşik (%)</label>
						<input 
							type="number" 
							min={0} 
							max={100} 
							value={dttThreshold} 
							onChange={e => onDttThresholdChange(Number(e.target.value))}
							style={{ width: '100%' }}
						/>
					</div>
					<div style={{ paddingTop: 20, color: 'var(--gray-500)', fontSize: '0.85rem' }}>
						Bu eşiğin altındaki barajlar kritik olarak işaretlenir
					</div>
				</div>

				{reservoirLatest && reservoirLatest.length > 0 ? (
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
						{/* Summary Card */}
						<div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 12 }}>
							<div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: 8 }}>Genel Durum</div>
							<div style={{ 
								fontSize: '2rem', 
								fontWeight: 800, 
								color: critical.length > 0 ? 'var(--error)' : warning.length > 0 ? '#b45309' : 'var(--success)'
							}}>
								{critical.length > 0 ? `${critical.length} Kritik` : warning.length > 0 ? `${warning.length} Uyarı` : 'Güvenli ✓'}
							</div>
							<div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626' }}></div>
									<span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Kritik: {critical.length}</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
									<span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Uyarı: {warning.length}</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
									<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }}></div>
									<span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Güvenli: {safe.length}</span>
								</div>
							</div>
							<div style={{ marginTop: 12, padding: '8px 12px', background: 'white', borderRadius: 8, fontSize: '0.9rem' }}>
								<strong>Ortalama Doluluk:</strong> {avgFill.toFixed(1)}%
							</div>
						</div>

						{/* Per-Dam Status */}
						<div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 12 }}>
							<div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: 12 }}>Baraj Bazında Doluluk</div>
							<div style={{ maxHeight: 280, overflowY: 'auto' }}>
								{reservoirLatest
									.slice()
									.sort((a, b) => a.fill - b.fill)
									.map(r => {
										const isCritical = r.fill <= dttThreshold;
										const isWarning = r.fill > dttThreshold && r.fill <= dttThreshold * 2;
										return (
											<div key={r.name} style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '12px 0',
												borderBottom: '1px solid var(--gray-200)',
											}}>
												<div style={{ flex: 1 }}>
													<div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-800)' }}>{r.name}</div>
													<div style={{ 
														marginTop: 4,
														height: 6,
														background: 'var(--gray-200)',
														borderRadius: 3,
														overflow: 'hidden',
														maxWidth: 150
													}}>
														<div style={{
															height: '100%',
															width: `${Math.min(100, r.fill)}%`,
															background: isCritical ? '#dc2626' : isWarning ? '#f59e0b' : '#22c55e',
															borderRadius: 3,
															transition: 'width 0.3s ease'
														}}></div>
													</div>
												</div>
												<span style={{
													fontWeight: 700,
													padding: '4px 10px',
													borderRadius: 6,
													fontSize: '0.9rem',
													background: isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7',
													color: isCritical ? '#dc2626' : isWarning ? '#b45309' : '#16a34a'
												}}>
													{r.fill.toFixed(1)}%
												</span>
											</div>
										);
									})}
							</div>
						</div>
					</div>
				) : (
					<div style={{ padding: 40, background: 'var(--gray-50)', borderRadius: 12, textAlign: 'center' }}>
						<div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
						<div style={{ color: 'var(--gray-500)' }}>Baraj verisi yükleniyor...</div>
					</div>
				)}
			</div>

			{/* DSS Module 1: Water Budget Simulator */}
			<div className="card">
				<h3 style={{ marginBottom: 8 }}>🔮 Su Bütçesi Simülatörü</h3>
				<p style={{ marginBottom: 20, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
					Farklı senaryolara göre gelecekteki su durumunu tahmin edin
				</p>

				<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
					<div className="form-group" style={{ minWidth: 160 }}>
						<label>Senaryo</label>
						<select value={simScenario} onChange={e => setSimScenario(e.target.value as SimScenario)}>
							<option value="drought">🔥 Kuraklık</option>
							<option value="normal">☁️ Normal</option>
							<option value="rainy">🌧️ Bol Yağışlı</option>
						</select>
					</div>
					<div className="form-group" style={{ minWidth: 120 }}>
						<label>Projeksiyon Süresi</label>
						<select value={simHorizon} onChange={e => setSimHorizon(Number(e.target.value))}>
							<option value={3}>3 Ay</option>
							<option value={6}>6 Ay</option>
							<option value={12}>12 Ay</option>
						</select>
					</div>
					<div className="form-group" style={{ minWidth: 140 }}>
						<label>Nüfus Artışı (%/yıl)</label>
						<input 
							type="number" 
							min={0} 
							max={10} 
							step={0.5}
							value={simPopGrowth} 
							onChange={e => setSimPopGrowth(Number(e.target.value))}
						/>
					</div>
					<div className="form-group" style={{ minWidth: 160 }}>
						<label>Kayıp Azaltma Hedefi (%)</label>
						<input 
							type="number" 
							min={0} 
							max={50} 
							step={5}
							value={simLossReduction} 
							onChange={e => setSimLossReduction(Number(e.target.value))}
						/>
					</div>
				</div>

				{/* Simulation Results */}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
					<div style={{ padding: 20, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginBottom: 4 }}>Mevcut Ortalama Doluluk</div>
						<div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gray-800)' }}>{avgFill.toFixed(1)}%</div>
					</div>

					<div style={{ padding: 20, background: label.bg, borderRadius: 12 }}>
						<div style={{ color: label.color, fontSize: '0.8rem', marginBottom: 4 }}>Senaryo</div>
						<div style={{ fontSize: '1.5rem', fontWeight: 700, color: label.color }}>{label.name}</div>
						<div style={{ fontSize: '0.85rem', color: label.color, marginTop: 4 }}>
							Arz: {mult.supply > 1 ? '+' : ''}{((mult.supply - 1) * 100).toFixed(0)}% | 
							Talep: {mult.demand > 1 ? '+' : ''}{((mult.demand - 1) * 100).toFixed(0)}%
						</div>
					</div>

					<div style={{ 
						padding: 20, 
						background: riskLevel === 'critical' ? '#fee2e2' : riskLevel === 'warning' ? '#fef3c7' : '#dcfce7', 
						borderRadius: 12 
					}}>
						<div style={{ 
							color: riskLevel === 'critical' ? '#dc2626' : riskLevel === 'warning' ? '#b45309' : '#16a34a', 
							fontSize: '0.8rem', 
							marginBottom: 4 
						}}>
							{simHorizon} Ay Sonra Tahmini Doluluk
						</div>
						<div style={{ 
							fontSize: '2rem', 
							fontWeight: 700, 
							color: riskLevel === 'critical' ? '#dc2626' : riskLevel === 'warning' ? '#b45309' : '#16a34a'
						}}>
							{finalFill.toFixed(1)}%
						</div>
						<div style={{ 
							fontSize: '0.85rem', 
							color: riskLevel === 'critical' ? '#dc2626' : riskLevel === 'warning' ? '#b45309' : '#16a34a',
							marginTop: 4
						}}>
							Min: {minFill.toFixed(1)}% | Risk: {riskLevel === 'critical' ? 'Yüksek ⚠️' : riskLevel === 'warning' ? 'Orta ⚡' : 'Düşük ✓'}
						</div>
					</div>

					{simLossReduction > 0 && (
						<div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '2px solid #22c55e' }}>
							<div style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: 4 }}>Kayıp Azaltmayla Tasarruf</div>
							<div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
								{Number(waterSaved) > 1000000 ? `${(Number(waterSaved) / 1000000).toFixed(1)}M` : `${(Number(waterSaved) / 1000).toFixed(0)}K`} m³
							</div>
							<div style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: 4 }}>
								%{simLossReduction} kayıp azaltımı ile
							</div>
						</div>
					)}
				</div>
			</div>

			{/* DSS Module 2: Loss Reduction Priority Matrix */}
			<div className="card">
				<h3 style={{ marginBottom: 8 }}>🎯 Kayıp Azaltma Öncelik Matrisi</h3>
				<p style={{ marginBottom: 20, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
					Yatırım önceliklerini belirlemek için ilçe bazlı kayıp analizi
				</p>

				{lossesByDistrict && lossesByDistrict.length > 0 ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						<div style={{ overflowX: 'auto' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
								<thead>
									<tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
										<th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--gray-600)' }}>Öncelik</th>
										<th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--gray-600)' }}>İlçe</th>
										<th style={{ textAlign: 'right', padding: '12px 8px', color: 'var(--gray-600)' }}>Toplam Kayıp (m³)</th>
										<th style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--gray-600)' }}>Risk Seviyesi</th>
										<th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--gray-600)' }}>Öneri</th>
									</tr>
								</thead>
								<tbody>
									{lossesByDistrict.slice(0, 5).map((d, idx) => {
										const districtRisk = idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low';
										const recommendations: Record<string, string> = {
											high: 'Acil şebeke yenileme',
											medium: 'Kaçak tespit çalışması',
											low: 'Rutin bakım yeterli'
										};
										return (
											<tr key={d.name} style={{ borderBottom: '1px solid var(--gray-100)' }}>
												<td style={{ padding: '12px 8px' }}>
													<span style={{ 
														display: 'inline-flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: 28,
														height: 28,
														borderRadius: '50%',
														background: districtRisk === 'high' ? '#dc2626' : districtRisk === 'medium' ? '#f59e0b' : '#22c55e',
														color: 'white',
														fontWeight: 700,
														fontSize: '0.85rem'
													}}>
														{idx + 1}
													</span>
												</td>
												<td style={{ padding: '12px 8px', fontWeight: 500 }}>{d.name}</td>
												<td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
													{formatInt(d.total)}
												</td>
												<td style={{ padding: '12px 8px', textAlign: 'center' }}>
													<span style={{
														padding: '4px 12px',
														borderRadius: 20,
														fontSize: '0.8rem',
														fontWeight: 500,
														background: districtRisk === 'high' ? '#fee2e2' : districtRisk === 'medium' ? '#fef3c7' : '#dcfce7',
														color: districtRisk === 'high' ? '#dc2626' : districtRisk === 'medium' ? '#b45309' : '#16a34a'
													}}>
														{districtRisk === 'high' ? 'Yüksek' : districtRisk === 'medium' ? 'Orta' : 'Düşük'}
													</span>
												</td>
												<td style={{ padding: '12px 8px', color: 'var(--gray-600)', fontSize: '0.85rem' }}>
													{recommendations[districtRisk]}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				) : (
					<div style={{ padding: 40, background: 'var(--gray-50)', borderRadius: 12, textAlign: 'center' }}>
						<div style={{ color: 'var(--gray-500)' }}>Kayıp verisi yükleniyor...</div>
					</div>
				)}
			</div>

			{/* DSS Module 3: What-If Scenario Analysis */}
			<div className="card">
				<h3 style={{ marginBottom: 8 }}>🔬 What-If Senaryo Analizi</h3>
				<p style={{ marginBottom: 20, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
					Farklı varsayımlar altında sistemin nasıl etkileneceğini görün
				</p>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
					{/* Population Change */}
					<div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>👥 Nüfus Değişimi</label>
							<span style={{ 
								fontWeight: 700, 
								color: whatIfPopChange > 0 ? '#dc2626' : whatIfPopChange < 0 ? '#16a34a' : 'var(--gray-600)'
							}}>
								{whatIfPopChange > 0 ? '+' : ''}{whatIfPopChange}%
							</span>
						</div>
						<input 
							type="range" 
							min={-20} 
							max={30} 
							value={whatIfPopChange}
							onChange={e => setWhatIfPopChange(Number(e.target.value))}
							style={{ width: '100%', accentColor: '#0070d6' }}
						/>
					</div>

					{/* Consumption Change */}
					<div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>🚿 Kişi Başı Tüketim</label>
							<span style={{ 
								fontWeight: 700, 
								color: whatIfConsumptionChange > 0 ? '#dc2626' : whatIfConsumptionChange < 0 ? '#16a34a' : 'var(--gray-600)'
							}}>
								{whatIfConsumptionChange > 0 ? '+' : ''}{whatIfConsumptionChange}%
							</span>
						</div>
						<input
							type="range" 
							min={-30} 
							max={30} 
							value={whatIfConsumptionChange}
							onChange={e => setWhatIfConsumptionChange(Number(e.target.value))}
							style={{ width: '100%', accentColor: '#0070d6' }}
						/>
					</div>

					{/* Loss Reduction */}
					<div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>🔧 Kayıp Azaltma</label>
							<span style={{ 
								fontWeight: 700, 
								color: whatIfLossChange > 0 ? '#16a34a' : 'var(--gray-600)'
							}}>
								-{whatIfLossChange}%
							</span>
						</div>
						<input
							type="range" 
							min={0} 
							max={50} 
							value={whatIfLossChange}
							onChange={e => setWhatIfLossChange(Number(e.target.value))}
							style={{ width: '100%', accentColor: '#22c55e' }}
						/>
					</div>

					{/* New Capacity */}
					<div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>🏗️ Yeni Baraj Kapasitesi</label>
							<span style={{ 
								fontWeight: 700, 
								color: whatIfNewCapacity > 0 ? '#0070d6' : 'var(--gray-600)'
							}}>
								+{whatIfNewCapacity}M m³
							</span>
						</div>
						<input 
							type="range" 
							min={0} 
							max={500} 
							step={50}
							value={whatIfNewCapacity}
							onChange={e => setWhatIfNewCapacity(Number(e.target.value))}
							style={{ width: '100%', accentColor: '#0070d6' }}
						/>
					</div>

					{/* Price Increase */}
					<div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--gray-700)' }}>💰 Su Fiyatı Artışı</label>
							<span style={{ 
								fontWeight: 700, 
								color: whatIfPriceIncrease > 0 ? '#8b5cf6' : 'var(--gray-600)'
							}}>
								+{whatIfPriceIncrease}%
							</span>
						</div>
						<input 
							type="range" 
							min={0} 
							max={100} 
							step={10}
							value={whatIfPriceIncrease}
							onChange={e => setWhatIfPriceIncrease(Number(e.target.value))}
							style={{ width: '100%', accentColor: '#8b5cf6' }}
						/>
					</div>

					{/* Reset Button */}
					<div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<button
							className="btn"
							onClick={() => {
								setWhatIfPopChange(0);
								setWhatIfConsumptionChange(0);
								setWhatIfLossChange(0);
								setWhatIfNewCapacity(0);
								setWhatIfPriceIncrease(0);
							}}
							style={{ background: 'var(--gray-200)', color: 'var(--gray-700)' }}
						>
							🔄 Sıfırla
						</button>
					</div>
				</div>

				{/* What-If Results */}
				<div style={{ 
					display: 'grid', 
					gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
					gap: 16,
					marginBottom: 20
				}}>
					<div style={{ 
						padding: 20, 
						background: finalDemandChange > 10 ? '#fee2e2' : finalDemandChange < -5 ? '#dcfce7' : '#fef3c7',
						borderRadius: 12,
						textAlign: 'center'
					}}>
						<div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Talep Değişimi</div>
						<div style={{ 
							fontSize: '1.8rem', 
							fontWeight: 700,
							color: finalDemandChange > 10 ? '#dc2626' : finalDemandChange < -5 ? '#16a34a' : '#b45309'
						}}>
							{finalDemandChange > 0 ? '+' : ''}{finalDemandChange.toFixed(1)}%
						</div>
					</div>

					<div style={{ 
						padding: 20, 
						background: supplyChange > 5 ? '#dcfce7' : supplyChange < -5 ? '#fee2e2' : '#eff6ff',
						borderRadius: 12,
						textAlign: 'center'
					}}>
						<div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Arz Artışı</div>
						<div style={{ 
							fontSize: '1.8rem', 
							fontWeight: 700,
							color: supplyChange > 5 ? '#16a34a' : supplyChange < -5 ? '#dc2626' : '#0070d6'
						}}>
							{supplyChange > 0 ? '+' : ''}{supplyChange.toFixed(1)}%
						</div>
					</div>

					<div style={{ 
						padding: 20, 
						background: whatIfRiskLevel === 'critical' ? '#fee2e2' : whatIfRiskLevel === 'warning' ? '#fef3c7' : '#dcfce7',
						borderRadius: 12,
						textAlign: 'center'
					}}>
						<div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Risk Skoru</div>
						<div style={{ 
							fontSize: '1.8rem', 
							fontWeight: 700,
							color: whatIfRiskLevel === 'critical' ? '#dc2626' : whatIfRiskLevel === 'warning' ? '#b45309' : '#16a34a'
						}}>
							{riskScore.toFixed(0)}/100
						</div>
					</div>

					<div style={{ 
						padding: 20, 
						background: netBalance > 0 ? '#dcfce7' : netBalance < -10 ? '#fee2e2' : '#fef3c7',
						borderRadius: 12,
						textAlign: 'center'
					}}>
						<div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 4 }}>Net Denge</div>
						<div style={{ 
							fontSize: '1.8rem', 
							fontWeight: 700,
							color: netBalance > 0 ? '#16a34a' : netBalance < -10 ? '#dc2626' : '#b45309'
						}}>
							{netBalance > 0 ? '+' : ''}{netBalance.toFixed(1)}%
						</div>
					</div>
				</div>

				{/* Financial Impact */}
				{(additionalRevenueCalc > 0 || savingsFromLossReductionCalc > 0) && (
					<div style={{ 
						padding: 16, 
						background: 'linear-gradient(135deg, #faf5ff, #f0fdf4)',
						borderRadius: 12,
						marginBottom: 20
					}}>
						<div style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 12 }}>💰 Finansal Etki (Yıllık)</div>
						<div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
							{additionalRevenueCalc > 0 && (
								<div>
									<div style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Fiyat Artışından Gelir</div>
									<div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.2rem' }}>
										+₺{formatInt(additionalRevenueCalc)}
									</div>
								</div>
							)}
							{savingsFromLossReductionCalc > 0 && (
								<div>
									<div style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Kayıp Azaltmadan Tasarruf</div>
									<div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.2rem' }}>
										+₺{formatInt(savingsFromLossReductionCalc)}
									</div>
								</div>
							)}
							<div>
								<div style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Toplam Yıllık Kazanç</div>
								<div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.2rem' }}>
									₺{formatInt(additionalRevenueCalc + savingsFromLossReductionCalc)}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default PredictionsView;

