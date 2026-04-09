import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Globe, AlertCircle, ChevronDown } from 'lucide-react';
import BackendApiService from '../../services/backendApi';

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

    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'it' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (formData.password !== formData.password_confirmation) {
            setError(t('auth.errors.passwordMatch'));
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError(t('auth.errors.passwordLength'));
            setLoading(false);
            return;
        }

        // Contractor validation
        if (formData.role === 'contractor') {
            if (!formData.company_name || !formData.vat_number) {
                setError(t('auth.errors.requiredFields'));
                setLoading(false);
                return;
            }
        }

        // Admin: require role, P.iva (11 digits), Studio (address, city, province)
        if (formData.role === 'admin') {
            if (!formData.admin_sub_role?.trim()) {
                setError(t('auth.errors.requiredFields'));
                setLoading(false);
                return;
            }
            const vat = (formData.vat_number || '').replace(/\D/g, '');
            if (vat.length !== 11) {
                setError(t('auth.errors.vat11Required') || 'P.iva: 11 numbers required.');
                setLoading(false);
                return;
            }
            if (!formData.address?.trim() || !formData.city?.trim() || !formData.province?.trim()) {
                setError(t('auth.errors.requiredFields'));
                setLoading(false);
                return;
            }
        }

        // Delegated technician: require order fields
        if (formData.role === 'admin' && formData.admin_sub_role === 'delegated_technician') {
            if (!formData.order_college?.trim() || !formData.order_province?.trim() || !formData.order_number?.trim()) {
                setError(t('auth.errors.requiredFields'));
                setLoading(false);
                return;
            }
        }

        try {
            const payload = formData.role === 'contractor' ? { ...formData, name: formData.company_name } : formData;
            await BackendApiService.register(payload);
            alert(t('auth.errors.registrationSuccess') || 'Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(', ')
                : t('auth.errors.registrationFailed');
            setError(errorMessage);
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
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative">
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Account Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">{t('auth.accountType')} *</label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                >
                                    <option value="admin">{t('auth.admin')}</option>
                                    <option value="contractor">{t('auth.contractor')}</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
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
                                        className="flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        required={isAdmin}
                                    >
                                        <option value="">{t('admin.profile.placeholders.selectRole')}</option>
                                        <option value="condominium_admin">{t('auth.roleCondominiumAdmin')}</option>
                                        <option value="delegated_technician">{t('auth.roleDelegatedTechnician')}</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
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
                                            placeholder="INGEGNERI/ARCHITETTI/GEOMETRI"
                                            required={isDelegatedTechnician}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('auth.orderProvince')} *</label>
                                        <Input
                                            type="text"
                                            name="order_province"
                                            value={formData.order_province}
                                            onChange={handleChange}
                                            placeholder="LATINA"
                                            required={isDelegatedTechnician}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">{t('auth.orderNumber')} *</label>
                                        <Input
                                            type="text"
                                            name="order_number"
                                            value={formData.order_number}
                                            onChange={handleChange}
                                            placeholder="2153"
                                            required={isDelegatedTechnician}
                                        />
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
                                    placeholder={isContractor ? 'ABC Construction SRL' : 'John Doe'}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.email')} *</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.password')} *</label>
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('auth.confirmPassword')} *</label>
                                <Input
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
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
                                            value={formData.vat_number}
                                            onChange={(e) => handleVatChange(e.target.value)}
                                            placeholder="12345678901"
                                            maxLength={11}
                                            required={isAdmin}
                                            className="flex-1"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">{t('auth.vat11Numbers')}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{t('auth.studioSection')} *</label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder={t('auth.studioAddress')}
                                        required={isAdmin}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                        <Input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder={t('auth.studioCity')}
                                            required={isAdmin}
                                        />
                                        <Input
                                            type="text"
                                            name="province"
                                            value={formData.province}
                                            onChange={handleChange}
                                            placeholder={t('auth.studioProvince')}
                                            maxLength={10}
                                            required={isAdmin}
                                        />
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
                                                    placeholder="12345678901"
                                                    required={isContractor}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.phone')}</label>
                                            <Input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+39 123 456 7890"
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.address')}</label>
                                            <Input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="Via Roma, 123"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.city')}</label>
                                            <Input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="Milano"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.province')}</label>
                                            <Input
                                                type="text"
                                                name="province"
                                                value={formData.province}
                                                onChange={handleChange}
                                                placeholder="MI"
                                                maxLength={2}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">{t('auth.legalRepresentative')}</label>
                                                <Input
                                                    type="text"
                                                    name="legal_representative"
                                                    value={formData.legal_representative}
                                                    onChange={handleChange}
                                                    placeholder="Mario Rossi"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">{t('auth.fiscalCodeLegalRep')}</label>
                                                <Input
                                                    type="text"
                                                    name="fiscal_code"
                                                    value={formData.fiscal_code}
                                                    onChange={handleChange}
                                                    placeholder="RSSMRA80A01H501U"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('contractor.profile.bio')}</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                placeholder={t('contractor.profile.bioPlaceholder')}
                                                rows={3}
                                                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">{t('contractor.profile.expertise')}</label>
                                            <Input
                                                type="text"
                                                name="expertise"
                                                value={formData.expertise}
                                                onChange={handleChange}
                                                placeholder={t('contractor.profile.expertisePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
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

