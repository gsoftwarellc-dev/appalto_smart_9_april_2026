import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { User, MapPin, Mail, Eye, X, CheckCircle, Star, Loader2, AlertCircle, FileText, Upload, Lock } from 'lucide-react';
import BackendApiService from '../../services/backendApi';

const getBackendBaseUrl = () => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return api.replace(/\/api\/?$/, '') || 'http://localhost:8000';
};

const MAX_DOCUMENT_SIZE_MB = 10;
const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

const Profile = () => {
    const { t } = useTranslation();
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [uploadingDocumentType, setUploadingDocumentType] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const chamberInputRef = useRef(null);
    const presentationInputRef = useRef(null);

    // Password change
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    // Profile Data State
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        company_name: "",
        vat_number: "",
        fiscal_code: "",
        address: "",
        city: "",
        province: "",
        phone: "",
        legal_representative: "",
        bio: "",
        expertise: "",
        avatar_url: null,
        documents: []
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getProfile();
            setProfile(data);
        } catch (error) {
            console.error("Failed to load profile", error);
            setError(t('contractor.profile.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setError(null);
            try {
                // Optimistic update for immediate feedback
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfile(prev => ({ ...prev, avatar_url: reader.result }));
                };
                reader.readAsDataURL(file);

                await BackendApiService.uploadAvatar(file);
                // Refresh to ensure we have the correct URL from backend
                loadProfile();
            } catch (error) {
                console.error("Avatar upload failed", error);
                setError(error.response?.data?.message || t('contractor.profile.avatarError'));
            }
        }
    };

    const getDocumentInputRef = (type) => {
        return type === 'visura_camerale' ? chamberInputRef : presentationInputRef;
    };

    const triggerDocumentPicker = (type) => {
        getDocumentInputRef(type).current?.click();
    };

    const isPdfFile = (file) => {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    };

    const handleFileChange = async (e, type) => {
        const input = e.currentTarget;
        const file = input.files?.[0];
        if (!file) return;

        setError(null);
        setUploadSuccess(null);

        if (!isPdfFile(file)) {
            setError(t('contractor.profile.invalidPdf'));
            input.value = '';
            return;
        }

        if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
            setError(t('contractor.profile.fileTooLarge', { size: MAX_DOCUMENT_SIZE_MB }));
            input.value = '';
            return;
        }

        try {
            setUploadingDocumentType(type);
            await BackendApiService.uploadProfileDocument(file, type);
            await loadProfile();
            setUploadSuccess(type);
        } catch (error) {
            console.error("Document upload failed", error);
            const message = error.response?.data?.message || t('contractor.profile.docError');
            const validationErrors = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(', ')
                : null;
            setError(validationErrors ? `${message}: ${validationErrors}` : message);
        } finally {
            setUploadingDocumentType(null);
            input.value = '';
        }
    };

    const handleSave = async () => {
        setError(null);
        try {
            setSaving(true);
            const updatedProfile = await BackendApiService.updateProfile({
                name: profile.name,
                company_name: profile.company_name,
                vat_number: profile.vat_number,
                fiscal_code: profile.fiscal_code,
                address: profile.address,
                city: profile.city,
                province: profile.province,
                phone: profile.phone,
                legal_representative: profile.legal_representative,
                bio: profile.bio,
                expertise: profile.expertise,
            });

            // Update global auth context so Header reflects changes immediately
            if (updateUser) {
                const currentUser = JSON.parse(localStorage.getItem('appalto_user') || '{}');
                updateUser({ ...currentUser, ...updatedProfile });
            }

            setIsEditing(false);
        } catch (err) {
            console.error("Save failed", err);
            const msg = err.response?.data?.message || t('contractor.profile.saveError');
            if (err.response?.data?.errors) {
                const errors = Object.values(err.response.data.errors).flat().join(", ");
                setError(`${msg}: ${errors}`);
            } else {
                setError(msg);
            }
        } finally {
            setSaving(false);
        }
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

    const getDocument = (type) => {
        return profile.documents?.find(d => d.document_type === type);
    };

    const getAvatarSrc = (url) => {
        if (!url) return null;
        return url.startsWith('http') || url.startsWith('data:') ? url : `${getBackendBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('contractor.profile.title')}</h2>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" /> {t('contractor.profile.viewPublic')}
                </Button>
            </div>

            {/* Public Profile Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 bg-white shadow-sm z-10"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>

                        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 mb-6 flex justify-between items-end">
                                <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                                    {profile.avatar_url ? (
                                        <img
                                            src={getAvatarSrc(profile.avatar_url)}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                            <User className="h-16 w-16 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="mb-2">
                                    {profile.company_name && (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" /> {t('contractor.profile.verifiedCompany')}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {profile.company_name || profile.name}
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                        </div>
                                    </h2>
                                    <p className="text-gray-500 font-medium">{profile.expertise || 'General Construction'}</p>
                                    <p className="text-gray-500 flex items-center gap-2 mt-1 text-sm">
                                        <MapPin className="h-3.5 w-3.5" /> {profile.city}, {profile.province}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <h3 className="font-semibold mb-2">{t('contractor.profile.aboutUs')}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {profile.bio || t('contractor.profile.noBio')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Card */}
                <Card className="lg:col-span-1 h-fit shadow-sm border-gray-200">
                    <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                                {profile.avatar_url ? (
                                    <img
                                        src={getAvatarSrc(profile.avatar_url)}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-50">
                                        <User className="h-12 w-12 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <span className="text-xs font-medium flex items-center"><Upload className="w-3 h-3 mr-1" /> {t('contractor.profile.changeAvatar')}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                            <p className="text-sm font-medium text-gray-600">{profile.company_name}</p>
                            <p className="text-xs text-gray-500">{profile.expertise || 'Construction & Renovation'}</p>
                        </div>

                        {/* Contact info removed */}
                    </CardContent>
                </Card>

                {/* Right Column: Details Form */}
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
                        <div>
                            <CardTitle className="text-xl font-bold">{t('contractor.profile.details')}</CardTitle>
                        </div>
                        <Button
                            variant={isEditing ? "default" : "outline"}
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                            disabled={saving}
                            className={isEditing ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isEditing ? t('contractor.profile.save') : t('contractor.profile.edit')}
                        </Button>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start">
                                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {uploadSuccess && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex items-start">
                                <CheckCircle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
                                <span>{t('contractor.profile.uploadSuccess')}</span>
                            </div>
                        )}

                        <section className="space-y-4">
                            <h3 className="font-bold text-gray-900 text-base">{t('contractor.profile.mandatoryFields')}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.companyName')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.company_name || ''}
                                        placeholder="Company Name S.r.l."
                                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.vatNumber')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.vat_number || ''}
                                        placeholder="IT12345678901"
                                        onChange={(e) => setProfile({ ...profile, vat_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.headquarters')}</label>
                                <Input
                                    disabled={!isEditing}
                                    value={profile.address || ''}
                                    placeholder="Via Roma 10"
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.city')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.city || ''}
                                        placeholder="Rome"
                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.province')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.province || ''}
                                        placeholder="RM"
                                        maxLength={2}
                                        onChange={(e) => setProfile({ ...profile, province: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.email')}</label>
                                    <Input
                                        disabled
                                        value={profile.email || ''}
                                        className="bg-gray-50 text-gray-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.phone')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.phone || ''}
                                        placeholder="+39 333 1234567"
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.legalRep')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.legal_representative || ''}
                                        placeholder="Mario Rossi"
                                        onChange={(e) => setProfile({ ...profile, legal_representative: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.fiscalCode')}</label>
                                    <Input
                                        disabled={!isEditing}
                                        value={profile.fiscal_code || ''}
                                        placeholder="RSSMRA80A01H501U"
                                        onChange={(e) => setProfile({ ...profile, fiscal_code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-gray-100 pt-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.uploadChamber')}</label>
                                <input
                                    ref={chamberInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'visura_camerale')}
                                />

                                {getDocument('visura_camerale') ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                    {getDocument('visura_camerale').file_name}
                                                </p>
                                                <a
                                                    href={`${getBackendBaseUrl()}/storage/${getDocument('visura_camerale').file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline flex items-center mt-0.5"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> {t('contractor.profile.viewDoc')}
                                                </a>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => triggerDocumentPicker('visura_camerale')}
                                            disabled={uploadingDocumentType === 'visura_camerale'}
                                        >
                                            {uploadingDocumentType === 'visura_camerale' ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {uploadingDocumentType === 'visura_camerale' ? t('contractor.profile.uploading') : t('contractor.profile.replace')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center border-gray-300 bg-gray-50">
                                        <FileText className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500 mb-2">{t('contractor.profile.noDoc')}</p>
                                        <p className="text-xs text-gray-500 mb-4">{t('contractor.profile.pdfHelp')}</p>
                                        <Button
                                            type="button"
                                            onClick={() => triggerDocumentPicker('visura_camerale')}
                                            disabled={uploadingDocumentType === 'visura_camerale'}
                                        >
                                            {uploadingDocumentType === 'visura_camerale' ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {uploadingDocumentType === 'visura_camerale' ? t('contractor.profile.uploading') : t('contractor.profile.uploadPdf')}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">{t('contractor.profile.uploadBrochure')}</label>
                                <input
                                    ref={presentationInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, 'presentation')}
                                />

                                {getDocument('presentation') ? (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                    {getDocument('presentation').file_name}
                                                </p>
                                                <a
                                                    href={`${getBackendBaseUrl()}/storage/${getDocument('presentation').file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline flex items-center mt-0.5"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> {t('contractor.profile.viewDoc')}
                                                </a>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => triggerDocumentPicker('presentation')}
                                            disabled={uploadingDocumentType === 'presentation'}
                                        >
                                            {uploadingDocumentType === 'presentation' ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {uploadingDocumentType === 'presentation' ? t('contractor.profile.uploading') : t('contractor.profile.replace')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center border-gray-300 bg-gray-50">
                                        <FileText className="h-10 w-10 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500 mb-2">{t('contractor.profile.noFile')}</p>
                                        <p className="text-xs text-gray-500 mb-4">{t('contractor.profile.pdfHelp')}</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => triggerDocumentPicker('presentation')}
                                            disabled={uploadingDocumentType === 'presentation'}
                                        >
                                            {uploadingDocumentType === 'presentation' ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            {uploadingDocumentType === 'presentation' ? t('contractor.profile.uploading') : t('contractor.profile.uploadPdf')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Change password - same column as Details */}
                        <div className="border-t border-gray-100 pt-6 space-y-4">
                            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                {t('admin.profile.changePassword')}
                            </h3>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                {passwordError && (
                                    <div className="p-2 text-sm text-red-700 bg-red-50 rounded border border-red-200">{passwordError}</div>
                                )}
                                {passwordSuccess && (
                                    <div className="p-2 text-sm text-green-700 bg-green-50 rounded border border-green-200">{passwordSuccess}</div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.currentPassword')}</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.newPassword')}</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.profile.confirmNewPassword')}</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={changingPassword}>
                                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {t('admin.profile.updatePassword')}
                                </Button>
                            </form>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
