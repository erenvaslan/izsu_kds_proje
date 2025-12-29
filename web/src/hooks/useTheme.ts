import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
	const [darkMode, setDarkMode] = useState<boolean>(() => {
		const saved = localStorage.getItem('kds_theme');
		return saved === 'dark';
	});

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
	}, [darkMode]);

	const toggleTheme = useCallback(() => {
		setDarkMode(prev => {
			const newValue = !prev;
			localStorage.setItem('kds_theme', newValue ? 'dark' : 'light');
			document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
			return newValue;
		});
	}, []);

	return { darkMode, toggleTheme };
}

export default useTheme;

