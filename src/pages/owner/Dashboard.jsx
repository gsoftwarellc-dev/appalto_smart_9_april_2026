import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DollarSign, Shield, Users, Loader2 } from 'lucide-react';
import { formatEuro } from '../../utils/currency';
import RevenueDashboard from './RevenueDashboard';
import api from '../../services/backendApi';

const Dashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await api.getOwnerDashboardStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch dashboard stats", err);
            setError(t('admin.dashboard.errorLoad'));
        } finally {
            setLoading(false);
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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('owner.dashboard.title')}</h2>
                    <p className="text-gray-500">{t('owner.dashboard.subtitle')}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.dashboard.totalRevenue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEuro(stats?.total_revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% {t('owner.dashboard.lastMonth')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.dashboard.totalContractors')}</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_contractors || 0}</div>
                        <p className="text-xs text-muted-foreground">+{stats?.new_contractors_this_week || 0} {t('owner.dashboard.newThisWeek')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('owner.dashboard.activeTenders')}</CardTitle>
                        <Shield className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.active_tenders || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.waiting_approval_tenders || 0} {t('owner.dashboard.waitingApproval')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-6 border-t border-gray-200">
                <RevenueDashboard embedded={true} />
            </div>
        </div>
    );
};

export default Dashboard;
