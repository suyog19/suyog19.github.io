/**
 * Razorpay + OTP Integration - Frontend JavaScript Library
 * 
 * This file contains all the frontend logic for:
 * - Razorpay payment integration using Handler Function
 * - OTP verification workflow
 * - API communication with backend
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Include Razorpay SDK: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
 * 2. Include this file: <script src="payment-otp.js"></script>
 * 3. Initialize: PaymentOTP.init(config)
 * 4. Use the provided methods in your forms/buttons
 */

class PaymentOTP {
    constructor() {
        this.config = null;
        this.currentOrder = null;
        this.currentOTPData = null;
    }

    /**
     * Initialize the PaymentOTP library
     * @param {Object} config - Configuration object
     * @param {string} config.razorpayKeyId - Your Razorpay key ID
     * @param {string} config.backendUrl - Your backend API URL
     * @param {Function} config.onSuccess - Success callback
     * @param {Function} config.onError - Error callback
     * @param {Function} config.onOTPSent - OTP sent callback
     * @param {Function} config.onOTPVerified - OTP verified callback
     */
    init(config) {
        this.config = {
            razorpayKeyId: config.razorpayKeyId,
            backendUrl: config.backendUrl || 'http://localhost:5000',
            onSuccess: config.onSuccess || console.log,
            onError: config.onError || console.error,
            onOTPSent: config.onOTPSent || console.log,
            onOTPVerified: config.onOTPVerified || console.log,
            ...config
        };

        if (!this.config.razorpayKeyId) {
            throw new Error('Razorpay Key ID is required');
        }

        console.log('PaymentOTP initialized with config:', this.config);
    }

    /**
     * Create a payment order
     * @param {Object} orderData - Order details
     * @param {number} orderData.amount - Amount in rupees
     * @param {string} orderData.customer_name - Customer name
     * @param {string} orderData.customer_phone - Customer phone
     * @param {string} orderData.customer_email - Customer email
     * @returns {Promise<Object>} Order details
     */
    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.config.backendUrl}/api/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Order creation failed');
            }

            this.currentOrder = result.order;
            this.currentOrder.customer = {
                name: orderData.customer_name,
                phone: orderData.customer_phone,
                email: orderData.customer_email
            };

            return result;

        } catch (error) {
            this.config.onError('Order creation failed: ' + error.message);
            throw error;
        }
    }

    /**
     * Open Razorpay payment gateway
     * @param {Object} options - Additional Razorpay options (optional)
     */
    openPaymentGateway(options = {}) {
        if (!this.currentOrder) {
            throw new Error('Please create an order first');
        }

        const defaultOptions = {
            key: this.config.razorpayKeyId,
            amount: this.currentOrder.amount,
            currency: this.currentOrder.currency,
            name: 'Payment with OTP',
            description: 'Payment with OTP verification',
            order_id: this.currentOrder.id,
            
            // 🎯 PRIMARY METHOD: Handler Function
            handler: (response) => {
                this._handlePaymentSuccess(response);
            },
            
            // Customer prefill
            prefill: {
                name: this.currentOrder.customer.name,
                email: this.currentOrder.customer.email,
                contact: this.currentOrder.customer.phone
            },
            
            // Theme
            theme: {
                color: '#3399cc'
            },
            
            // Modal settings
            modal: {
                ondismiss: () => {
                    this.config.onError('Payment cancelled by user');
                }
            },
            
            // Merge with custom options
            ...options
        };

        const rzp = new Razorpay(defaultOptions);
        rzp.open();
    }

    /**
     * Handle successful payment (internal method)
     * @private
     */
    async _handlePaymentSuccess(response) {
        try {
            console.log('Payment successful:', response);

            // Verify payment and send OTP
            const verificationResult = await this._verifyPaymentAndSendOTP(response);
            
            if (verificationResult.success) {
                this.currentOTPData = {
                    phone: this.currentOrder.customer.phone,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id
                };

                this.config.onSuccess({
                    payment: response,
                    verification: verificationResult,
                    nextStep: 'otp_verification'
                });

                this.config.onOTPSent({
                    phone: this.currentOrder.customer.phone,
                    message: 'OTP sent successfully'
                });
            } else {
                throw new Error('Payment verification failed');
            }

        } catch (error) {
            this.config.onError('Post-payment processing failed: ' + error.message);
        }
    }

    /**
     * Verify payment and send OTP (internal method)
     * @private
     */
    async _verifyPaymentAndSendOTP(paymentResponse) {
        try {
            const response = await fetch(`${this.config.backendUrl}/api/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentResponse)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Verification failed');
            }

            return result;

        } catch (error) {
            throw new Error('Payment verification failed: ' + error.message);
        }
    }

    /**
     * Verify OTP entered by user
     * @param {string} otp - OTP entered by user
     * @returns {Promise<Object>} Verification result
     */
    async verifyOTP(otp) {
        try {
            if (!this.currentOTPData) {
                throw new Error('No OTP session found. Please complete payment first.');
            }

            const response = await fetch(`${this.config.backendUrl}/api/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: this.currentOTPData.phone,
                    otp: otp
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'OTP verification failed');
            }

            // Clear current session
            this.currentOrder = null;
            this.currentOTPData = null;

            this.config.onOTPVerified({
                success: true,
                message: 'OTP verified successfully',
                paymentId: result.payment_id,
                orderId: result.order_id
            });

            return result;

        } catch (error) {
            this.config.onError('OTP verification failed: ' + error.message);
            throw error;
        }
    }

    /**
     * Resend OTP (if needed)
     * @returns {Promise<Object>} Result
     */
    async resendOTP() {
        try {
            if (!this.currentOTPData) {
                throw new Error('No OTP session found');
            }

            const response = await fetch(`${this.config.backendUrl}/api/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: this.currentOTPData.phone
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'OTP resend failed');
            }

            this.config.onOTPSent({
                phone: this.currentOTPData.phone,
                message: 'OTP resent successfully'
            });

            return result;

        } catch (error) {
            this.config.onError('OTP resend failed: ' + error.message);
            throw error;
        }
    }

    /**
     * Get current session info
     * @returns {Object} Current session data
     */
    getCurrentSession() {
        return {
            hasOrder: !!this.currentOrder,
            hasOTPSession: !!this.currentOTPData,
            order: this.currentOrder,
            otpData: this.currentOTPData ? {
                phone: this.currentOTPData.phone,
                paymentId: this.currentOTPData.paymentId,
                orderId: this.currentOTPData.orderId
            } : null
        };
    }

    /**
     * Reset current session
     */
    resetSession() {
        this.currentOrder = null;
        this.currentOTPData = null;
    }
}

// Create global instance
window.PaymentOTP = new PaymentOTP();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentOTP;
}
