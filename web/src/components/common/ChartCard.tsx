import React from 'react';

interface ChartCardProps {
	title: string;
	headerRight?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	fullWidth?: boolean;
	customHeight?: number;
}

export function ChartCard({ title, headerRight, children, footer, fullWidth, customHeight }: ChartCardProps) {
	return (
		<div className="chart-card" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
			<div className="chart-card-header">
				<h3 className="chart-card-title">{title}</h3>
				{headerRight}
			</div>
			<div className="chart-container" style={customHeight ? { height: customHeight } : undefined}>
				{children}
			</div>
			{footer && (
				<div className="chart-card-footer">
					{footer}
				</div>
			)}
		</div>
	);
}

export default ChartCard;

