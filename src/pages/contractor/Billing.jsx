import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import BackendApiService from '../../services/backendApi';
import { formatEuro } from '../../utils/currency';

const Billing = () => {
    const { t } = useTranslation();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    const [cards] = useState([
        { id: 1, type: 'Visa', last4: '4242', expiry: '12/28', default: true },
        { id: 2, type: 'Mastercard', last4: '8899', expiry: '05/27', default: false },
    ]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await BackendApiService.getBillingOverview();
            setBalance(data.balance);
            setTransactions(data.transactions);
        } catch (err) {
            console.error("Failed to fetch billing data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePurchase = async (packId) => {
        try {
            setPurchaseLoading(true);
            const res = await BackendApiService.purchaseCredits(packId);
            setBalance(res.balance);
            setTransactions(prev => [res.transaction, ...prev]);
            alert(t('contractor.billing.purchaseSuccess'));
        } catch (err) {
            console.error("Purchase failed", err);
            alert(t('contractor.billing.purchaseError'));
        } finally {
            setPurchaseLoading(false);
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
                        <div className="grid grid-cols-1 gap-2 mt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePurchase('basic')}
                                disabled={purchaseLoading}
                            >
                                {t('contractor.billing.buy50')}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handlePurchase('pro')}
                                disabled={purchaseLoading}
                            >
                                {t('contractor.billing.buy150')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('contractor.billing.paymentMethods')}</CardTitle>
                            <CardDescription>{t('contractor.billing.paymentMethodsDesc')}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> {t('contractor.billing.addCard')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cards.map((card) => (
                            <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-14 bg-gray-100 rounded flex items-center justify-center">
                                        <CreditCard className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{card.type} ending in {card.last4}</p>
                                        <p className="text-sm text-gray-500">{t('contractor.billing.expires')} {card.expiry}</p>
                                    </div>
                                </div>
                                {card.default && <Badge variant="secondary">{t('contractor.billing.default')}</Badge>}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('contractor.billing.txnHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
                        ) : transactions.length > 0 ? transactions.map((trx) => (
                            <div key={trx.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trx.type === 'purchase' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {trx.type === 'purchase' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{trx.description}</p>
                                        <p className="text-xs text-gray-500">{trx.created_at?.split('T')[0]} • ID: {trx.id}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${trx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {trx.amount > 0 ? '+' : ''}{trx.amount} {t('contractor.billing.credits')}
                                    </p>
                                    {trx.cash_amount && <p className="text-xs text-gray-400">{formatEuro(trx.cash_amount)}</p>}
                                    <Badge variant="outline" className="text-xs">{trx.status}</Badge>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                                <div className="bg-gray-100 p-3 rounded-full">
                                    <ArrowUpRight className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-medium">{t('contractor.billing.noTxn')}</p>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                    {t('contractor.billing.noTxnDesc')}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Billing;
