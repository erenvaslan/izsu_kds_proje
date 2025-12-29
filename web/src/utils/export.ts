import type { OverviewData, ReservoirData, LossByDistrict } from '../types';
import { formatInt } from './formatters';

export function exportToExcel(
	overview: OverviewData | null,
	reservoirLatest: ReservoirData[],
	lossesByDistrict: LossByDistrict[]
): void {
	let csv = 'İZSU KDS Raporu\n';
	csv += `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n\n`;

	// KPI Summary
	csv += 'ÖZET BİLGİLER\n';
	csv += `Ortalama Doluluk,${overview?.avgFill?.toFixed(1) || '-'}%\n`;
	csv += `Günlük Üretim,${overview?.totalDailyProduction || '-'} m³\n`;
	csv += `Toplam Abone,${overview?.totalSubscribers || '-'}\n\n`;

	// Reservoir data
	csv += 'BARAJ DOLULUKLARI\n';
	csv += 'Baraj Adı,Doluluk (%)\n';
	reservoirLatest.forEach(r => {
		csv += `${r.name},${r.fill.toFixed(1)}\n`;
	});
	csv += '\n';

	// Loss data
	csv += 'İLÇE BAZLI KAYIPLAR\n';
	csv += 'İlçe,Toplam Kayıp (m³)\n';
	lossesByDistrict.forEach(d => {
		csv += `${d.name},${d.total}\n`;
	});

	// Download
	const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `IZSU_KDS_Rapor_${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();

	alert('Excel raporu indirildi!');
}

export function exportToPDF(): void {
	window.print();
}

