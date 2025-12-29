export function formatInt(value: unknown): string {
	const num = Number(value);
	if (!Number.isFinite(num)) return '-';
	return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(num));
}

export function formatMonthLabel(ym: string): string {
	const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
	const y = ym.slice(0, 4);
	const idx = Math.max(0, Math.min(11, Number(ym.slice(5, 7)) - 1));
	return `${monthNames[idx]} ${y}`;
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('tr-TR', {
		style: 'currency',
		currency: 'TRY',
		maximumFractionDigits: 0
	}).format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
	return `${value.toFixed(decimals)}%`;
}

export function formatVolume(value: number): string {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M m³`;
	if (value >= 1000) return `${(value / 1000).toFixed(0)}K m³`;
	return `${value.toFixed(0)} m³`;
}

