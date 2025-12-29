import React from 'react';

interface KPICardProps {
	icon: React.ReactNode;
	iconColor: 'blue' | 'green' | 'amber' | 'violet';
	label: string;
	value: string;
	variant?: 'default' | 'success' | 'warning' | 'info';
	children?: React.ReactNode;
}

export function KPICard({ icon, iconColor, label, value, variant = 'default', children }: KPICardProps) {
	return (
		<div className={`kpi-card ${variant}`}>
			<div className={`kpi-icon ${iconColor}`}>
				{icon}
			</div>
			<div className="kpi-label">{label}</div>
			<div className="kpi-value">{value}</div>
			{children}
		</div>
	);
}

export default KPICard;

