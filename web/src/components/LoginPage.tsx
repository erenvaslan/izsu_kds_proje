import React, { useState } from 'react';

interface LoginPageProps {
	onLogin: (email: string, password: string) => Promise<void>;
	statusText: string;
	onStatusChange: (status: string) => void;
}

export function LoginPage({ onLogin, statusText, onStatusChange }: LoginPageProps) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async () => {
		try {
			await onLogin(email, password);
		} catch (e) {
			onStatusChange('Giriş başarısız');
		}
	};

	return (
		<div className="login-page">
			<div className="login-card">
				<div className="login-logo">
					<img
						src="/logo.png"
						alt="Logo"
						onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
					/>
					<h1><span>İZ</span>SU KDS</h1>
					<p style={{ color: 'var(--gray-500)', marginTop: 8 }}>Karar Destek Sistemi</p>
				</div>

				{statusText && (
					<div style={{
						padding: '10px 16px',
						background: statusText.includes('KAPALI') ? 'var(--error)' : 'var(--info)',
						color: 'white',
						borderRadius: 8,
						fontSize: '0.85rem',
						marginBottom: 16,
						textAlign: 'center'
					}}>
						{statusText}
					</div>
				)}

				<div className="login-form">
					<div className="form-group">
						<label>E-posta</label>
						<input
							id="email"
							type="email"
							placeholder="ornek@izsu.gov.tr"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="form-group">
						<label>Şifre</label>
						<input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<button
						className="btn btn-primary login-btn"
						onClick={handleSubmit}
					>
						Giriş Yap
					</button>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;

