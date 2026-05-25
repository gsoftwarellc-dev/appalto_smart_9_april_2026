import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/backendApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Save, RefreshCw, Settings, ToggleLeft, ToggleRight, Coins, Euro, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Link2, Unlink, Copy, Check, Lock as LockIcon, Gift, Percent, ImagePlus, Trash2, GripVertical, ChevronUp, ChevronDown, Megaphone } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';

import { Trans } from 'react-i18next';

const BUDGET_CREDIT_RANGES = [
    { budgetRange: '0-50000', labelKey: 'owner.configuration.budgetLess50k' },
    { budgetRange: '50000-100000', labelKey: 'owner.configuration.budget50k100k' },
    { budgetRange: '100000-250000', labelKey: 'owner.configuration.budget100k250k' },
    { budgetRange: '250000+', labelKey: 'owner.configuration.budgetMore250k' },
];

const DEFAULT_BUDGET_RANGE_RULES = [
    { budgetRange: '0-50000', credits: 10 },
    { budgetRange: '50000-100000', credits: 15 },
    { budgetRange: '100000-250000', credits: 25 },
    { budgetRange: '250000+', credits: 40 },
];

const normalizeBudgetRangeRules = (rules) => {
    const parsedRules = Array.isArray(rules) ? rules : DEFAULT_BUDGET_RANGE_RULES;

    return BUDGET_CREDIT_RANGES.map((range) => {
        const savedRule = parsedRules.find(rule => rule.budgetRange === range.budgetRange);
        return {
            budgetRange: range.budgetRange,
            credits: savedRule?.credits ?? DEFAULT_BUDGET_RANGE_RULES.find(rule => rule.budgetRange === range.budgetRange)?.credits ?? 0,
        };
    });
};

