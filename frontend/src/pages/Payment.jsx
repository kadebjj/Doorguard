import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPaymentStatus } from '../lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId, 0);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const pollPaymentStatus = async (stripeSessionId, attempts) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await getPaymentStatus(stripeSessionId);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('expired');
        return;
      }

      setTimeout(() => pollPaymentStatus(stripeSessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4" data-testid="payment-success">
      <div className="max-w-md w-full text-center">
        {status === 'checking' && (
          <div className="animate-fade-in">
            <Loader2 className="w-16 h-16 text-[#C0A062] mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
            <p className="text-zinc-400">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-zinc-400 mb-8">
              Your session has been booked. The trainer will confirm shortly.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/sessions')} 
                className="btn-primary w-full"
                data-testid="view-sessions-btn"
              >
                View My Sessions
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'expired' || status === 'timeout') && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {status === 'timeout' ? 'Payment Status Unknown' : 'Payment Failed'}
            </h1>
            <p className="text-zinc-400 mb-8">
              {status === 'timeout' 
                ? 'We could not confirm your payment. Please check your email or sessions page.'
                : 'Something went wrong with your payment. Please try again.'}
            </p>
            <Button 
              onClick={() => navigate('/trainers')} 
              className="btn-primary w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4" data-testid="payment-cancel">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-zinc-400 mb-8">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/trainers')} 
            className="btn-primary w-full"
          >
            Find a Trainer
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export { PaymentSuccess, PaymentCancel };
