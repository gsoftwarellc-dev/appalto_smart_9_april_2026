import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="h-10 w-10 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
                <p className="text-gray-500 mb-8">You cancelled the payment. No charges were made. You can try again whenever you're ready.</p>
                <Button className="w-full h-12 text-base" onClick={() => navigate('/contractor/billing')}>
                    Back to Billing
                </Button>
            </div>
        </div>
    );
};

export default PaymentCancel;
