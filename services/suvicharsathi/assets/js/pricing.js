/**
 * Pricing page JavaScript
 * Handles subscription and payment functionality
 */

// Initialize API service with error handling
let api;
try {
  api = new APIService();
  console.log('✅ API service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize API service:', error);
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Pricing DOM loaded');
  
  if (!api) {
    console.error('❌ API service not available');
    alert('Technical error: API service not available. Please refresh the page.');
    return;
  }
  
  console.log('� API authenticated:', api.isAuthenticated());
  
  initializePricingPage();
  setupEventListeners();
});

function initializePricingPage() {
  console.log('🚀 Initializing pricing page');
  // Check if user is logged in
  if (api.isAuthenticated()) {
    showUserGreeting();
  }
}

function showUserGreeting() {
  const userData = api.getUserData();
  if (userData) {
    const greetingElement = document.getElementById('userGreeting');
    const nameElement = document.getElementById('greetingName');
    
    nameElement.textContent = userData.name || userData.full_name || 'User';
    greetingElement.classList.remove('d-none');
  }
}

function setupEventListeners() {
  console.log('� Setting up event listeners');
  
  const subscribeButtons = document.querySelectorAll('.subscribe-btn');
  console.log('🔍 Found subscribe buttons:', subscribeButtons.length);
  
  if (subscribeButtons.length === 0) {
    console.error('❌ No subscribe buttons found!');
    return;
  }
  
  subscribeButtons.forEach((button, index) => {
    console.log(`⚙️ Setting up button ${index}: ${button.dataset.plan}`);
    
    button.addEventListener('click', function(event) {
      console.log('🎯 Subscribe button clicked:', button.dataset.plan);
      alert('Button clicked: ' + button.dataset.plan);
      
      // Add more detailed logging
      console.log('🔍 About to call handleSubscription...');
      console.log('🔍 Event object:', event);
      console.log('🔍 Button element:', button);
      
      try {
        handleSubscription(event);
        console.log('✅ handleSubscription called successfully');
      } catch (error) {
        console.error('❌ Error calling handleSubscription:', error);
        alert('Error: ' + error.message);
      }
    });
  });
  
  console.log('✅ Event listeners setup complete');
}

async function handleSubscription(event) {
  console.log('🎯 handleSubscription called - START');
  
  try {
    console.log('🔍 Event received:', event);
    
    const button = event.target;
    console.log('🔍 Button element:', button);
    
    const plan = button.dataset.plan;
    const amount = parseInt(button.dataset.amount);
    const duration = button.dataset.duration;

    console.log('📝 Subscription details:', { plan, amount, duration });

    // Check if user is authenticated
    console.log('🔍 Checking authentication...');
    console.log('🔍 API object available:', !!api);
    
    if (!api) {
      console.error('❌ API object is null/undefined');
      alert('API service not available. Please refresh the page.');
      return;
    }
    
    const isAuth = api.isAuthenticated();
    console.log('🔐 Authentication check result:', isAuth);
    
    if (!isAuth) {
      console.log('❌ User not authenticated');
      alert('You need to login first. Redirecting to login page...');
      showAuthRequiredModal();
      return;
    }

    console.log('✅ User is authenticated');

    // Skip subscription check for now to test payment flow
    console.log('🚀 Proceeding to payment...');
    
    // Start payment process
    console.log('💳 About to call initiatePayment...');
    await initiatePayment(plan, amount, duration, button);
    console.log('✅ initiatePayment completed');
    
  } catch (error) {
    console.error('❌ Error in handleSubscription:', error);
    console.error('❌ Error stack:', error.stack);
    alert('Error: ' + error.message);
  }
  
  console.log('🎯 handleSubscription - END');
}

async function checkActiveSubscription() {
  try {
    console.log('Checking for active subscription...');
    const result = await api.getCurrentSubscription();
    console.log('Subscription check result:', result);
    
    if (result.success && result.data) {
      const hasActive = result.data.status === 'active';
      console.log('Has active subscription:', hasActive);
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
    const orderResult = await api.initiatePayment(planId);
    
    if (!orderResult.success) {
      throw new Error(orderResult.error || 'Failed to create payment order');
    }

    const order = orderResult.data;
    const userData = api.getUserData();

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
    const verifyResult = await api.verifyPayment(
      paymentResponse.razorpay_order_id,
      paymentResponse.razorpay_payment_id,
      paymentResponse.razorpay_signature
    );

    if (verifyResult.success) {
      // Payment verified successfully
      showAlert('🎉 Subscription activated successfully! Welcome to SuvicharSathi!', 'success');
      
      // Update local subscription data
      if (verifyResult.data.subscription) {
        api.saveSubscriptionData(verifyResult.data.subscription);
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
  alert('Please create an account or login to subscribe to SuvicharSathi!');
  // Optionally redirect to registration
  // window.location.href = 'register.html';
}

// Utility functions
function showAlert(message, type = 'info') {
  console.log(`🚨 Alert: ${message} (${type})`);
  // Use simple alert for now
  alert(message);
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
if (api.isAuthenticated()) {
  setInterval(async () => {
    await checkActiveSubscription();
  }, 30000);
}
