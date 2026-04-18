
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { ArrowLeft, Download, CheckCircle, XCircle, Loader2, Calendar, MapPin, Building, FileText, User } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { formatEuro } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { getContractorDisplayName, getContractorInitial } from '../../utils/contractorDisplay';

const BidDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [bid, setBid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadBid();
    }, [id]);

    const loadBid = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getBid(id);
            setBid(data);
            setError(null);
        } catch (err) {
            console.error("Failed to load bid details", err);
            setError("Failed to load bid details. It may not exist or you don't have permission.");
        } finally {
            setLoading(false);
        }
    };

    const handleAward = async () => {
        if (!window.confirm(t('admin.bidDetails.confirmAward'))) return;

        try {
            setProcessing(true);
            await BackendApiService.awardBid(bid.id);
            // Reload to show updated status
            await loadBid();
        } catch (err) {
            console.error("Failed to award bid", err);
            setError("Failed to award bid. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> {t('admin.bidDetails.back')}
                </Button>
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    if (!bid) return null;

    const canAwardBid = user?.role === 'admin';

    const getStatusColor = (status) => {
        switch (status) {
            case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'under_review': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'awarded': return 'bg-green-50 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> {t('admin.bidDetails.backToBids')}
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">{t('admin.bidDetails.title')} #{bid.id}</h1>
                <Badge className={getStatusColor(bid.status)}>
                    {bid.status.toUpperCase().replace('_', ' ')}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Bid Info & Items */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tender Summary */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BriefcaseIcon className="h-5 w-5 text-gray-500" />
                                {t('admin.bidDetails.project')}: {bid.tender?.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> {bid.tender?.location}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> {t('admin.bidDetails.deadline')}: {new Date(bid.tender?.deadline).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOQ Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('admin.bidDetails.boqPricing')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('admin.bidDetails.table.item')}</TableHead>
                                        <TableHead className="text-right">{t('admin.bidDetails.table.qty')}</TableHead>
                                        <TableHead className="text-right">{t('admin.bidDetails.table.unitPrice')}</TableHead>
                                        <TableHead className="text-right">{t('admin.bidDetails.table.total')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bid.bid_items?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <p className="font-medium">{item.boq_item?.description}</p>
                                                <span className="text-xs text-gray-500">{item.boq_item?.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-gray-600">
                                                {formatEuro(item.unit_price)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-900">
                                                {formatEuro(item.quantity * item.unit_price)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!bid.bid_items || bid.bid_items.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                {t('admin.bidDetails.noLineItems')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                        <TableCell colSpan={3} className="text-right">{t('admin.bidDetails.table.grandTotal')}:</TableCell>
                                        <TableCell className="text-right text-lg text-blue-700">
                                            {formatEuro(bid.total_amount)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Proposal / Cover Letter */}
                    {bid.proposal && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('admin.bidDetails.proposal')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded border border-gray-100">
                                    {bid.proposal}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Contractor & Actions */}
                <div className="space-y-6">

                    {/* Contractor Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="h-5 w-5 text-gray-500" />
                                {t('admin.bidDetails.contractor')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {getContractorInitial(bid)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{getContractorDisplayName(bid)}</h3>
                                    {bid.contractor?.legal_representative && bid.contractor?.legal_representative !== getContractorDisplayName(bid) && (
                                        <p className="text-sm text-gray-500">{bid.contractor.legal_representative}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm space-y-2 pt-4 border-t border-gray-100">
                                <p className="flex items-center justify-between">
                                    <span className="text-gray-500">{t('admin.bidDetails.submitted')}:</span>
                                    <span className="font-medium">{new Date(bid.created_at).toLocaleDateString()}</span>
                                </p>
                                {/* Add more contractor stats here if available */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature */}
                    {bid.offer_file_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    {t('admin.bidDetails.signature')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {bid.offer_file_name && bid.offer_file_name.endsWith('.png') ? (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                        <img
                                            src={`http://localhost:8000${bid.offer_file_url}`}
                                            alt="Contractor Signature"
                                            className="max-w-full h-auto mx-auto"
                                            style={{ maxHeight: '150px' }}
                                        />
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => window.open(`http://localhost:8000${bid.offer_file_url}`, '_blank')}
                                    >
                                        <Download className="h-4 w-4 mr-3 text-blue-600" />
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900">{bid.offer_file_name || 'Offer Document'}</p>
                                            <p className="text-xs text-gray-500">{t('admin.bidDetails.clickToDownload')}</p>
                                        </div>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    {canAwardBid && (
                        <Card className="border-blue-100 bg-blue-50/30">
                            <CardHeader>
                                <CardTitle className="text-lg">{t('admin.bidDetails.actions')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {bid.status === 'submitted' && (
                                    <>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            onClick={handleAward}
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            {t('admin.bidDetails.awardJob')}
                                        </Button>
                                        {/* Reject button logic could be added here */}
                                    </>
                                )}

                                {bid.status === 'awarded' && (
                                    <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm text-center font-medium">
                                        ✓ {t('admin.bidDetails.awardedParams')}
                                    </div>
                                )}

                                {bid.status !== 'submitted' && bid.status !== 'awarded' && (
                                    <div className="text-center text-sm text-gray-500 italic">
                                        {t('admin.bidDetails.noActions')}: {bid.status}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Icon
const BriefcaseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

export default BidDetails;
