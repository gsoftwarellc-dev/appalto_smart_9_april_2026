import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Upload, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { useAuth } from '../../context/AuthContext';
import { ITALIAN_REGIONS } from '../../constants/italianRegions';

const getBackendBaseUrl = () => {
    const api = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    return api.replace(/\/api\/?$/, '') || 'http://localhost:8000';
};

const resolveBoqUrl = (rawUrl) => {
    if (!rawUrl) return null;
    // If backend already returns absolute URL, use it as-is
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    const base = getBackendBaseUrl();
    return `${base}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
};

const parseTenderLocation = (location) => {
    const value = (location || '').trim();
    const lastComma = value.lastIndexOf(', ');

    if (lastComma > 0) {
        return {
            address: value.slice(0, lastComma).trim(),
            region: value.slice(lastComma + 2).trim(),
        };
    }

    return {
        address: ITALIAN_REGIONS.includes(value) ? '' : value,
        region: ITALIAN_REGIONS.includes(value) ? value : '',
    };
};

const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
};

const CreateTender = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams(); // For edit mode
    const isEditMode = !!id;
    const basePath = user?.role === 'owner' ? '/owner' : '/admin';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: getDefaultDeadline(),
        budget: '',
        location: '',
        region: '',
        status: 'published'
    });

    const [isUrgent, setIsUrgent] = useState(false);
    const [extractionStatus, setExtractionStatus] = useState(null); // 'uploading', 'processing', 'completed', 'error'
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedBoqDocumentId, setUploadedBoqDocumentId] = useState(null); // link PDF to tender on create
    const [uploadedBoqFileName, setUploadedBoqFileName] = useState(null);
    const [uploadedBoqFileSize, setUploadedBoqFileSize] = useState(null);
    const [uploadedBoqPreviewUrl, setUploadedBoqPreviewUrl] = useState(null);
    const [existingBoqUrl, setExistingBoqUrl] = useState(null); // from backend when editing

    const loadTenderData = useCallback(async () => {
        try {
            setLoading(true);
            const tender = await BackendApiService.getTenderById(id);
            const parsedLocation = parseTenderLocation(tender.location);
            setFormData({
                title: tender.title || '',
                description: tender.description || '',
                deadline: tender.deadline ? tender.deadline.split('T')[0] : getDefaultDeadline(),
                budget: tender.budget || '',
                location: parsedLocation.address,
                region: parsedLocation.region,
                status: tender.status || 'draft'
            });

            // Load BOQ items if they exist
            if (tender.boqItems && Array.isArray(tender.boqItems)) {
                setBoqItems(tender.boqItems.map(item => ({
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity,
                    item_type: item.item_type || 'unit_priced'
                })));
            } else {
                setBoqItems([]);
            }

            // Existing BOQ PDF (for preview when editing, before new upload)
            setExistingBoqUrl(tender.boq_file_url || null);
            setUploadedBoqFileName(null);
            setUploadedBoqFileSize(null);
            setUploadedBoqPreviewUrl(null);
            setError(null);
        } catch (error) {
            console.error("Failed to load tender", error);
            setError("Failed to load tender data.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Load tender data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            loadTenderData();
        }
    }, [isEditMode, loadTenderData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // BOQ Management (items come only from PDF extraction)
    const [boqItems, setBoqItems] = useState([]);

    // AI Extraction Logic
    const pollExtractionStatus = async (extractionId) => {
        const pollInterval = setInterval(async () => {
            try {
                const statusData = await BackendApiService.getExtractionStatus(extractionId);
                console.log("Polling extraction:", statusData.status);

                if (statusData.status === 'completed') {
                    clearInterval(pollInterval);
                    setExtractionStatus('completed');

                    if (statusData.data && statusData.data.boq_items) {
                        const newItems = statusData.data.boq_items.map(item => ({
                            description: item.description,
                            unit: item.unit,
                            quantity: item.quantity,
                            item_type: item.item_type || 'unit_priced'
                        }));
                        setBoqItems(prev => [...prev, ...newItems]);
                        setSuccess("BOQ items extracted successfully!");
                    }
                } else if (statusData.status === 'failed') {
                    clearInterval(pollInterval);
                    setExtractionStatus('error');
                    setError(`${t('admin.create.boq.extraction.error')}: ` + (statusData.error || 'Unknown error'));
                }
            } catch (err) {
                console.error("Polling error", err);
                clearInterval(pollInterval);
                setExtractionStatus('error');
            }
        }, 2000);
    };

    const handleFileUpload = async (files) => {
        const file = files[0];
        if (!file) return;

        // Reset existing preview and show the newly selected PDF
        if (uploadedBoqPreviewUrl) {
            URL.revokeObjectURL(uploadedBoqPreviewUrl);
        }
        const objectUrl = URL.createObjectURL(file);

        setUploadedBoqFileName(file.name);
        setUploadedBoqFileSize(file.size);
        setUploadedBoqPreviewUrl(objectUrl);
        setExistingBoqUrl(null);

        try {
            setExtractionStatus('uploading');
            setUploadProgress(10);
            setError(null);

            const response = await BackendApiService.extractPdf(id, file);
            setUploadProgress(50);

            if (response.document_id && !id) setUploadedBoqDocumentId(response.document_id);
            if (response.extraction_id) {
                setExtractionStatus('processing');
                pollExtractionStatus(response.extraction_id);
            } else if (response.data && response.data.boq_items) {
                // If it was synchronous and already completed
                setExtractionStatus('completed');
                setUploadProgress(100);
                const newItems = response.data.boq_items.map(item => ({
                    description: item.description,
                    unit: item.unit,
                    quantity: item.quantity,
                    item_type: item.item_type || 'unit_priced'
                }));
                setBoqItems(prev => [...prev, ...newItems]);
                setSuccess(t('admin.create.boq.extraction.success'));

                // Auto-switch to Manual Entry tab to show extracted items
            }
        } catch (err) {
            console.error('Extraction upload error:', err);
            setExtractionStatus('error');
            const backendError = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(`AI Upload failed: ${backendError}. Check your internet and try again.`);
            setUploadedBoqFileName(null);
            setUploadedBoqFileSize(null);
            if (uploadedBoqPreviewUrl) {
                URL.revokeObjectURL(uploadedBoqPreviewUrl);
                setUploadedBoqPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (boqItems.length === 0) {
            setError(t('admin.create.messages.boqRequired'));
            return;
        }
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const tenderData = {
                ...formData,
                location: formData.location.trim(),
                region: formData.region,
                budget: formData.budget,
                boq_items: boqItems.map((item, index) => ({
                    ...item,
                    display_order: index + 1,
                    quantity: parseFloat(item.quantity) || 1,
                    unit: item.unit && item.unit.trim() ? item.unit.trim() : 'Unità',
                    item_type: item.item_type || 'unit_priced'
                }))
            };
            if (!isEditMode && uploadedBoqDocumentId) tenderData.boq_document_id = uploadedBoqDocumentId;

            if (isEditMode) {
                await BackendApiService.updateTender(id, tenderData);
                setSuccess(t('admin.create.messages.successUpdate'));
            } else {
                await BackendApiService.createTender(tenderData);
                setSuccess(t('admin.create.messages.successCreate'));
            }

            // Redirect after short delay
            setTimeout(() => {
                navigate(`${basePath}/tenders`);
            }, 1500);
        } catch (error) {
            console.error("Failed to save tender", error);
            setError(error.response?.data?.message || t('admin.create.messages.errorSave'));
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!isEditMode) {
            setError(t('admin.create.messages.publishFirst'));
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await BackendApiService.publishTender(id);
            setSuccess(t('admin.create.messages.successPublish'));
            setTimeout(() => {
                navigate(`${basePath}/tenders`);
            }, 1500);
        } catch (error) {
            console.error("Failed to publish tender", error);
            setError(t('admin.create.messages.errorPublish'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-8 text-center flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">
                {isEditMode ? t('admin.create.editTitle') : t('admin.createTender')}
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? t('admin.create.editDetails') : t('admin.create.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client name / Title */}
                        <div>
                            <label className="block text-sm font-bold mb-2">
                                {t('admin.create.clientName')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder={t('admin.create.clientNamePlaceholder')}
                                required
                            />
                        </div>

                        {/* Address and Region */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    {t('admin.create.address')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder={t('admin.create.addressPlaceholder')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    {t('admin.create.region')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                >
                                    <option value="" disabled>{t('admin.create.regionPlaceholder')}</option>
                                    {ITALIAN_REGIONS.map((region) => (
                                        <option key={region} value={region}>{region}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold mb-2">
                                {t('admin.create.object')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="flex min-h-[200px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                                placeholder={t('admin.create.object')}
                                required
                            />
                        </div>

                        {/* Deadline and Budget */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    {t('admin.create.deadline')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    {t('admin.create.estimatedAmount')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                >
                                    <option value="" disabled>{t('admin.create.estimatedAmount')}</option>
                                    <option value="0-50000">€0 – €50.000</option>
                                    <option value="50000-100000">€50.000 – €100.000</option>
                                    <option value="100000-250000">€100.000 – €250.000</option>
                                    <option value="250000+">{t('contractor.tenders.moreThan')} €250.000</option>
                                </select>
                            </div>
                        </div>

                        {/* Urgent Checkbox */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="urgent"
                                checked={isUrgent}
                                onChange={(e) => setIsUrgent(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="urgent" className="text-sm font-medium text-gray-700">{t('contractor.tenders.urgent')}</label>
                        </div>

                        {/* BOQ: Carica computo metrico (PDF) – only PDF from technician */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold mb-2">
                                {t('admin.create.boq.uploadLabel')}
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative bg-white">
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={extractionStatus === 'uploading' || extractionStatus === 'processing'}
                                />
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    {extractionStatus === 'uploading' || extractionStatus === 'processing' ? (
                                        <>
                                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                            <p className="text-sm text-gray-600 font-medium"><span>{t('admin.create.boq.upload.processing')}</span><span> {uploadProgress}%</span></p>
                                        </>
                                    ) : extractionStatus === 'completed' ? (
                                        <>
                                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Upload className="h-5 w-5 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900"><span>{t('admin.create.boq.extraction.complete')}</span></p>
                                            <p className="text-xs text-gray-500"><span>{t('admin.create.boq.extraction.review')}</span></p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-10 w-10 text-gray-400" />
                                            <p className="text-sm text-gray-600 font-medium"><span>{t('admin.create.boq.upload.click')}</span></p>
                                            <p className="text-xs text-gray-400"><span>{t('admin.create.boq.upload.format')}</span></p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Uploaded / existing PDF info + actions */}
                            {(() => {
                                const activeUrl = uploadedBoqPreviewUrl
                                    || (existingBoqUrl ? resolveBoqUrl(existingBoqUrl) : null);
                                const fileLabel = uploadedBoqFileName
                                    || (existingBoqUrl ? existingBoqUrl.split('/').pop() : null);
                                const sizeKb = uploadedBoqFileSize ? (uploadedBoqFileSize / 1024).toFixed(1) : null;

                                if (!activeUrl && !fileLabel) return null;

                                return (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-600">
                                            <span>{t('admin.create.boq.uploadedFile')}:{" "}</span>
                                            <span className="font-medium break-all">{fileLabel}</span>
                                            {sizeKb && <span className="text-gray-400"> ({sizeKb} KB)</span>}
                                        </p>
                                        {activeUrl && (
                                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(activeUrl, '_blank', 'noopener,noreferrer')}
                                                >
                                                    {t('admin.create.boq.openPdf')}
                                                </Button>
                                                <a
                                                    href={activeUrl}
                                                    download={fileLabel || undefined}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    {t('admin.create.boq.downloadPdf')}
                                                </a>
                                            </div>
                                        )}
                                        {activeUrl && (
                                            <div className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                                <iframe
                                                    title={t('admin.create.boq.uploadLabel')}
                                                    src={activeUrl}
                                                    className="w-full min-h-[260px] sm:min-h-[360px] border-0"
                                                    style={{ height: 'clamp(260px, 50vh, 640px)' }}
                                                />
                                                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-[10px] sm:text-xs text-gray-500 text-left">
                                                    {t('admin.create.boq.previewFallback')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Editable BOQ items table */}
                            {boqItems.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">
                                                <span>Extracted BOQ Items</span>
                                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-semibold">{boqItems.length}</span>
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5"><span>Review all items below. Edit, delete or add missing rows before saving.</span></p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBoqItems(prev => [...prev, { description: '', unit: '', quantity: 1, item_type: 'unit_priced' }])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Row
                                        </button>
                                    </div>

                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                                                        <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Unit</th>
                                                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Qty</th>
                                                        <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Type</th>
                                                        <th className="px-3 py-2.5 w-16 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {boqItems.map((item, index) => (
                                                        <tr key={index} className="group hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-3 py-2 text-xs text-gray-400 font-medium">{index + 1}</td>
                                                            <td className="px-3 py-2">
                                                                <textarea
                                                                    value={item.description}
                                                                    onChange={e => setBoqItems(prev => prev.map((it, i) => i === index ? { ...it, description: e.target.value } : it))}
                                                                    rows={2}
                                                                    placeholder="Item description..."
                                                                    className="w-full text-sm text-gray-800 resize-none bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-2 py-1 outline-none transition-colors leading-snug min-w-[200px]"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.unit}
                                                                    onChange={e => setBoqItems(prev => prev.map((it, i) => i === index ? { ...it, unit: e.target.value } : it))}
                                                                    placeholder="mq, nr…"
                                                                    className="w-full text-sm text-center text-gray-700 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-1 py-1 outline-none transition-colors"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="any"
                                                                    value={item.quantity}
                                                                    disabled={item.item_type === 'lump_sum'}
                                                                    onChange={e => setBoqItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: parseFloat(e.target.value) || 0 } : it))}
                                                                    className="w-full text-sm text-center font-semibold text-gray-900 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-1 py-1 outline-none transition-colors disabled:opacity-40"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={item.item_type}
                                                                    onChange={e => setBoqItems(prev => prev.map((it, i) => i === index ? { ...it, item_type: e.target.value } : it))}
                                                                    className="w-full text-xs text-center text-gray-600 bg-transparent border border-transparent focus:border-blue-300 focus:bg-white rounded px-1 py-1 outline-none transition-colors cursor-pointer"
                                                                >
                                                                    <option value="unit_priced">Unit priced</option>
                                                                    <option value="lump_sum">Lump sum</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBoqItems(prev => { const n = [...prev]; if (index > 0) { [n[index-1], n[index]] = [n[index], n[index-1]]; } return n; })}
                                                                        disabled={index === 0}
                                                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-20"
                                                                        title="Move up"
                                                                    >
                                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBoqItems(prev => { const n = [...prev]; if (index < n.length-1) { [n[index], n[index+1]] = [n[index+1], n[index]]; } return n; })}
                                                                        disabled={index === boqItems.length - 1}
                                                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-20"
                                                                        title="Move down"
                                                                    >
                                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setBoqItems(prev => prev.filter((_, i) => i !== index))}
                                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                                        title="Delete row"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Add row — bottom of table */}
                                        <button
                                            type="button"
                                            onClick={() => setBoqItems(prev => [...prev, { description: '', unit: '', quantity: 1, item_type: 'unit_priced' }])}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-200 transition-colors"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Add missing row</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`${basePath}/tenders`)}
                                disabled={saving}
                            >
                                {t('admin.create.cancel')}
                            </Button>

                            {isEditMode && formData.status === 'draft' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePublish}
                                    disabled={saving}
                                    className="border-green-500 text-green-600 hover:bg-green-50"
                                >
                                    {saving ? t('admin.create.publishing') : t('admin.create.publish')}
                                </Button>
                            )}

                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {isEditMode ? t('admin.create.updating') : t('admin.create.creating')}
                                    </>
                                ) : (
                                    isEditMode ? t('admin.create.update') : t('admin.create.submit')
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateTender;
