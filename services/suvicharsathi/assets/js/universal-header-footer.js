// Universal Header/Footer Injection - Live Server Compatible
// This script can be embedded directly in HTML files for maximum compatibility

function createUniversalHeaderFooter() {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('suvicharsathi_token');
  const userData = JSON.parse(localStorage.getItem('suvicharsathi_user') || '{}');
  
  // Build navigation items based on authentication status
  let navItems = '';
  
  // Common navigation items
  navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="suvicharsathi.html">Home</a></li>';
  navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="pricing.html">Pricing</a></li>';
  navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="privacy.html">Privacy Policy</a></li>';
  navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="terms.html">Terms & Conditions</a></li>';
  navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="refund.html">Refund Policy</a></li>';
  
  if (isAuthenticated) {
    navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="dashboard.html">Dashboard</a></li>';
    navItems += '<li class="nav-item dropdown">';
    navItems += '<a class="nav-link dropdown-toggle fw-semibold" href="#" role="button" data-bs-toggle="dropdown">';
    navItems += '👤 ' + (userData.full_name || 'User');
    navItems += '</a>';
    navItems += '<ul class="dropdown-menu">';
    navItems += '<li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>';
    navItems += '<li><a class="dropdown-item" href="#" onclick="handleLogout()">Logout</a></li>';
    navItems += '</ul>';
    navItems += '</li>';
  } else {
    navItems += '<li class="nav-item"><a class="nav-link fw-semibold" href="login.html">Login</a></li>';
    navItems += '<li class="nav-item"><a class="nav-link fw-semibold btn btn-outline-light ms-2" href="register.html">Register</a></li>';
  }
  
  const headerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm py-2" style="position:fixed;top:0;left:0;width:100%;z-index:1000;background:linear-gradient(90deg, #0d6efd 60%, #23395d 100%);backdrop-filter:blur(2px);">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" href="suvicharsathi.html">
          <img src="assets/images/logo.png" alt="SuvicharSathi Logo" style="height:40px; margin-right:12px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <span style="font-size:1.6rem; font-weight:700; letter-spacing:1px;">सुविचारसाथी</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            ${navItems}
          </ul>
        </div>
      </div>
    </nav>
  `;

  const footerHTML = `
    <footer class="text-center" style="background:linear-gradient(90deg, #0d6efd 60%, #23395d 100%); color:#fff; border-top:2px solid #e3e3e3; position:fixed; left:0; bottom:0; width:100%; z-index:999; padding:8px 0 4px 0; font-size:0.97rem;">
      <span>📧 <a href="mailto:contact@suyogjoshi.com" style="color:#fff; text-decoration:underline;">contact@suyogjoshi.com</a></span>
      <span style="margin:0 10px;">|</span>
      <span><a href="suvicharsathi.html" style="color:#fff;">Home</a> | <a href="pricing.html" style="color:#fff;">Pricing</a> | <a href="privacy.html" style="color:#fff;">Privacy</a> | <a href="terms.html" style="color:#fff;">Terms</a> | <a href="refund.html" style="color:#fff;">Refund</a></span>
      <span style="margin:0 10px;">|</span>
      <span>&copy; 2025 Suyog Joshi. All rights reserved.</span>
    </footer>
  `;
  
  const headerElement = document.getElementById('shared-header');
  const footerElement = document.getElementById('shared-footer');
  
  if (headerElement) {
    headerElement.innerHTML = headerHTML;
  }
  
  if (footerElement) {
    footerElement.innerHTML = footerHTML;
  }
}

// Global logout function
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear all stored data
    localStorage.removeItem('suvicharsathi_token');
    localStorage.removeItem('suvicharsathi_user');
    localStorage.removeItem('suvicharsathi_subscription');
    
    // Redirect to home page
    window.location.href = 'suvicharsathi.html';
  }
}

// Multiple initialization methods for maximum compatibility
document.addEventListener('DOMContentLoaded', createUniversalHeaderFooter);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createUniversalHeaderFooter);
} else {
  createUniversalHeaderFooter();
}

// Backup timer
setTimeout(createUniversalHeaderFooter, 500);
