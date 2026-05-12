import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { FileText, Award, Clock, Bell, CheckCircle, Calendar, Loader2, ArrowRight, MapPin, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import BackendApiService from '../../services/backendApi';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';

const Dashboard = () => {
    const { t } = useTranslation();
    const [greeting, setGreeting] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        stats: { total_bids: 0, active_bids: 0, awarded_bids: 0, win_rate: 0 },
        chart_data: { won: 0, pending: 0, lost: 0, draft: 0 },
        upcoming_deadlines: [],
        recent_activity: [],
        recommended_tenders: []
    });

    useEffect(() => {
        const hour = parseInt(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hour12: false, timeZone: 'Europe/Rome' }).format(new Date()), 10);
        if (hour < 12) setGreeting(t('contractor.dashboard.goodMorning'));
        else if (hour < 18) setGreeting(t('contractor.dashboard.goodAfternoon'));
        else setGreeting(t('contractor.dashboard.goodEvening'));

        loadDashboardData();
    }, [t]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const dashboardData = await BackendApiService.getContractorDashboardStats();
            // Ensure we have valid objects even if backend returns partial data
            setData({
                stats: dashboardData?.stats || { total_bids: 0, active_bids: 0, awarded_bids: 0, win_rate: 0 },
                chart_data: dashboardData?.chart_data || { won: 0, pending: 0, lost: 0, draft: 0 },
                upcoming_deadlines: Array.isArray(dashboardData?.upcoming_deadlines) ? dashboardData.upcoming_deadlines : [],
                recent_activity: Array.isArray(dashboardData?.recent_activity) ? dashboardData.recent_activity : [],
                recommended_tenders: Array.isArray(dashboardData?.recommended_tenders) ? dashboardData.recommended_tenders : []
            });
            setError(null);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
            setError("Failed to load dashboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        {
            title: t('contractor.dashboard.totalTenders'),
            value: data.stats?.total_bids || 0,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: t('contractor.dashboard.activeTenders'),
            value: data.stats?.active_bids || 0,
            icon: Clock,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            title: t('contractor.dashboard.bidsSubmitted'),
            value: data.chart_data?.pending || 0,
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: t('contractor.dashboard.awardedLost'),
            value: `${data.stats?.awarded_bids || 0} / ${data.chart_data?.lost || 0}`,
            icon: Award,
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
    ];

    const pieData = [
        { name: t('contractor.dashboard.won'), value: data.chart_data?.won || 0, color: '#16a34a' },
        { name: t('contractor.dashboard.pending'), value: data.chart_data?.pending || 0, color: '#eab308' },
        { name: t('contractor.dashboard.notSelected'), value: data.chart_data?.lost || 0, color: '#ef4444' },
        { name: 'Draft', value: data.chart_data?.draft || 0, color: '#94a3b8' },
    ].filter(d => d.value > 0);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 20; // Push label out
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                {name} ({value})
            </text>
        );
    };

    const formatBudget = (val) => {
        if (!val) return 'N/A';
        const str = String(val).trim();
        if (str === '0-50000') return '€0 – €50.000';
        if (str === '50000-100000') return '€50.000 – €100.000';
        if (str === '100000-250000') return '€100.000 – €250.000';
        if (str === '250000+') return `${t('contractor.tenders.moreThan')} €250.000`;
        const num = parseFloat(str);
        if (!Number.isNaN(num)) {
            if (num <= 50000) return '€0 – €50.000';
            if (num <= 100000) return '€50.000 – €100.000';
            if (num <= 250000) return '€100.000 – €250.000';
            return `${t('contractor.tenders.moreThan')} €250.000`;
        }
        return val;
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading Dashboard...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100 mt-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <FileText className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Unable to load dashboard</h3>
            <p className="text-gray-500 mt-1 mb-6">{error}</p>
            <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        {greeting}, <span className="text-blue-600">{BackendApiService.getCurrentUserSync()?.company_name || BackendApiService.getCurrentUserSync()?.name}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t('contractor.dashboard.welcome')}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {statsCards.map((stat, index) => (
                    <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                {stat.trend ? (
                                    stat.trend.includes('+') ? (
                                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <TrendingUp className="h-3 w-3 mr-1" /> {stat.trend.split(' ')[0]}
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                            {stat.trend}
                                        </span>
                                    )
                                ) : null}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</h3>
                                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bids Analysis - Full Width */}
            <Card className="h-full border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        {t('contractor.dashboard.bidsAnalysis')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] relative">
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cornerRadius={6}
                                        label={renderCustomizedLabel}
                                        labelLine={true}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="text-3xl font-bold text-gray-900">{data.stats?.total_bids || 0}</span>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <FileText className="h-12 w-12 mb-2 opacity-20" />
                            <p>No bid data available yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recommended Section - 4 cols */}
            <Card className="border-none shadow-sm flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-500" />
                        {t('contractor.dashboard.recommendedTenders')}
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Link to="/contractor/tenders" className="flex items-center gap-1">
                            {t('contractor.dashboard.viewMarket')} <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="h-full">
                    <div className="grid gap-4 md:grid-cols-3">
                        {data.recommended_tenders?.length > 0 ? (
                            data.recommended_tenders.map((tender) => (
                                <Link key={tender.id} to={`/contractor/tenders/${tender.id}`}>
                                    <div className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col h-full justify-between">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mt-1 group-hover:scale-110 transition-transform flex-shrink-0">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">{tender.title}</h4>
                                                <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {tender.location}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(tender.deadline).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                                            <div className="text-xs">
                                                <span className="text-gray-400 block">{t('contractor.dashboard.budget')}</span>
                                                <span className="font-bold text-gray-900">{formatBudget(tender.budget)}</span>
                                            </div>
                                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-bold">
                                                {t('contractor.dashboard.participate')} &rarr;
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="md:col-span-3 h-[200px] flex flex-col items-center justify-center text-center space-y-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Clock className="h-10 w-10 text-gray-300" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-900">No specific recommendations</p>
                                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Complete your profile to get matched with relevant tenders.</p>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <Link to="/contractor/tenders">Browse All Tenders</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default Dashboard;
