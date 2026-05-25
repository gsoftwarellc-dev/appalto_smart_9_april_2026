import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { ArrowLeft, Eye, EyeOff, Globe, AlertCircle, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const VALID_ROLES = ['admin', 'contractor'];
const DASHBOARD_PATHS = {
    admin: '/admin',
    contractor: '/contractor',
};

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        // Admin / Condominium profile (same as admin profile page)
        admin_sub_role: '',
        vat_number: '',
        address: '',
        city: '',
        province: '',
        phone: '',
        // Delegated technician only
        order_college: '',
        order_province: '',
        order_number: '',
        // Contractor-specific fields (same as contractor profile)
        company_name: '',
        fiscal_code: '',
        legal_representative: '',
        bio: '',
        expertise: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touchedFields, setTouchedFields] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(true);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [successAction, setSuccessAction] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setTouchedFields((prev) => ({ ...prev, [name]: true }));
    };

    const handleBlur = (e) => {
        setTouchedFields((prev) => ({ ...prev, [e.target.name]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setHasSubmitted(true);

        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setError(t('auth.errors.correctHighlightedFields'));
            setLoading(false);
            return;
        }

        try {
            const payload = buildPayload();
            await BackendApiService.register(payload);
            setSuccessMessage(t('auth.registrationSuccess'));
            setSuccessAction(t('auth.preparingDashboard'));
            const result = await login(payload.email, payload.password);

            if (result.success) {
                navigate(DASHBOARD_PATHS[payload.role], { replace: true });
            } else {
                setSuccessAction(t('auth.redirectingToLogin'));
                setError(result.message || t('auth.errors.loginFailed'));
                navigate('/login', { replace: true });
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const isContractor = formData.role === 'contractor';
    const isAdmin = formData.role === 'admin';
    const isDelegatedTechnician = formData.admin_sub_role === 'delegated_technician';

    const handleVatChange = (value) => {
        // Allow typing with or without IT prefix, but always keep only 11 digits in state
        const digits = value.replace(/\D/g, '').slice(0, 11);
        setFormData((prev) => ({ ...prev, vat_number: digits }));
        setTouchedFields((prev) => ({ ...prev, vat_number: true }));
    };

    const validateForm = (data) => {
        const errors = {};
        const role = data.role;
        const isContractorAccount = role === 'contractor';
        const isAdminAccount = role === 'admin';
        const isDelegatedTechnicianAccount = isAdminAccount && data.admin_sub_role === 'delegated_technician';
        const displayName = isContractorAccount ? data.company_name.trim() : data.name.trim();
        const email = data.email.trim();
        const vat = data.vat_number.replace(/\D/g, '');

        if (!VALID_ROLES.includes(role)) {
            errors.role = t('auth.errors.invalidRole');
        }

        if (!displayName) {
            errors[isContractorAccount ? 'company_name' : 'name'] = t('auth.errors.requiredFields');
        }

        if (!email) {
            errors.email = t('auth.errors.requiredFields');
        } else if (!EMAIL_PATTERN.test(email)) {
            errors.email = t('auth.errors.invalidEmail');
        }

        if (!data.password) {
            errors.password = t('auth.errors.requiredFields');
        } else if (!PASSWORD_PATTERN.test(data.password)) {
            errors.password = t('auth.errors.passwordComplexity');
        }

        if (!data.password_confirmation) {
            errors.password_confirmation = t('auth.errors.requiredFields');
        } else if (data.password && data.password !== data.password_confirmation) {
            errors.password_confirmation = t('auth.errors.passwordMatch');
        }

        if (vat.length > 0 && vat.length !== 11) {
            errors.vat_number = t('auth.errors.vat11Required');
        } else if (vat.length === 0 && isAdminAccount) {
            errors.vat_number = t('auth.errors.requiredFields');
        }

        if (isAdminAccount) {
            if (!data.admin_sub_role.trim()) {
                errors.admin_sub_role = t('auth.errors.requiredFields');
            }
            if (!data.address.trim()) {
                errors.address = t('auth.errors.requiredFields');
            }
            if (!data.city.trim()) {
                errors.city = t('auth.errors.requiredFields');
            }
            if (!data.province.trim()) {
                errors.province = t('auth.errors.requiredFields');
            }
        }

        if (isDelegatedTechnicianAccount) {
            if (!data.order_college.trim()) {
                errors.order_college = t('auth.errors.requiredFields');
            }
            if (!data.order_province.trim()) {
                errors.order_province = t('auth.errors.requiredFields');
            }
            if (!data.order_number.trim()) {
                errors.order_number = t('auth.errors.requiredFields');
            }
        }

        if (data.phone.trim().length > 20) {
            errors.phone = t('auth.errors.maxLength', { count: 20 });
        }
        if (data.bio.trim().length > 2000) {
            errors.bio = t('auth.errors.maxLength', { count: 2000 });
        }
        if (data.expertise.trim().length > 255) {
            errors.expertise = t('auth.errors.maxLength', { count: 255 });
        }
        if (data.fiscal_code.trim().length > 255) {
            errors.fiscal_code = t('auth.errors.maxLength', { count: 255 });
        }
        if (data.legal_representative.trim().length > 255) {
            errors.legal_representative = t('auth.errors.maxLength', { count: 255 });
        }

        return errors;
    };

    const fieldErrors = validateForm(formData);
    const shouldShowFieldError = (name) => (hasSubmitted || touchedFields[name]) && fieldErrors[name];
    const getFieldClassName = (name, className = '') => {
        const errorClassName = shouldShowFieldError(name) ? 'border-red-400 focus:ring-red-400' : '';
        return [className, errorClassName].filter(Boolean).join(' ');
    };
    const renderFieldError = (name) => (
        shouldShowFieldError(name) ? (
            <p className="text-xs text-red-600" role="alert">{fieldErrors[name]}</p>
        ) : null
    );

    const getApiErrorMessage = (err) => {
        if (err.response?.status === 429) {
            return t('auth.errors.tooManyAttempts');
        }

        const errors = err.response?.data?.errors;

        if (errors && typeof errors === 'object') {
            return Object.values(errors).flat().filter(Boolean).join(', ');
        }

        return err.response?.data?.message || t('auth.errors.registrationFailed');
    };

    const buildPayload = () => {
        const basePayload = {
            name: isContractor ? formData.company_name.trim() : formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            password_confirmation: formData.password_confirmation,
            role: formData.role,
            vat_number: formData.vat_number.replace(/\D/g, ''),
            phone: formData.phone.trim(),
        };

        if (isContractor) {
            return {
                ...basePayload,
                name: formData.company_name.trim(),
                company_name: formData.company_name.trim(),
                fiscal_code: formData.fiscal_code.trim().toUpperCase(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                province: formData.province.trim().toUpperCase(),
                legal_representative: formData.legal_representative.trim(),
                bio: formData.bio.trim(),
                expertise: formData.expertise.trim(),
            };
        }

        return {
            ...basePayload,
            admin_sub_role: formData.admin_sub_role,
            address: formData.address.trim(),
            city: formData.city.trim(),
            province: formData.province.trim().toUpperCase(),
            order_college: isDelegatedTechnician ? formData.order_college.trim() : '',
            order_province: isDelegatedTechnician ? formData.order_province.trim().toUpperCase() : '',
            order_number: isDelegatedTechnician ? formData.order_number.trim() : '',
        };
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative">
            {successMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
                    <div
                        role="status"
                        aria-live="polite"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl"
                    >
                        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
                        <div className="p-7 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                            </div>
                            <h2 className="mt-5 text-2xl font-bold text-gray-900">{successMessage}</h2>
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {successAction}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('auth.registeringSecurely')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-blue-600 my-8">
                <CardHeader className="space-y-4 flex flex-col items-center pb-2">
                    <img src="/logo.jpg" alt="Appalto Smart Logo" className="h-16 w-auto rounded-md shadow-sm" />
                    <div className="text-center space-y-1">
                        <CardTitle className="text-2xl font-bold text-blue-600">{t('auth.createAccount')}</CardTitle>
                        <p className="text-sm text-gray-500">{t('auth.registerSubtitle')}</p>
                    </div>
                </CardHeader>

                <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Account Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('auth.accountType')} *</label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={loading}
                                    required
                                    className={`flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${getFieldClassName('role')}`}
                                >
                                    <option value="admin">{t('auth.admin')}</option>
                                    <option value="contractor">{t('auth.contractor')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                            {renderFieldError('role')}
                        </div>

                        {/* Ruolo (admin only) - right after account type so technician block can show next */}
                        {isAdmin && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.roleLabel')} *</label>
                                <div className="relative">
                                    <select
                                        name="admin_sub_role"
                                        value={formData.admin_sub_role}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        disabled={loading}
                                        className={`flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${getFieldClassName('admin_sub_role')}`}
                                        required={isAdmin}
                                    >
                                        <option value="">{t('admin.profile.placeholders.selectRole')}</option>
                                        <option value="condominium_admin">{t('auth.roleCondominiumAdmin')}</option>
                                        <option value="delegated_technician">{t('auth.roleDelegatedTechnician')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                                {renderFieldError('admin_sub_role')}
                            </div>
                        )}

                        {/* SOLO PER TECNICI DELEGATI - shown when admin + role = Tecnico Delegato */}
                        {isAdmin && isDelegatedTechnician && (
                            <div className="rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4 space-y-3">
                                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                                    {t('auth.onlyForDelegatedTechnicians')}
                                </h3>
                                <p className="text-xs text-amber-700">{t('auth.mandatoryForRegistrationNote')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('auth.orderCollege')} *</label>
                                        <Input
                                            type="text"
                                            name="order_college"
                                            value={formData.order_college}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="INGEGNERI/ARCHITETTI/GEOMETRI"
                                            className={getFieldClassName('order_college')}
                                            disabled={loading}
                                            required={isDelegatedTechnician}
                                        />
                                        {renderFieldError('order_college')}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('auth.orderProvince')} *</label>
                                        <Input
                                            type="text"
                                            name="order_province"
                                            value={formData.order_province}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="LATINA"
                                            className={getFieldClassName('order_province')}
                                            disabled={loading}
                                            required={isDelegatedTechnician}
                                        />
                                        {renderFieldError('order_province')}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('auth.orderNumber')} *</label>
                                        <Input
                                            type="text"
                                            name="order_number"
                                            value={formData.order_number}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="2153"
                                            className={getFieldClassName('order_number')}
                                            disabled={loading}
                                            required={isDelegatedTechnician}
                                        />
                                        {renderFieldError('order_number')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Crea Account: Nome/Ragione Sociale, Email, Password */}
                        <div className="text-sm font-semibold text-gray-700 border-b pb-2">{t('auth.createAccount')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    {isContractor ? t('auth.companyName') : (isAdmin ? t('auth.fullNameLabel') : t('auth.fullName'))} *
                                </label>
                                <Input
                                    type="text"
                                    name={isContractor ? 'company_name' : 'name'}
                                    value={isContractor ? formData.company_name : formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder={isContractor ? 'ABC Construction SRL' : 'John Doe'}
                                    autoComplete={isContractor ? 'organization' : 'name'}
                                    className={getFieldClassName(isContractor ? 'company_name' : 'name')}
                                    disabled={loading}
                                    required
                                />
                                {renderFieldError(isContractor ? 'company_name' : 'name')}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.email')} *</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    placeholder="admin@example.com"
                                    autoComplete="email"
                                    inputMode="email"
                                    className={getFieldClassName('email')}
                                    disabled={loading}
                                    required
                                />
                                {renderFieldError('email')}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.password')} *</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={255}
                                        className={getFieldClassName('password', 'pr-11')}
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
                                {renderFieldError('password') || <p className="text-xs text-gray-500">{t('auth.passwordRequirement')}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.confirmPassword')} *</label>
                                <div className="relative">
                                    <Input
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        minLength={8}
                                        maxLength={255}
                                        className={getFieldClassName('password_confirmation', 'pr-11')}
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
                                {renderFieldError('password_confirmation')}
                            </div>
                        </div>

                        {/* Admin: P.iva and Studio (mandatory) */}
                        {isAdmin && (
                            <div className="pt-4 border-t space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{t('auth.vatNumber')} *</label>
                                    <div className="flex items-stretch gap-1">
                                        <span className="inline-flex items-center px-3 rounded-md border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700 select-none">
                                            IT
                                        </span>
                                        <Input
                                            type="text"
                                            name="vat_number"
                                            value={formData.vat_number}
                                            onChange={(e) => handleVatChange(e.target.value)}
                                            onBlur={handleBlur}
                                            placeholder="12345678901"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={11}
                                            disabled={loading}
                                            required={isAdmin}
                                            className={getFieldClassName('vat_number', 'flex-1')}
                                        />
                                    </div>
                                    {renderFieldError('vat_number') || <p className="text-xs text-gray-500">{t('auth.vat11Numbers')}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{t('auth.studioSection')} *</label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder={t('auth.studioAddress')}
                                        autoComplete="street-address"
                                        className={getFieldClassName('address')}
                                        disabled={loading}
                                        required={isAdmin}
                                    />
                                    {renderFieldError('address')}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        <div className="space-y-2">
                                            <Input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('auth.studioCity')}
                                                autoComplete="address-level2"
                                                className={getFieldClassName('city')}
                                                disabled={loading}
                                                required={isAdmin}
                                            />
                                            {renderFieldError('city')}
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                type="text"
                                                name="province"
                                                value={formData.province}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('auth.studioProvince')}
                                                maxLength={10}
                                                autoComplete="address-level1"
                                                className={getFieldClassName('province')}
                                                disabled={loading}
                                                required={isAdmin}
                                            />
                                            {renderFieldError('province')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contractor-specific fields */}
                        {isContractor && (
                            <>
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('auth.companyInfo')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.vatNumber')} *</label>
                                            <div className="flex items-stretch gap-1">
                                                <span className="inline-flex items-center px-3 rounded-md border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700 select-none">
                                                    IT
                                                </span>
                                                <Input
                                                    type="text"
                                                    name="vat_number"
                                                    value={formData.vat_number}
                                                    onChange={(e) => handleVatChange(e.target.value)}
                                                    onBlur={handleBlur}
                                                    placeholder="12345678901"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={11}
                                                    disabled={loading}
                                                    required={isContractor}
                                                    className={getFieldClassName('vat_number', 'flex-1')}
                                                />
                                            </div>
                                            {renderFieldError('vat_number')}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.phone')}</label>
                                            <Input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="+39 123 456 7890"
                                                autoComplete="tel"
                                                className={getFieldClassName('phone')}
                                                disabled={loading}
                                            />
                                            {renderFieldError('phone')}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.address')}</label>
                                            <Input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="Via Roma, 123"
                                                autoComplete="street-address"
                                                className={getFieldClassName('address')}
                                                disabled={loading}
                                            />
                                            {renderFieldError('address')}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.city')}</label>
                                            <Input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="Milano"
                                                autoComplete="address-level2"
                                                className={getFieldClassName('city')}
                                                disabled={loading}
                                            />
                                            {renderFieldError('city')}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.province')}</label>
                                            <Input
                                                type="text"
                                                name="province"
                                                value={formData.province}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder="MI"
                                                maxLength={2}
                                                autoComplete="address-level1"
                                                className={getFieldClassName('province')}
                                                disabled={loading}
                                            />
                                            {renderFieldError('province')}
                                        </div>

                                        <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">{t('auth.legalRepresentative')}</label>
                                                <Input
                                                    type="text"
                                                    name="legal_representative"
                                                    value={formData.legal_representative}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="Mario Rossi"
                                                    autoComplete="name"
                                                    className={getFieldClassName('legal_representative')}
                                                    disabled={loading}
                                                />
                                                {renderFieldError('legal_representative')}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">{t('auth.fiscalCodeLegalRep')}</label>
                                                <Input
                                                    type="text"
                                                    name="fiscal_code"
                                                    value={formData.fiscal_code}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    placeholder="RSSMRA80A01H501U"
                                                    maxLength={32}
                                                    className={getFieldClassName('fiscal_code')}
                                                    disabled={loading}
                                                />
                                                {renderFieldError('fiscal_code')}
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('contractor.profile.bio')}</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('contractor.profile.bioPlaceholder')}
                                                rows={3}
                                                disabled={loading}
                                                className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${getFieldClassName('bio')}`}
                                            />
                                            {renderFieldError('bio')}
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('contractor.profile.expertise')}</label>
                                            <Input
                                                type="text"
                                                name="expertise"
                                                value={formData.expertise}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                placeholder={t('contractor.profile.expertisePlaceholder')}
                                                className={getFieldClassName('expertise')}
                                                disabled={loading}
                                            />
                                            {renderFieldError('expertise')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md" role="alert" aria-live="polite">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button className="w-full h-11 text-base font-medium" type="submit" disabled={loading}>
                            {loading ? t('auth.registering') : t('auth.registerButton')}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="justify-center border-t pt-4">
                    <p className="text-sm text-gray-600">
                        {t('auth.haveAccount')}{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                            {t('auth.loginHere')}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
