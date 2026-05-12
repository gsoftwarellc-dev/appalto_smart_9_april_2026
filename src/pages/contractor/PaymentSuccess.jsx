import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import BackendApiService from '../../services/backendApi';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [credits, setCredits] = useState(0);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) { setStatus('error'); return; }

        BackendApiService.verifyStripeSession(sessionId)
            .then(data => {
                if (data.paid) {
                    setCredits(data.credits);
                    setBalance(data.balance);
                    setStatus('success');
                    window.dispatchEvent(new CustomEvent('appalto:credits-updated', {
                        detail: { balance: Number(data.balance ?? 0) },
                    }));
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-14 w-14 animate-spin text-blue-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Confirming your payment...</h2>
                        <p className="text-gray-500 mt-2">Please wait a moment.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-500 mb-1">
                            <span className="font-semibold text-gray-800">{credits} credits</span> have been added to your account.
                        </p>
                        <p className="text-sm text-gray-400 mb-8">Your new balance is <strong>{balance} credits</strong>.</p>
                        <Button className="w-full h-12 text-base" onClick={() => navigate('/contractor/billing')}>
                            Back to Billing
                        </Button>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-500 mb-8">We could not verify your payment. If you were charged, please contact support.</p>
                        <Button className="w-full h-12 text-base" onClick={() => navigate('/contractor/billing')}>
                            Back to Billing
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
