import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export function useAuth() {
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const saved = localStorage.getItem('kds_token');
		if (saved) {
			setToken(saved);
			apiService.setToken(saved);
		}
		setIsLoading(false);
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const data = await apiService.login(email, password);
		setToken(data.token);
		apiService.setToken(data.token);
		localStorage.setItem('kds_token', data.token);
	}, []);

	const logout = useCallback(() => {
		setToken(null);
		apiService.setToken(null);
		localStorage.removeItem('kds_token');
	}, []);

	return { token, isLoading, login, logout };
}

export default useAuth;

