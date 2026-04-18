import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Award, CheckCircle, Download, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MockApiService from '../../services/mockApi';
import BackendApiService from '../../services/backendApi';
import { getContractorDisplayName } from '../../utils/contractorDisplay';

const BidComparison = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [tender, setTender] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [awarding, setAwarding] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Get Tender
                const tenderData = await BackendApiService.getTenderById(id);
                setTender(tenderData);

                // 2. Get Bids
                const bidsData = await BackendApiService.getTenderBids(id);
                // Filter only submitted bids for comparison
                const submittedBids = bidsData.filter(b => b.status === 'submitted' || b.status === 'accepted' || b.status === 'rejected');
                setBids(submittedBids);
            } catch (err) {
                console.error("Failed to load comparison data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleAward = async (bidId, contractorName) => {
        if (!window.confirm(t('admin.bidComparison.confirmAward', { name: contractorName }))) return;

        setAwarding(true);
        try {
            await BackendApiService.awardBid(bidId);
            alert(t('admin.bidComparison.awardSuccess', { name: contractorName }));
            navigate('/admin/tenders');
        } catch (err) {
            console.error("Award failed", err);
            alert(t('admin.bidComparison.awardFail') + ": " + (err.response?.data?.message || err.message));
        } finally {
            setAwarding(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading comparison...</div>;
    if (!tender) return <div className="p-8 text-center text-red-500">Tender not found</div>;

    // Helper to find best price for an item across all bids
    const getBestPrice = (itemIndex) => {
        if (!bids.length) return null;
        let min = Infinity;
        bids.forEach(bid => {
            if (bid.items && bid.items[itemIndex]) {
                const price = parseFloat(bid.items[itemIndex].price) || 0;
                if (price > 0 && price < min) min = price;
            }
        });
        return min === Infinity ? null : min;
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin/tenders')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> {t('admin.reviewBoq.back')}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{t('admin.bidComparison.title')}: {tender.title}</h1>
                        <p className="text-sm text-gray-500">{bids.length} {t('admin.bidComparison.bidsSubmitted')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> {t('admin.bidComparison.exportExcel')}
                    </Button>
                </div>
            </div>

            {bids.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                    <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('admin.bidComparison.noValidBids')}</p>
                </div>
            ) : (
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-md">
                    <CardContent className="flex-1 p-0 overflow-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-gray-50 text-left">
                                <tr className="border-b">
                                    <th className="p-3 font-medium text-gray-500 w-12 sticky top-0 left-0 z-30 bg-gray-50">{t('admin.bidComparison.table.no')}</th>
                                    <th className="p-3 font-medium text-gray-500 min-w-[300px] sticky top-0 left-12 z-30 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{t('admin.bidComparison.table.description')}</th>
                                    <th className="p-3 font-medium text-gray-500 w-24 sticky top-0 z-20 bg-gray-50 text-right">{t('admin.bidComparison.table.qty')}</th>
                                    {bids.map(bid => (
                                        <th key={bid.id} className="p-3 font-bold text-gray-900 min-w-[200px] text-right bg-blue-50/30 border-l sticky top-0 z-20">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    {getContractorDisplayName(bid)}
                                                    {bid.status === 'Accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-normal">{new Date(bid.submittedAt || Date.now()).toLocaleDateString()}</div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Totals Row */}
                                <tr className="bg-blue-50 font-bold border-b border-blue-200">
                                    <td className="p-3 sticky left-0 bg-blue-50 z-10 text-blue-900" colSpan={2}>{t('admin.bidComparison.table.totalOffer')}</td>
                                    <td className="p-3"></td>
                                    {bids.map(bid => {
                                        // Mock total calc if missing
                                        const total = bid.totalAmount ? bid.totalAmount * 1.22 : 0;
                                        return (
                                            <td key={bid.id} className="p-3 text-right text-blue-800 border-l border-blue-200 text-lg">
                                                € {total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        )
                                    })}
                                </tr>

                                {/* Awarding Actions Row */}
                                <tr className="bg-gray-50 border-b">
                                    <td colSpan={3} className="p-3 sticky left-0 bg-gray-50 font-medium text-gray-600">{t('admin.bidComparison.table.decision')}</td>
                                    {bids.map(bid => (
                                        <td key={bid.id} className="p-3 text-right border-l bg-gray-50">
                                            {tender.status === 'Published' && (
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-green-600 hover:bg-green-700 shadow-sm"
                                                    onClick={() => handleAward(bid.id, getContractorDisplayName(bid))}
                                                    disabled={awarding}
                                                    title={t('admin.bidComparison.selectWinner')}
                                                >
                                                    <Award className="h-3 w-3 mr-1" /> {t('admin.bidComparison.awardContract')}
                                                </Button>
                                            )}
                                            {bid.status === 'Accepted' && (
                                                <div className="flex justify-end">
                                                    <span className="text-green-700 font-bold text-xs px-3 py-1 bg-green-100 rounded-full border border-green-200 flex items-center gap-1">
                                                        <Award className="h-3 w-3" /> {t('admin.bidComparison.winner')}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* Detail Items Rows */}
                                {tender.boqItems && tender.boqItems.map((item, index) => {
                                    const bestPrice = getBestPrice(index);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 group">
                                            <td className="p-3 text-gray-400 text-xs align-top sticky left-0 bg-white group-hover:bg-gray-50">{item.source_item_no || index + 1}</td>
                                            <td className="p-3 align-top text-gray-700 sticky left-12 bg-white group-hover:bg-gray-50 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                <div className="line-clamp-2 text-sm" title={item.description}>{item.description}</div>
                                                {item.is_optional && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{t('admin.bidComparison.option')}</span>}
                                            </td>
                                            <td className="p-3 text-right text-gray-500 text-xs align-top bg-white group-hover:bg-gray-50">
                                                {item.item_type === 'lump_sum' ? '1 (LS)' : `${item.quantity} ${item.unit}`}
                                            </td>
                                            {bids.map(bid => {
                                                const bidItem = bid.items ? bid.items[index] : null;
                                                const unitPrice = parseFloat(bidItem?.price) || 0;
                                                // Check strictly if this is the best price (lowest and > 0)
                                                const isBest = unitPrice > 0 && unitPrice === bestPrice;

                                                const itemTotal = bidItem ? (bidItem.item_type === 'lump_sum' ? unitPrice : unitPrice * (parseFloat(item.quantity) || 0)) : 0;

                                                return (
                                                    <td key={bid.id} className={`p-3 text-right align-top border-l ${isBest ? 'bg-green-50/40' : ''}`}>
                                                        <div className={`font-mono text-sm ${isBest ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                                                            € {unitPrice.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            Tot: € {itemTotal.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default BidComparison;
