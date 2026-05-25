import React, { createContext, useContext, useState, useEffect } from 'react';
import BackendApiService from '../services/backendApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('appalto_user');
        const token = localStorage.getItem('auth_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const user = await BackendApiService.login(email, password);

            setUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            const isNetworkError = !error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK');
            const message = isNetworkError
                ? 'Cannot reach server. Make sure the backend is running (npm run dev in appalto-backend, or php artisan serve on port 8000).'
                : (error.response?.data?.message || error.message || 'Login failed');
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await BackendApiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('appalto_user');
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('appalto_user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
