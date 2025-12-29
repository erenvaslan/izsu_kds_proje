import React from 'react';
import { Icons } from '../Icons';
import type { ViewType } from '../../types';

interface SidebarProps {
	view: ViewType;
	onViewChange: (view: ViewType) => void;
	onLogout: () => void;
}

export function Sidebar({ view, onViewChange, onLogout }: SidebarProps) {
	return (
		<aside className="sidebar open">
			<div className="sidebar-logo">
				<img src="/logo.png" alt="Logo" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
				<div className="sidebar-logo-text"><span>İZ</span>SU</div>
			</div>

			<nav className="sidebar-nav">
				<button
					className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
					onClick={() => onViewChange('dashboard')}
				>
					<Icons.Dashboard />
					<span>Dashboard</span>
				</button>
				<button
					className={`nav-item ${view === 'analytics' ? 'active' : ''}`}
					onClick={() => onViewChange('analytics')}
				>
					<Icons.History />
					<span>Trend Analizi</span>
				</button>
				<button
					className={`nav-item ${view === 'predictions' ? 'active' : ''}`}
					onClick={() => onViewChange('predictions')}
				>
					<Icons.TrendingUp />
					<span>Karar Destek</span>
				</button>
				<button
					className={`nav-item ${view === 'reports' ? 'active' : ''}`}
					onClick={() => onViewChange('reports')}
				>
					<Icons.DollarSign />
					<span>Maliyet Analizi</span>
				</button>
			</nav>

			<div className="sidebar-footer">
				<div className="user-info">
					<div className="user-avatar">A</div>
					<div className="user-details">
						<div className="user-name">Admin</div>
						<div className="user-role">Yönetici</div>
					</div>
				</div>
				<button className="nav-item" onClick={onLogout} style={{ marginTop: 12 }}>
					<Icons.Logout />
					<span>Çıkış Yap</span>
				</button>
			</div>
		</aside>
	);
}

export default Sidebar;

