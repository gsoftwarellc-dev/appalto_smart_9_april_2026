import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Search, Loader2, Eye, Edit, FileText, MapPin, Calendar, Euro, Clock } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 5) return 'just now posted';
    if (diffSec < 60) return `${diffSec} sec ago posted`;
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago posted`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago posted`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago posted`;
    if (diffWeek < 5) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago posted`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago posted`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago posted`;
};

const TendersList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenders, setTenders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        loadTenders();
    }, []);

    const loadTenders = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getTenders({});
            setTenders(data || []);
            setError(null);
        } catch (error) {
            console.error("Failed to load tenders", error);
            setError("Failed to load tenders. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'warning';
            case 'closed': return 'secondary';
            case 'awarded': return 'success';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'published': return t('admin.tendersList.statusPublished');
            case 'draft': return t('admin.tendersList.statusDraft');
            case 'closed': return t('admin.tendersList.statusClosed');
            case 'awarded': return t('admin.tendersList.statusAwarded');
            default: return status;
        }
    };

    const formatBudgetRange = (value) => {
        if (value === undefined || value === null || value === '') return 'N/A';
        const str = String(value).trim();
        if (str === '0-50000') return '€0 – €50.000';
        if (str === '50000-100000') return '€50.000 – €100.000';
        if (str === '100000-250000') return '€100.000 – €250.000';
        if (str === '250000+') return `${t('contractor.tenders.moreThan')} €250.000`;

        const num = parseFloat(value);
        if (!isNaN(num)) {
            if (num <= 50000) return '€0 – €50.000';
            if (num <= 100000) return '€50.000 – €100.000';
            if (num <= 250000) return '€100.000 – €250.000';
            return `${t('contractor.tenders.moreThan')} €250.000`;
        }
        return value;
    };

    const filteredTenders = tenders
        .filter(tender => {
            const matchesSearch =
                tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tender.location?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || tender.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateB - dateA;
        });

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    if (error) return (
        <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600">Error</h3>
            <p className="text-gray-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadTenders}>Retry</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('admin.tendersList.title')}</h2>
                    <p className="text-gray-500">{t('admin.tendersList.subtitle')}</p>
                </div>
                <Link to="/admin/create-tender">
                    <Button className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('admin.createTender')}
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={t('admin.list.searchPlaceholder')}
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="All">{t('admin.tendersList.allStatus')}</option>
                        <option value="draft">{t('admin.tendersList.statusDraft')}</option>
                        <option value="published">{t('admin.tendersList.statusPublished')}</option>
                        <option value="closed">{t('admin.tendersList.statusClosed')}</option>
                        <option value="awarded">{t('admin.tendersList.statusAwarded')}</option>
                    </select>
                </div>
            </div>

            {/* Tenders Grid */}
            <div className="grid gap-6">
                {filteredTenders.map((tender) => {
                    const basePath = user?.role === 'owner' ? '/owner' : '/admin';
                    const canEdit = user?.role === 'admin' && tender.status === 'draft';
                    return (
                    <Card
                        key={tender.id}
                        className="relative group hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden bg-white ring-1 ring-gray-50/50 cursor-pointer"
                        onClick={() => navigate(`${basePath}/tenders/${tender.id}`)}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {tender.title}
                                        </h3>
                                        {tender.status === 'published' ? (
                                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                </span>
                                                <span className="text-xs font-semibold uppercase tracking-wide">{getStatusLabel(tender.status)}</span>
                                            </div>
                                        ) : (
                                            <Badge variant={getStatusVariant(tender.status)} className="px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                                                {getStatusLabel(tender.status)}
                                            </Badge>
                                        )}
                                    </div>

                                    {tender.description && (
                                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 max-w-3xl">
                                            {tender.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-6 pt-3 text-sm border-t border-gray-50 mt-4">
                                        {tender.location && (
                                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium text-gray-700">{tender.location}</span>
                                            </div>
                                        )}
                                        {tender.deadline && (
                                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                <span className="font-medium text-gray-700">{new Date(tender.deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {tender.budget && (
                                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                                <Euro className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-gray-900 tracking-tight text-base">
                                                    {formatBudgetRange(tender.budget)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors ml-auto md:ml-0">
                                            <FileText className="h-4 w-4 text-purple-500" />
                                            <span className="font-medium text-gray-700">{tender.bids_count || 0} {t('admin.tendersList.bids')}</span>
                                        </div>
                                        {tender.created_at && (
                                            <div className="flex items-center gap-2 text-gray-500 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-100">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                <span className="font-medium text-amber-700 text-xs">{timeAgo(tender.created_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-3 w-full md:w-auto shrink-0 min-w-[140px]">
                                    <Button
                                        className="w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm transition-all duration-300 font-medium group/btn h-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`${basePath}/tenders/${tender.id}`);
                                        }}
                                    >
                                        {t('admin.list.view')}
                                        <Eye className="ml-2 h-4 w-4 transition-transform group-hover/btn:scale-110" />
                                    </Button>

                                    {canEdit && (
                                        <Link
                                            to={`/admin/edit-tender/${tender.id}`}
                                            className="block"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-10 border border-transparent hover:border-gray-200">
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('admin.tendersList.edit')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )})}
            </div>

            {filteredTenders.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.tendersList.noTenders')}</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm || statusFilter !== 'All'
                            ? t('admin.tendersList.tryAdjusting')
                            : t('admin.tendersList.getStarted')}
                    </p>
                    {!searchTerm && statusFilter === 'All' && (
                        <Link to="/admin/create-tender">
                            <Button>{t('admin.createTender')}</Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default TendersList;
