import React from 'react';
import type { ViewType } from '../../types';

interface HeaderProps {
	view: ViewType;
	darkMode: boolean;
	onToggleTheme: () => void;
	onExportPDF: () => void;
}

export function Header({ view, darkMode, onToggleTheme, onExportPDF }: HeaderProps) {
	const titles: Record<ViewType, string> = {
		dashboard: '📊 Dashboard',
		analytics: '📈 Tarihsel Trend Analizi',
		reports: '💰 Maliyet Analizi',
		predictions: '🎯 Karar Destek Merkezi'
	};

	return (
		<header className="header">
			<h1 className="header-title">{titles[view]}</h1>
			<div className="header-actions">
				{/* Export Button */}
				<div className="export-btn-group no-print">
					<button className="export-btn pdf" onClick={onExportPDF} title="PDF Olarak Yazdır">
						📄 PDF
					</button>
				</div>

				{/* Theme Toggle */}
				<button
					className={`theme-toggle no-print ${darkMode ? 'dark' : ''}`}
					onClick={onToggleTheme}
					title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
				/>

				<span className="badge badge-success">API Aktif</span>
			</div>
		</header>
	);
}

export default Header;

