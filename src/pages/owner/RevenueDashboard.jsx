import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DollarSign, TrendingUp, CreditCard, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { formatEuro } from '../../utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/backendApi';
import StripeConfigModal from './components/StripeConfigModal'; // Import the new modal

const RevenueDashboard = ({ embedded = false }) => {
    const { t } = useTranslation();
    const [revenueData, setRevenueData] = useState([]);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [stats, setStats] = useState({
        total_revenue: 0,
        credit_sales: 0,
        success_fees: 0,
        pending_payments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false); // State for modal

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.getOwnerRevenue();
                setRevenueData(data.chart_data || []);
                setTransactionHistory(data.recent_transactions || []);
                if (data.stats) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch revenue data", err);
                setError("Failed to load revenue data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    return (
        <div className="space-y-6">
            {!embedded && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('owner.revenue.title')}</h2>
                        <p className="text-gray-500">{t('owner.revenue.subtitle')}</p>
                    </div>
                    <Button onClick={() => setIsStripeModalOpen(true)} variant="outline" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('owner.revenue.paymentSettings')}
                    </Button>
                </div>
            )}

            <StripeConfigModal
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
            />

            {/* KPI Cards */}
            <div className={`grid gap-4 ${embedded ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                {!embedded && ((
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">{t('owner.revenue.totalRevenueYtd')}</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatEuro(stats.total_revenue || 0)}</div>
                            <div className="flex items-center text-xs text-green-600 mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" /> +0.0% {t('owner.revenue.lastYear')}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">{t('owner.revenue.creditSales')}</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEuro(stats.credit_sales || 0)}</div>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +0.0% {t('owner.dashboard.lastMonth')}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">{t('owner.revenue.successFees')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEuro(stats.success_fees || 0)}</div>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +0.0% {t('owner.dashboard.lastMonth')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('owner.revenue.revenueOverview')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="credits" name={t('owner.revenue.creditSales')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="fees" name={t('owner.revenue.successFees')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('owner.revenue.breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: t('owner.revenue.totalRevenueYtd'), value: parseFloat(stats.total_revenue) || 0, color: '#10b981' },
                                        { name: t('owner.revenue.creditSales'), value: parseFloat(stats.credit_sales) || 0, color: '#3b82f6' },
                                        { name: t('owner.revenue.successFees'), value: parseFloat(stats.success_fees) || 0, color: '#8b5cf6' }
                                    ].filter(item => item.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${formatEuro(value)}`}
                                >
                                    {[
                                        { name: t('owner.revenue.totalRevenueYtd'), value: parseFloat(stats.total_revenue) || 0, color: '#10b981' },
                                        { name: t('owner.revenue.creditSales'), value: parseFloat(stats.credit_sales) || 0, color: '#3b82f6' },
                                        { name: t('owner.revenue.successFees'), value: parseFloat(stats.success_fees) || 0, color: '#8b5cf6' }
                                    ].filter(item => item.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatEuro(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('owner.revenue.recentTransactions')}</CardTitle>
                        <Button variant="outline" size="sm">{t('owner.revenue.viewAll')}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactionHistory.length > 0 ? (
                            transactionHistory.map((txn) => (
                                <div key={txn.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${txn.type === 'Credit Purchase' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{txn.user}</p>
                                            <p className="text-xs text-gray-500">{txn.type} • {txn.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatEuro(txn.amount || 0)}</p>
                                        <p className={`text-xs ${txn.status === 'Completed' ? 'text-green-600' : 'text-amber-600'
                                            }`}>{txn.status}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">{t('owner.revenue.noTransactions')}</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default RevenueDashboard;
