import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, CheckCircle, Globe, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import BackendApiService from '../../services/backendApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [developmentResetUrl, setDevelopmentResetUrl] = useState('');
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setDevelopmentResetUrl('');

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError(t('auth.errors.requiredFields'));
            return;
        }

        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            setError(t('auth.errors.invalidEmail'));
            return;
        }

        setLoading(true);
        try {
            const response = await BackendApiService.forgotPassword(normalizedEmail);
            setMessage(t('auth.passwordResetLinkSent'));
            setDevelopmentResetUrl(response.development_reset_url || '');
        } catch (err) {
            if (err.response?.status === 429) {
                setError(t('auth.errors.tooManyAttempts'));
            } else {
                setError(err.response?.data?.message || t('auth.errors.passwordResetRequestFailed'));
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
                        <CardTitle className="text-2xl font-bold text-blue-600">{t('auth.forgotPassword')}</CardTitle>
                        <p className="text-sm text-gray-500">{t('auth.forgotPasswordSubtitle')}</p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-700">{t('auth.email')}</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    inputMode="email"
                                    className="h-12 pl-10"
                                    disabled={loading}
                                    required
                                />
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="space-y-3 p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md" role="status" aria-live="polite">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{message}</span>
                                </div>
                                {developmentResetUrl && (
                                    <a href={developmentResetUrl} className="inline-flex font-medium text-blue-700 hover:text-blue-800 hover:underline">
                                        {t('auth.localResetLink')}
                                    </a>
                                )}
                            </div>
                        )}

                        {developmentResetUrl && (
                            <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                                {t('auth.localResetLinkNote')}
                            </div>
                        )}

                        <Button className="w-full h-12 text-base font-medium" type="submit" disabled={loading}>
                            {loading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
                        </Button>
                    </form>
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

export default ForgotPassword;
