import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import BackendApiService from '../../services/backendApi';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const email = searchParams.get('email') || '';
    const token = searchParams.get('token') || '';

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !token) {
            setError(t('auth.errors.invalidResetLink'));
            return;
        }

        if (!PASSWORD_PATTERN.test(password)) {
            setError(t('auth.errors.passwordComplexity'));
            return;
        }

        if (password !== passwordConfirmation) {
            setError(t('auth.errors.passwordMatch'));
            return;
        }

        setLoading(true);
        try {
            await BackendApiService.resetPassword({
                email,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        } catch (err) {
            if (err.response?.status === 429) {
                setError(t('auth.errors.tooManyAttempts'));
            } else if (err.response?.data?.errors) {
                setError(Object.values(err.response.data.errors).flat().filter(Boolean).join(', '));
            } else {
                setError(err.response?.data?.message || t('auth.errors.passwordResetFailed'));
            }
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
                        <CardTitle className="text-2xl font-bold text-blue-600">{t('auth.resetPassword')}</CardTitle>
                        <p className="text-sm text-gray-500">{t('auth.resetPasswordSubtitle')}</p>
                    </div>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-gray-900">{t('auth.passwordResetSuccess')}</p>
                                <p className="text-sm text-gray-500">Redirecting you to login...</p>
                            </div>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-700">{t('auth.password')}</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    minLength={8}
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
                            <p className="text-xs text-gray-500">{t('auth.passwordRequirement')}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-700">{t('auth.confirmPassword')}</label>
                            <div className="relative">
                                <Input
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={255}
                                    className="h-12 pr-11"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation((value) => !value)}
                                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50"
                                    aria-label={showPasswordConfirmation ? t('auth.hidePassword') : t('auth.showPassword')}
                                    aria-pressed={showPasswordConfirmation}
                                    title={showPasswordConfirmation ? t('auth.hidePassword') : t('auth.showPassword')}
                                    disabled={loading}
                                >
                                    {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button className="w-full h-12 text-base font-medium" type="submit" disabled={loading}>
                            {loading ? t('auth.resettingPassword') : t('auth.resetPasswordButton')}
                        </Button>
                    </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center border-t pt-4">
                    <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        {t('auth.backToLogin')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ResetPassword;
