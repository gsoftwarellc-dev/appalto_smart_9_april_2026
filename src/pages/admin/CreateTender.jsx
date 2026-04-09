import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Upload, Loader2 } from 'lucide-react';
import BackendApiService from '../../services/backendApi';

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

const CreateTender = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams(); // For edit mode
    const isEditMode = !!id;

    const getDefaultDeadline = () => {
        const date = new Date();
        date.setDate(date.getDate() + 15);
        return date.toISOString().split('T')[0];
    };

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
        city: '',
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

    // Load tender data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            loadTenderData();
        }
    }, [id]);

    const loadTenderData = async () => {
        try {
            setLoading(true);
            const tender = await BackendApiService.getTenderById(id);
            const loc = tender.location || '';
            const lastComma = loc.lastIndexOf(', ');
            const addressPart = lastComma > 0 ? loc.slice(0, lastComma).trim() : loc;
            const cityPart = lastComma > 0 ? loc.slice(lastComma + 2).trim() : '';
            setFormData({
                title: tender.title || '',
                description: tender.description || '',
                deadline: tender.deadline ? tender.deadline.split('T')[0] : getDefaultDeadline(),
                budget: tender.budget || '',
                location: addressPart,
                city: cityPart,
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
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // BOQ Management (items come only from PDF extraction)
    const [boqItems, setBoqItems] = useState([]);

    const removeBoqItem = (index) => {
        const newItems = [...boqItems];
        newItems.splice(index, 1);
        setBoqItems(newItems);
    };

    const handleBoqChange = (index, field, value) => {
        const newItems = [...boqItems];
        newItems[index][field] = value;
        setBoqItems(newItems);
    };

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

            const fullLocation = [formData.location, formData.city].filter(Boolean).join(', ');
            const tenderData = {
                ...formData,
                location: fullLocation,
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
                navigate('/admin/tenders');
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
                navigate('/admin/tenders');
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

                        {/* Address and City */}
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
                                    {t('admin.create.city')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder={t('admin.create.cityPlaceholder')}
                                    required
                                />
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
                                            <p className="text-sm text-gray-600 font-medium">{t('admin.create.boq.upload.processing')} {uploadProgress}%</p>
                                        </>
                                    ) : extractionStatus === 'completed' ? (
                                        <>
                                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <Upload className="h-5 w-5 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{t('admin.create.boq.extraction.complete')}</p>
                                            <p className="text-xs text-gray-500">{t('admin.create.boq.extraction.review')}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-10 w-10 text-gray-400" />
                                            <p className="text-sm text-gray-600 font-medium">{t('admin.create.boq.upload.click')}</p>
                                            <p className="text-xs text-gray-400">{t('admin.create.boq.upload.format')}</p>
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
                                            {t('admin.create.boq.uploadedFile')}:{" "}
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

                            {/* Extracted BOQ items are sent with the form but not shown here:
                                only contractors see and edit the items table (preventivo). */}
                            {boqItems.length > 0 && (
                                <p className="text-sm text-gray-500 pt-2 border-t mt-2">
                                    {t('admin.create.boq.extractedItemsSaved', { count: boqItems.length })}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/tenders')}
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
