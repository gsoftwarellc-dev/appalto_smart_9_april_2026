import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
    ArrowLeft, User, Mail, Building, Phone, Calendar, Ban, CheckCircle,
    FileText, DollarSign, TrendingUp, Loader2, MapPin, FileCheck, ExternalLink
} from 'lucide-react';
import { formatEuro } from '../../utils/currency';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/Table";
import api from '../../services/backendApi';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await api.getUserProfile(id);
            setProfile(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError(err.response?.data?.message || t('admin.userProfile.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm(t('admin.userProfile.confirmSuspend'))) return;
        try {
            setActionLoading(true);
            await api.suspendUser(id);
            await fetchProfile();
            alert(t('admin.userProfile.suspendSuccess'));
        } catch (err) {
            alert(err.response?.data?.message || t('admin.userProfile.suspendError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async () => {
        try {
            setActionLoading(true);
            await api.activateUser(id);
            await fetchProfile();
            alert(t('admin.userProfile.activateSuccess'));
        } catch (err) {
            alert(err.response?.data?.message || t('admin.userProfile.activateError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!confirm(t('owner.users.confirmVerify'))) return;
        try {
            setActionLoading(true);
            await api.verifyContractor(id);
            await fetchProfile();
            alert(t('owner.users.successVerify'));
        } catch (err) {
            alert(err.response?.data?.message || t('owner.users.errorAction'));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-50 rounded-lg">
                <p>Error: {error}</p>
                <Button variant="outline" onClick={() => navigate('/owner/users')} className="mt-4">
                    {t('admin.userProfile.back')}
                </Button>
            </div>
        );
    }

    const { user, stats, recent_activity, transactions, documents = [] } = profile;
    const isSuspended = user.status === 'suspended';
    const isContractorUnverified = user.role === 'contractor' && user.verified === false;
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '') || 'http://localhost:8000';
    const hasDetailedProfileData = Boolean(
        user.address ||
        user.city ||
        user.vat_number ||
        user.fiscal_code ||
        user.legal_representative ||
        user.bio ||
        user.expertise ||
        user.admin_sub_role
    );
    const showCompanyClientDataCard = user.role === 'admin' || (user.role === 'contractor' && hasDetailedProfileData);

    const getAdminSubRoleLabel = (adminSubRole) => {
        if (adminSubRole === 'condominium_admin') return t('auth.roleCondominiumAdmin');
        if (adminSubRole === 'delegated_technician') return t('auth.roleDelegatedTechnician');
        return t('admin.profile.roleCommittenteOnly');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/owner/users')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('admin.userProfile.title')}</h2>
                        <p className="text-gray-500">{t('admin.userProfile.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isContractorUnverified && (
                        <Button onClick={handleVerify} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('owner.users.verify')}
                        </Button>
                    )}
                    {isSuspended ? (
                        <Button onClick={handleActivate} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('admin.userProfile.activate')}
                        </Button>
                    ) : (
                        <Button onClick={handleSuspend} disabled={actionLoading} variant="destructive">
                            <Ban className="h-4 w-4 mr-2" />
                            {t('admin.userProfile.suspend')}
                        </Button>
                    )}
                </div>
            </div>

            {/* User Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.userProfile.userInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">{t('admin.userProfile.name')}</p>
                                <p className="font-medium">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">{t('admin.userProfile.email')}</p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                        </div>
                        {user.company_name && (
                            <div className="flex items-center gap-3">
                                <Building className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">{t('admin.userProfile.company')}</p>
                                    <p className="font-medium">{user.company_name}</p>
                                </div>
                            </div>
                        )}
                        {user.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">{t('admin.userProfile.phone')}</p>
                                    <p className="font-medium">{user.phone}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">{t('admin.userProfile.memberSince')}</p>
                                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5" />
                            <div>
                                <p className="text-sm text-gray-500">{t('admin.userProfile.status')}</p>
                                <Badge variant={isSuspended ? 'destructive' : 'success'}>
                                    {isSuspended ? t('admin.userProfile.suspended') : t('admin.userProfile.active')}
                                </Badge>
                            </div>
                        </div>
                        {user.role === 'contractor' && (
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5" />
                                <div>
                                    <p className="text-sm text-gray-500">{t('owner.userProfile.verified')}</p>
                                    <Badge variant={user.verified ? 'success' : 'warning'}>
                                        {user.verified ? t('owner.userProfile.verifiedYes') : t('owner.userProfile.verifiedNo')}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Company / Client data (impresa o committente) */}
            {showCompanyClientDataCard && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            {user.role === 'contractor' ? t('owner.userProfile.companyData') : t('owner.userProfile.clientData')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {user.role === 'admin' && (
                                <div>
                                    <p className="text-sm text-gray-500">{t('admin.profile.roleLabel')}</p>
                                    <p className="font-medium">{getAdminSubRoleLabel(user.admin_sub_role)}</p>
                                </div>
                            )}
                            {user.vat_number != null && user.vat_number !== '' && (
                                <div>
                                    <p className="text-sm text-gray-500">{t('contractor.profile.vatNumber')}</p>
                                    <p className="font-medium">{user.vat_number}</p>
                                </div>
                            )}
                            {user.fiscal_code != null && user.fiscal_code !== '' && (
                                <div>
                                    <p className="text-sm text-gray-500">{t('contractor.profile.fiscalCode')}</p>
                                    <p className="font-medium">{user.fiscal_code}</p>
                                </div>
                            )}
                            {user.legal_representative != null && user.legal_representative !== '' && (
                                <div>
                                    <p className="text-sm text-gray-500">{t('contractor.profile.legalRep')}</p>
                                    <p className="font-medium">{user.legal_representative}</p>
                                </div>
                            )}
                            {user.address != null && user.address !== '' && (
                                <div className="md:col-span-2 flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">{t('contractor.profile.headquarters')}</p>
                                        <p className="font-medium">{[user.address, user.city, user.province].filter(Boolean).join(', ')}</p>
                                    </div>
                                </div>
                            )}
                            {user.role === 'contractor' && user.bio != null && user.bio !== '' && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">{t('contractor.profile.aboutUs')}</p>
                                    <p className="text-sm font-medium whitespace-pre-wrap">{user.bio}</p>
                                </div>
                            )}
                            {user.role === 'contractor' && user.expertise != null && user.expertise !== '' && (
                                <div>
                                    <p className="text-sm text-gray-500">{t('contractor.profile.expertise')}</p>
                                    <p className="font-medium">{user.expertise}</p>
                                </div>
                            )}
                            {user.role === 'admin' && user.admin_sub_role === 'delegated_technician' && (user.order_college || user.order_number) && (
                                <>
                                    {user.order_college && <div><p className="text-sm text-gray-500">{t('auth.orderCollege')}</p><p className="font-medium">{user.order_college}</p></div>}
                                    {user.order_province && <div><p className="text-sm text-gray-500">{t('auth.orderProvince')}</p><p className="font-medium">{user.order_province}</p></div>}
                                    {user.order_number && <div><p className="text-sm text-gray-500">{t('auth.orderNumber')}</p><p className="font-medium">{user.order_number}</p></div>}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documenti per la verifica (solo per impresa appaltatrice): visura camerale obbligatoria + allegati facoltativi */}
            {user.role === 'contractor' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('owner.userProfile.documentsVerification')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Visura camerale (obbligatoria) */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('owner.userProfile.visuraCameraleRequired')}</h4>
                            {(() => {
                                const visura = (documents || []).find((d) => d.document_type === 'visura_camerale');
                                if (visura) {
                                    const docUrl = visura.url ? `${backendBase}${visura.url.startsWith('/') ? '' : '/'}${visura.url}` : `${backendBase}/storage/${visura.file_path}`;
                                    return (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <FileCheck className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{visura.file_name}</p>
                                                </div>
                                            </div>
                                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                <ExternalLink className="h-4 w-4" /> {t('owner.userProfile.viewDownload')}
                                            </a>
                                        </div>
                                    );
                                }
                                return (
                                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                        {t('owner.userProfile.visuraNotUploaded')}
                                    </p>
                                );
                            })()}
                        </div>
                        {/* Allegati facoltativi */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">{t('owner.userProfile.optionalAttachments')}</h4>
                            {(() => {
                                const optional = (documents || []).filter((d) => d.document_type !== 'visura_camerale');
                                if (optional.length === 0) {
                                    return (
                                        <p className="text-sm text-gray-500 italic py-2">{t('owner.userProfile.noOptionalAttachments')}</p>
                                    );
                                }
                                return (
                                    <div className="space-y-2">
                                        {optional.map((doc) => {
                                            const docUrl = doc.url ? `${backendBase}${doc.url.startsWith('/') ? '' : '/'}${doc.url}` : `${backendBase}/storage/${doc.file_path}`;
                                            const label = doc.document_type === 'presentation' ? t('owner.userProfile.presentation') : doc.file_name;
                                            return (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                        <p className="font-medium text-gray-900">{label}</p>
                                                        {doc.document_type !== 'presentation' && <span className="text-xs text-gray-500">({doc.file_name})</span>}
                                                    </div>
                                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        <ExternalLink className="h-4 w-4" /> {t('owner.userProfile.viewDownload')}
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {user.role === 'admin' ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.totalTenders')}</CardTitle>
                                <FileText className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_tenders || 0}</div>
                                <p className="text-xs text-gray-500">{stats.active_tenders || 0} {t('admin.userProfile.stats.activeSuffix')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.awardedTenders')}</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.awarded_tenders || 0}</div>
                            </CardContent>
                        </Card>
                    </>
                ) : user.role === 'contractor' ? (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.totalBids')}</CardTitle>
                                <FileText className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_bids || 0}</div>
                                <p className="text-xs text-gray-500">{stats.pending_bids || 0} {t('admin.userProfile.stats.pendingSuffix')}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.wonBids')}</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.won_bids || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.credits')}</CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.credits_balance || 0}</div>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('admin.userProfile.stats.totalSpent')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEuro(stats.total_spent || 0)}</div>
                        <p className="text-xs text-gray-500">{stats.total_transactions || 0} {t('admin.userProfile.stats.txnSuffix')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            {recent_activity && recent_activity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('admin.userProfile.recentActivity')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.userProfile.table.title')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.type')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.status')}</TableHead>
                                    {user.role === 'contractor' && <TableHead>{t('admin.userProfile.table.amount')}</TableHead>}
                                    <TableHead>{t('admin.userProfile.table.date')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recent_activity.map((activity) => (
                                    <TableRow key={`${activity.type}-${activity.id}`}>
                                        <TableCell className="font-medium">{activity.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{activity.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{activity.status}</Badge>
                                        </TableCell>
                                        {user.role === 'contractor' && (
                                            <TableCell>{formatEuro(activity.amount || 0)}</TableCell>
                                        )}
                                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Transaction History */}
            {transactions && transactions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('admin.userProfile.txnHistory')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.userProfile.table.id')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.type')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.description')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.amount')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.status')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.date')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="font-mono text-xs">#{txn.id}</TableCell>
                                        <TableCell>{txn.type}</TableCell>
                                        <TableCell className="max-w-xs truncate">{txn.description}</TableCell>
                                        <TableCell className="font-medium">{formatEuro(txn.cash_amount || 0)}</TableCell>
                                        <TableCell>
                                            <Badge variant={txn.status === 'Completed' ? 'success' : 'warning'}>
                                                {txn.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default UserProfile;
