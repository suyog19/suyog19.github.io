/**
 * Pricing page JavaScript
 * Handles subscription and payment functionality
 */

// Initialize API service with error handling
let pricingApi;
try {
  if (typeof APIService === 'undefined') {
    console.error('APIService class not found - api.js might not be loaded');
  } else {
    pricingApi = new APIService();
  }
} catch (error) {
  console.error('Failed to initialize pricing API service:', error);
}

// Also check if global api exists as fallback
if (typeof api !== 'undefined') {
  pricingApi = api;
}

document.addEventListener('DOMContentLoaded', function() {
  if (!pricingApi) {
    showAlert('Technical error: API service not available. Please refresh the page.', 'danger');
    return;
  }
  
  initializePricingPage();
  setupEventListeners();
});

function initializePricingPage() {
  // Check if user is logged in
  if (pricingApi && pricingApi.isAuthenticated()) {
    showUserGreeting();
  }
}

function showUserGreeting() {
  const userData = pricingApi.getUserData();
  if (userData) {
    const greetingElement = document.getElementById('userGreeting');
    const nameElement = document.getElementById('greetingName');
    
    nameElement.textContent = userData.name || userData.full_name || 'User';
    greetingElement.classList.remove('d-none');
  }
}

function setupEventListeners() {
  // Wait a bit for DOM to be fully ready
  setTimeout(() => {
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    
    if (subscribeButtons.length === 0) {
      // Try again with different selector
      const alternativeButtons = document.querySelectorAll('button[data-plan]');
      if (alternativeButtons.length === 0) {
        return;
      }
    }
    
    const buttonsToSetup = subscribeButtons.length > 0 ? subscribeButtons : document.querySelectorAll('button[data-plan]');
    
    buttonsToSetup.forEach((button) => {
      // Remove any existing listeners first
      button.removeEventListener('click', handleButtonClick);
      // Add the event listener
      button.addEventListener('click', handleButtonClick);
    });
  }, 100);
}

// Separate function to handle button clicks
function handleButtonClick(event) {
  event.preventDefault();
  
  const button = event.currentTarget;
  
  try {
    handleSubscription(event);
  } catch (error) {
    console.error('Error calling handleSubscription:', error);
    showAlert('Error: ' + error.message, 'danger');
  }
}

async function handleSubscription(event) {
  try {
    const button = event.currentTarget;
    
    const plan = button.dataset.plan;
    const amount = parseInt(button.dataset.amount);
    const duration = button.dataset.duration;

    // Validate required data
    if (!plan || !amount || !duration) {
      throw new Error('Missing subscription data. Please refresh the page and try again.');
    }

    // Check if user is authenticated
    if (!pricingApi) {
      showAlert('API service not available. Please refresh the page.', 'danger');
      return;
    }
    
    const isAuth = pricingApi.isAuthenticated();
    
    if (!isAuth) {
      showAuthRequiredModal();
      return;
    }

    // Start payment process
    await initiatePayment(plan, amount, duration, button);
    
  } catch (error) {
    console.error('Error in handleSubscription:', error);
    showAlert('Error: ' + error.message, 'danger');
  }
}

async function checkActiveSubscription() {
  try {
    const result = await pricingApi.getCurrentSubscription();
    
    if (result.success && result.data) {
      const hasActive = result.data.status === 'active';
      return hasActive;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subscription:', error);
    // Don't block the user if subscription check fails
    return false;
  }
}

async function initiatePayment(plan, amount, duration, button) {
  showLoading(button, true);

  try {
    // Create payment order using the fixed API method
    const planId = plan; // Simple plan ID mapping
    const orderResult = await pricingApi.initiatePayment(planId);
    
    if (!orderResult.success) {
      throw new Error(orderResult.error || 'Failed to create payment order');
    }

    const order = orderResult.data;
    const userData = pricingApi.getUserData();

    // Razorpay options
    const options = {
      key: 'rzp_test_PnYQjeDzMgRBvV', // Replace with your Razorpay key
      amount: amount * 100, // Amount in paise
      currency: order.currency || 'INR',
      name: 'SuvicharSathi',
      description: `${plan} subscription - Daily Marathi सुविचार`,
      order_id: order.id || order.order_id,
      prefill: {
        name: userData.name || userData.full_name || '',  // Fixed: Support both field names
        email: userData.email || '',
        contact: userData.phone_number || ''
      },
      theme: {
        color: '#0d6efd'
      },
      handler: function(response) {
        handlePaymentSuccess(response, plan, duration);
      },
      modal: {
        ondismiss: function() {
          showLoading(button, false);
          showAlert('Payment cancelled', 'warning');
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Payment initiation error:', error);
    showAlert(error.message || 'Failed to initiate payment. Please try again.', 'danger');
  } finally {
    showLoading(button, false);
  }
}

async function handlePaymentSuccess(paymentResponse, plan, duration) {
  try {
    showAlert('Payment successful! Verifying...', 'success');

    // Verify payment with backend
    const verifyResult = await pricingApi.verifyPayment(
      paymentResponse.razorpay_order_id,
      paymentResponse.razorpay_payment_id,
      paymentResponse.razorpay_signature
    );

    if (verifyResult.success) {
      // Payment verified successfully
      showAlert('🎉 Subscription activated successfully! Welcome to SuvicharSathi!', 'success');
      
      // Update local subscription data
      if (verifyResult.data.subscription) {
        pricingApi.saveSubscriptionData(verifyResult.data.subscription);
      }
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 3000);
      
    } else {
      throw new Error(verifyResult.error || 'Payment verification failed');
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    showAlert('Payment completed but verification failed. Please contact support.', 'danger');
  }
}

function showAuthRequiredModal() {
  console.log('🔐 User needs to authenticate');
  
  // Try to show the modal if it exists
  const modal = document.getElementById('authRequiredModal');
  if (modal) {
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  } else {
    // Fallback to alert and redirect
    showAlert('Please create an account or login to subscribe to SuvicharSathi!', 'warning');
    setTimeout(() => {
      window.location.href = 'register.html';
    }, 2000);
  }
}

// Utility functions
function showAlert(message, type = 'info') {
  console.log(`🚨 Alert: ${message} (${type})`);
  
  // Try to use Bootstrap alert container if available
  const alertContainer = document.getElementById('alertContainer');
  if (alertContainer) {
    const alertClass = type === 'danger' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 
                     type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const alertHTML = `
      <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Auto-dismiss after 5 seconds for non-error alerts
    if (type !== 'danger') {
      setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
          alert.remove();
        }
      }, 5000);
    }
  } else {
    // Fallback to browser alert
    alert(message);
  }
}

function showLoading(button, show) {
  const spinner = button.querySelector('.spinner-border');
  const originalText = button.dataset.originalText || button.textContent;
  
  if (show) {
    button.dataset.originalText = originalText;
    button.disabled = true;
    spinner.classList.remove('d-none');
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing...`;
  } else {
    button.disabled = false;
    spinner.classList.add('d-none');
    button.textContent = originalText;
  }
}

// Handle navigation from other pages
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('plan')) {
  const plan = urlParams.get('plan');
  const planButton = document.querySelector(`[data-plan="${plan}"]`);
  if (planButton) {
    // Scroll to the plan and highlight it
    planButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    planButton.classList.add('btn-outline-primary');
    setTimeout(() => {
      planButton.classList.remove('btn-outline-primary');
    }, 2000);
  }
}

// Auto-refresh subscription status every 30 seconds if user is logged in
if (pricingApi && pricingApi.isAuthenticated()) {
  setInterval(async () => {
    await checkActiveSubscription();
  }, 30000);
}
