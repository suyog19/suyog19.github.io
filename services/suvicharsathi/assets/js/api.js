/**
 * API Service for SuvicharSathi Frontend
 * Handles all backend API communications
 */

class APIService {
  constructor() {
    // Update this to your actual backend URL
    this.baseURL = 'https://cuddly-spork-xqvpg9w4xh6pxr-8000.app.github.dev';
    this.token = localStorage.getItem('suvicharsathi_token');
  }

  // Helper method to make HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      referrerPolicy: 'no-referrer',  // Explicitly set referrer policy
      ...options
    };

    // Add auth token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      console.log('Making API request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      // Handle different content types
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.detail || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('API Request Error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Network error occurred';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Connection failed. Please check:\n1. Internet connection\n2. Backend server is running\n3. CORS is enabled on backend\n4. Try running from a local server (not file://)';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Authentication APIs
  async sendRegistrationOTP(phoneNumber, fullName, email = '') {
    return this.makeRequest('/auth/register/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        name: fullName,  // Backend expects 'name', not 'full_name'
        email: email
      })
    });
  }

  async verifyRegistrationOTP(phoneNumber, otp, fullName, email = '') {
    const result = await this.makeRequest('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp_code: otp  // Backend expects 'otp_code', not 'otp'
      })
    });

    // Store token if registration successful
    if (result.success && result.data) {
      const token = result.data.access_token || result.data.token;
      if (token) {
        this.setToken(token);
      }
    }

    return result;
  }

  async sendLoginOTP(phoneNumber) {
    return this.makeRequest('/auth/login/send-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber
      })
    });
  }

  async verifyLoginOTP(phoneNumber, otp) {
    const result = await this.makeRequest('/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp_code: otp  // Backend expects 'otp_code', not 'otp'
      })
    });

    // Store token if login successful
    if (result.success && result.data) {
      const token = result.data.access_token || result.data.token;
      if (token) {
        this.setToken(token);
      }
    }

    return result;
  }

  async resendOTP(phoneNumber) {
    return this.makeRequest('/auth/resend-otp', {  // Single endpoint for both register and login
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber
      })
    });
  }

  // Test/Development APIs
  async getTestOTP() {
    return this.makeRequest('/auth/test-otp', {
      method: 'GET'
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me', {
      method: 'GET'
    });
  }

  async refreshToken() {
    return this.makeRequest('/auth/refresh', {
      method: 'POST'
    });
  }

  async logout() {
    const result = await this.makeRequest('/auth/logout', {
      method: 'POST'
    });
    
    if (result.success) {
      this.clearToken();
    }
    
    return result;
  }

  // User APIs
  async getUserProfile() {
    return this.makeRequest('/user/profile', {
      method: 'GET'
    });
  }

  async updateUserProfile(updates) {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteUserAccount() {
    return this.makeRequest('/user/account', {
      method: 'DELETE'
    });
  }

  // Subscription APIs
  async getSubscriptions() {
    return this.makeRequest('/subscriptions', {
      method: 'GET'
    });
  }

  async getCurrentSubscription() {
    return this.makeRequest('/subscriptions/current', {
      method: 'GET'
    });
  }

  async createSubscription(planType, duration) {
    return this.makeRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan_type: planType,
        duration: duration
      })
    });
  }

  async cancelSubscription(subscriptionId) {
    return this.makeRequest(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST'
    });
  }

  async renewSubscription(subscriptionId) {
    return this.makeRequest(`/subscriptions/${subscriptionId}/renew`, {
      method: 'POST'
    });
  }

  // Payment APIs (Swagger-compliant)
  async initiatePayment(planId) {
    return this.makeRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId  // Backend expects 'plan_id' according to Swagger
      })
    });
  }

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    return this.makeRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,      // Swagger-compliant field names
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      })
    });
  }

  async getPaymentPlans() {
    return this.makeRequest('/payments/plans', {
      method: 'GET'
    });
  }

  async getPaymentHistory() {
    return this.makeRequest('/payments/history', {
      method: 'GET'
    });
  }

  // Message APIs
  async getRecentMessages(limit = 10) {
    return this.makeRequest(`/messages/recent?limit=${limit}`, {
      method: 'GET'
    });
  }

  async getMessageHistory(page = 1, limit = 20) {
    return this.makeRequest(`/messages/history?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }

  async getMessageStats() {
    return this.makeRequest('/messages/stats', {
      method: 'GET'
    });
  }

  // Admin APIs (if needed)
  async sendTestMessage(phoneNumber, message) {
    return this.makeRequest('/admin/send-test-message', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        message: message
      })
    });
  }

  // Utility methods
  setToken(token) {
    this.token = token;
    localStorage.setItem('suvicharsathi_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('suvicharsathi_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('suvicharsathi_token');
  }

  logout() {
    this.clearToken();
    // Clear any other user data
    localStorage.removeItem('suvicharsathi_user');
    localStorage.removeItem('suvicharsathi_subscription');
    // Redirect to home page
    window.location.href = 'suvicharsathi.html';
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // Format phone number for API
  formatPhoneNumber(phone) {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  // Validate phone number
  isValidPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  }

  // Validate email
  isValidEmail(email) {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Local storage helpers
  saveUserData(userData) {
    localStorage.setItem('suvicharsathi_user', JSON.stringify(userData));
  }

  getUserData() {
    const userData = localStorage.getItem('suvicharsathi_user');
    return userData ? JSON.parse(userData) : null;
  }

  saveSubscriptionData(subscriptionData) {
    localStorage.setItem('suvicharsathi_subscription', JSON.stringify(subscriptionData));
  }

  getSubscriptionData() {
    const subscriptionData = localStorage.getItem('suvicharsathi_subscription');
    return subscriptionData ? JSON.parse(subscriptionData) : null;
  }

  clearAllData() {
    localStorage.removeItem('suvicharsathi_token');
    localStorage.removeItem('suvicharsathi_user');
    localStorage.removeItem('suvicharsathi_subscription');
  }
}

// Create global API instance
const api = new APIService();

// Utility functions for UI
function showAlert(message, type = 'info', duration = 5000) {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alertId = 'alert_' + Date.now();
  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>${type === 'danger' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</strong>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  alertContainer.insertAdjacentHTML('beforeend', alertHTML);

  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      const alertElement = document.getElementById(alertId);
      if (alertElement) {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
      }
    }, duration);
  }
}

function showLoading(element, show = true) {
  const spinner = element.querySelector('.spinner-border');
  if (spinner) {
    spinner.classList.toggle('d-none', !show);
  }
  element.disabled = show;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function calculateDaysRemaining(endDate) {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Auth guard - redirect to login if not authenticated
function requireAuth() {
  if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', function() {
  const protectedPages = ['dashboard.html', 'subscription.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage)) {
    requireAuth();
  }
});
