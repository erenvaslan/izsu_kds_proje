import type { ChartColors } from '../types';

export const chartColors: ChartColors = {
	primary: 'rgba(0, 112, 214, 1)',
	primaryLight: 'rgba(0, 112, 214, 0.2)',
	success: 'rgba(16, 185, 129, 1)',
	successLight: 'rgba(16, 185, 129, 0.2)',
	warning: 'rgba(245, 158, 11, 1)',
	warningLight: 'rgba(245, 158, 11, 0.2)',
	danger: 'rgba(244, 63, 94, 1)',
	dangerLight: 'rgba(244, 63, 94, 0.2)',
	violet: 'rgba(139, 92, 246, 1)',
	violetLight: 'rgba(139, 92, 246, 0.2)',
	cyan: 'rgba(0, 188, 212, 1)',
	cyanLight: 'rgba(0, 188, 212, 0.2)',
};

export const gradientPalette = [
	'#0070d6', '#00bcd4', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e',
	'#06b6d4', '#14b8a6', '#a855f7', '#eab308', '#ec4899', '#3b82f6'
];

export const chartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		tooltip: {
			backgroundColor: 'rgba(15, 23, 42, 0.9)',
			padding: 12,
			cornerRadius: 8,
		}
	}
};

