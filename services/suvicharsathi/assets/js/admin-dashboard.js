// Admin Dashboard JavaScript
const API_BASE_URL = 'https://cuddly-spork-xqvpg9w4xh6pxr-8000.app.github.dev';

// Get admin token
function getAdminToken() {
    return localStorage.getItem('adminToken');
}

// Check admin authentication
function checkAdminAuth() {
    const token = getAdminToken();
    const isAdmin = localStorage.getItem('isAdmin');
    
    if (!token || isAdmin !== 'true') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Make authenticated API request
async function makeAuthenticatedRequest(url, options = {}) {
    const token = getAdminToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            // Token expired, redirect to login
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('isAdmin');
    window.location.href = 'admin-login.html';
}

// Navigation functions
function showDashboard() {
    hideAllContent();
    document.getElementById('dashboardContent').classList.remove('d-none');
    setActiveNav(0);
    loadDashboardStats();
}

function showUsers() {
    hideAllContent();
    document.getElementById('usersContent').classList.remove('d-none');
    setActiveNav(1);
    loadUsers();
}

function showQuotes() {
    hideAllContent();
    document.getElementById('quotesContent').classList.remove('d-none');
    setActiveNav(2);
    loadQuotes();
}

function showAnalytics() {
    hideAllContent();
    document.getElementById('analyticsContent').classList.remove('d-none');
    setActiveNav(3);
}

function showPayments() {
    hideAllContent();
    document.getElementById('paymentsContent').classList.remove('d-none');
    setActiveNav(4);
}

function showLogs() {
    hideAllContent();
    document.getElementById('logsContent').classList.remove('d-none');
    setActiveNav(5);
}

function hideAllContent() {
    const contents = ['dashboardContent', 'usersContent', 'quotesContent', 'analyticsContent', 'paymentsContent', 'logsContent'];
    contents.forEach(id => {
        document.getElementById(id).classList.add('d-none');
    });
}

function setActiveNav(index) {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    navLinks[index].classList.add('active');
}

// Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/dashboard`);
        if (!response) return;
        
        const stats = await response.json();
        renderStatsCards(stats);
        
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showAlert('Failed to load dashboard statistics', 'danger');
    }
}

function renderStatsCards(stats) {
    const statsCards = document.getElementById('statsCards');
    
    const cards = [
        {
            title: 'Total Users',
            value: stats.total_users || 0,
            icon: 'fas fa-users',
            color: 'primary',
            bgColor: 'rgba(13, 110, 253, 0.1)'
        },
        {
            title: 'Active Users',
            value: stats.active_users || 0,
            icon: 'fas fa-user-check',
            color: 'success',
            bgColor: 'rgba(25, 135, 84, 0.1)'
        },
        {
            title: 'Total Quotes',
            value: stats.total_quotes || 0,
            icon: 'fas fa-quote-left',
            color: 'info',
            bgColor: 'rgba(13, 202, 240, 0.1)'
        },
        {
            title: 'Pending Quotes',
            value: stats.pending_quotes || 0,
            icon: 'fas fa-clock',
            color: 'warning',
            bgColor: 'rgba(255, 193, 7, 0.1)'
        },
        {
            title: 'Active Subscriptions',
            value: stats.active_subscriptions || 0,
            icon: 'fas fa-crown',
            color: 'purple',
            bgColor: 'rgba(102, 126, 234, 0.1)'
        },
        {
            title: 'Monthly Revenue',
            value: `₹${(stats.monthly_revenue || 0).toLocaleString('en-IN')}`,
            icon: 'fas fa-rupee-sign',
            color: 'success',
            bgColor: 'rgba(25, 135, 84, 0.1)'
        },
        {
            title: 'Total Revenue',
            value: `₹${(stats.total_revenue || 0).toLocaleString('en-IN')}`,
            icon: 'fas fa-chart-line',
            color: 'info',
            bgColor: 'rgba(13, 202, 240, 0.1)'
        },
        {
            title: 'Recent Signups',
            value: stats.recent_signups || 0,
            icon: 'fas fa-user-plus',
            color: 'primary',
            bgColor: 'rgba(13, 110, 253, 0.1)'
        }
    ];
    
    statsCards.innerHTML = cards.map(card => `
        <div class="col-xl-3 col-md-6 mb-3">
            <div class="card stat-card h-100">
                <div class="card-body text-center">
                    <div class="stat-icon mx-auto" style="background-color: ${card.bgColor}; color: var(--bs-${card.color})">
                        <i class="${card.icon}"></i>
                    </div>
                    <h3 class="fw-bold text-${card.color}">${card.value}</h3>
                    <p class="text-muted mb-0">${card.title}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Users Management
async function loadUsers(page = 1, search = '') {
    try {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/users?page=${page}&size=20${searchParam}`);
        if (!response) return;
        
        const users = await response.json();
        console.log('Users API Response:', users); // Debug log
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Failed to load users:', error);
        showAlert('Failed to load users', 'danger');
    }
}