const Configuration = () => {
    const { t } = useTranslation();

    // Default Configuration State
    const [config, setConfig] = useState({
        creditsPerEuro: 1,
        creditRequirementMode: 'budget_range',
        fixedTenderUnlockCredits: 50,
        budgetRangeCreditRules: DEFAULT_BUDGET_RANGE_RULES,
        welcomeCredits: 0,
        successFeePercent: 3.0,
        successFeeDiscountEnabled: false,
        successFeeDiscountPercent: 0,
        successFeeDiscountDays: 0,
        tenderDurationDays: 15,
        autoApproveClients: false,
        stripePublishableKey: '',
        stripeSecretKey: '',
        stripeTestMode: true,
    });

    const [banners, setBanners] = useState([]);

    const newBanner = () => ({
        id: Date.now(),
        active: true,
        image: '',
        tag: '',
        title: '',
        subtitle: '',
        ctaText: '',
        ctaUrl: '',
        ctaColor: '#eb761b',
        bgColor: 'linear-gradient(135deg,#1e3a5f 0%,#0f2744 100%)',
    });

    const updateBanner = (id, field, value) =>
        setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));

    const deleteBanner = (id) => setBanners(prev => prev.filter(b => b.id !== id));

    const moveBanner = (index, dir) => setBanners(prev => {
        const next = [...prev];
        const target = index + dir;
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    });

    const handleBannerImage = (id, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => updateBanner(id, 'image', e.target.result);
        reader.readAsDataURL(file);
    };

    const [stripeConnected, setStripeConnected] = useState(false);
    const [stripeConnecting, setStripeConnecting] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);
    const [showPublishableKey, setShowPublishableKey] = useState(false);
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const savedConfigRef = useRef(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await api.getSystemConfig();
                if (data && Object.keys(data).length > 0) {
                    const formatted = { ...data };
                    if (formatted.autoApproveClients) formatted.autoApproveClients = formatted.autoApproveClients === '1' || formatted.autoApproveClients === 'true';
                    if (formatted.stripeTestMode) formatted.stripeTestMode = formatted.stripeTestMode === '1' || formatted.stripeTestMode === 'true' || formatted.stripeTestMode === true;
                    if (formatted.successFeeDiscountEnabled !== undefined) formatted.successFeeDiscountEnabled = formatted.successFeeDiscountEnabled === '1' || formatted.successFeeDiscountEnabled === 'true' || formatted.successFeeDiscountEnabled === true;
                    formatted.budgetRangeCreditRules = normalizeBudgetRangeRules(formatted.budgetRangeCreditRules);
                    if (formatted.homepageBanners) {
                        setBanners(Array.isArray(formatted.homepageBanners) ? formatted.homepageBanners : []);
                        delete formatted.homepageBanners;
                    }
                    const merged = { ...config, ...formatted };
                    setConfig(merged);
                    savedConfigRef.current = JSON.stringify(merged);
                } else {
                    savedConfigRef.current = JSON.stringify(config);
                }
            } catch (error) {
                console.error('Failed to fetch system config:', error);
                savedConfigRef.current = JSON.stringify(config);
            }
        };
        fetchConfig();
    }, []);

    const isDirty = savedConfigRef.current !== null && JSON.stringify(config) !== savedConfigRef.current;

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleRangeCreditChange = (budgetRange, credits) => {
        setConfig(prev => ({
            ...prev,
            budgetRangeCreditRules: normalizeBudgetRangeRules(prev.budgetRangeCreditRules).map(rule =>
                rule.budgetRange === budgetRange ? { ...rule, credits } : rule
            ),
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.updateSystemConfig({ ...config, creditRequirementMode: 'budget_range', homepageBanners: banners });
            savedConfigRef.current = JSON.stringify(config);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2500);
        } catch (error) {
            console.error('Failed to update config:', error);
            alert(t('owner.configuration.saveError') || 'Failed to update configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    const rate = parseFloat(config.creditsPerEuro) || 0;
    const budgetRangeRules = normalizeBudgetRangeRules(config.budgetRangeCreditRules);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('owner.configuration.title')}</h2>
                <p className="text-gray-500">{t('owner.configuration.subtitle')}</p>
            </div>

            {/* Credit Pricing Section */}
            <Card className="border-2 border-blue-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Coins className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{t('owner.configuration.creditPricing')}</h3>
                            <p className="text-blue-100 text-sm">{t('owner.configuration.creditPricingDesc')}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="max-w-md">
                        <Label htmlFor="credits-per-euro" className="text-sm font-semibold text-gray-700 mb-2 block">
                            {t('owner.configuration.creditsPerEuro')}
                        </Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-0 flex-1">
                                <div className="flex items-center justify-center h-10 w-12 bg-blue-100 border border-r-0 border-blue-200 rounded-l-md">
                                    <span className="text-blue-600 font-bold text-lg">€1</span>
                                </div>
                                <div className="flex items-center justify-center h-10 px-3 bg-gray-50 border-y border-gray-200 text-gray-400 font-medium">
                                    =
                                </div>
                                <Input
                                    id="credits-per-euro"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={config.creditsPerEuro}
                                    onChange={(e) => handleChange('creditsPerEuro', e.target.value)}
                                    className="rounded-l-none border-l-0 font-bold text-lg text-center w-28"
                                />
                                <div className="flex items-center justify-center h-10 px-3 bg-amber-50 border border-l-0 border-amber-200 rounded-r-md">
                                    <Coins className="h-4 w-4 text-amber-500 mr-1" />
                                    <span className="text-amber-700 font-medium text-sm">{t('owner.configuration.credits')}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 font-medium">
                            <Trans i18nKey="owner.configuration.contractorReceives" values={{ credits: config.creditsPerEuro || 0 }}>Contractors will receive <span className="font-bold text-amber-600">{config.creditsPerEuro || 0}</span> credits for every €1 they buy.</Trans>
                        </p>
                    </div>


                </CardContent>
            </Card>

            {/* Tender Unlock Credit Requirement */}
            <Card className="border border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-amber-200">
                            <LockIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg">{t('owner.configuration.tenderUnlockCredits')}</h3>
                            <p className="text-gray-600 text-sm">{t('owner.configuration.tenderUnlockCreditsDesc')}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="rounded-lg border border-amber-200 bg-white p-5 max-w-3xl">
                        <div className="space-y-3">
                            {BUDGET_CREDIT_RANGES.map(range => {
                                const rule = budgetRangeRules.find(item => item.budgetRange === range.budgetRange);
                                return (
                                    <div key={range.budgetRange} className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
                                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                                            {t(range.labelKey)}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={rule?.credits ?? 0}
                                                onChange={(e) => handleRangeCreditChange(range.budgetRange, e.target.value)}
                                                className="pr-14 text-right font-semibold"
                                                aria-label={`${t(range.labelKey)} credits`}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-500">{t('owner.configuration.credits')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Welcome Credits for New Contractors */}
            <Card className="border border-green-200 shadow-sm overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-green-200">
                            <Gift className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-gray-900 font-bold text-lg">{t('owner.configuration.welcomeCredits')}</h3>
                            <p className="text-gray-600 text-sm">{t('owner.configuration.welcomeCreditsDesc')}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="max-w-sm">
                        <Label htmlFor="welcome-credits" className="text-sm font-semibold text-gray-700 mb-2 block">
                            {t('owner.configuration.welcomeCreditsLabel')}
                        </Label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Input
                                    id="welcome-credits"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={config.welcomeCredits}
                                    onChange={(e) => handleChange('welcomeCredits', e.target.value)}
                                    className="pr-16 font-semibold text-lg"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-gray-500">{t('owner.configuration.credits')}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {parseInt(config.welcomeCredits) > 0
                                ? t('owner.configuration.welcomeCreditsHint', { credits: config.welcomeCredits })
                                : t('owner.configuration.welcomeCreditsDisabled')}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Commission Discount */}
            <Card className="border border-blue-200 shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-blue-200">
                                <Percent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-bold text-lg">{t('owner.configuration.commissionDiscount')}</h3>
                                <p className="text-gray-600 text-sm">{t('owner.configuration.commissionDiscountDesc')}</p>
                            </div>
                        </div>
                        <button onClick={() => handleChange('successFeeDiscountEnabled', !config.successFeeDiscountEnabled)}>
                            {config.successFeeDiscountEnabled
                                ? <ToggleRight className="h-8 w-8 text-blue-600" />
                                : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                        </button>
                    </div>
                </div>
                <CardContent className={`p-6 transition-opacity ${config.successFeeDiscountEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="grid gap-5 sm:grid-cols-2 max-w-lg">
                        <div>
                            <Label htmlFor="discount-percent" className="text-sm font-semibold text-gray-700 mb-2 block">
                                {t('owner.configuration.discountPercent')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="discount-percent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={config.successFeeDiscountPercent}
                                    onChange={(e) => handleChange('successFeeDiscountPercent', e.target.value)}
                                    className="pr-8 font-semibold"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{t('owner.configuration.discountPercentHint', { base: config.successFeePercent, effective: Math.max(0, parseFloat(config.successFeePercent) - parseFloat(config.successFeeDiscountPercent || 0)).toFixed(1) })}</p>
                        </div>
                        <div>
                            <Label htmlFor="discount-days" className="text-sm font-semibold text-gray-700 mb-2 block">
                                {t('owner.configuration.discountDays')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="discount-days"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={config.successFeeDiscountDays}
                                    onChange={(e) => handleChange('successFeeDiscountDays', e.target.value)}
                                    className="pr-14 font-semibold"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-gray-500">{t('owner.configuration.days')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {parseInt(config.successFeeDiscountDays) > 0
                                    ? t('owner.configuration.discountDaysHint', { days: config.successFeeDiscountDays })
                                    : t('owner.configuration.discountDaysForever')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Financial Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-600" /> {t('owner.configuration.financial')}
                        </CardTitle>
                        <CardDescription>{t('owner.configuration.financialDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="success-fee">{t('owner.configuration.successFee')}</Label>
                            <div className="relative">
                                <Input
                                    id="success-fee"
                                    type="number"
                                    step="0.1"
                                    value={config.successFeePercent}
                                    onChange={(e) => handleChange('successFeePercent', e.target.value)}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500">{t('owner.configuration.successFeeDesc')}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Operational Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-green-600" /> {t('owner.configuration.operational')}
                        </CardTitle>
                        <CardDescription>{t('owner.configuration.operationalDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tender-duration">{t('owner.configuration.tenderDuration')}</Label>
                            <Input
                                id="tender-duration"
                                type="number"
                                value={config.tenderDurationDays}
                                onChange={(e) => handleChange('tenderDurationDays', e.target.value)}
                            />
                        </div>

                        <div className="pt-4 pb-2">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">{t('owner.configuration.aiModules')}</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 border rounded bg-white">
                                    <Label className="text-sm cursor-pointer" htmlFor="ai-boq">{t('owner.configuration.autoBoq')}</Label>
                                    <Switch
                                        id="ai-boq"
                                        checked={true}
                                        onCheckedChange={() => { }}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded bg-white">
                                    <Label className="text-sm cursor-pointer" htmlFor="ai-match">{t('owner.configuration.smartMatching')}</Label>
                                    <Switch
                                        id="ai-match"
                                        checked={true}
                                        onCheckedChange={() => { }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-0.5">
                                <Label className="text-base">{t('owner.configuration.autoApprove')}</Label>
                                <p className="text-xs text-gray-500">{t('owner.configuration.autoApproveDesc')}</p>
                            </div>
                            <button onClick={() => handleChange('autoApproveClients', !config.autoApproveClients)}>
                                {config.autoApproveClients ? (
                                    <ToggleRight className="h-8 w-8 text-green-600" />
                                ) : (
                                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Homepage Banner Ads */}
            <Card className="border border-orange-200 shadow-sm overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-orange-200">
                                <Megaphone className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-bold text-lg">Homepage Banners</h3>
                                <p className="text-gray-600 text-sm">Manage sponsored ads shown on the public homepage. Supports image, text, and a CTA button.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setBanners(prev => [...prev, newBanner()])}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                            <ImagePlus className="h-4 w-4" />
                            Add Banner
                        </button>
                    </div>
                </div>
                <CardContent className="p-6 space-y-5">
                    {banners.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-orange-200 rounded-xl">
                            <Megaphone className="h-10 w-10 text-orange-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500">No banners yet.</p>
                            <p className="text-xs text-gray-400 mt-1">Click "Add Banner" to create your first sponsored ad.</p>
                        </div>
                    )}

                    {banners.map((banner, index) => (
                        <div key={banner.id} className={`rounded-xl border ${banner.active ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 bg-gray-50/50'} overflow-hidden`}>
                            {/* Banner header row */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200/60 bg-white/60">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                    <span className="text-sm font-semibold text-gray-700 truncate max-w-[160px]">{banner.title || 'Untitled banner'}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {banner.active ? 'Active' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveBanner(index, -1)} disabled={index === 0} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors" title="Move up">
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => moveBanner(index, 1)} disabled={index === banners.length - 1} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition-colors" title="Move down">
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => updateBanner(banner.id, 'active', !banner.active)} className={`p-1.5 rounded transition-colors ${banner.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title="Toggle visibility">
                                        {banner.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                    </button>
                                    <button onClick={() => deleteBanner(banner.id)} className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Banner fields */}
                            <div className="p-4 grid gap-4 sm:grid-cols-2">
                                {/* Image upload */}
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Banner Image</label>
                                    <div className="flex items-start gap-3">
                                        {banner.image ? (
                                            <div className="relative shrink-0">
                                                <img src={banner.image} alt="preview" className="h-20 w-36 object-cover rounded-lg border border-gray-200" />
                                                <button onClick={() => updateBanner(banner.id, 'image', '')} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="h-20 w-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors shrink-0">
                                                <ImagePlus className="h-6 w-6 text-gray-400" />
                                                <span className="text-[10px] text-gray-400 mt-1">Upload image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleBannerImage(banner.id, e.target.files[0])} />
                                            </label>
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <label className="text-[11px] text-gray-500 mb-0.5 block">Fallback background color/gradient</label>
                                                <input
                                                    type="text"
                                                    value={banner.bgColor}
                                                    onChange={e => updateBanner(banner.id, 'bgColor', e.target.value)}
                                                    placeholder="e.g. #1e3a5f or linear-gradient(...)"
                                                    className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-orange-400 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tag */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tag / Label <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={banner.tag}
                                        onChange={e => updateBanner(banner.id, 'tag', e.target.value)}
                                        placeholder="e.g. Partner, Sponsored, New"
                                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Title</label>
                                    <input
                                        type="text"
                                        value={banner.title}
                                        onChange={e => updateBanner(banner.id, 'title', e.target.value)}
                                        placeholder="e.g. Premium Construction Materials"
                                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>

                                {/* Subtitle */}
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Subtitle / Description <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={banner.subtitle}
                                        onChange={e => updateBanner(banner.id, 'subtitle', e.target.value)}
                                        placeholder="e.g. Trusted by 500+ contractors across Italy"
                                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>

                                {/* CTA Text */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Button Text <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={banner.ctaText}
                                        onChange={e => updateBanner(banner.id, 'ctaText', e.target.value)}
                                        placeholder="e.g. Learn More, Visit Site"
                                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>

                                {/* CTA URL */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Button Link (URL)</label>
                                    <input
                                        type="url"
                                        value={banner.ctaUrl}
                                        onChange={e => updateBanner(banner.id, 'ctaUrl', e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>

                                {/* CTA button color */}
                                <div className="flex items-center gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Button Color</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={banner.ctaColor}
                                                onChange={e => updateBanner(banner.id, 'ctaColor', e.target.value)}
                                                className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5"
                                            />
                                            <span className="text-xs text-gray-500 font-mono">{banner.ctaColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Live preview chip */}
                                {banner.ctaText && (
                                    <div className="flex items-center">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Button Preview</label>
                                            <span
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow"
                                                style={{ background: banner.ctaColor }}
                                            >
                                                {banner.ctaText}
                                                <ExternalLink className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {banners.length > 0 && (
                        <p className="text-xs text-gray-400 text-center">
                            <span>{banners.filter(b => b.active).length} active banner{banners.filter(b => b.active).length !== 1 ? 's' : ''} will rotate automatically on the homepage.</span>
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Stripe Integration Section */}
            <Card className="border-2 border-purple-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#635BFF] to-[#7A73FF] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">{t('owner.configuration.stripeGateway')}</h3>
                                <p className="text-purple-100 text-sm">{t('owner.configuration.stripeGatewayDesc')}</p>
                            </div>
                        </div>
                        {stripeConnected ? (
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <CheckCircle2 className="h-4 w-4 text-green-300" />
                                <span className="text-white text-sm font-medium">{t('owner.configuration.connected')}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <AlertCircle className="h-4 w-4 text-yellow-300" />
                                <span className="text-white/80 text-sm">{t('owner.configuration.notConnected')}</span>
                            </div>
                        )}
                    </div>
                </div>
                <CardContent className="p-6 space-y-5">
                    {/* API Keys */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="stripe-pk" className="text-sm font-semibold text-gray-700">{t('owner.configuration.publishableKey')}</Label>
                            <div className="relative">
                                <Input
                                    id="stripe-pk"
                                    type={showPublishableKey ? 'text' : 'password'}
                                    placeholder="pk_test_..."
                                    value={config.stripePublishableKey}
                                    onChange={(e) => handleChange('stripePublishableKey', e.target.value)}
                                    className="pr-10 font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPublishableKey(!showPublishableKey)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPublishableKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="stripe-sk" className="text-sm font-semibold text-gray-700">{t('owner.configuration.secretKey')}</Label>
                            <div className="relative">
                                <Input
                                    id="stripe-sk"
                                    type={showSecretKey ? 'text' : 'password'}
                                    placeholder="sk_test_..."
                                    value={config.stripeSecretKey}
                                    onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                                    className="pr-10 font-mono text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline flex items-center gap-1">
                                    {t('owner.configuration.getStripeKeys')} <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-amber-50/50 border-amber-200">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold text-gray-800">{t('owner.configuration.testMode')}</Label>
                            <p className="text-xs text-gray-500">{t('owner.configuration.testModeDesc')}</p>
                        </div>
                        <button onClick={() => handleChange('stripeTestMode', !config.stripeTestMode)}>
                            {config.stripeTestMode ? (
                                <ToggleRight className="h-8 w-8 text-amber-500" />
                            ) : (
                                <ToggleLeft className="h-8 w-8 text-gray-400" />
                            )}
                        </button>
                    </div>

                    {/* Connect / Disconnect Button */}
                    {!stripeConnected ? (
                        <Button
                            onClick={() => {
                                if (!config.stripePublishableKey || !config.stripeSecretKey) {
                                    alert(t('owner.configuration.pleaseEnterKeys'));
                                    return;
                                }
                                setStripeConnecting(true);
                                setTimeout(() => {
                                    setStripeConnected(true);
                                    setStripeConnecting(false);
                                }, 1500);
                            }}
                            disabled={stripeConnecting || !config.stripePublishableKey || !config.stripeSecretKey}
                            className="w-full h-11 bg-[#635BFF] hover:bg-[#5851DB] text-white shadow-md hover:shadow-lg transition-all"
                        >
                            {stripeConnecting ? (
                                <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> {t('owner.configuration.connectingStripe')}</>
                            ) : (
                                <><Link2 className="h-4 w-4 mr-2" /> {t('owner.configuration.connectStripe')}</>
                            )}
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            {/* Connected Status */}
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-1.5 bg-green-100 rounded-full">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-green-800">{t('owner.configuration.stripeConnected')}</p>
                                        <p className="text-xs text-green-600">{config.stripeTestMode ? t('owner.configuration.runningTestMode') : t('owner.configuration.runningLiveMode')}</p>
                                    </div>
                                </div>

                                {/* Webhook URL */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-green-700">{t('owner.configuration.webhookEndpoint')}</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-green-200 rounded-md px-3 py-2 text-xs font-mono text-gray-600 truncate">
                                            {window.location.origin}/api/stripe/webhook
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/api/stripe/webhook`);
                                                setCopiedWebhook(true);
                                                setTimeout(() => setCopiedWebhook(false), 2000);
                                            }}
                                            className="p-2 bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
                                        >
                                            {copiedWebhook ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-green-600">{t('owner.configuration.addWebhook')}</p>
                                </div>
                            </div>

                            {/* Disconnect */}
                            <button
                                onClick={() => {
                                    if (confirm(t('owner.configuration.disconnectConfirm'))) {
                                        setStripeConnected(false);
                                    }
                                }}
                                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
                            >
                                <Unlink className="h-4 w-4" /> {t('owner.configuration.disconnectStripe')} </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Floating Save Bar — only visible when changes are made */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out ${
                isDirty || showSaved ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}>
                <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-6 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {showSaved ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-medium text-green-700">{t('owner.configuration.changesSaved')}</span>
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-sm font-medium text-gray-700">{t('owner.configuration.unsavedChanges')}</span>
                                </>
                            )}
                        </div>
                        {!showSaved && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (savedConfigRef.current) {
                                            setConfig(JSON.parse(savedConfigRef.current));
                                        }
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                >{t('owner.configuration.discard')}</button>
                                <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px] shadow-md">
                                    {isSaving ? (
                                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t('owner.configuration.saving')}</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> {t('owner.configuration.save')}</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
