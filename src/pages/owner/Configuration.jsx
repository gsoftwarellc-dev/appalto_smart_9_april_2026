import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/backendApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Label } from '../../components/ui/Label';
import { Save, RefreshCw, Settings, ToggleLeft, ToggleRight, Coins, Euro, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Link2, Unlink, Copy, Check, Lock as LockIcon } from 'lucide-react';
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
        successFeePercent: 3.0,
        tenderDurationDays: 15,
        autoApproveClients: false,
        stripePublishableKey: '',
        stripeSecretKey: '',
        stripeTestMode: true,
    });

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
                    formatted.budgetRangeCreditRules = normalizeBudgetRangeRules(formatted.budgetRangeCreditRules);
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
            await api.updateSystemConfig(config);
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
