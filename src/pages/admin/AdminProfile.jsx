import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader2, User, Mail, Phone, Save, Building2, Hash, Lock, Eye, EyeOff } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';

const ADMIN_SUB_ROLES = [
    { value: 'condominium_admin', labelKey: 'admin.profile.roleCondominiumAdmin' },
    { value: 'delegated_technician', labelKey: 'admin.profile.roleDelegatedTechnician' },
];

const AdminProfile = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        admin_sub_role: '',
        vat_number: '',
        address: '',
        city: '',
        province: '',
        order_college: '',
        order_province: '',
        order_number: '',
    });
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getProfile();
            setProfileData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                admin_sub_role: data.admin_sub_role || '',
                vat_number: data.vat_number || '',
                address: data.address || '',
                city: data.city || '',
                province: data.province || '',
                order_college: data.order_college || '',
                order_province: data.order_province || '',
                order_number: data.order_number || '',
            });
            setError(null);
        } catch (err) {
            console.error("Failed to load profile", err);
            setError(t('admin.profile.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const missing = [];

        // All admin users: personal info required
        if (!profileData.name) missing.push(t('admin.profile.name'));
        if (!profileData.phone) missing.push(t('admin.profile.phone'));

        // Admin-specific professional fields (skip for owners)
        if (user?.role !== 'owner') {
            if (!profileData.admin_sub_role) missing.push(t('admin.profile.roleLabel'));
            if (!profileData.vat_number || profileData.vat_number.length !== 11) missing.push(t('admin.profile.vatNumber'));
            if (!profileData.address) missing.push(t('admin.profile.studioSection'));
            if (!profileData.city) missing.push(t('admin.profile.placeholders.studioCity'));
            if (!profileData.province) missing.push(t('admin.profile.placeholders.studioProvince'));

            if (profileData.admin_sub_role === 'delegated_technician') {
                if (!profileData.order_college) missing.push(t('auth.orderCollege'));
                if (!profileData.order_province) missing.push(t('auth.orderProvince'));
                if (!profileData.order_number) missing.push(t('auth.orderNumber'));
            }
        }

        if (missing.length) {
            setError(t('admin.profile.missingRequired', { fields: missing.join(', ') }));
            return;
        }
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);
            // Send only fields the backend accepts for profile update (no email)
            const payload = {
                name: profileData.name || '',
                phone: profileData.phone || '',
                admin_sub_role: profileData.admin_sub_role || '',
                vat_number: profileData.vat_number || '',
                address: profileData.address || '',
                city: profileData.city || '',
                province: profileData.province || '',
                order_college: profileData.order_college || '',
                order_province: profileData.order_province || '',
                order_number: profileData.order_number || '',
            };
            const updated = await BackendApiService.updateProfile(payload);
            setProfileData((prev) => ({
                ...prev,
                name: updated.name ?? prev.name,
                phone: updated.phone ?? prev.phone,
                admin_sub_role: updated.admin_sub_role ?? prev.admin_sub_role,
                vat_number: updated.vat_number ?? prev.vat_number,
                address: updated.address ?? prev.address,
                city: updated.city ?? prev.city,
                province: updated.province ?? prev.province,
                order_college: updated.order_college ?? prev.order_college,
                order_province: updated.order_province ?? prev.order_province,
                order_number: updated.order_number ?? prev.order_number,
            }));
            setSuccess(t('admin.profile.updateSuccess'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Failed to update profile", err);
            setError(err.response?.data?.message || t('admin.profile.updateError'));
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleVatChange = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        setProfileData(prev => ({ ...prev, vat_number: digits }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError(t('admin.profile.passwordMismatch'));
            return;
        }
        if (passwordForm.new.length < 8) {
            setPasswordError(t('auth.errors.passwordLength'));
            return;
        }
        try {
            setChangingPassword(true);
            await BackendApiService.changePassword(passwordForm.current, passwordForm.new);
            setPasswordSuccess(t('admin.profile.passwordUpdated'));
            setPasswordForm({ current: '', new: '', confirm: '' });
            setTimeout(() => setPasswordSuccess(null), 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || t('admin.profile.passwordUpdateError'));
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    const effectiveSubRole = user?.admin_sub_role || profileData.admin_sub_role || '';
    const isCondoAdmin = user?.role === 'admin' && effectiveSubRole === 'condominium_admin';
    const isDelegatedTechnician = user?.role === 'admin' && effectiveSubRole === 'delegated_technician';

    const profileTitle =
        isCondoAdmin
            ? t('admin.profile.titleCondominiumAdmin')
            : isDelegatedTechnician
                ? t('admin.profile.titleDelegatedTechnician')
                : t('admin.profile.title');

    const profileSubtitle =
        isCondoAdmin
            ? t('admin.profile.subtitleCondominiumAdmin')
            : isDelegatedTechnician
                ? t('admin.profile.subtitleDelegatedTechnician')
                : t('admin.profile.subtitleCommittente');

    const sectionTitle =
        isCondoAdmin
            ? t('admin.profile.titleCondominiumAdmin')
            : isDelegatedTechnician
                ? t('admin.profile.titleDelegatedTechnician')
                : t('admin.profile.condominiumProfileTitle');

    const requiredMark = <span className="text-red-500">*</span>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{profileTitle}</h2>
                <p className="text-gray-500">{profileSubtitle}</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information – always visible; name + phone required for all roles */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('admin.profile.personalInfo')}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">{t('admin.profile.completeAllRequired')}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                {t('admin.profile.name')} {requiredMark}
                            </label>
                            <Input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder={t('admin.profile.placeholders.name')}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="h-4 w-4 inline mr-1" />
                                {t('admin.profile.email')}
                            </label>
                            <Input type="email" value={profileData.email} disabled className="bg-gray-50 cursor-not-allowed" />
                            <p className="text-xs text-gray-500 mt-1">{t('admin.profile.emailNote')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="h-4 w-4 inline mr-1" />
                                {t('admin.profile.phone')} {requiredMark}
                            </label>
                            <Input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder={t('admin.profile.placeholders.phone')}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Profilo Amm.re Condominio o Tecnico Delegato – only for admin users, not owners */}
                {user?.role !== 'owner' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{sectionTitle}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">{t('admin.profile.completeAllRequired')}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                {t('admin.profile.fullNameLabel')} {requiredMark}
                            </label>
                            <Input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder={t('admin.profile.placeholders.fullName')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.profile.roleLabel')} {requiredMark}
                            </label>
                            <select
                                value={profileData.admin_sub_role ?? ''}
                                onChange={(e) => handleInputChange('admin_sub_role', e.target.value)}
                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">{t('admin.profile.placeholders.selectRole')}</option>
                                <option value="condominium_admin">{t('admin.profile.roleCondominiumAdmin')}</option>
                                <option value="delegated_technician">{t('admin.profile.roleDelegatedTechnician')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="h-4 w-4 inline mr-1" />
                                # {t('admin.profile.vatNumber')} {requiredMark}
                            </label>
                            <Input
                                type="text"
                                value={profileData.vat_number}
                                onChange={(e) => handleVatChange(e.target.value)}
                                placeholder={t('admin.profile.placeholders.vat')}
                                maxLength={11}
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('admin.profile.vatNote')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="h-4 w-4 inline mr-1" />
                                {t('admin.profile.studioSection')} {requiredMark}
                            </label>
                            <div className="space-y-3">
                                <Input
                                    type="text"
                                    value={profileData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder={t('admin.profile.placeholders.studioAddress')}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input
                                        type="text"
                                        value={profileData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        placeholder={t('admin.profile.placeholders.studioCity')}
                                    />
                                    <Input
                                        type="text"
                                        value={profileData.province}
                                        onChange={(e) => handleInputChange('province', e.target.value)}
                                        placeholder={t('admin.profile.placeholders.studioProvince')}
                                    />
                                </div>
                            </div>
                        </div>
                        {profileData.admin_sub_role === 'delegated_technician' && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                                        {t('auth.onlyForDelegatedTechnicians')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.orderCollege')} {requiredMark}</label>
                                            <Input
                                                type="text"
                                                value={profileData.order_college}
                                                onChange={(e) => handleInputChange('order_college', e.target.value)}
                                                placeholder="INGEGNERI/ARCHITETTI/GEOMETRI"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.orderProvince')} {requiredMark}</label>
                                            <Input
                                                type="text"
                                                value={profileData.order_province}
                                                onChange={(e) => handleInputChange('order_province', e.target.value)}
                                                placeholder="LATINA"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">{t('auth.orderNumber')} {requiredMark}</label>
                                            <Input
                                                type="text"
                                                value={profileData.order_number}
                                                onChange={(e) => handleInputChange('order_number', e.target.value)}
                                                placeholder="2153"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-3">
                    <Button type="submit" disabled={saving} className="flex items-center gap-2">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('admin.profile.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {t('admin.profile.saveChanges')}
                            </>
                        )}
                    </Button>
                    <Button type="button" variant="outline" onClick={loadProfile}>
                        {t('admin.profile.cancel')}
                    </Button>
                </div>
            </form>

            {/* Change password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        {t('admin.profile.changePassword')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        {passwordError && (
                            <div className="p-2 text-sm text-red-700 bg-red-50 rounded border border-red-200">{passwordError}</div>
                        )}
                        {passwordSuccess && (
                            <div className="p-2 text-sm text-green-700 bg-green-50 rounded border border-green-200">{passwordSuccess}</div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.currentPassword')}</label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={passwordForm.current}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                    className="pr-10"
                                />
                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.newPassword')}</label>
                            <div className="relative">
                                <Input
                                    type={showNewPw ? 'text' : 'password'}
                                    value={passwordForm.new}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                    placeholder="••••••••"
                                    minLength={8}
                                    required
                                    className="pr-10"
                                />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.confirmNewPassword')}</label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPw ? 'text' : 'password'}
                                    value={passwordForm.confirm}
                                    onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                    className="pr-10"
                                />
                                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={changingPassword}>
                            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t('admin.profile.updatePassword')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminProfile;
