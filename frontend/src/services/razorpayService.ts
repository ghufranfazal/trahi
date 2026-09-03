/**
 * Razorpay Payment Gateway Integration Service (Test Mode)
 * Frontend-only integration using Razorpay Standard Checkout JS library.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayCheckoutParams {
  keyId?: string;
  amount: number; // in INR (e.g. 500)
  title?: string;
  description?: string;
  donorName?: string;
  donorEmail?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Dynamically load the Razorpay Checkout JavaScript SDK if not already loaded.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Launch the Razorpay Checkout Modal
 */
export async function openRazorpayCheckout(params: RazorpayCheckoutParams): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  // Use public key from env var or fallback test key ID
  const razorpayKey = params.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_12345678901234';

  const options = {
    key: razorpayKey,
    amount: Math.round(params.amount * 100), // Amount in paise (1 INR = 100 paise)
    currency: 'INR',
    name: 'Trahi Emergency Relief',
    description: params.description || params.title || 'Disaster Relief Contribution',
    image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=trahi_relief',
    handler: function (response: { razorpay_payment_id: string }) {
      if (response && response.razorpay_payment_id) {
        params.onSuccess(response.razorpay_payment_id);
      } else {
        if (params.onError) {
          params.onError(new Error('Payment succeeded but no payment ID returned.'));
        }
      }
    },
    modal: {
      ondismiss: function () {
        if (params.onDismiss) {
          params.onDismiss();
        }
      },
      escape: true,
      backdropclose: false,
    },
    prefill: {
      name: params.donorName || '',
      email: params.donorEmail || '',
    },
    theme: {
      color: '#0F9D8F',
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response: any) {
    console.error('Razorpay Payment Failed:', response.error);
    if (params.onError) {
      params.onError(response.error || new Error('Payment failed.'));
    }
  });

  rzp.open();
}
