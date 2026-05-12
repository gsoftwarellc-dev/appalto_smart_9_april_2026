import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
    AlertTriangle, FileText, Info, MapPin, Calendar, Clock, Lock, Download, CheckCircle,
    Euro, Percent, Circle, Check, Eye, User, Zap, ChevronRight, ArrowRight, ArrowLeft, Upload,
    Pencil, Trash2
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import BackendApiService from '../services/backendApi';
import AiScan from './contractor/AiScan';
import { getContractorDisplayName } from '../utils/contractorDisplay';

const BACKEND_URL = 'http://localhost:8000';
const getBackendBaseUrl = () => (import.meta.env.VITE_API_URL || BACKEND_URL + '/api').replace(/\/api\/?$/, '') || BACKEND_URL;

const ProgressTracker = ({ status }) => {
    const { t } = useTranslation();
    const steps = [
        { id: 'published', label: t('contractor.tenders.published'), icon: FileText },
        { id: 'open', label: t('contractor.tenders.open'), icon: Lock },
        { id: 'review', label: t('contractor.tenders.underReview'), icon: Eye },
        { id: 'awarded', label: t('contractor.tenders.awarded'), icon: CheckCircle }
    ];

    const getCurrentStepIndex = () => {
        switch (status) {
            case 'draft': return -1;
            case 'published': return 0;
            case 'open': return 1;
            case 'review': return 2;
            case 'awarded': return 3;
            default: return 0;
        }
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="w-full py-4 sm:py-6 lg:py-8 overflow-x-auto">
            <div className="flex items-center justify-between w-full min-w-[280px] max-w-4xl mx-auto px-2 sm:px-4 gap-0">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Item */}
                            <div className="flex flex-col items-center relative group flex-shrink-0">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-white
                                ${isActive ? 'border-blue-600 text-blue-600 shadow-lg lg:scale-110' : 'border-gray-200 text-gray-300'}
                                ${isCurrent ? 'ring-2 sm:ring-4 ring-blue-50' : ''}
                            `}>
                                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${isActive ? 'fill-blue-50 text-blue-600' : ''}`} />
                                </div>
                                <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center transition-colors duration-300 max-w-[4rem] sm:max-w-none
                                ${isActive ? 'text-blue-700' : 'text-gray-400'}
                            `}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Arrow Connector (if not last) */}
                            {!isLast && (
                                <div className="flex-1 min-w-[12px] sm:min-w-[16px] flex justify-center items-center px-1 sm:px-2 lg:px-4">
                                    <div className={`h-0.5 sm:h-1 w-full rounded-full transition-all duration-500 relative
                                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-100'}
                                `}>
                                        <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 -mr-0.5 sm:-mr-1
                                        ${index < currentStep ? 'text-blue-600' : 'text-gray-100'}
                                    `}>
                                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const Countdown = ({ deadline }) => {
    const { t } = useTranslation();
    const calculateTimeLeft = () => {
        const difference = +new Date(deadline) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute
        return () => clearTimeout(timer);
    });

    if (!timeLeft.days && !timeLeft.hours && !timeLeft.minutes) {
        return <span className="text-red-500 font-bold">{t('contractor.tenders.expired')}</span>;
    }

    return (
        <span className="font-mono text-red-500">
            {timeLeft.days} {t('contractor.tenders.days')} {timeLeft.hours} {t('contractor.tenders.hours')} {timeLeft.minutes} {t('contractor.tenders.minutes')}
        </span>
    );
};

const formatBudget = (value, t) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const str = String(value).trim();
    if (str === '0-50000') return '€0 – €50.000';
    if (str === '50000-100000') return '€50.000 – €100.000';
    if (str === '100000-250000') return '€100.000 – €250.000';
    if (str === '250000+') return `${t('contractor.tenders.moreThan')} €250.000`;

    // Legacy numeric: map to range for display (solo forbice, no importo esatto)
    const num = parseFloat(value);
    if (!isNaN(num)) {
        if (num <= 50000) return '€0 – €50.000';
        if (num <= 100000) return '€50.000 – €100.000';
        if (num <= 250000) return '€100.000 – €250.000';
        return `${t('contractor.tenders.moreThan')} €250.000`;
    }
    return value;
};

const resolveBoqUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    const base = getBackendBaseUrl();
    return `${base}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
};

const resolveBackendFileUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    if (rawUrl.startsWith('/storage/')) return `${getBackendBaseUrl()}${rawUrl}`;
    return `${getBackendBaseUrl()}/storage/${rawUrl.replace(/^\/+/, '')}`;
};

const VIEWABLE_BID_STATUSES = ['submitted', 'accepted', 'rejected', 'awarded'];

const TenderDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [tender, setTender] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(true);
    const [editableItems, setEditableItems] = useState([]);
    const [bids, setBids] = useState([]); // Admin view only

    // Bid State
    const [totalBidAmount, setTotalBidAmount] = useState(0);
    const [bidFile, setBidFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bidStatus, setBidStatus] = useState(null);
    const [submittedBid, setSubmittedBid] = useState(null);

    // Modals
    const [unlocking, setUnlocking] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showAiScan, setShowAiScan] = useState(false);
    const [activeBidTab, setActiveBidTab] = useState('manual'); // 'manual' or 'ai'
    const [errorMsg, setErrorMsg] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Discount State
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
    const [proposalText, setProposalText] = useState(''); // Cover letter / Proposal

    const clearBidFile = () => {
        setBidFile(null);
    };

    const handleAiDataExtracted = (extractedItems) => {
        const updatedItems = [...editableItems];
        let matchCount = 0;

        extractedItems.forEach(extracted => {
            const extDesc = (extracted.description || '').toLowerCase().trim();
            if (!extDesc) return;

            const matchIndex = updatedItems.findIndex(item => {
                const itemDesc = (item.description || '').toLowerCase().trim();
                return itemDesc.includes(extDesc) || extDesc.includes(itemDesc);
            });

            if (matchIndex >= 0) {
                // If quantity is found, use it. Some providers might call it qty or quantity.
                updatedItems[matchIndex].quantity = extracted.quantity || extracted.qty || updatedItems[matchIndex].quantity;
                matchCount++;
            }
        });

        setEditableItems(updatedItems);
        setShowAiScan(false);
        // Optional: show a nice toast or notification instead of alert
    };

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const tenderData = await BackendApiService.getTenderById(id);
                setTender(tenderData);
                // Respect backend unlock state for contractors; admins/owners always see details
                if (user?.role === 'contractor') {
                    setIsUnlocked(!!tenderData.isUnlocked);
                } else {
                    setIsUnlocked(true);
                }

                if (user?.role === 'contractor') {
                    try {
                        const myBids = await BackendApiService.getMyBids();
                        const bid = myBids.find(b => b.tender_id === parseInt(id));

                        if (bid && bid.bid_items) {
                            setEditableItems(bid.bid_items.map(bi => ({
                                id: bi.boq_item_id,
                                description: bi.boq_item?.description || '',
                                unit: bi.boq_item?.unit || '',
                                quantity: bi.quantity ?? bi.boq_item?.quantity ?? 0,
                                item_type: bi.boq_item?.item_type || 'unit_priced',
                                price: bi.unit_price || 0,
                                note: bi.notes || '',
                                source_item_no: bi.boq_item?.display_order || '',
                            })));
                            const loadedDiscountValue = parseFloat(bid.discount_value ?? 0) || 0;
                            setDiscountType(bid.discount_type || 'percent');
                            setDiscountValue(loadedDiscountValue > 0 ? String(loadedDiscountValue) : '');
                            setProposalText(bid.proposal || '');
                            setBidStatus(bid.status);
                            setSubmittedBid(bid);
                        } else if (tenderData.boqItems) {
                            setEditableItems(tenderData.boqItems.map(item => ({
                                ...item,
                                id: item.id, // Explicit mapping needed if prop names differ
                                price: 0,
                                note: '',
                                source_item_no: item.display_order
                            })));
                            setDiscountType('percent');
                            setDiscountValue('');
                            setProposalText('');
                        }
                    } catch (bidErr) {
                        console.error("Failed to load bid", bidErr);
                        // Fallback to BOQ
                        if (tenderData.boqItems) {
                            setEditableItems(tenderData.boqItems.map(item => ({
                                ...item,
                                id: item.id,
                                price: 0,
                                note: '',
                                source_item_no: item.display_order
                            })));
                            setDiscountType('percent');
                            setDiscountValue('');
                            setProposalText('');
                        }
                    }
                } else if (user?.role === 'admin' || user?.role === 'owner') {
                    try {
                        const bidsData = await BackendApiService.getTenderBids(id);
                        const list = Array.isArray(bidsData) ? bidsData : (bidsData?.data ?? []);
                        setBids(Array.isArray(list) ? list : []);
                    } catch (err) {
                        console.error("Failed to load bids for admin", err);
                        setBids([]);
                    }
                }
            } catch (err) {
                console.error("Load failed", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, user]);

    // Calculate Totals
    useEffect(() => {
        if (!editableItems.length) return;
        let subtotal = 0;
        editableItems.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 0;
            if (item.item_type === 'lump_sum') {
                subtotal += price;
            } else {
                subtotal += price * qty;
            }
        });

        // Calculate Discount
        let discountAmount = 0;
        const discountVal = parseFloat(discountValue) || 0;
        if (discountVal > 0) {
            if (discountType === 'percent') {
                discountAmount = subtotal * (discountVal / 100);
            } else {
                discountAmount = discountVal;
            }
        }

        setTotalBidAmount(Math.max(0, subtotal - discountAmount));
    }, [editableItems, discountValue, discountType]);

    const handleItemChange = (index, value) => {
        if (bidStatus === 'submitted') return;
        const num = parseFloat(value);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        const newItems = [...editableItems];
        newItems[index].price = value === '' ? '' : value;
        setEditableItems(newItems);
    };

    const handleQuantityChange = (index, value) => {
        if (bidStatus === 'submitted') return;
        const num = parseFloat(value);
        if (value !== '' && (isNaN(num) || num < 0)) return;
        const newItems = [...editableItems];
        newItems[index].quantity = value === '' ? '' : value;
        setEditableItems(newItems);
    };

    const handleUnitChange = (index, value) => {
        if (bidStatus === 'submitted') return;
        const newItems = [...editableItems];
        newItems[index].unit = value ?? '';
        setEditableItems(newItems);
    };

    const handleItemNoteChange = (index, value) => {
        if (bidStatus === 'submitted') return;
        const newItems = [...editableItems];
        newItems[index].note = value;
        setEditableItems(newItems);
    };

    const preparePayload = () => {
        const items = editableItems.map(item => ({
            boq_item_id: item.id,
            unit_price: parseFloat(item.price) || 0,
            quantity: parseFloat(item.quantity) || 0,
            notes: item.note || null,
        }));

        const parsedDiscountValue = parseFloat(discountValue);
        const hasDiscount = !isNaN(parsedDiscountValue) && parsedDiscountValue > 0;

        return {
            items,
            discountType: hasDiscount ? discountType : null,
            discountValue: hasDiscount ? parsedDiscountValue : 0,
        };
    };

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({
                base64: reader.result,
                name: file.name
            });
            reader.onerror = error => reject(error);
        });
    };

    const handleSaveDraft = async () => {
        try {
            setSubmitting(true);
            const { items, discountType: payloadDiscountType, discountValue: payloadDiscountValue } = preparePayload();
            let offerFileData = null;
            if (bidFile) {
                offerFileData = await readFileAsBase64(bidFile);
            }
            const bid = await BackendApiService.createOrUpdateBid(
                id,
                items,
                offerFileData,
                proposalText,
                payloadDiscountType,
                payloadDiscountValue
            );
            setSubmittedBid(bid);
            setBidStatus('draft'); // Update local status
            alert(t('contractor.tenders.draftSaved'));
        } catch (err) {
            console.error(err);
            alert(t('contractor.tenders.saveDraftError'));
        } finally {
            setSubmitting(false);
        }
    };

    const validateBid = () => {
        // Validation: No negative values (handled in change), No empty inputs (optional but good)
        // Check if total > 0
        if (totalBidAmount <= 0) {
            setErrorMsg(t('contractor.tenders.totalMustBePositive'));
            return false;
        }
        if (!bidFile) {
            setErrorMsg(t('contractor.tenders.uploadRequired'));
            return false;
        }
        setErrorMsg(null);
        return true;
    };

    const confirmSubmit = (e) => {
        e.preventDefault();
        if (validateBid()) {
            setShowSubmitModal(true);
        }
    };

    const handleConfirmSubmit = async () => {
        setShowSubmitModal(false);
        setSubmitting(true);
        try {
            // First update the bid with items and the file
            const { items, discountType: payloadDiscountType, discountValue: payloadDiscountValue } = preparePayload();
            let offerFileData = null;
            if (bidFile) {
                offerFileData = await readFileAsBase64(bidFile);
            }
            const bid = await BackendApiService.createOrUpdateBid(
                id,
                items,
                offerFileData,
                proposalText,
                payloadDiscountType,
                payloadDiscountValue
            );

            // Then submit
            const submitted = await BackendApiService.submitBid(bid.id);
            setBidStatus('submitted');
            setSubmittedBid(submitted || { ...bid, status: 'submitted', submitted_at: new Date().toISOString() });
            setShowSuccessModal(true);
        } catch (err) {
            console.error(err);
            setErrorMsg("Failed to submit bid: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            await BackendApiService.updateTender(id, { status: 'published' });
            setTender({ ...tender, status: 'published' });
            alert('Tender published successfully!');
        } catch (error) {
            console.error('Failed to publish tender:', error);
            alert('Failed to publish tender. Please try again.');
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this tender? This action cannot be undone.');
        if (!confirmed) return;
        setDeleting(true);
        try {
            await BackendApiService.deleteTender(id);
            const redirectPath = user?.role === 'owner' ? '/owner/tenders' : '/admin/tenders';
            navigate(redirectPath, { replace: true });
        } catch (error) {
            console.error('Failed to delete tender:', error);
            const msg = error?.response?.data?.message || error?.message || 'Please try again.';
            alert('Failed to delete tender. ' + msg);
            setDeleting(false);
        }
    };

    const handleUnlockTender = async () => {
        try {
            setUnlocking(true);
            const result = await BackendApiService.unlockTender(id);
            setIsUnlocked(true);
            setTender(prev => prev ? { ...prev, isUnlocked: true } : prev);
            window.dispatchEvent(new CustomEvent('appalto:credits-updated'));
            alert(result?.message || t('contractor.tenders.unlockSuccess'));
        } catch (err) {
            console.error("Failed to unlock tender", err);
            if (err.response?.status === 402) {
                const required = err.response?.data?.required_credits;
                const balance = err.response?.data?.current_balance;
                alert(required !== undefined
                    ? `Insufficient credits. This tender requires ${required} credits and your balance is ${balance ?? 0}.`
                    : t('contractor.tenders.insufficientCredits'));
            } else {
                alert(t('contractor.tenders.unlockError'));
            }
        } finally {
            setUnlocking(false);
        }
    };

    if (loading) return <div className="p-6 sm:p-12 text-center text-gray-500 text-sm sm:text-base">Loading tender data...</div>;
    if (!tender) return <div className="p-6 sm:p-12 text-center text-red-500 text-sm sm:text-base">Tender not found.</div>;

    const isLockedByDeadline = new Date(tender.deadline) < new Date();
    const isDeadlinePassed = new Date(tender.deadline) <= new Date();
    const canBid = user?.role === 'contractor' && isUnlocked && !isLockedByDeadline;
    const isContractor = user?.role === 'contractor';
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';
    const canViewReceivedBids = user?.role === 'owner' || isDeadlinePassed;
    const getBidDetailsPath = (bidId) => user?.role === 'owner' ? `/owner/bids/${bidId}` : `/admin/bids/${bidId}`;
    const hasViewableExistingBid = isContractor && submittedBid && VIEWABLE_BID_STATUSES.includes(String(bidStatus || '').toLowerCase());
    const showContractorOfferPanel = canBid || hasViewableExistingBid;
    const submittedOfferFileUrl = resolveBackendFileUrl(submittedBid?.offer_file_url || submittedBid?.offer_file_path);
    const getContractorBidStatusLabel = (status) => {
        switch (String(status || '').toLowerCase()) {
            case 'submitted': return t('admin.bidManagement.status.submitted');
            case 'accepted': return t('contractor.tenders.awarded');
            case 'awarded': return t('contractor.tenders.awarded');
            case 'rejected': return t('admin.bidManagement.status.rejected');
            case 'draft': return t('contractor.bids.status.draft');
            default: return status || t('common.na');
        }
    };
    const formatCurrency = (value) => {
        const amount = Number(value);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        return `€${safeAmount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const submittedTotalAmount = parseFloat(submittedBid?.total_amount ?? totalBidAmount) || 0;
    const submittedSubtotalAmount = parseFloat(submittedBid?.subtotal_amount ?? submittedTotalAmount) || 0;
    const submittedDiscountAmount = parseFloat(submittedBid?.discount_amount ?? 0) || 0;
    const submittedDiscountType = submittedBid?.discount_type;
    const submittedDiscountValue = parseFloat(submittedBid?.discount_value ?? 0) || 0;
    const hasSubmittedDiscount = submittedDiscountAmount > 0;

    return (
        <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 text-gray-500 hover:text-gray-900 text-sm sm:text-base">
                    <ArrowLeft className="h-4 w-4 mr-1 flex-shrink-0" /> <span className="truncate">{t('contractor.tenders.browseTenders')}</span>
                </Button>
            </div>

            <div className={`flex flex-col gap-4 sm:gap-6 lg:gap-8 ${isContractor ? '' : 'lg:flex-row'}`}>
                {/* LEFT COLUMN: Tender Info */}
                <div className="flex-1 space-y-6">
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                            {/* Title & Meta */}
                            <div className="relative">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 z-10 relative">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 sm:px-3 sm:py-1 text-xs">
                                                Construction & Renovation
                                            </Badge>
                                            <Badge className={`px-2 py-0.5 sm:px-3 sm:py-1 border-none text-xs ${tender.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {tender.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('contractor.tenders.clientNameLabel')}</p>
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 sm:mb-4 break-words">{tender.title}</h1>

                                        <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
                                            {(() => {
                                                const loc = tender.location || '';
                                                const lastComma = loc.lastIndexOf(', ');
                                                const addressPart = lastComma > 0 ? loc.slice(0, lastComma).trim() : loc;
                                                const cityPart = lastComma > 0 ? loc.slice(lastComma + 2).trim() : '';
                                                return addressPart || cityPart ? (
                                                    <>
                                                        {addressPart && (
                                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100 min-w-0">
                                                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate"><span className="text-gray-500 font-normal">{t('contractor.tenders.addressLabel')}: </span>{addressPart}</span>
                                                            </div>
                                                        )}
                                                        {cityPart && (
                                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100 min-w-0">
                                                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate"><span className="text-gray-500 font-normal">{t('contractor.tenders.cityLabel')}: </span>{cityPart}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100 min-w-0">
                                                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{tender.location || '—'}</span>
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100 min-w-0">
                                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">{t('contractor.tenders.deadline')}: {new Date(tender.deadline).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-red-100 min-w-0">
                                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                                                <Countdown deadline={tender.deadline} />
                                            </div>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                                            {tender.status === 'draft' && (
                                                <Button onClick={handlePublish} disabled={publishing} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                                    {publishing ? 'Publishing...' : 'Publish Tender'}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/${user?.role === 'owner' ? 'owner' : 'admin'}/edit-tender/${id}`)}
                                                className="border-gray-300 hover:bg-gray-50"
                                            >
                                                <Pencil className="h-4 w-4 mr-1.5" /> Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleDelete}
                                                disabled={deleting}
                                                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                            >
                                                <Trash2 className="h-4 w-4 mr-1.5" />
                                                {deleting ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Tracker */}
                            <div className="py-2 border-t border-b border-gray-100">
                                <ProgressTracker status={tender.status === 'published' ? 'open' : tender.status} />
                                {/* Mapping 'published' to 'open' for visual tracker if needed, or just use raw status */}
                            </div>

                            {/* Description & Budget Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                                <div className="md:col-span-2 space-y-2 sm:space-y-3 p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-100 min-w-0">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" /> {t('contractor.tenders.description')}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm break-words">
                                        {tender.description}
                                    </p>
                                </div>
                                <div className="space-y-2 sm:space-y-3 p-4 sm:p-5 bg-blue-50 rounded-xl border border-blue-100 flex flex-col justify-center items-center text-center min-w-0">
                                    <h3 className="font-bold text-blue-900 text-xs sm:text-sm uppercase tracking-wider">{t('contractor.tenders.estimatedBudget')}</h3>
                                    <p className="text-sm sm:text-base font-bold text-blue-700 break-words">{formatBudget(tender.budget, t)}</p>
                                </div>
                            </div>

                            {/* BOQ: PDF preview + extracted items table */}
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-100 mt-4 space-y-4 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                                        <Download className="h-4 w-4 text-blue-600 flex-shrink-0" /> {t('contractor.tenders.boqSectionTitle')}
                                    </h3>
                                </div>

                                {(() => {
                                    const rawUrl = tender.boq_file_url;
                                    const fullUrl = resolveBoqUrl(rawUrl);
                                    const fileName = tender.boq_file_name || (rawUrl ? rawUrl.split('/').pop() : null);
                                    const sizeKb = tender.boq_file_size_kb;

                                    if (!fullUrl && !fileName) {
                                        return null;
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {fileName && (
                                                <p className="text-xs text-gray-600">
                                                    {t('contractor.tenders.uploadedFile')}:{" "}
                                                    <span className="font-medium break-all">{fileName}</span>
                                                    {sizeKb && <span className="text-gray-400"> ({sizeKb} KB)</span>}
                                                </p>
                                            )}
                                            {fullUrl && (
                                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(fullUrl, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        {t('contractor.tenders.openPdf')}
                                                    </Button>
                                                    <a
                                                        href={fullUrl}
                                                        download={fileName || undefined}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        {t('contractor.tenders.downloadPdf')}
                                                    </a>
                                                </div>
                                            )}
                                            {fullUrl && (
                                                <div className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm min-w-0">
                                                    <iframe
                                                        title={t('contractor.tenders.boqSectionTitle')}
                                                        src={fullUrl}
                                                        className="w-full min-h-[280px] sm:min-h-[400px] lg:min-h-[500px] border-0"
                                                        style={{ height: 'clamp(280px, 55vh, 700px)' }}
                                                    />
                                                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-[10px] sm:text-xs text-gray-500 text-left">
                                                        {t('contractor.tenders.previewFallback')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Contractors use the editable offer table below; hide this read-only BOQ table to avoid duplication. */}
                                {!isAdmin && !isContractor && (() => {
                                    const boqItems = tender.boqItems || tender.boq_items || [];
                                    if (!boqItems.length) {
                                        return (
                                            <div className="bg-white p-4 sm:p-8 rounded border border-gray-200 text-center text-gray-500 text-sm">
                                                {t('contractor.tenders.noBoqItems')}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm min-w-0">
                                            <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                                                <h4 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                                                    {t('contractor.tenders.priceTable')} • {boqItems.length} items
                                                </h4>
                                            </div>
                                            <div className="overflow-x-auto -mx-px">
                                                <table className="min-w-[520px] w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
                                                                {t('contractor.tenders.description')}
                                                            </th>
                                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                {t('contractor.tenders.unit')}
                                                            </th>
                                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                {t('contractor.tenders.quantity')}
                                                            </th>
                                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                {t('contractor.tenders.type')}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {boqItems.map((item, index) => (
                                                            <tr key={item.id ?? index} className="hover:bg-blue-50/30 transition-colors even:bg-gray-50/50">
                                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 font-mono">{index + 1}</td>
                                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium break-words max-w-[200px] sm:max-w-none">{item.description}</td>
                                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 bg-gray-50/30 font-medium">{item.unit}</td>
                                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-bold">{item.quantity}</td>
                                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 border-gray-200"
                                                                    >
                                                                        {item.item_type === 'lump_sum'
                                                                            ? t('contractor.tenders.lumpSum')
                                                                            : t('contractor.tenders.unitPrice')}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                        </CardContent>
                    </Card>
                </div>


                {/* RIGHT COLUMN: Bidding Interface */}
                {showContractorOfferPanel ? (
                    <div className={isContractor ? 'w-full flex-shrink-0' : 'w-full lg:w-[420px] xl:w-[450px] flex-shrink-0'}>
                        <Card className={`${isContractor ? '' : 'lg:sticky lg:top-6 '}border shadow-lg border-blue-100 min-w-0`}>
                            <CardHeader className="bg-blue-50/50 pb-3 sm:pb-4 border-b border-blue-100 px-4 sm:px-6">
                                <CardTitle className="text-blue-700 text-base sm:text-lg">
                                    {hasViewableExistingBid ? t('contractor.tenders.bidSubmitted') : t('contractor.tenders.submitOffer')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 min-w-0">
                                {/* Tabs */}
                                {!hasViewableExistingBid && (
                                    <div className="flex border-b border-gray-200 px-3 sm:px-4 pt-3 sm:pt-4 mb-0">
                                        <button
                                            type="button"
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all ${activeBidTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            onClick={() => setActiveBidTab('manual')}
                                        >
                                            {t('contractor.tenders.manualEntry')}
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 relative ${activeBidTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                }`}
                                            onClick={() => setActiveBidTab('ai')}
                                        >
                                            <Zap className={`h-3.5 w-3.5 flex-shrink-0 ${activeBidTab === 'ai' ? 'text-purple-600 fill-purple-600' : 'text-gray-300'}`} />
                                            <span className="truncate">{t('contractor.tenders.smartAiScan')}</span>
                                        </button>
                                    </div>
                                )}

                                {hasViewableExistingBid ? (
                                    <div className="bg-white rounded-b-xl overflow-hidden min-w-0">
                                        <div className="bg-green-50/50 p-4 sm:p-6 border-b border-green-100">
                                            <div className="flex items-center gap-3 mb-3 sm:mb-4">
                                                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white rounded-full flex items-center justify-center border border-green-200 shadow-sm flex-shrink-0">
                                                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('contractor.tenders.bidSubmitted')}</h3>
                                                    <p className="text-xs text-gray-500">on {submittedBid?.submitted_at ? new Date(submittedBid.submitted_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                <div className="bg-white p-2.5 sm:p-3 rounded border border-green-100 shadow-sm min-w-0">
                                                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">{t('contractor.tenders.totalAmount')}</p>
                                                    <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{formatCurrency(submittedTotalAmount)}</p>
                                                    {hasSubmittedDiscount && (
                                                        <div className="mt-1 space-y-0.5">
                                                            <p className="text-[10px] sm:text-xs text-gray-500">
                                                                {t('contractor.tenders.subtotalAmount')}: <span className="font-medium text-gray-700">{formatCurrency(submittedSubtotalAmount)}</span>
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-gray-500">
                                                                {t('contractor.tenders.discountApplied')}: <span className="font-medium text-gray-700">-{formatCurrency(submittedDiscountAmount)}</span>
                                                                {submittedDiscountType === 'percent' && submittedDiscountValue > 0 ? ` (${submittedDiscountValue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}%)` : ''}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="bg-white p-2.5 sm:p-3 rounded border border-green-100 shadow-sm min-w-0">
                                                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">{t('contractor.tenders.status')}</p>
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-xs">{getContractorBidStatusLabel(submittedBid?.status)}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                            {/* Cover Letter */}
                                            {submittedBid?.proposal && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <FileText className="h-3.5 w-3.5 text-gray-400" /> {t('contractor.tenders.proposal')}
                                                    </h4>
                                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 border border-gray-100 italic">
                                                        "{submittedBid.proposal}"
                                                    </div>
                                                </div>
                                            )}

                                            {/* Signature / File */}
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-gray-400" /> {t('contractor.tenders.authorization')}
                                                </h4>
                                                {submittedOfferFileUrl ? (
                                                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => window.open(submittedOfferFileUrl, '_blank', 'noopener,noreferrer')}>
                                                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium text-blue-900 truncate">{t('contractor.tenders.signedQuote')}</p>
                                                            <p className="text-xs text-blue-500">{t('contractor.tenders.tapToView')}</p>
                                                        </div>
                                                        <Download className="h-4 w-4 text-blue-400 group-hover:text-blue-600" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                                        <Info className="h-4 w-4 text-gray-400" /> {t('contractor.tenders.signedDigitally')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price Table Summary */}
                                            <div className="min-w-0">
                                                <h4 className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5 sm:mb-2">{t('contractor.tenders.priceTable')}</h4>
                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-[10px] sm:text-xs min-w-[200px]">
                                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                                <tr>
                                                                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left">{t('contractor.tenders.item')}</th>
                                                                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">{t('contractor.tenders.price')}</th>
                                                                    <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">{t('contractor.tenders.total')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {(submittedBid?.bid_items || []).slice(0, 3).map((item, i) => (
                                                                    <tr key={i}>
                                                                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-700 truncate max-w-[100px] sm:max-w-[120px]" title={item.boq_item?.description}>{item.boq_item?.description || `Item #${i + 1}`}</td>
                                                                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-gray-500">€{parseFloat(item.unit_price).toLocaleString()}</td>
                                                                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-medium text-gray-900">€{(parseFloat(item.unit_price) * parseFloat(item.quantity)).toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                                {(submittedBid?.bid_items || []).length > 3 && (
                                                                    <tr>
                                                                        <td colSpan={3} className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-gray-400 italic bg-gray-50/30 text-[10px] sm:text-xs">
                                                                            + {(submittedBid?.bid_items || []).length - 3} {t('contractor.tenders.moreThan')} items...
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium shadow-sm transition-all" onClick={() => navigate('/contractor/bids')}>
                                                {t('contractor.tenders.backToBids')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : activeBidTab === 'ai' ? (
                                    <div className="min-h-[400px]">
                                        <AiScan
                                            tenderId={id}
                                            onDataExtracted={(data) => {
                                                handleAiDataExtracted(data);
                                                setActiveBidTab('manual');
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <form onSubmit={confirmSubmit} className="space-y-0 min-w-0">
                                        {/* BOQ Table */}
                                        <div className="overflow-x-auto max-h-[320px] sm:max-h-[400px] overflow-y-auto w-full custom-scrollbar -mx-px">
                                            <table className="w-full text-xs sm:text-sm text-left min-w-[520px]">
                                                <thead className="text-[10px] sm:text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 shadow-sm z-10">
                                                    <tr>
                                                        <th className="px-2 sm:px-4 py-2 sm:py-3 font-semibold min-w-[120px]">{t('contractor.tenders.item')}</th>
                                                        <th className="px-2 sm:px-3 py-2 sm:py-3 w-12 sm:w-16 text-center">{t('contractor.tenders.unit')}</th>
                                                        <th className="px-2 sm:px-3 py-2 sm:py-3 w-12 sm:w-20 text-right">{t('contractor.tenders.quantity')}</th>
                                                        <th className="px-2 sm:px-3 py-2 sm:py-3 w-20 sm:w-28 text-right">{t('contractor.tenders.price')} (€)</th>
                                                        <th className="px-2 sm:px-4 py-2 sm:py-3 w-20 sm:w-28 text-right">{t('contractor.tenders.total')} (€)</th>
                                                        <th className="px-2 sm:px-4 py-2 sm:py-3 min-w-[120px]">{t('contractor.tenders.notes')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {editableItems.map((item, idx) => {
                                                        const price = parseFloat(item.price) || 0;
                                                        const qty = item.item_type === 'lump_sum' ? 1 : (parseFloat(item.quantity) || 0);
                                                        const rowTotal = item.item_type === 'lump_sum' ? price : price * qty;
                                                        return (
                                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                                                <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-700 max-w-[160px] sm:max-w-none truncate sm:whitespace-normal align-top" title={item.description}>
                                                                    {item.description}
                                                                </td>
                                                                <td className="px-2 sm:px-3 py-2 sm:py-3 align-top">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full min-w-[3rem] max-w-20 text-center bg-white border border-gray-200 rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                        placeholder="—"
                                                                        value={item.unit ?? ''}
                                                                        onChange={(e) => handleUnitChange(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-right align-top">
                                                                    <input
                                                                        type="number"
                                                                        step="any"
                                                                        min="0"
                                                                        className="w-full min-w-[3rem] max-w-20 text-right bg-white border border-gray-200 rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                                                                        placeholder="0"
                                                                        value={item.quantity ?? ''}
                                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 py-2 sm:py-3 text-right align-top">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        className="w-full min-w-[4rem] max-w-24 text-right bg-white border border-gray-200 rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                                        placeholder="0.00"
                                                                        value={item.price ?? ''}
                                                                        onChange={(e) => handleItemChange(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold tabular-nums text-xs sm:text-sm text-gray-900 align-top">
                                                                    €{rowTotal.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="px-2 sm:px-4 py-2 sm:py-3 align-top">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full min-w-[6rem] max-w-xs border border-gray-200 rounded-md px-2 py-1 text-[11px] sm:text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                                                        placeholder={t('contractor.tenders.notesPlaceholder')}
                                                                        value={item.note ?? ''}
                                                                        onChange={(e) => handleItemNoteChange(idx, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50/50 border-t border-b border-gray-100 flex justify-center">
                                            <span className="text-[10px] sm:text-xs text-gray-400 italic">{t('contractor.tenders.addingDisabled')}</span>
                                        </div>

                                        {/* Optional discount (% or fixed amount) */}
                                        <div className="px-4 sm:px-6 py-2 bg-white border-t border-gray-100 flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-gray-500">{t('contractor.tenders.discountOptional')}</span>
                                            <select
                                                value={discountType}
                                                onChange={(e) => setDiscountType(e.target.value)}
                                                className="rounded border border-gray-300 px-2 py-1 text-xs"
                                            >
                                                <option value="percent">%</option>
                                                <option value="fixed">€</option>
                                            </select>
                                            <input
                                                type="number"
                                                step={discountType === 'percent' ? '0.1' : '0.01'}
                                                min="0"
                                                placeholder={discountType === 'percent' ? '0' : '0.00'}
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(e.target.value)}
                                                className="w-20 rounded border border-gray-300 px-2 py-1 text-xs text-right"
                                            />
                                        </div>

                                        {/* Totals */}
                                        <div className="p-4 sm:p-6 space-y-4 bg-white">
                                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-2">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider font-semibold">{t('contractor.tenders.totalBid')}</span>
                                                    <span className="text-[10px] sm:text-xs text-gray-400">{t('contractor.tenders.exclVat')}</span>
                                                </div>
                                                <span className="text-lg sm:text-2xl font-bold text-blue-600 tracking-tight flex-shrink-0">€{totalBidAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        {/* Proposal / Cover Letter */}
                                        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 bg-white border-t border-gray-100">
                                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">{t('contractor.tenders.proposal')}</label>
                                            <textarea
                                                value={proposalText}
                                                onChange={(e) => setProposalText(e.target.value)}
                                                className="w-full min-h-[100px] sm:min-h-[120px] rounded-md border border-gray-300 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y min-w-0"
                                                placeholder={t('contractor.tenders.proposalPlaceholder')}
                                            />
                                        </div>

                                        {/* Upload signed offer PDF (required) */}
                                        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100">
                                            <label className="text-[10px] sm:text-xs font-semibold text-gray-700 block mb-1.5 sm:mb-2">{t('contractor.tenders.signQuote')} *</label>
                                            <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">{t('contractor.tenders.uploadSignedBoqNote')}</p>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 bg-white text-center min-w-0">
                                                {bidFile && bidFile.name && bidFile.name.toLowerCase().endsWith('.pdf') ? (
                                                    <div className="text-center py-2">
                                                        <p className="text-[10px] sm:text-xs text-green-700 font-medium bg-green-50 px-2 py-1.5 rounded inline-flex items-center gap-1">
                                                            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> {t('contractor.tenders.documentUploaded')}: {bidFile.name}
                                                        </p>
                                                        <button type="button" onClick={clearBidFile} className="block mx-auto mt-2 text-[10px] sm:text-xs text-red-500 underline hover:text-red-700">{t('contractor.tenders.change')}</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,application/pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setBidFile(file);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                            className="hidden"
                                                            id="upload-signed-boq-pdf"
                                                        />
                                                        <label htmlFor="upload-signed-boq-pdf" className="block">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-300 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-medium cursor-pointer hover:bg-blue-100">
                                                                <Upload className="h-3.5 w-3.5" /> {t('contractor.tenders.uploadSignedBoqPdf')}
                                                            </span>
                                                        </label>
                                                        <p className="mt-2 text-[10px] sm:text-xs text-gray-500">
                                                            {t('contractor.tenders.pdfOnlyHint')}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            {/* Disclaimer */}
                                            <div className="mt-3 sm:mt-4 bg-blue-50/50 p-2.5 sm:p-3 rounded border border-blue-100">
                                                <label className="flex gap-2 items-start cursor-pointer">
                                                    <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" required />
                                                    <span className="text-[10px] sm:text-xs text-blue-800 leading-tight min-w-0">
                                                        <Trans i18nKey="contractor.tenders.disclaimer" values={{ fee: (totalBidAmount * 0.03).toLocaleString() }} components={{ strong: <span className="font-semibold" /> }} />
                                                    </span>
                                                </label>
                                            </div>

                                            {errorMsg && (
                                                <div className="mt-2 p-2 bg-red-50 text-red-600 text-[10px] sm:text-xs rounded border border-red-100 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3 flex-shrink-0" /> <span className="break-words">{errorMsg}</span>
                                                </div>
                                            )}

                                            <Button type="submit" className="w-full mt-3 sm:mt-4 bg-[#8b8df2] hover:bg-[#7a7ce0] text-white font-medium h-9 sm:h-10 shadow-sm text-sm" disabled={submitting}>
                                                {submitting ? t('contractor.tenders.submitting') : `${t('contractor.tenders.submitBid')} (${totalBidAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })})`}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : user?.role === 'admin' || user?.role === 'owner' ? (
                    <div className="w-full lg:w-[420px] xl:w-[450px] flex-shrink-0">
                        <Card className="lg:sticky lg:top-6 border-none shadow-2xl bg-white overflow-hidden ring-1 ring-gray-100 min-w-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-4 sm:pb-6 pt-4 sm:pt-6 border-b border-gray-100 relative px-4 sm:px-6">
                                <div className="absolute top-0 right-0 p-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                </div>
                                <CardTitle className="text-gray-900 text-base sm:text-xl flex justify-between items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="truncate">{t('contractor.tenders.receivedBids')}</span>
                                        <span className="relative flex h-2 w-2 ml-1 flex-shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                    </span>
                                    <Badge className="bg-blue-600 text-white shadow-sm px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-bold rounded-full flex-shrink-0">
                                        {bids.length}
                                    </Badge>
                                </CardTitle>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">
                                    {canViewReceivedBids
                                        ? t('contractor.tenders.liveMonitoring')
                                        : t('contractor.tenders.bidsVisibleAtDeadline')}
                                </p>
                            </CardHeader>
                            <CardContent className="p-0 bg-gray-50/30">
                                {bids.length === 0 ? (
                                    <div className="p-6 sm:p-10 text-center text-gray-400 flex flex-col items-center justify-center min-h-[160px] sm:h-[200px]">
                                        <div className="p-3 sm:p-4 bg-gray-50 rounded-full mb-2 sm:mb-3 shadow-inner">
                                            <Info className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
                                        </div>
                                        <p className="font-medium animate-pulse text-sm sm:text-base">{t('contractor.tenders.waitingForBids')}</p>
                                    </div>
                                ) : !canViewReceivedBids ? (
                                    <div className="p-6 sm:p-8 text-center text-gray-500 text-xs sm:text-sm">
                                        <p className="font-medium mb-1">
                                            {t('contractor.tenders.bidsVisibleAtDeadline')}
                                        </p>
                                        <p className="text-gray-400">
                                            {bids.length === 1
                                                ? `1 ${t('admin.tendersList.bids')}`
                                                : `${bids.length} ${t('admin.tendersList.bids')}`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto px-2 py-2 space-y-2 custom-scrollbar">
                                        {bids.map((bid) => (
                                            <div key={bid.id} className="p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group relative overflow-hidden min-w-0">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform -translate-x-1 group-hover:translate-x-0 transition-transform duration-300" />

                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2 sm:mb-3">
                                                    <div className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base min-w-0">
                                                        <div className="p-1 sm:p-1.5 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0">
                                                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </div>
                                                        <span className="truncate">{getContractorDisplayName(bid)}</span>
                                                    </div>
                                                    <Badge variant="outline" className={`text-[10px] py-0.5 px-2 h-5 border-0 font-semibold capitalize flex-shrink-0 ${bid.status === 'submitted' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {bid.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">{t('contractor.tenders.totalOffer')}</div>
                                                        <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                                                            {(() => {
                                                                const total = bid.total_amount ?? bid.totalAmount;
                                                                const num = total != null && total !== '' ? parseFloat(total) : NaN;
                                                                return Number.isFinite(num)
                                                                    ? `€${num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                    : (t('common.na') || '—');
                                                            })()}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                            <Clock className="h-3 w-3 flex-shrink-0" /> {bid.submitted_at ? new Date(bid.submitted_at).toLocaleDateString() : bid.created_at ? new Date(bid.created_at).toLocaleDateString() : '—'}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm rounded-lg transition-all duration-300 font-medium px-3 sm:px-4 text-xs sm:text-sm w-full sm:w-auto"
                                                        onClick={() => navigate(getBidDetailsPath(bid.id))}
                                                    >
                                                        {t('contractor.tenders.view')} <Eye className="ml-1.5 h-3.5 w-3.5 flex-shrink-0" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="w-full lg:w-[420px] xl:w-[450px] flex-shrink-0">
                        <Card className="bg-gray-50 border border-gray-200 min-w-0">
                            <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center text-gray-500">
                                <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mb-2" />
                                <p className="text-xs sm:text-sm font-medium">{t('contractor.tenders.biddingUnavailable')}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 px-2">
                                    {user?.role !== 'contractor' ? t('contractor.tenders.contractorOnly') :
                                        !isUnlocked ? t('contractor.tenders.unlockToView') :
                                            t('contractor.tenders.closedOrAwarded')}
                                </p>
                                {user?.role === 'contractor' && !isUnlocked && (
                                    <Button
                                        onClick={handleUnlockTender}
                                        disabled={unlocking}
                                        className="mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        {unlocking ? 'Unlocking...' : `Unlock for ${tender.unlockCredits ?? tender.unlock_credits ?? 0} credits`}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* KEEP EXISTING MODALS AS IS */}
            {/* Submit Confirmation Modal */}
            <Modal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                title={t('contractor.tenders.confirmSubmission')}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowSubmitModal(false)}>{t('contractor.tenders.cancel')}</Button>
                        <Button onClick={handleConfirmSubmit} disabled={submitting} className="bg-blue-600">
                            {submitting ? t('contractor.tenders.submitting') : t('contractor.tenders.confirmSubmitBtn')}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        <Trans i18nKey="contractor.tenders.submissionWarning" values={{ amount: (totalBidAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 }) }} components={{ bold: <span className="font-bold text-gray-900" /> }} />
                    </p>
                    <div className="bg-amber-50 p-4 rounded text-sm text-amber-800 border-l-4 border-amber-400">
                        <p className="font-bold mb-1">Important:</p>
                        <p><Trans i18nKey="contractor.tenders.submissionNote" components={{ strong: <strong /> }} /></p>
                    </div>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    // Stay on page to see success state
                }}
                title={t('contractor.tenders.successTitle')}
            >
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{t('contractor.tenders.successMessage')}</h3>
                        <p className="text-gray-500 mt-2">
                            {t('contractor.tenders.successNote')}
                        </p>
                    </div>
                    <Button onClick={() => navigate('/contractor/bids')} className="w-full mt-4">
                        {t('contractor.tenders.goToBids')}
                    </Button>
                </div>
            </Modal>


        </div >
    );
};

export default TenderDetails;
