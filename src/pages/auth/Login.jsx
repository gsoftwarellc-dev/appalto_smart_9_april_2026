import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { ArrowLeft, ChevronDown, Eye, EyeOff, Globe, AlertCircle } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DASHBOARD_PATHS = {
    admin: '/admin',
    contractor: '/contractor',
    owner: '/owner',
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('contractor');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(true);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            setError(t('auth.errors.requiredFields'));
            setLoading(false);
            return;
        }

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            setError(t('auth.errors.invalidEmail'));
            setLoading(false);
            return;
        }

        try {
            const result = await login(normalizedEmail, password);
            if (result.success) {
                const from = location.state?.from?.pathname;
                const userRole = result.user?.role ?? role;
                const defaultPath = DASHBOARD_PATHS[userRole] ?? '/';
                navigate(from?.startsWith(defaultPath) ? from : defaultPath, { replace: true });
            } else {
                setError(result.message || t('auth.errors.loginFailed'));
            }
        } catch {
            setError(t('auth.errors.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative">
            <div className="absolute top-4 left-4">
                <Link to="/" className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-white/50 px-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                    <ArrowLeft className="h-4 w-4" />
                    <span>{t('common.home')}</span>
                </Link>
            </div>

            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="sm" onClick={toggleLanguage} className="flex items-center gap-2 bg-white/50 hover:bg-white shadow-sm">
                    <Globe className="h-4 w-4" />
                    <span className="uppercase font-medium">{i18n.language === 'en' ? 'English' : 'Italiano'}</span>
                </Button>
            </div>

            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-600">
                <CardHeader className="space-y-4 flex flex-col items-center pb-2">
                    <img src="/logo.jpg" alt="Appalto Smart Logo" className="h-16 w-auto rounded-md shadow-sm" />
                    <div className="text-center space-y-1">
                        <CardTitle className="text-2xl font-bold text-blue-600">Appalto Smart</CardTitle>
                        <p className="text-sm text-gray-500">{t('auth.enterCredentials')}</p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-5" noValidate>
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-700">
                                {t('auth.selectRole')}
                            </label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={loading}
                                    required
                                    className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                >
                                    <option value="contractor">{t('auth.contractor')}</option>
                                    <option value="admin">{t('auth.admin')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-700">
                                {t('auth.email')}
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                autoComplete="email"
                                inputMode="email"
                                className="h-12"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-sm font-medium leading-none text-gray-700">
                                    {t('auth.password')}
                                </label>
                                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    {t('auth.forgotPassword')}
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    maxLength={255}
                                    className="h-12 pr-11"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50"
                                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                    aria-pressed={showPassword}
                                    title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button className="w-full h-12 text-base font-medium" type="submit" disabled={loading}>
                            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
                        </Button>
                    </form>


                </CardContent>

                <CardFooter className="justify-center border-t pt-4">
                    <p className="text-sm text-gray-600">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                            {t('auth.registerHere')}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