function renderUsersTable(users) {
    const usersTable = document.getElementById('usersTable');
    
    console.log('Rendering users table with data:', users); // Debug log
    console.log('Users table element found:', !!usersTable); // Check if element exists
    
    // Handle different possible response structures
    let userData = users;
    if (users && users.users) {
        userData = users.users;
        console.log('Using users.users:', userData);
    } else if (users && users.data) {
        userData = users.data;
        console.log('Using users.data:', userData);
    } else if (users && Array.isArray(users)) {
        userData = users;
        console.log('Using users as direct array:', userData);
    } else if (users && users.items) {
        userData = users.items;
        console.log('Using users.items:', userData);
    } else {
        console.log('No recognized data structure, using raw users:', userData);
    }
    
    console.log('Final userData:', userData);
    console.log('Is userData an array?', Array.isArray(userData));
    console.log('userData length:', userData ? userData.length : 'undefined');
    
    if (!userData || !Array.isArray(userData) || userData.length === 0) {
        console.log('No valid user data found, showing "No users found" message');
        usersTable.innerHTML = '<p class="text-center text-muted">No users found.</p>';
        return;
    }

    usersTable.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Registration Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${userData.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.name || user.full_name || 'N/A'}</td>
                            <td>${user.phone_number || user.phone || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td>
                                <span class="badge bg-${user.is_active ? 'success' : 'secondary'}">
                                    ${user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails(${user.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <nav aria-label="Users pagination">
            <ul class="pagination justify-content-center">
                ${users.pagination ? generatePagination(users.pagination.page || 1, users.pagination.pages, 'loadUsers') : ''}
            </ul>
        </nav>
    `;
}

// Quotes Management
async function loadQuotes(page = 1, status = null, search = '') {
    try {
        let params = `page=${page}&size=20`;
        if (status) params += `&status=${status}`;
        if (search) params += `&search=${encodeURIComponent(search)}`;
        
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/quotes?${params}`);
        if (!response) return;
        
        const quotes = await response.json();
        console.log('Quotes API Response:', quotes); // Debug log
        renderQuotesTable(quotes);
        
    } catch (error) {
        console.error('Failed to load quotes:', error);
        showAlert('Failed to load quotes', 'danger');
    }
}

function renderQuotesTable(quotes) {
    const quotesTable = document.getElementById('quotesTable');
    
    console.log('Rendering quotes table with data:', quotes); // Debug log
    
    // Handle different possible response structures
    let quotesData = quotes;
    if (quotes && quotes.quotes) {
        quotesData = quotes.quotes;
        console.log('Using quotes.quotes:', quotesData);
    } else if (quotes && quotes.data) {
        quotesData = quotes.data;
        console.log('Using quotes.data:', quotesData);
    } else if (quotes && Array.isArray(quotes)) {
        quotesData = quotes;
        console.log('Using quotes as direct array:', quotesData);
    } else if (quotes && quotes.items) {
        quotesData = quotes.items;
        console.log('Using quotes.items:', quotesData);
    } else {
        console.log('No recognized data structure, using raw quotes:', quotesData);
    }
    
    console.log('Final quotesData:', quotesData);
    console.log('Is quotesData an array?', Array.isArray(quotesData));
    console.log('quotesData length:', quotesData ? quotesData.length : 'undefined');
    
    if (!quotesData || !Array.isArray(quotesData) || quotesData.length === 0) {
        console.log('No valid quotes data found, showing "No quotes found" message');
        quotesTable.innerHTML = '<p class="text-center text-muted">No quotes found.</p>';
        return;
    }
    
    quotesTable.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-light">
                    <tr>
                        <th>
                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                        </th>
                        <th>ID</th>
                        <th>Text</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${quotesData.map(quote => `
                        <tr>
                            <td>
                                <input type="checkbox" class="quote-checkbox" value="${quote.id}">
                            </td>
                            <td>${quote.id}</td>
                            <td title="${quote.text}">
                                ${quote.text.length > 50 ? quote.text.substring(0, 50) + '...' : quote.text}
                            </td>
                            <td>${quote.author || 'Unknown'}</td>
                            <td>${quote.category || 'General'}</td>
                            <td>${quote.language}</td>
                            <td>
                                <span class="badge bg-${quote.is_approved ? 'success' : 'warning'}">
                                    ${quote.is_approved ? 'Approved' : 'Pending'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="editQuote(${quote.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success me-1" onclick="approveQuote(${quote.id})" ${quote.is_approved ? 'disabled' : ''}>
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteQuote(${quote.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <nav aria-label="Quotes pagination">
            <ul class="pagination justify-content-center">
                ${quotes.pagination ? generatePagination(quotes.pagination.page || 1, quotes.pagination.pages, 'loadQuotes') : ''}
            </ul>
        </nav>
    `;
}

// Utility functions
function generatePagination(currentPage, totalPages, functionName) {
    if (totalPages <= 1) return '';
    
    let pagination = '';
    
    // Previous button
    pagination += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${functionName}(${currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        pagination += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="${functionName}(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    pagination += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="${functionName}(${currentPage + 1})">Next</a>
        </li>
    `;
    
    return pagination;
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to body
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Search functions
function searchUsers() {
    const search = document.getElementById('userSearch').value;
    loadUsers(1, search);
}

// Bulk operations
function showBulkImport() {
    const modal = new bootstrap.Modal(document.getElementById('bulkImportModal'));
    modal.show();
}

async function importQuotes() {
    try {
        const language = document.getElementById('importLanguage').value;
        const autoApprove = document.getElementById('autoApprove').checked;
        const quotesJsonText = document.getElementById('quotesJson').value;
        
        if (!quotesJsonText.trim()) {
            showAlert('Please enter quotes in JSON format', 'warning');
            return;
        }
        
        let quotes;
        try {
            quotes = JSON.parse(quotesJsonText);
        } catch (e) {
            showAlert('Invalid JSON format', 'danger');
            return;
        }
        
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/quotes/bulk-import`, {
            method: 'POST',
            body: JSON.stringify({
                quotes: quotes,
                language: language,
                auto_approve: autoApprove
            })
        });
        
        if (!response) return;
        
        if (response.ok) {
            showAlert('Quotes imported successfully!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('bulkImportModal')).hide();
            loadQuotes(); // Refresh quotes list
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Failed to import quotes', 'danger');
        }
        
    } catch (error) {
        console.error('Import failed:', error);
        showAlert('Failed to import quotes', 'danger');
    }
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.quote-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

async function bulkApprove() {
    const selectedQuotes = Array.from(document.querySelectorAll('.quote-checkbox:checked')).map(cb => parseInt(cb.value));
    
    if (selectedQuotes.length === 0) {
        showAlert('Please select quotes to approve', 'warning');
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/quotes/bulk-approve`, {
            method: 'POST',
            body: JSON.stringify(selectedQuotes)
        });
        
        if (!response) return;
        
        if (response.ok) {
            showAlert(`${selectedQuotes.length} quotes approved successfully!`, 'success');
            loadQuotes(); // Refresh quotes list
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Failed to approve quotes', 'danger');
        }
        
    } catch (error) {
        console.error('Bulk approve failed:', error);
        showAlert('Failed to approve quotes', 'danger');
    }
}

// Individual quote operations
async function approveQuote(quoteId) {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/admin/quotes/bulk-approve`, {
            method: 'POST',
            body: JSON.stringify([quoteId])
        });
        
        if (!response) return;
        
        if (response.ok) {
            showAlert('Quote approved successfully!', 'success');
            loadQuotes(); // Refresh quotes list
        } else {
            const error = await response.json();
            showAlert(error.detail || 'Failed to approve quote', 'danger');
        }
        
    } catch (error) {
        console.error('Approve failed:', error);
        showAlert('Failed to approve quote', 'danger');
    }
}

function editQuote(quoteId) {
    // TODO: Implement edit quote functionality
    showAlert('Edit functionality coming soon!', 'info');
}

function deleteQuote(quoteId) {
    if (confirm('Are you sure you want to delete this quote?')) {
        // TODO: Implement delete quote functionality
        showAlert('Delete functionality coming soon!', 'info');
    }
}

function viewUserDetails(userId) {
    // TODO: Implement user details view
    showAlert('User details view coming soon!', 'info');
}

function refreshDashboard() {
    loadDashboardStats();
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    // Load dashboard by default
    showDashboard();
});
