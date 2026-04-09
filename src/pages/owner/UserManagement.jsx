import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Users, AlertTriangle, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/Table";
import api from '../../services/backendApi';

const UserManagement = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'clients', 'contractors', 'owners'
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch users from API
    useEffect(() => {
        fetchUsers();
        fetchStatistics();
    }, [activeTab, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let role;
            if (activeTab === 'contractors') {
                role = 'contractor';
            } else if (activeTab === 'clients') {
                role = 'admin';
            } else if (activeTab === 'owners') {
                role = 'owner';
            }
            // If activeTab is 'all', don't send role parameter to get all users
            const params = {
                ...(role && { role }),
                ...(searchTerm && { search: searchTerm })
            };
            const response = await api.getUsers(params);
            setUsers(response.data || response); // Handle pagination structure if needed
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.getUserStatistics();
            setStatistics(response);
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'verify') {
                await api.verifyContractor(id);
            } else if (action === 'block') {
                await api.updateUserStatus(id, 'suspended');
            } else if (action === 'activate') {
                await api.updateUserStatus(id, 'active');
            }

            // Refresh the user list and statistics
            await fetchUsers();
            await fetchStatistics();

            if (action === 'verify') alert(t('owner.users.successVerify'));
            else if (action === 'block') alert(t('owner.users.successBlock'));
            else if (action === 'activate') alert(t('owner.users.successActivate'));
        } catch (err) {
            console.error(`Error performing ${action}:`, err);
            alert(`${t('owner.users.errorAction')}: ${err.response?.data?.message || 'Unknown error'}`);
        }
    };

    const getUserStatus = (user) => {
        if (user.status === 'suspended') return t('owner.users.statusValues.suspended');
        if (user.verified === false && user.role === 'contractor') return t('owner.users.statusValues.pending');
        return t('owner.users.statusValues.active');
    };

    const getStatusVariant = (status) => {
        if (status === t('owner.users.statusValues.active')) return 'success';
        if (status === t('owner.users.statusValues.pending')) return 'warning';
        return 'destructive';
    };

    const getAdminSubRoleLabel = (adminSubRole) => {
        if (adminSubRole === 'condominium_admin') return t('auth.roleCondominiumAdmin');
        if (adminSubRole === 'delegated_technician') return t('auth.roleDelegatedTechnician');
        return t('admin.profile.roleCommittenteOnly');
    };

    const getUserTypeLabel = (user) => {
        if (user.role === 'admin') return getAdminSubRoleLabel(user.admin_sub_role);
        if (user.role === 'contractor') return user.company_name || t('auth.contractor');
        if (user.role === 'owner') return t('auth.owner');
        return t('common.na');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('owner.users.title')}</h2>
                <p className="text-gray-500">{t('owner.users.subtitle')}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.users.totalUsers')}</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.total_users || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.users.pendingVerifications')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.pending_verifications || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.users.suspendedUsers')}</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.suspended_users || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('owner.users.tabs.all')}
                            </button>
                            <button
                                onClick={() => setActiveTab('clients')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'clients' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('owner.users.clients')}
                            </button>
                            <button
                                onClick={() => setActiveTab('contractors')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'contractors' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('owner.users.contractors')}
                            </button>
                            <button
                                onClick={() => setActiveTab('owners')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'owners' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {t('owner.users.owners')}
                            </button>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder={t('owner.users.searchPlaceholder')}
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>{error}</p>
                            <Button variant="outline" onClick={fetchUsers} className="mt-4">
                                {t('admin.dashboard.retry')}
                            </Button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {t('owner.users.noUsers')}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('owner.users.name')}</TableHead>
                                    <TableHead>{t('admin.userProfile.table.type')}</TableHead>
                                    <TableHead>{t('owner.users.email')}</TableHead>
                                    <TableHead>{t('owner.users.status')}</TableHead>
                                    <TableHead>{activeTab === 'contractors' ? t('owner.users.credits') : t('owner.users.activeTenders')}</TableHead>
                                    <TableHead className="text-right">{t('owner.users.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => {
                                    const status = getUserStatus(user);
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'contractor' && !user.verified && (
                                                        <AlertTriangle className="h-4 w-4 text-amber-500" title={t('owner.users.statusValues.pending')} />
                                                    )}
                                                    {user.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getUserTypeLabel(user)}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(status)}>
                                                    {status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.role === 'contractor' ? (user.credits?.balance ?? '0') : '0'}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/owner/users/${user.id}`)}>
                                                    <Eye className="h-4 w-4 mr-1" /> {t('owner.users.viewProfile')}
                                                </Button>
                                                {(user.role === 'contractor' && !user.verified) && (
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" onClick={() => handleAction(user.id, 'verify')}>
                                                        <CheckCircle className="h-4 w-4 mr-1" /> {t('owner.users.verify')}
                                                    </Button>
                                                )}
                                                {status !== 'Suspended' ? (
                                                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleAction(user.id, 'block')}>
                                                        {t('owner.users.block')}
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => handleAction(user.id, 'activate')}>
                                                        {t('owner.users.activate')}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManagement;
