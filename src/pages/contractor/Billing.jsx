import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { CreditCard, ArrowUpRight, ArrowDownRight, Loader2, Coins, ShoppingCart, Shield } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { formatEuro } from '../../utils/currency';
import { Badge } from '../../components/ui/Badge';


/* ─── Main Billing Page ─── */
const Billing = () => {
    const { t } = useTranslation();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creditsPerEuro, setCreditsPerEuro] = useState(1);
    const [creditsToBuy, setCreditsToBuy] = useState('');
    const [redirecting, setRedirecting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getBillingOverview();
            setBalance(data.balance);
            setTransactions(data.transactions);
            if (data.creditsPerEuro) setCreditsPerEuro(parseFloat(data.creditsPerEuro));
        } catch (err) {
            console.error("Failed to fetch billing data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const creditsNum = parseInt(creditsToBuy) || 0;
    const totalPrice = creditsPerEuro > 0 ? (creditsNum / creditsPerEuro) : 0;

    const handleBuyNow = async () => {
        if (creditsNum <= 0) return;
        setRedirecting(true);
        try {
            const { url } = await BackendApiService.createStripeCheckout(creditsNum);
            window.location.href = url;
        } catch {
            setRedirecting(false);
            alert('Could not start checkout. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('contractor.billing.title')}</h2>
                <p className="text-gray-500">{t('contractor.billing.subtitle')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Balance Card */}
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">{t('contractor.billing.balanceTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-900">
                            {loading ? <Loader2 className="h-8 w-8 animate-spin inline" /> : `${balance} ${t('contractor.billing.credits')}`}
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-sm text-blue-700">
                            <Coins className="h-4 w-4" />
                            <span>Rate: <strong>{creditsPerEuro}</strong> {creditsPerEuro === 1 ? 'credit' : 'credits'} per €1</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Buy Credits Card */}
                <Card className="md:col-span-2 border-2 border-amber-100 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center gap-3">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><ShoppingCart className="h-5 w-5 text-white" /></div>
                        <div>
                            <h3 className="text-white font-bold">Buy Credits</h3>
                            <p className="text-amber-100 text-xs">Enter the number of credits you want to purchase</p>
                        </div>
                    </div>
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="credits-input" className="text-sm font-semibold text-gray-700">Number of Credits</Label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                                    <Input id="credits-input" type="number" min="1" placeholder="e.g. 100" value={creditsToBuy} onChange={(e) => setCreditsToBuy(e.target.value)} className="pl-9 text-lg font-medium" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-sm font-semibold text-gray-700">Total Price</Label>
                                <div className="h-10 flex items-center px-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <span className="text-2xl font-bold text-gray-900">€{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button size="lg" onClick={handleBuyNow} disabled={creditsNum <= 0 || redirecting} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all min-w-[140px]">
                                {redirecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('contractor.billing.redirecting')}</> : <><ShoppingCart className="h-4 w-4 mr-2" /> {t('contractor.billing.buyNow')}</>}
                            </Button>
                        </div>
                        {creditsPerEuro > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {[50, 100, 200, 500].map(c => (
                                    <button key={c} onClick={() => setCreditsToBuy(String(c))} className={`px-3 py-1.5 text-sm rounded-full border transition-all ${parseInt(creditsToBuy) === c ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                        {c} credits — €{(c / creditsPerEuro).toFixed(2)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader><CardTitle>{t('contractor.billing.txnHistory')}</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
                        ) : transactions.length > 0 ? transactions.map(trx => (
                            <div key={trx.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trx.type === 'purchase' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {trx.type === 'purchase' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{trx.description}</p>
                                        <p className="text-xs text-gray-500">{trx.created_at?.split('T')[0]} • ID: {trx.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${trx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>{trx.amount > 0 ? '+' : ''}{trx.amount} {t('contractor.billing.credits')}</p>
                                    {trx.cash_amount != null && parseFloat(trx.cash_amount) > 0 && (
                                        <p className="text-sm font-semibold text-gray-700">{formatEuro(trx.cash_amount)}</p>
                                    )}
                                    <Badge variant="outline" className="text-xs">{trx.status}</Badge>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 flex flex-col items-center space-y-3">
                                <div className="bg-gray-100 p-3 rounded-full"><ArrowUpRight className="h-6 w-6 text-gray-400" /></div>
                                <p className="text-gray-500 font-medium">{t('contractor.billing.noTxn')}</p>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">{t('contractor.billing.noTxnDesc')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default Billing;
