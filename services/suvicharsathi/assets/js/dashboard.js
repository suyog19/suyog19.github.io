/**
 * Dashboard page JavaScript
 * Handles user dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize dashboard
  initializeDashboard();

  // Event listeners
  setupEventListeners();
});

async function initializeDashboard() {
  try {
    // Load user profile
    await loadUserProfile();
    
    // Load subscription data
    await loadSubscriptionData();
    
    // Load recent messages
    await loadRecentMessages();
    
    // Load message stats
    await loadMessageStats();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showAlert('Failed to load dashboard data. Please refresh the page.', 'danger');
  }
}

async function loadUserProfile() {
  try {
    // Try to get user data from localStorage first
    let userData = api.getUserData();
    
    if (!userData) {
      // Fetch from API if not in localStorage
      const result = await api.getUserProfile();
      if (result.success) {
        userData = result.data;
        api.saveUserData(userData);
      } else {
        throw new Error('Failed to load user profile');
      }
    }

    // Update UI with user data
    document.getElementById('userName').textContent = userData.full_name || 'User';
    document.getElementById('userPhone').textContent = userData.phone_number || '+91 XXXXXXXXXX';
    document.getElementById('editUserName').value = userData.full_name || '';
    document.getElementById('editUserEmail').value = userData.email || '';
    document.getElementById('editUserPhone').value = userData.phone_number || '';

  } catch (error) {
    console.error('Error loading user profile:', error);
    showAlert('Failed to load user profile', 'danger');
  }
}

async function loadSubscriptionData() {
  try {
    const result = await api.getCurrentSubscription();
    
    if (result.success && result.data) {
      const subscription = result.data;
      api.saveSubscriptionData(subscription);
      displaySubscription(subscription);
    } else {
      displayNoSubscription();
    }

  } catch (error) {
    console.error('Error loading subscription:', error);
    displayNoSubscription();
  }
}

function displaySubscription(subscription) {
  const noSubscription = document.getElementById('noSubscription');
  const activeSubscription = document.getElementById('activeSubscription');
  
  noSubscription.style.display = 'none';
  activeSubscription.style.display = 'block';

  // Update subscription details
  document.getElementById('planName').textContent = subscription.plan_name || 'Subscription Plan';
  document.getElementById('planStartDate').textContent = formatDate(subscription.start_date);
  document.getElementById('planEndDate').textContent = formatDate(subscription.end_date);
  document.getElementById('planPrice').textContent = formatCurrency(subscription.amount);
  document.getElementById('planInterval').textContent = subscription.duration === 'monthly' ? 'per month' : 'per year';
  
  // Update status
  const statusElement = document.getElementById('planStatus');
  const isActive = subscription.status === 'active';
  statusElement.textContent = isActive ? 'Active' : subscription.status;
  statusElement.className = `badge ${isActive ? 'bg-success' : 'bg-warning'}`;
  
  // Update subscription status in stats card
  document.getElementById('subscriptionStatus').textContent = isActive ? 'Active Plan' : subscription.status;
  document.getElementById('subscriptionDetails').textContent = 
    `${calculateDaysRemaining(subscription.end_date)} days remaining`;

  // Update progress bar
  const progressBar = document.getElementById('subscriptionProgress');
  const totalDays = Math.ceil((new Date(subscription.end_date) - new Date(subscription.start_date)) / (1000 * 60 * 60 * 24));
  const remainingDays = calculateDaysRemaining(subscription.end_date);
  const progressPercent = Math.max(0, ((totalDays - remainingDays) / totalDays) * 100);
  progressBar.style.width = `${progressPercent}%`;
}

function displayNoSubscription() {
  const noSubscription = document.getElementById('noSubscription');
  const activeSubscription = document.getElementById('activeSubscription');
  
  noSubscription.style.display = 'block';
  activeSubscription.style.display = 'none';
  
  // Update stats card
  document.getElementById('subscriptionStatus').textContent = 'No Active Plan';
  document.getElementById('subscriptionDetails').textContent = 'Choose a plan to start';
}

async function loadRecentMessages() {
  try {
    const result = await api.getRecentMessages(5);
    
    if (result.success && result.data && result.data.length > 0) {
      displayRecentMessages(result.data);
    } else {
      displayNoMessages();
    }

  } catch (error) {
    console.error('Error loading recent messages:', error);
    displayNoMessages();
  }
}

function displayRecentMessages(messages) {
  const container = document.getElementById('recentMessages');
  
  if (messages.length === 0) {
    displayNoMessages();
    return;
  }

  const messagesHTML = messages.map(message => `
    <div class="message-card mb-3">
      <div class="message-text">${message.content || message.text || 'Message content'}</div>
      <div class="message-date">📅 ${formatDate(message.sent_date || message.created_at)}</div>
    </div>
  `).join('');

  container.innerHTML = messagesHTML;
}

function displayNoMessages() {
  const container = document.getElementById('recentMessages');
  container.innerHTML = `
    <div class="text-center py-3">
      <p class="text-muted">No messages yet. Subscribe to start receiving daily सुविचार!</p>
    </div>
  `;
}

async function loadMessageStats() {
  try {
    const result = await api.getMessageStats();
    
    if (result.success && result.data) {
      document.getElementById('totalMessages').textContent = result.data.total_messages || 0;
    }

  } catch (error) {
    console.error('Error loading message stats:', error);
    document.getElementById('totalMessages').textContent = '0';
  }
}

function setupEventListeners() {
  // Subscription management buttons
  document.getElementById('renewPlanBtn').addEventListener('click', handleRenewPlan);
  document.getElementById('changePlanBtn').addEventListener('click', handleChangePlan);
  document.getElementById('cancelPlanBtn').addEventListener('click', handleCancelPlan);

  // Account settings buttons
  document.getElementById('editNameBtn').addEventListener('click', showEditNameModal);
  document.getElementById('editEmailBtn').addEventListener('click', showEditEmailModal);
  document.getElementById('saveNameBtn').addEventListener('click', handleSaveName);
  document.getElementById('saveEmailBtn').addEventListener('click', handleSaveEmail);

  // Account actions
  document.getElementById('downloadDataBtn').addEventListener('click', handleDownloadData);
  document.getElementById('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

async function handleRenewPlan() {
  try {
    const subscription = api.getSubscriptionData();
    if (!subscription) {
      showAlert('No active subscription found', 'warning');
      return;
    }

    const result = await api.renewSubscription(subscription.id);
    
    if (result.success) {
      showAlert('Plan renewed successfully!', 'success');
      await loadSubscriptionData();
    } else {
      showAlert(result.error || 'Failed to renew plan', 'danger');
    }

  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

function handleChangePlan() {
  window.location.href = 'pricing.html';
}

async function handleCancelPlan() {
  if (!confirm('Are you sure you want to cancel your subscription? You will continue to receive messages until the end of your current billing period.')) {
    return;
  }

  try {
    const subscription = api.getSubscriptionData();
    if (!subscription) {
      showAlert('No active subscription found', 'warning');
      return;
    }

    const result = await api.cancelSubscription(subscription.id);
    
    if (result.success) {
      showAlert('Subscription cancelled successfully. You will continue to receive messages until the end of your billing period.', 'info');
      await loadSubscriptionData();
    } else {
      showAlert(result.error || 'Failed to cancel subscription', 'danger');
    }

  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

function showEditNameModal() {
  const currentName = document.getElementById('editUserName').value;
  document.getElementById('newUserName').value = currentName;
  
  const modal = new bootstrap.Modal(document.getElementById('editNameModal'));
  modal.show();
}

function showEditEmailModal() {
  const currentEmail = document.getElementById('editUserEmail').value;
  document.getElementById('newUserEmail').value = currentEmail;
  
  const modal = new bootstrap.Modal(document.getElementById('editEmailModal'));
  modal.show();
}

async function handleSaveName() {
  const newName = document.getElementById('newUserName').value.trim();
  
  if (!newName) {
    showAlert('Please enter a valid name', 'danger');
    return;
  }

  try {
    const result = await api.updateUserProfile({ full_name: newName });
    
    if (result.success) {
      // Update UI
      document.getElementById('userName').textContent = newName;
      document.getElementById('editUserName').value = newName;
      
      // Update localStorage
      const userData = api.getUserData();
      if (userData) {
        userData.full_name = newName;
        api.saveUserData(userData);
      }
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editNameModal'));
      modal.hide();
      
      showAlert('Name updated successfully!', 'success');
    } else {
      showAlert(result.error || 'Failed to update name', 'danger');
    }

  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

async function handleSaveEmail() {
  const newEmail = document.getElementById('newUserEmail').value.trim();
  
  if (newEmail && !api.isValidEmail(newEmail)) {
    showAlert('Please enter a valid email address', 'danger');
    return;
  }

  try {
    const result = await api.updateUserProfile({ email: newEmail });
    
    if (result.success) {
      // Update UI
      document.getElementById('editUserEmail').value = newEmail;
      
      // Update localStorage
      const userData = api.getUserData();
      if (userData) {
        userData.email = newEmail;
        api.saveUserData(userData);
      }
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editEmailModal'));
      modal.hide();
      
      showAlert('Email updated successfully!', 'success');
    } else {
      showAlert(result.error || 'Failed to update email', 'danger');
    }

  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

async function handleDownloadData() {
  try {
    // Get user data
    const userData = api.getUserData();
    const subscriptionData = api.getSubscriptionData();
    
    // Get message history
    const messagesResult = await api.getMessageHistory(1, 1000);
    const messages = messagesResult.success ? messagesResult.data : [];

    const dataToDownload = {
      user_profile: userData,
      subscription: subscriptionData,
      messages: messages,
      download_date: new Date().toISOString()
    };

    // Create and download file
    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `suvicharsathi_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showAlert('Data downloaded successfully!', 'success');

  } catch (error) {
    showAlert('Failed to download data. Please try again.', 'danger');
  }
}

async function handleDeleteAccount() {
  const confirmText = 'DELETE';
  const userInput = prompt(`This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm:`);
  
  if (userInput !== confirmText) {
    return;
  }

  try {
    const result = await api.deleteUserAccount();
    
    if (result.success) {
      showAlert('Account deleted successfully. You will be redirected to the home page.', 'info');
      
      // Clear all data and redirect
      api.clearAllData();
      setTimeout(() => {
        window.location.href = 'suvicharsathi.html';
      }, 3000);
    } else {
      showAlert(result.error || 'Failed to delete account', 'danger');
    }

  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    api.logout();
  }
}

// Auto-refresh subscription data every 5 minutes
setInterval(async () => {
  await loadSubscriptionData();
}, 5 * 60 * 1000);

// Refresh messages every 30 minutes
setInterval(async () => {
  await loadRecentMessages();
  await loadMessageStats();
}, 30 * 60 * 1000);
