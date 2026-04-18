import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Search, FileCheck, ChevronRight, ArrowLeft, Download, Eye, Loader2 } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { formatEuro } from '../../utils/currency';
import { getContractorDisplayName } from '../../utils/contractorDisplay';

const BidManagement = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [tenders, setTenders] = useState([]);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTenders();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadBidsForTender(selectedProject.id);
        }
    }, [selectedProject]);

    const loadTenders = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getTenders({});
            setTenders(data || []);
            setError(null);
        } catch (error) {
            console.error("Failed to load tenders", error);
            setError(t('admin.bidManagement.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const loadBidsForTender = async (tenderId) => {
        try {
            setLoading(true);
            const data = await BackendApiService.getTenderBids(tenderId);
            setBids(data || []);
            setError(null);
        } catch (error) {
            console.error("Failed to load bids", error);
            setError(t('admin.bidManagement.loadBidsError'));
            setBids([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTenders = tenders.filter(tender =>
        tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tender.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusLabel = (status) => {
        const statusMap = {
            'submitted': t('admin.bidManagement.status.submitted'),
            'under_review': t('admin.bidManagement.status.underReview'),
            'awarded': t('admin.bidManagement.status.awarded'),
            'rejected': t('admin.bidManagement.status.rejected'),
            'pending': t('admin.bidManagement.status.pending')
        };
        return statusMap[status] || status;
    };

    const getTenderStatusLabel = (status) => {
        const statusMap = {
            'draft': t('admin.tendersList.statusDraft'),
            'published': t('admin.tendersList.statusPublished'),
            'closed': t('admin.tendersList.statusClosed'),
            'awarded': t('admin.bidManagement.tenderStatus.awarded')
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted':
            case 'pending':
                return 'bg-blue-50 text-blue-700';
            case 'under_review':
                return 'bg-yellow-50 text-yellow-700';
            case 'awarded':
                return 'bg-green-50 text-green-700';
            case 'rejected':
                return 'bg-red-50 text-red-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    const getTenderStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-50 text-green-700';
            case 'draft':
                return 'bg-yellow-50 text-yellow-700';
            case 'awarded':
                return 'bg-blue-50 text-blue-700';
            case 'closed':
                return 'bg-gray-50 text-gray-700';
            default:
                return 'bg-gray-50 text-gray-700';
        }
    };

    if (loading && !selectedProject) {
        return (
            <div className="p-8 text-center flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // If no project is selected, show project list
    if (!selectedProject) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('admin.bidManagement.title')}</h2>
                    <p className="text-gray-500">{t('admin.bidManagement.subtitle')}</p>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder={t('admin.bidManagement.searchPlaceholder')}
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Projects Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTenders.map((tender) => (
                        <Card
                            key={tender.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedProject(tender)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{tender.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2">📍 {tender.location}</p>
                                        <Badge className={getTenderStatusColor(tender.status)}>
                                            {getTenderStatusLabel(tender.status)}
                                        </Badge>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-600">{t('admin.bidManagement.totalBids')}:</span>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">{tender.bids_count || 0}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{t('tender.details.deadline')}: {tender.deadline}</p>
                                </div>

                                <Button variant="outline" className="w-full mt-4" size="sm">
                                    {t('admin.bidManagement.viewBids')}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredTenders.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <h3 className="text-lg font-medium text-gray-900">{t('admin.bidManagement.noProjects')}</h3>
                        <p className="text-gray-500">{t('admin.bidManagement.noProjectsDesc')}</p>
                    </div>
                )}
            </div>
        );
    }

    // If project is selected, show bids for that project
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProject(null)}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> {t('admin.bidManagement.backToProjects')}
                </Button>
            </div>

            <div>
                <h2 className="text-3xl font-bold tracking-tight">{selectedProject.title}</h2>
                <p className="text-gray-500">{t('admin.bidManagement.allBids')} ({bids.length})</p>
            </div>

            {loading && (
                <div className="p-8 text-center flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {!loading && (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.bidManagement.table.contractor')}</TableHead>
                                    <TableHead>{t('admin.bidManagement.table.amount')}</TableHead>
                                    <TableHead>{t('admin.bidManagement.table.date')}</TableHead>
                                    <TableHead>{t('admin.bidManagement.table.status')}</TableHead>
                                    <TableHead className="text-right">{t('admin.bidManagement.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bids.map((bid) => (
                                    <TableRow key={bid.id}>
                                        <TableCell className="font-medium">{getContractorDisplayName(bid)}</TableCell>
                                        <TableCell className="font-semibold text-gray-900">{formatEuro(bid.total_amount || 0)}</TableCell>
                                        <TableCell>{new Date(bid.created_at || bid.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(bid.status)}>
                                                {getStatusLabel(bid.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/bids/${bid.id}`);
                                                }}>
                                                    <Eye className="h-3 w-3 mr-1" /> {t('admin.bidManagement.table.view')}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {bids.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-gray-900">{t('admin.bidManagement.noBids')}</h3>
                                <p className="text-gray-500">{t('admin.bidManagement.noBidsDesc')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default BidManagement;
